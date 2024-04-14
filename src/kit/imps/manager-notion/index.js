const {Notion} = require("../../foundations/notion");
const {asyncIter2Array} = require("../../utils/async/index");
const _ = require("lodash")
const moment = require('moment-timezone');
const {modify, merge} = require("../../utils/iter");

class ManagerNotionBase {
    constructor({accessToken, tasksDatabaseId, tasksPerRound, timeZone}) {
        this._notion = new Notion(
            {
                accessToken,
                scrollingSize: parseInt(tasksPerRound),
                limit: tasksPerRound
            }
        )
        this._tasksDatabaseId = tasksDatabaseId
        this._timeZone = timeZone
    }
}

class ManagerNotionDetector extends ManagerNotionBase {
    constructor(props) {
        super(props)
        this._cache = new Map()
    }

    list = async () => {
    }

    get = async () => {
    }

    _sync = (taskId, {unsync = false, deleting = false, editTimeString} = {}) =>
        this._notion
            .page(taskId)
            .edit(
                {
                    properties: {
                        "متزامن": {
                            checkbox: !unsync
                        },
                        "وقت التعديل السابق": {
                            date: {
                                start: editTimeString,
                            }
                        },
                        ...(
                            deleting ? {
                                "محذوف": {
                                    checkbox: false
                                }
                            } : {}
                        )
                    },
                    ...(
                        deleting ? {
                            archived: true
                        } : {}
                    )
                }
            )

    _operate = async (
        {
            includeChildrenDeletion = false,
            cacheDeletedTasks = false
        } = {}
    ) => {
        this._cache = new Map(
            (await asyncIter2Array(this.list())).map(
                ({id, ...rest}) => [id, {id, ...rest}]
            )
        )

        const tasks = Array.from(this._cache.values())

        for await (const {
            id,
            operation,
            parentId,
            childId,
            childrenIds,
            task
        } of ManagerNotionDetector._generatePatches(tasks, includeChildrenDeletion)) {

            const [, editTimeString, editTimeSyncString] = ManagerNotionDetector._createEditTime(this._timeZone)

            switch (true) {
                case operation === "updateParent":

                    this._cache.set(
                        parentId,
                        modify(
                            merge(this._cache.get(parentId), {}),
                            [
                                [
                                    "properties.التفصيلات.relation",
                                    _.reject(
                                        _.get(this._cache.get(parentId), "properties.التفصيلات.relation") || [],
                                        {id}
                                    )
                                ],
                                ["properties.متزامن.checkbox", true],
                                ["properties.وقت التعديل السابق.date.start", editTimeString],
                            ]
                        )
                    )
                    break;

                case (operation === "updateChild") && !includeChildrenDeletion:
                    this._cache.set(
                        childId,
                        modify(
                            merge(this._cache.get(childId), {}),
                            [
                                [
                                    "properties.تفصيلة لـ.relation",
                                    _.reject(
                                        _.get(this._cache.get(childId), "properties.تفصيلة لـ.relation") || [],
                                        {id}
                                    )
                                ],
                                ["properties.متزامن.checkbox", true],
                                ["properties.وقت التعديل السابق.date.start", editTimeString],
                            ]
                        )
                    )
                    break;

                case operation === "delete":
                    this._sync(
                        id,
                        {
                            unsync: true,
                            deleting: true,
                            editTimeString: editTimeSyncString
                        }
                    )

                    if (cacheDeletedTasks) {
                        this._cache.set(
                            id,
                            modify(
                                merge(task, this._cache.get(id) || {}),
                                [
                                    ["archived", true],
                                    ["in_trash", true],
                                    ["properties.متزامن.checkbox", false],
                                    ["properties.محذوف.checkbox", false],
                                    ["properties.وقت التعديل السابق.date.start", editTimeString],
                                ]
                            )
                        )
                    } else {
                        this._cache.delete(id)
                    }

                    break;

                case operation === "deleteChildren":
                    for (const task of await this._deleteAllSubTasks(childrenIds)) {
                        const {id} = task

                        this._cache.set(
                            id,
                            merge(task, this._cache.get(id) || {})
                        )
                    }
                    break;

                default:
                    this._sync(
                        id,
                        {
                            editTimeString: editTimeSyncString
                        }
                    )
                    this._cache.set(
                        id,
                        modify(
                            merge(task, this._cache.get(id) || {}),
                            [
                                ["properties.متزامن.checkbox", true],
                                ["properties.وقت التعديل السابق.date.start", editTimeString],
                            ]
                        )
                    )

                    break;
            }

        }

        this._cache = new Map(Array.from(this._cache.entries()).filter(([, {id}]) => id))
    }

