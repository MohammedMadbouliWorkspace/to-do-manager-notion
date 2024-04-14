const zapier = require('zapier-platform-core');

// Use this to make test calls into your app:
const App = require('../../index');
const appTester = zapier.createAppTester(App);
// read the `.env` file into the environment, if available
zapier.tools.env.inject();

describe('triggers.detect_new_tasks', () => {
    it('should run', async () => {
        const bundle = {
            authData: {
                access_token: process.env.ACCESS_TOKEN
            },
            inputData: {
                databaseId: process.env.TASKS_DATABASE_ID,
                tasksPerRound: process.env.TASKS_PER_ROUND,
                timeZone: process.env.TIMEZONE
            }
        };

        const results = await appTester(
            App.triggers['detect_new_tasks'].operation.perform,
            bundle
        );
        expect(results).toBeDefined();
    }, 100000);
});
