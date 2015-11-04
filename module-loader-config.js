// Provide the module loader configuration

// require is unused in this file, but used by loader for runtime config
// jshint -W098

// __SITECUES_BUNDLES__ must use quotes because that's what minifier keeps,
// and it needs to be consistent so that we can replace it with actual module structure in finalize-loader-config.js
// jshint -W109

var require = {
  // Tell loader to never search for or execute a script with a "data-main"
  // attribute, since this could have weird consequences on customer pages.
  skipDataMain : true,
  baseUrl: (function(config) {
    var scriptUrl = config.scriptUrl || config.script_url, // Old load script sometimes used underscore names, which is deprecated but still supported
      folderOnly = scriptUrl.substring(0, scriptUrl.lastIndexOf('/js/')),
      withVersionName = folderOnly + '/__VERSION__/js/',
      withLatestReplaced = withVersionName.replace('/latest/', '/__VERSION__/');  // The /latest/ means the current version
    return withLatestReplaced;  // Includes version name so that cached resources are only used with the appropriately matching sitecues.js
  })(sitecues.everywhereConfig || sitecues.config),
  map: {
    // All modules get 'zepto' when they ask for $
    '*': {
      // We use jQuery when the page has prototype.js, as it is fundamentally incompatible with Zepto
      // This is just the tip of the iceberg: https://github.com/madrobby/zepto/issues/710
      '$': window.Prototype ? 'jquery' : 'page/zepto/zepto'
    }
  },
  // This will be replaced with actual module structure in core.mk via a call to finalize-loader-config.js
  bundles: "__SITECUES_BUNDLES__"
};

