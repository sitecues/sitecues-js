// Alameda configuration
// Must be inserted before alameda by the build process

/* globals SC_RESOURCE_FOLDER_NAME  */

sitecues._require = {
  defaultErrback: function(error) {
    var event = new CustomEvent('SitecuesRequireFailure', {detail: error});
    window.dispatchEvent(event);
  },
  waitSeconds: 30,
  baseUrl: (function(config) {
    var resourceFolderName = SC_RESOURCE_FOLDER_NAME,
      scriptUrl = config.scriptUrl || config.script_url, // Old load script sometimes used underscore names, which is deprecated but still supported
      folderOnly = scriptUrl.substring(0, scriptUrl.lastIndexOf('/js/')),
      withVersionName = folderOnly + '/' + resourceFolderName + '/js/',
      withLatestReplaced = withVersionName.replace('/latest/', '/' + resourceFolderName + '/');  // The /latest/ means the current version

    return withLatestReplaced;  // Includes version name so that cached resources are only used with the appropriately matching sitecues.js
  })(sitecues.everywhereConfig || sitecues.config),
  map: {
    '*': {
      '$': 'page/jquery/jquery'
    }
  }
};
