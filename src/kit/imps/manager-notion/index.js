const {Notion} = require("../../foundations/notion");
const {asyncIter2Array} = require("../../utils/async/index");
const _ = require("lodash")
const moment = require('moment-timezone');
const {modify, merge, dynamic} = require("../../utils/iter");
const {Airtable} = require("../../foundations/airtable");
const {Action} = require("../../foundations/bulk");

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

class ManagerNotionTasksDeltaHandler extends ManagerNotionBase {
    constructor(props) {
        super(props)
        this._tasksDelta = {}
    }

    storeIds = async (cells) =>
        await this._airtable
            .base(this._airtableBaseId)
            .table(this._airtableIdsTableId)
            .bulkCreateByCells(
                cells,
                ["notionId", "microsoftId", "parentNotionId", "parentMicrosoftId"]
            )

    deleteIds = async (recordIds) =>
        await this._airtable
            .base(this._airtableBaseId)
            .table(this._airtableIdsTableId)
            .bulkDelete(recordIds)

    storeData = async (cells) =>
        await this._airtable
            .base(this._airtableBaseId)
            .table(this._airtableDataTableId)
            .bulkCreateByCells(
                cells,
                ["notionId", "microsoftId", "notionData", "microsoftData"]
            )

    editData = async (cells) =>
        await this._airtable
            .base(this._airtableBaseId)
            .table(this._airtableDataTableId)
            .bulkEditByCells(
                cells,
                ["notionData", "microsoftData"]
            )

    editDataByField = async (cells, field) =>
        await this._airtable
            .base(this._airtableBaseId)
            .table(this._airtableDataTableId)
            .bulkEditByQuery(
                cells.map(
                    ([value, notionData, microsoftData]) => (
                        {
                            query: {
                                [field]: value
                            },
                            fields: {
                                notionData,
                                microsoftData
                            }
                        }
                    )
                )
            )

    deleteData = async (recordIds) =>
        await this._airtable
            .base(this._airtableBaseId)
            .table(this._airtableDataTableId)
            .bulkDelete(recordIds)

    deleteDataByField = async (values, field) =>
        await this._airtable
            .base(this._airtableBaseId)
            .table(this._airtableDataTableId)
            .bulkDeleteByQuery(
                {
                    [field]: values
                }
            )

    config = (
        {
            airtableConfig: {
                apiKey: airtableAPIKey,
                baseId: airtableBaseId,
                dataTableId: airtableDataTableId,
                idsTableId: airtableIdsTableId,
                syncCheckpointsTableId: airtableSyncCheckpointsTableId,
            }
        }
    ) => {
        this._airtable = new Airtable(
            {
                apiKey: airtableAPIKey
            }
        )
        this._airtableBaseId = airtableBaseId
        this._airtableIdsTableId = airtableIdsTableId
        this._airtableDataTableId = airtableDataTableId
        this._airtableSyncCheckpointsTableId = airtableSyncCheckpointsTableId
    }

    provide = (tasksDelta) => {
        this._tasksDelta = tasksDelta
    }