    _deleteAllSubTasks = async (subTasksIds) => {
        const tasks = []
        for (const notionId of subTasksIds) {
            const subTask = await this._notion
                .page(notionId)
                .edit(
                    {
                        properties: {
                            "وقت التعديل السابق": {
                                date: {
                                    start: new Date().toJSON(),
                                },
                            },
                            "محذوف": {
                                checkbox: false,
                            },
                            "متزامن": {
                                checkbox: false,
                            },
                        },
                        archived: true,
                    }
                )

            tasks.push(subTask)

            const {
                properties: {
                    "التفصيلات": {relation: children}
                }
            } = subTask

            const childrenIds = children.map(({id}) => id)

            if (children.length) {
                tasks.push(
                    ...await this._deleteAllSubTasks(childrenIds)
                )
            }
        }

        return tasks
    }

    static _generatePatches = function* (tasks, includeChildrenDeletion = false) {
        for (const task of tasks) {

            const {
                id,
                properties: {
                    "محذوف": {checkbox: deleted},
                    "تفصيلة لـ": {relation: parents},
                    "التفصيلات": {relation: children}
                }
            } = task

            if (deleted) {
                yield {
                    id,
                    operation: "delete",
                    task
                }

                for (const {id: parentId} of parents) {
                    yield {
                        id,
                        operation: "updateParent",
                        parentId,
                        task
                    }
                }

                if (includeChildrenDeletion) {
                    yield {
                        id,
                        operation: "deleteChildren",
                        childrenIds: children.map(({id}) => id),
                        task
                    }
                } else {
                    for (const {id: childId} of children) {
                        yield {
                            id,
                            operation: "updateChild",
                            childId,
                            task
                        }
                    }
                }

            } else {
                yield {
                    id,
                    task
                }
            }

        }
    }

    static _createEditTime = (timeZone) => {
        const editTime = moment(new Date()).tz(timeZone).utcOffset(0).seconds(0).milliseconds(0).subtract(1, "minute")
        const editTimeString = editTime.format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        const editTimeSyncString = editTime.add(1, 'minute').format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        return [editTime, editTimeString, editTimeSyncString]
    }
}

class ManagerNotionEditedTasksDetector extends ManagerNotionDetector {
    constructor(props) {
        super(props)
        this._cache = new Map()
    }

    list = () =>
        this._notion
            .database(this._tasksDatabaseId)
            .query(
                {
                    filter: {
                        and: [
                            {
                                property: 'متزامن',
                                checkbox: {
                                    equals: true
                                }
                            },
                            {
                                property: 'تم تعديله',
                                formula: {
                                    checkbox: {
                                        equals: true
                                    }
                                }
                            }
                        ]
                    },
                    sorts: [
                        {
                            timestamp: 'last_edited_time',
                            direction: 'descending'
                        }
                    ]
                }
            )

    get = async () => {

        await this._operate(
            {
                includeChildrenDeletion: true,
                cacheDeletedTasks: true
            }
        )

        return Array.from(this._cache.values())
    }
}

class ManagerNotionNewTasksDetector extends ManagerNotionDetector {
    constructor(props) {
        super(props)
        this._cache = new Map()
    }

    list = () =>
        this._notion
            .database(this._tasksDatabaseId)
            .query(
                {
                    filter: {
                        property: 'متزامن',
                        checkbox: {
                            equals: false,
                        },
                    },
                    sorts: [
                        {
                            property: 'التاريخ',
                            direction: 'descending',
                        },
                    ],
                }
            )

    get = async () => {

        await this._operate()

        return Array.from(this._cache.values())
    }
}

class ManagerNotion extends ManagerNotionBase {
    constructor(props) {
        super(props)
        this.newTasks = new ManagerNotionNewTasksDetector(props)
        this.editedTasks = new ManagerNotionEditedTasksDetector(props)
    }
}

exports.ManagerNotion = ManagerNotion