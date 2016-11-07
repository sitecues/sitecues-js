/**
 * data-map implementation for the IN-PAGE library (not extension)
 * This returns the data for a data module name.
 * Data is retrieved from the network as needed
 * Example of data folder is locale-data
 * See source-folders.json to get a list of data folders
 */
define([], function() {
  // Hack: sitecues.require() is used instead of require() so that we can use it with a variable name
  function get(dataModuleName, callback) {
    sitecues.require([ dataModuleName ], function(data) {
      callback(data);
    });
  }

  return {
    get: get
  };
});