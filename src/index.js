const authentication = require('./authentication');
const detectNewTasksTrigger = require('./triggers/detect_new_tasks.js');
const listDatabasesTrigger = require('./triggers/list_databases.js');
const detectEditedTasksTrigger = require('./triggers/detect_edited_tasks.js');

module.exports = {
  version: require('../package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication: authentication,
  triggers: {
    [detectNewTasksTrigger.key]: detectNewTasksTrigger,
    [listDatabasesTrigger.key]: listDatabasesTrigger,
    [detectEditedTasksTrigger.key]: detectEditedTasksTrigger,
  },
};
