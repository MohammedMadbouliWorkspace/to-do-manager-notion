const {v4: uuidv4} = require("uuid");
const {ManagerNotion} = require("../kit/imps/manager-notion");

module.exports = {
    display: {
        description: 'Applies Microsoft Tasks Delta in a Notion Database',
        hidden: false,
        label: 'Applies Microsoft Tasks Delta',
    },
    key: 'apply_tasks_delta',
    noun: 'Tasks Delta Application Result',
    operation: {
        inputFields: [
            {
                key: 'tasksDeltaObject',
                label: 'Tasks Delta Object',
                type: 'string',
                required: true,
                list: false,
                altersDynamicFields: false,
            },
            {
                key: 'airtablePersonalAccessToken',
                label: 'Airtable Personal Access Token',
                type: 'string',
                required: true,
                list: false,
                altersDynamicFields: false,
            },
            {
                key: 'airtableBaseId',
                label: 'Airtable Base Id',
                type: 'string',
                dynamic: 'list_airtable_bases.id.name',
                required: true,
                list: false,
                altersDynamicFields: false,
            },
            {
                key: 'airtableIdsTableId',
                label: 'Airtable Ids Table Id',
                type: 'string',
                dynamic: 'list_airtable_tables.id.name',
                required: true,
                list: false,
                altersDynamicFields: false,
            },
            {
                key: 'airtableDataTableId',
                label: 'Airtable Data Table Id',
                type: 'string',
                dynamic: 'list_airtable_tables.id.name',
                required: true,
                list: false,
                altersDynamicFields: false,
            },
            {
                key: 'airtableSyncCheckpointsTableId',
                label: 'Airtable Sync Checkpoints Table Id',
                type: 'string',
                dynamic: 'list_airtable_tables.id.name',
                required: true,
                list: false,
                altersDynamicFields: false,
            },
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
                key: 'timeZone',
                label: 'Time Zone',
                type: 'string',
                choices: Intl.supportedValuesOf('timeZone'),
                required: true,
                list: false,
                altersDynamicFields: false,
            },
        ],
        perform: async (z, bundle) => {

            const mn = new ManagerNotion(
                {
                    accessToken: bundle.authData.access_token,
                    tasksDatabaseId: bundle.inputData.databaseId,
                    timeZone: bundle.inputData.timeZone
                }
            )

            mn.asTasksDelta.config(
                {
                    airtableConfig: {
                        apiKey: bundle.inputData.airtablePersonalAccessToken,
                        baseId: bundle.inputData.airtableBaseId,
                        dataTableId: bundle.inputData.airtableDataTableId,
                        idsTableId: bundle.inputData.airtableIdsTableId,
                        syncCheckpointsTableId: bundle.inputData.airtableSyncCheckpointsTableId,
                    }
                }
            )

            mn.asTasksDelta.provide(
                JSON.parse(bundle.inputData.tasksDeltaObject)
            )

            try {
                await mn.asTasksDelta.apply()
                return {
                    id: uuidv4(),
                    succeed: true
                }
            } catch (error) {
                return {
                    id: uuidv4(),
                    succeed: false,
                    error
                }
            }


        },
    },
};
