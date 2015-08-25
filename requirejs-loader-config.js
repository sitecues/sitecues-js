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
      'jquery': 'jquery-private'
    },
    // Treat 'jquery-private' as a special case and allow it to access
    // the "real" jQuery module. Without this, there would be an
    // unresolvable cyclic dependency.
    'jquery-private': {
      'jquery': 'jquery'
    }
  }
};