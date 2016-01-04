/**
 * data-map implementation for the EXTENSION
 * This returns the data for a data module name.
 * All data is bundled with the extension in order to avoid network requests.
 * Example of data folder is locale-data
 * See source-folders.json to get a list of data folders
 */

define([], function() {
  // This is a handlebars template!
  // It is generated from the contents of data folders via the build system
  // See task/extension/js.js -- generateDataMapFile()

  //noinspection JSUnresolvedVariable,JSUnresolvedVariable,JSUnresolvedVariable,JSUnresolvedVariable
  /* jshint ignore:start */
  function get(dataModuleName, callback) {
    {{#each dataModules}}
    if (dataModuleName === '{{this}}') {
      require(['{{this}}'], function(data) {
        callback(data);
      });
    }
    {{/each}}
  }
  /* jshint ignore:end */

  return {
    get: get
  };
});
