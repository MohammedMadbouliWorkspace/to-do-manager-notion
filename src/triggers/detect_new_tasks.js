const {ManagerNotion} = require("../kit/imps/manager-notion");
const {v4: uuidv4} = require("uuid");

module.exports = {
    operation: {
        perform: async (z, bundle) => {
            const mn = new ManagerNotion(
                {
                    accessToken: bundle.authData.access_token,
                    tasksDatabaseId: bundle.inputData.databaseId,
                    tasksPerRound: parseInt(bundle.inputData.tasksPerRound),
                    timeZone: bundle.inputData.timeZone
                }
            )

            const newTasks = await mn.newTasks.get()

            return newTasks?.length ? [{ id: uuidv4(), data: JSON.stringify(newTasks) }] : []
        },
        inputFields: [
            {
                key: 'databaseId',
                type: 'string',
                label: 'Database',
                dynamic: 'list_databases.id.title',
                required: true,
                list: false,
                altersDynamicFields: false,
            },
            {
                key: 'tasksPerRound',
                type: 'integer',
                label: 'Tasks Per Round',
                default: '75',
                required: true,
                list: false,
                altersDynamicFields: false,
            },
            {
                key: 'timeZone',
                label: 'Time Zone',
                type: 'string',
                choices: Intl.supportedValuesOf('timeZone'),
                required: false,
                list: false,
                altersDynamicFields: false,
            }
        ],
        sample: {
            id: '6f4525bf-647a-4a05-bdde-ae9307aef063',
            data: '[{"object":"page","id":"de3d37a0-d856-4b2d-94fb-7826c2674dfc","created_time":"2024-02-29T00:14:00.000Z","last_edited_time":"2024-02-29T00:14:00.000Z","created_by":{"object":"user","id":"a85ad162-9cf4-41bf-9ac0-bae4f6ebb2d9"},"last_edited_by":{"object":"user","id":"a85ad162-9cf4-41bf-9ac0-bae4f6ebb2d9"},"cover":null,"icon":{"type":"emoji","emoji":"📖"},"parent":{"type":"database_id","database_id":"e635b399-e657-4625-be0e-af819a8907d6"},"archived":false,"properties":{"ألغي":{"id":"%3DI%7Dl","type":"checkbox","checkbox":false},"الوقت":{"id":"M%3Cqr","type":"formula","formula":{"type":"string","string":"02:14 AM ᅳ‌ 02:14 AM"}},"أجل":{"id":"OcEi","type":"checkbox","checkbox":false},"تم":{"id":"Rm%60%5E","type":"checkbox","checkbox":false},"التالي":{"id":"UbdZ","type":"relation","relation":[],"has_more":false},"تفصيلة لـ":{"id":"VKlJ","type":"relation","relation":[],"has_more":false},"التاريخ":{"id":"XE%5Dd","type":"date","date":{"start":"2024-02-29T02:14:00.000+02:00","end":null,"time_zone":null}},"نوع المهمة":{"id":"eEdD","type":"multi_select","multi_select":[{"id":"C<Fx","name":"مذاكرة","color":"blue"},{"id":";\\\\s|","name":"قراءة","color":"blue"},{"id":"P?R{","name":"استماع","color":"blue"},{"id":"MHRy","name":"عبادة","color":"green"}]},"متزامن":{"id":"lgWG","type":"checkbox","checkbox":false},"الوصف":{"id":"sG%7CS","type":"rich_text","rich_text":[]},"السابق":{"id":"x%5EeG","type":"relation","relation":[],"has_more":false},"التفصيلات":{"id":"%7Dc%7Cw","type":"relation","relation":[],"has_more":false},"الهدف":{"id":"~%5BUl","type":"relation","relation":[],"has_more":false},"الاسم":{"id":"title","type":"title","title":[{"type":"text","text":{"content":"مراجعة القرآن","link":null},"annotations":{"bold":false,"italic":false,"strikethrough":false,"underline":false,"code":false,"color":"default"},"plain_text":"مراجعة القرآن","href":null}]}},"url":"https://www.notion.so/de3d37a0d8564b2d94fb7826c2674dfc","public_url":null}]',
        },
        outputFields: [{key: 'id'}, {key: 'data'}],
    },
    display: {
        description: 'Triggers when new tasks are created.',
        hidden: false,
        label: 'New Tasks',
    },
    key: 'detect_new_tasks',
    noun: 'Tasks',
};
