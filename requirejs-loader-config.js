var require = {
  // Tell loader to never search for or execute a script with a "data-main"
  // attribute, since this could have weird consequences on customer pages.
  skipDataMain : true,
  baseUrl: (function(scriptUrl) { return scriptUrl.substring(0, scriptUrl.lastIndexOf('/')) + '/'; })(sitecues.config.scriptUrl),
  // Make aliases to modules, for convenience.
  map: {
    // All modules get 'jquery-private' when they ask for 'jquery',
    // so that we can secretly return a customized value which
    // implements .noConflict() to avoid puking on customers.
    '*': {
      '$': 'util/jquery-private'
    }
  },
  paths: {
    jquery: 'jquery-1.9.0'
  },
  // This will be replaced in core.mk via a call to insert-bundle-config.js
  bundles: '__SITECUES_BUNDLES__'
};