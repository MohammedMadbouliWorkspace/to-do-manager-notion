const authentication = require('./authentication');
const detectNewTasksTrigger = require('./triggers/detect_new_tasks.js');
const listDatabasesTrigger = require('./triggers/list_databases.js');
const detectEditedTasksTrigger = require('./triggers/detect_edited_tasks.js');
const listAirtableBasesTrigger = require('./triggers/list_airtable_bases.js');
const listAirtableTablesTrigger = require('./triggers/list_airtable_tables.js');
const applyTasksDelta = require('./creates/apply_tasks_delta');

module.exports = {
  version: require('../package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication: authentication,
  creates: {
    [applyTasksDelta.key]: applyTasksDelta
  },
  triggers: {
    [detectNewTasksTrigger.key]: detectNewTasksTrigger,
    [listDatabasesTrigger.key]: listDatabasesTrigger,
    [detectEditedTasksTrigger.key]: detectEditedTasksTrigger,
    [listAirtableBasesTrigger.key]: listAirtableBasesTrigger,
    [listAirtableTablesTrigger.key]: listAirtableTablesTrigger,
  },
};