    apply = async () => {
        const {toEdit, toCreate, toDelete, toRefresh} = this._tasksDelta

        const toEditCD = Action.connect(
            toEdit,
            await asyncIter2Array(
                toEdit,
                async ({ids: {notionId}, data}) =>
                    await this._notion.page(notionId).edit(
                        this._createNotionRequestBody(data)
                    )
            ),
            "ids.notionId",
            "id",
            "flat"
        )

        await this.editData(
            toEditCD.map(
                (
                    [,
                        {
                            ids: {airtableId},
                            syncData: {microsoftData}
                        },
                        notionData
                    ]
                ) => [
                    airtableId,
                    JSON.stringify(notionData),
                    JSON.stringify(microsoftData)
                ]
            )
        )

        const [toCreateReady, toCreateBending] = _.partition(
            toCreate,
            ({ids: {parentNotionId}}) => parentNotionId
        )

        const [toCreateBendingParents, toCreateBendingChildren] = _.partition(
            toCreateBending,
            ({ids: {parentMicrosoftId}}) => !parentMicrosoftId
        )

        const toCreateReadyCD =
            await asyncIter2Array(
                toCreateReady,
                async ({
                           ids: {microsoftId, checklistItemMicrosoftId, parentMicrosoftId, parentNotionId},
                           data,
                           syncData: {microsoftData}
                       }) => {
                    const notionData = await this._notion
                        .database(this._tasksDatabaseId)
                        .create(
                            this._createNotionRequestBody({...data, parentNotionId})
                        )

                    return {
                        notionId: notionData?.id,
                        parentNotionId,
                        microsoftId,
                        parentMicrosoftId,
                        checklistItemMicrosoftId,
                        notionData,
                        microsoftData
                    }
                }
            )

        const toCreateBendingParentsCD =
            await asyncIter2Array(
                toCreateBendingParents,
                async ({ids: {microsoftId}, data, syncData: {microsoftData}}) => {
                    const notionData = await this._notion
                        .database(this._tasksDatabaseId)
                        .create(
                            this._createNotionRequestBody(data)
                        )

                    return {
                        notionId: notionData?.id,
                        microsoftId,
                        notionData,
                        microsoftData
                    }
                }
            )

        const toCreateBendingChildrenCD =
            await asyncIter2Array(
                Action.connect(
                    toCreateBendingChildren,
                    toCreateBendingParentsCD,
                    "ids.parentMicrosoftId",
                    "microsoftId",
                    "flat"
                ),
                async (
                    [,
                        {
                            ids: {
                                microsoftId,
                                parentMicrosoftId,
                                checklistItemMicrosoftId
                            },
                            data,
                            syncData: {
                                microsoftData
                            }
                        },
                        {
                            notionId: parentNotionId
                        }
                    ]
                ) => {
                    const notionData = await this._notion
                        .database(this._tasksDatabaseId)
                        .create(
                            this._createNotionRequestBody({...data, parentNotionId})
                        )

                    return {
                        notionId: notionData?.id,
                        parentNotionId,
                        microsoftId,
                        parentMicrosoftId,
                        checklistItemMicrosoftId,
                        notionData,
                        microsoftData
                    }
                }
            )

        const toCreateCD = [
            ...toCreateReadyCD,
            ...toCreateBendingParentsCD,
            ...toCreateBendingChildrenCD
        ]


        await this.storeData(
            toCreateCD.map(
                ({
                     notionId,
                     microsoftId,
                     notionData,
                     microsoftData
                 }) => [notionId, microsoftId, JSON.stringify(notionData), JSON.stringify(microsoftData)]
            )
        )

        await this.storeIds(
            toCreateCD.filter(
                (
                    {
                        notionId,
                        checklistItemMicrosoftId,
                        parentNotionId,
                        parentMicrosoftId
                    }
                ) => notionId && checklistItemMicrosoftId && parentNotionId && parentMicrosoftId
            ).map(
                (
                    {
                        notionId,
                        checklistItemMicrosoftId,
                        parentNotionId,
                        parentMicrosoftId
                    }
                ) => [
                    notionId,
                    checklistItemMicrosoftId,
                    parentNotionId,
                    parentMicrosoftId
                ]
            )
        )

        const toDeleteCD = Action.connect(
            toDelete,
            await asyncIter2Array(
                toDelete,
                async ({ids: {notionId}}) =>
                    await this._notion.page(notionId).edit(
                        this._createNotionRequestBody({archived: true})
                    )
            ),
            "ids.notionId",
            "id",
            "flat"
        )

        const toRefreshCD = Action.connect(
            toRefresh,
            await asyncIter2Array(
                toRefresh,
                async ({ids: {notionId}}) =>
                    await this._notion.page(notionId).get()
            ),
            "ids.notionId",
            "id",
            "flat"
        )

        await this.editDataByField(
            toRefreshCD.map(
                (
                    [,
                        {ids: {notionId}, syncData: {microsoftData}},
                        notionData
                    ]
                ) => [
                    notionId,
                    JSON.stringify(notionData),
                    JSON.stringify(microsoftData)
                ]
            ),
            "notionId"
        )

    }

    _createNotionRequestBody = ({checked, emoji, title, date, parentNotionId, archived}) => {
        const [, , editTimeSyncString] = ManagerNotionDetector._createEditTime(this._timeZone)

        return dynamic(
            {
                icon: {
                    type: emoji ? "emoji" : undefined,
                    emoji
                },
                properties: {
                    "الاسم": {
                        "title": [
                            {
                                "text": {
                                    "content": title
                                }
                            }
                        ]
                    },
                    "تم": {
                        checkbox: checked
                    },
                    "محذوف": {
                        checkbox: archived
                    },
                    "متزامن": {
                        checkbox: true
                    },
                    "التاريخ": {
                        date
                    },
                    "تفصيلة لـ": {
                        relation: [
                            {
                                id: parentNotionId
                            }
                        ]
                    },
                    "وقت التعديل السابق": !archived ? {
                        date: {
                            start: editTimeSyncString,
                        }
                    } : {}
                }
            },
            { preserveEmpty: false }
        )
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
        this.asTasksDelta = new ManagerNotionTasksDeltaHandler(props)
    }
}

exports.ManagerNotion = ManagerNotion