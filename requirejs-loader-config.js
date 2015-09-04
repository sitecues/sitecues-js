// Provide the module loader configuration

// require is unused in this file, but used by loader for runtime config
// jshint -W098

// __SITECUES_BUNDLES__ must use quotes because that's what minifier keeps,
// and it needs to be consistent so that we can replace it with actual module structure in insert-bundle-config.js
// jshint -W109

var require = {
  // Tell loader to never search for or execute a script with a "data-main"
  // attribute, since this could have weird consequences on customer pages.
  skipDataMain : true,
  baseUrl: (function(scriptUrl) { return scriptUrl.substring(0, scriptUrl.lastIndexOf('/')) + '/'; })(sitecues.config.scriptUrl),
  // Make aliases to modules, for convenience.
  map: {
    // Modern browsers:
    // All modules get 'zepto-private' when they ask for $
    // IE9:
    // All modules get 'jquery-private' when they ask for '$',
    // so that we can secretly return a customized value which
    // implements .noConflict() to avoid puking on customers.
    '*': {
      '$': ('__proto__' in {}) ? 'dollar/zepto-private' : 'dollar/jquery-private',
      '$utils': 'dollar/dollar-utils'
    }
  },
  // This will be replaced with actual module structure in core.mk via a call to insert-bundle-config.js
  bundles: "__SITECUES_BUNDLES__"
};