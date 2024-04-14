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

            const editedTasks = await mn.editedTasks.get()

            return editedTasks?.length ? [{id: uuidv4(), data: JSON.stringify(editedTasks)}] : []
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
            data: '[{"object":"page","id":"ec863df0-5c24-467b-9cc0-5421a67cffe8","created_time":"2024-03-02T23:21:00.000Z","last_edited_time":"2024-03-02T23:40:00.000Z","created_by":{"object":"user","id":"646abac1-7293-435f-9a10-b9f694b42431"},"last_edited_by":{"object":"user","id":"a85ad162-9cf4-41bf-9ac0-bae4f6ebb2d9"},"cover":null,"icon":{"type":"emoji","emoji":"🕌"},"parent":{"type":"database_id","database_id":"e635b399-e657-4625-be0e-af819a8907d6"},"archived":false,"properties":{"ألغي":{"id":"%3DI%7Dl","type":"checkbox","checkbox":false},"الوقت":{"id":"M%3Cqr","type":"formula","formula":{"type":"string","string":"05:00 AM ᅳ‌ 05:45 AM"}},"أجل":{"id":"OcEi","type":"checkbox","checkbox":false},"تم":{"id":"Rm%60%5E","type":"checkbox","checkbox":false},"التالي":{"id":"UbdZ","type":"relation","relation":[],"has_more":false},"تم تعديله":{"id":"UljZ","type":"formula","formula":{"type":"boolean","boolean":true}},"تفصيلة لـ":{"id":"VKlJ","type":"relation","relation":[],"has_more":false},"التاريخ":{"id":"XE%5Dd","type":"date","date":{"start":"2024-03-03T05:00:00.000+02:00","end":"2024-03-03T05:45:00.000+02:00","time_zone":null}},"نوع المهمة":{"id":"eEdD","type":"multi_select","multi_select":[{"id":"VRwo","name":"صلاة","color":"green"}]},"وقت التعديل السابق":{"id":"jvsX","type":"date","date":{"start":"2024-03-02T23:35:00.000+00:00","end":null,"time_zone":null}},"متزامن":{"id":"lgWG","type":"checkbox","checkbox":true},"الوصف":{"id":"sG%7CS","type":"rich_text","rich_text":[]},"السابق":{"id":"x%5EeG","type":"relation","relation":[],"has_more":false},"التفصيلات":{"id":"%7Dc%7Cw","type":"relation","relation":[],"has_more":false},"الهدف":{"id":"~%5BUl","type":"relation","relation":[],"has_more":false},"الاسم":{"id":"title","type":"title","title":[{"type":"text","text":{"content":"الفجر","link":null},"annotations":{"bold":false,"italic":false,"strikethrough":false,"underline":false,"code":false,"color":"default"},"plain_text":"الفجر","href":null}]}},"url":"https://www.notion.so/ec863df05c24467b9cc05421a67cffe8","public_url":null},{"object":"page","id":"82670ac4-2d44-427f-978e-f393467a309f","created_time":"2024-03-02T23:21:00.000Z","last_edited_time":"2024-03-02T23:40:00.000Z","created_by":{"object":"user","id":"646abac1-7293-435f-9a10-b9f694b42431"},"last_edited_by":{"object":"user","id":"a85ad162-9cf4-41bf-9ac0-bae4f6ebb2d9"},"cover":null,"icon":{"type":"emoji","emoji":"📜"},"parent":{"type":"database_id","database_id":"e635b399-e657-4625-be0e-af819a8907d6"},"archived":false,"properties":{"ألغي":{"id":"%3DI%7Dl","type":"checkbox","checkbox":false},"الوقت":{"id":"M%3Cqr","type":"formula","formula":{"type":"string","string":"05:45 AM ᅳ‌ 06:15 AM"}},"أجل":{"id":"OcEi","type":"checkbox","checkbox":false},"تم":{"id":"Rm%60%5E","type":"checkbox","checkbox":false},"التالي":{"id":"UbdZ","type":"relation","relation":[],"has_more":false},"تم تعديله":{"id":"UljZ","type":"formula","formula":{"type":"boolean","boolean":true}},"تفصيلة لـ":{"id":"VKlJ","type":"relation","relation":[],"has_more":false},"التاريخ":{"id":"XE%5Dd","type":"date","date":{"start":"2024-03-03T05:45:00.000+02:00","end":"2024-03-03T06:15:00.000+02:00","time_zone":null}},"نوع المهمة":{"id":"eEdD","type":"multi_select","multi_select":[{"id":"ko]o","name":"أذكار","color":"green"}]},"وقت التعديل السابق":{"id":"jvsX","type":"date","date":{"start":"2024-03-02T23:36:00.000+00:00","end":null,"time_zone":null}},"متزامن":{"id":"lgWG","type":"checkbox","checkbox":true},"الوصف":{"id":"sG%7CS","type":"rich_text","rich_text":[]},"السابق":{"id":"x%5EeG","type":"relation","relation":[],"has_more":false},"التفصيلات":{"id":"%7Dc%7Cw","type":"relation","relation":[],"has_more":false},"الهدف":{"id":"~%5BUl","type":"relation","relation":[],"has_more":false},"الاسم":{"id":"title","type":"title","title":[{"type":"text","text":{"content":"الصباح","link":null},"annotations":{"bold":false,"italic":false,"strikethrough":false,"underline":false,"code":false,"color":"default"},"plain_text":"الصباح","href":null}]}},"url":"https://www.notion.so/82670ac42d44427f978ef393467a309f","public_url":null},{"object":"page","id":"2d17f268-38ce-4548-b21f-3154b33dd3c4","created_time":"2024-03-02T23:21:00.000Z","last_edited_time":"2024-03-02T23:40:00.000Z","created_by":{"object":"user","id":"646abac1-7293-435f-9a10-b9f694b42431"},"last_edited_by":{"object":"user","id":"a85ad162-9cf4-41bf-9ac0-bae4f6ebb2d9"},"cover":null,"icon":{"type":"emoji","emoji":"🕌"},"parent":{"type":"database_id","database_id":"e635b399-e657-4625-be0e-af819a8907d6"},"archived":false,"properties":{"ألغي":{"id":"%3DI%7Dl","type":"checkbox","checkbox":false},"الوقت":{"id":"M%3Cqr","type":"formula","formula":{"type":"string","string":"06:22 AM ᅳ‌ 06:52 AM"}},"أجل":{"id":"OcEi","type":"checkbox","checkbox":false},"تم":{"id":"Rm%60%5E","type":"checkbox","checkbox":false},"التالي":{"id":"UbdZ","type":"relation","relation":[],"has_more":false},"تم تعديله":{"id":"UljZ","type":"formula","formula":{"type":"boolean","boolean":true}},"تفصيلة لـ":{"id":"VKlJ","type":"relation","relation":[],"has_more":false},"التاريخ":{"id":"XE%5Dd","type":"date","date":{"start":"2024-03-03T06:22:00.000+02:00","end":"2024-03-03T06:52:00.000+02:00","time_zone":null}},"نوع المهمة":{"id":"eEdD","type":"multi_select","multi_select":[{"id":"VRwo","name":"صلاة","color":"green"}]},"وقت التعديل السابق":{"id":"jvsX","type":"date","date":{"start":"2024-03-02T23:36:00.000+00:00","end":null,"time_zone":null}},"متزامن":{"id":"lgWG","type":"checkbox","checkbox":true},"الوصف":{"id":"sG%7CS","type":"rich_text","rich_text":[]},"السابق":{"id":"x%5EeG","type":"relation","relation":[],"has_more":false},"التفصيلات":{"id":"%7Dc%7Cw","type":"relation","relation":[],"has_more":false},"الهدف":{"id":"~%5BUl","type":"relation","relation":[],"has_more":false},"الاسم":{"id":"title","type":"title","title":[{"type":"text","text":{"content":"الضحى","link":null},"annotations":{"bold":false,"italic":false,"strikethrough":false,"underline":false,"code":false,"color":"default"},"plain_text":"الضحى","href":null}]}},"url":"https://www.notion.so/2d17f26838ce4548b21f3154b33dd3c4","public_url":null}]',
        },
        outputFields: [{key: 'id'}, {key: 'data'}],
    },
    display: {
        description: 'Triggers when tasks are edited.',
        hidden: false,
        label: 'Edited Tasks',
    },
    key: 'detect_edited_tasks',
    noun: 'Tasks',
};
