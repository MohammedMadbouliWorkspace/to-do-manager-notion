const zapier = require('zapier-platform-core');
zapier.tools.env.inject();

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { TASKS_DELTA_INPUT } = require("../../../.mock.json")

describe('triggers.apply_tasks_delta', () => {
    it('should run', async () => {

        const bundle = {
            authData: {
                access_token: process.env.ACCESS_TOKEN
            },
            inputData: {
                databaseId: process.env.TASKS_DATABASE_ID,
                tasksDeltaObject: JSON.stringify(TASKS_DELTA_INPUT),
                airtablePersonalAccessToken: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
                airtableBaseId: process.env.AIRTABLE_BASE_ID,
                airtableIdsTableId: process.env.AIRTABLE_IDS_TABLE_ID,
                airtableDataTableId: process.env.AIRTABLE_DATA_TABLE_ID,
                airtableSyncCheckpointsTableId: process.env.AIRTABLE_SYNC_CHECKPOINTS_TABLE_ID,
                timeZone: process.env.TIMEZONE
            }
        };

        const results = await appTester(
            App.creates['apply_tasks_delta'].operation.perform,
            bundle
        );

        expect(results).toBeDefined();
    }, 100000);
});
