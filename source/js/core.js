/*
 * Sitecues: core.js
 *   The core module of the sitecues library.
 */

(function () {

  'use strict';

  // WARNING: **** DO NOT REMOVE OR CHANGE THE FOLLOWING LINE! ****
  var version = '0.0.0-UNVERSIONED',

   // Array's prototype
  arr = Array.prototype,

  // Either ws.sitecues.com/ or ws.dev.sitecues.com/
  apiDomain,

  // Either up.sitecues.com/ or up.dev.sitecues.com/
  prefsDomain,

  // Modules container
  modules = {},

  // Each customization that is registered requires a new index by which it is referenced in the
  // future
  customizationIndex = 0,

  // Sitecues top-level namespace: all public classes and modules will be
  // attached to this name space and aliased on 'window.sitecues'. This
  // variable is initialized at the bottom of this script.
  sitecues = null,

  // Private Functions
  exportPublicFields, resolveUrl, parseUrlQuery, parseUrl,

  // Public Functions (these should be registered in the exportPublicFields() function)
  getVersion, getLibraryUrl, getPrefsUrl, getApiUrl, getSiteConfig, getEverywhereConfig, on, off, emit, def, use,
  resolveSitecuesUrl, loadScript, load,

  // Define place-holder for Logger
  log = {
    fatal     : function () {},
    error     : function () {},
    warn      : function () {},
    info      : function () {},
    debug     : function () {},
    trace     : function () {},
    newLogger : function () {
      return this;
    }
  };

  function safe_production_msg (text) {
    if (window.navigator.userAgent.indexOf('MSIE ') > 0) {
      // Using console.log in IE9 too early can cause "Invalid pointer" errors -- see SC-2237.
      // To be safe, do not use console.log in core.js in IE.
      return;
    }
    if (console) {
      console.log('**** '+text+' ****');
    }
  }

  if (SC_DEV) {
    safe_production_msg('SITECUES MODE: SC_DEV');
    safe_production_msg('SITECUES VERSION: '+version);
  }

  // This function is called when we are sure that no other library already exists in the page. Otherwise,
  // we risk overwriting the methods of the live library.
  exportPublicFields = function () {
    sitecues.getVersion = getVersion;
    sitecues.getApiUrl = getApiUrl;
    sitecues.getPrefsUrl = getPrefsUrl;
    sitecues.getLibraryUrl = getLibraryUrl;
    sitecues.getSiteConfig = getSiteConfig;
    sitecues.getEverywhereConfig = getEverywhereConfig;
    sitecues.on = on;
    sitecues.off = off;
    sitecues.emit = emit;
    sitecues.def = def;
    sitecues.use = use;
    sitecues.resolveSitecuesUrl = resolveSitecuesUrl;
    sitecues.loadScript = loadScript;
    sitecues.load = load;
    sitecues.parseUrl = parseUrl;
    sitecues.resolveUrl = resolveUrl;
  };


  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Getters
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  getVersion = function() {
    return version;
  };

  function isProduction() {
    return getLibraryUrl().hostname === 'js.sitecues.com';
  }

  function initServices() {
    var domainEnding = isProduction() ? '.sitecues.com/' : '.dev.sitecues.com/';
    apiDomain = 'ws' + domainEnding;
    prefsDomain = 'up' + domainEnding;
  }

  getApiUrl = function(restOfUrl) {
    return 'https://' + apiDomain + 'sitecues/api/' + restOfUrl;
  };

  getPrefsUrl = function(restOfUrl) {
    return 'https://' + prefsDomain + restOfUrl;
  };

  getLibraryUrl = function() {
    // Underscore names deprecated
    var url = getEverywhereConfig().scriptUrl || getSiteConfig().scriptUrl || getSiteConfig().script_url;
    return url && parseUrl(url);
  };

  getSiteConfig = function() {
    return sitecues.config || {};
  };

  getEverywhereConfig = function() {
    return sitecues.everywhereConfig || {};
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Event Management
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // bind an event, specified by a string name, `events`, to a `callback`
  // function. passing `'*'` will bind the callback to all events fired
  on = function(events, callback, context) {
    var ev, list, tail;
    events = events.split(/\s+/);
    var calls = this._events || (this._events = {});
    while ((ev = events.shift())) {
      // create an immutable callback list, allowing traversal during
      // modification. the tail is an empty object that will always be used
      // as the next node
      list = calls[ev] || (calls[ev] = {});
      tail = list.tail || (list.tail = list.next = {});
      tail.callback = callback;
      tail.context = context;
      list.tail = tail.next = {};
  }
    return this;
  };

  // remove one or many callbacks. if `context` is null, removes all callbacks
  // with that function. if `callback` is null, removes all callbacks for the
  // event. if `events` is null, removes all bound callbacks for all events
  off = function(events, callback, context) {
    var ev, calls, node;
    if (!events) {
      delete this._events;
    } else if (calls = this._events) {
      events = events.split(/\s+/);
      while ((ev = events.shift())) {
        node = calls[ev];
        delete calls[ev];
        if (!callback || !node) {
          continue;
        }

        // create a new list, omitting the indicated event/context pairs
        while ((node = node.next) && node.next) {
          if (node.callback === callback && (!context || node.context === context)) {
            continue;
          }
          this.on(ev, node.callback, node.context);
        }
      }
    }

    return this;
  };

  // emit an event, firing all bound callbacks. callbacks are passed the
  // same arguments as `trigger` is, apart from the event name.
  // listening for `'*'` passes the true event name as the first argument
  emit = function(events) {
    var event, node, calls, tail, args, all, rest;
    if (!(calls = this._events)) {
        return this;
    }

    all = calls['*'];
    (events = events.split(/\s+/)).push(null);

    // save references to the current heads & tails
    while ((event = events.shift())) {
      if (all) {
        events.push({
          next: all.next,
          tail: all.tail,
          event: event
        });
      }
      if (!(node = calls[event])) {
        continue;
      }
      events.push({
        next: node.next,
        tail: node.tail
      });
    }

    // traverse each list, stopping when the saved tail is reached.
    rest = arr.slice.call(arguments, 1);
    while ((node = events.pop())) {
      tail = node.tail;
      args = node.event ? [node.event].concat(rest) : rest;
      while ((node = node.next) !== tail) {
        node.callback.apply(node.context || this, args);
      }
    }

      return this;
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Module Management
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // Module modes management:
  var MODULE_STATE = {
    NONE         : 1, // A 'def' or 'use' call has never been made for the module.
    LOADING      : 2, // A 'use' call has been made for a module, and a load request has been started.
    INITIALIZING : 3, // A 'def' call has been made for a module, and the module is initializing.
    READY        : 4  // The module is initialized and ready for use.
  },
  READY_FOR_DEF_CALLS = false,
  DEF_QUEUE = [],
  LOAD_LIST = [];

  // Returns the state of the requested module.
  var getModuleState = function(name) {
    var module = modules[name];

    if (!module) {
      // There is no entry, so the there is no state.
      return MODULE_STATE.NONE;
    }

    // The entry is a number, so just return that saved state.
    if (typeof module === 'number') {
      return module;
    }

    // Otherwise, the entry is an object, so the module is ready.
    return MODULE_STATE.READY;
  };

  // define equinox module
  var _def = function(name, constructor) {

    // Handle customizations, which do not require a def name for defining the module
    if (typeof name === 'function') {
      constructor = name;
      name = 'custom_' + customizationIndex;
      customizationIndex++;
    }

    // do not define modules twice.
    if (getModuleState(name) >= MODULE_STATE.INITIALIZING) {
      log.warn('sitecues: module ' + name + ' already defined.');
      return;
    }

    var module = {};

    // module is initializing
    modules[name] = MODULE_STATE.INITIALIZING;

    // call constructor for module
    constructor(module, function(result) {

      // if return present
      if (result) {
        module = result;
      } else {
        // Modules can double-load when an sitecues.def use statement
        // does not fire callback();
      }
      // save module for future call
      modules[name] = module;
      // notify about new module
      sitecues.emit('module', name, module);
      // notify about new module load once
      sitecues.emit('load/' + name, module).off('load/' + name);
      // Module checking.....
      modules[name].defined = true;

      // Apply any registered customizations
      if (modules.custom && modules.custom.check) {
        modules.custom.check.call(module, name);
      }

      // Process the next module in the Def_Queue
      _processDefQueue();

        // Pass a new logger into the constructor scope of the module
    }, log.newLogger(name));
  };

  // exposed function for defining modules: queues until library is ready.
  def = function(name, constructor) {

    if (READY_FOR_DEF_CALLS) {
      _def(name, constructor);
    } else {

      DEF_QUEUE.push({
        name: name,
        constructor: constructor
      });

      LOAD_LIST.push(name);
    }
  };

  var procDefCount = 0;

  // processes the def queue once initialization has completed.
  var _processDefQueue = function() {
    if (procDefCount < DEF_QUEUE.length) {
      var defObj = DEF_QUEUE[procDefCount];
      procDefCount++;
      _def(defObj.name, defObj.constructor);
    } else {
      READY_FOR_DEF_CALLS = true;

      sitecues.emit('core/allModulesLoaded');

      if (typeof sitecues.ready === 'function') {
        sitecues.ready.call(sitecues);
      }

    }
  };

  // Fire use callbacks from module files
  use = function() {

    var i = 0,
      args = arguments,
      l = args.length,
      requiredModules = [],
      sitecuesScope = this,
      useCallback, moduleName, argument, modNames = [];

    for (; i < l; i++) {
      argument = args[i];
      switch (typeof argument) {
        case 'string':
          moduleName = argument;
          modNames.push(moduleName);
          break;

        case 'function':
          useCallback = argument;
          break;
      }
      requiredModules.push(modules[moduleName]);
    }

    useCallback.apply(sitecuesScope, requiredModules);
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  URL Processing
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // Parse a URL query into key/value pairs.
  parseUrlQuery = function(queryStr) {
    var query = {};
    query.raw = queryStr;
    query.parameters = {};

    // Parse the query into key/value pairs.
    var start = 0,
      end = 0;

    if (queryStr[start] === '?'){
      start++;
    }

    while (start < queryStr.length) {
      end = queryStr.indexOf('=', start);
      if (end < 0) end = queryStr.length;

      var key = decodeURIComponent(queryStr.substring(start, end));
      start = end + 1;

      var value = null;
      if (start <= queryStr.length) {
        end = queryStr.indexOf('&', start);
        if (end < 0) end = queryStr.length;

        value = decodeURIComponent(queryStr.substring(start, end));
        start = end + 1;
      }
      query.parameters[key] = value;
    }
  };

  // Parse a URL into its components.
  parseUrl = function(urlStr) {
    if (typeof urlStr !== 'string') {
      return;
    }
    // Ran across this in a Google search... loved the simplicity of the solution.
    var url = {}, parser = document.createElement('a');
    parser.href = urlStr;

    // No one ever wants the hash on a full URL...
    if (parser.hash) {
      url.raw = parser.href.substring(parser.href.length - parser.hash.length);
    } else {
      url.raw = parser.href;
    }

    url.protocol = parser.protocol.substring(0, parser.protocol.length - 1).toLowerCase();
    url.secure = (url.protocol === 'https');
    url.hostname = parser.hostname;
    url.host = parser.host;

    if (parser.search) {
      url.query = parseUrlQuery(parser.search);
    } else {
      url.query = null;
    }
    // Extract the path and file portion of the pathname.
    var pathname = parser.pathname;

    // IE < 10 versions pathname does not contains first slash whereas in other browsers it does.
    // So let's unify pathnames. Since we need '/' anyway, just add it to pathname when needed.
    if (pathname.indexOf('/') > 0) {
      pathname = '/' + pathname;
    }

    var index = pathname.lastIndexOf('/') + 1;
    url.path = pathname.substring(0, index);
    url.file = pathname.substring(index);

    return url;
  };

  // The regular expression for an absolute URL. There is a capturing group for
  // the protocol-relative portion of the URL.
  var ABSOLUTE_URL_REQEXP = /^[a-zA-Z0-9-]+:(\/\/.*)$/i;

  // Resolve a URL as relative to a base URL.
  resolveUrl = function(urlStr, baseUrl) {
    var absRegExpResult = ABSOLUTE_URL_REQEXP.exec(urlStr);
    if (absRegExpResult) {
      // We have an absolute URL, with protocol. That's a no-no, so, convert to a
      // protocol-relative URL.
      urlStr = absRegExpResult[1];
    } else if (urlStr.indexOf('//') === 0) {
      // Protocol-relative No need to modify the URL,
      // as we will inherit the containing page's protocol.
    } else if (urlStr.indexOf('/') === 0) {
      // Host-relative URL.
      urlStr = '//' + baseUrl.host + urlStr;
    } else {
      // A directory-relative URL.
      urlStr = '//' + baseUrl.host + baseUrl.path + urlStr;
    }

    return urlStr;
  };

  // Resolve a URL as relative to the main script URL.
  resolveSitecuesUrl = function(urlStr) {
    return resolveUrl(urlStr, getLibraryUrl());
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Script Loading
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // async script loading
  loadScript = function(url, callback) {
    // Resolve the URL as relative to the library URL.
    url = sitecues.resolveSitecuesUrl(url);

    // create script DOM element
    var script = document.createElement('script');

    // set proper script type
    script.type = 'text/javascript';

    // set url
    script.src = url;

    // enforce async loading
    script.async = true;

    // add callback to track when it will be loaded.

    // NOTE: We should not be using script.onreadystatechange here for two
    // reasons: 1, it doesn't mean that the script as loaded (it could change
    // state to 'loading') and 2. it has been removed from IE as of v11.
    script.onload = callback;

    // add element to head to start loading
    document.getElementsByTagName('head')[0].appendChild(script);
  };

  /**
/* trigger module loading
/*/
  load = function() {
    // iterate over passed module names
    for (var i = 0, l = arguments.length; i < l; i++) {
      // and initiate loading of code for each
      sitecues.loadScript(arguments[i] + '.js');
    }
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Basic Site Configuration
  //    This section process the basic site configuration, whose absence will
  //    prevent the library from loading.
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  var validateConfiguration = function() {
    if (!sitecues.config) {
      log.error('The ' + sitecues.config + ' object was not provided.');
      return;
    }

    if (typeof sitecues.config !== 'object') {
      log.error('The ' + sitecues.config + ' is not an object.');
      return;
    }

    // Underscore parameters deprecated
    var everywhereConfig = getEverywhereConfig();

    // siteId is required and must be a string
    var siteId = everywhereConfig.siteId || sitecues.config.siteId || sitecues.config.site_id;
    if (typeof siteId !== 'string') {
      log.error('The siteId parameter is not provided or not a string.');
      return;
    }

    // Library URL must be a valid URL
    if (!getLibraryUrl()) {
      log.error('Unable to get sitecues script url. Library can not initialize.');
      return;
    }

    // Continue loading sitecues
    return true;
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Library Configuration
  //    This section loads the library configuration, whose absence will prevent the
  //    library from loading.
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Library Initialization
  //    This section is responsible for the initialization of the sitecues library.
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  var initialize = function () {

    // If the sitecues global object does not exist, then there is no basic site configuration, nor
    // is there a logger. Simply print an error to the console and abort initialization.

    // Set the internal reference.
    sitecues = window.sitecues;

    if (!sitecues || typeof sitecues !== 'object') {
      console.log('The base ' + window.sitecues + ' namespace was not found. The sitecues library will not load.');
      return;
    }

    // See if another sitecues library has 'planted it's flag' on this page.
    if (sitecues.exists) {
      console.error('The sitecues library already exists on this page.');
      return;
    }

    // 'Plant our flag' on this page.
    sitecues.exists = true;

    // As we have now 'planted our flag', export the public fields.
    exportPublicFields();

    // Create the logger for this module
    if (sitecues.logger) {
      log = sitecues.logger.log('core');
    }

    // Process the basic configuration needed for library initialization.
    if (!validateConfiguration()) {
      log.error('Unable to load basic site configuration. Library can not initialize.');
    } else if (window !== window.top && !sitecues.config.iframe) {
      // Stop sitecues from initializing if:
      // 1) sitecues is running in an IFRAME
      // 2) sitecues.config.iframe = falsey
      safe_production_msg('Developer note (sitecues): the following iframe attempted to load sitecues, which does not currently support iframes: '+window.location +
        ' ... email support@sitecues.com for more information.');
    }
    else {
      initServices();
      _processDefQueue(); // Load all modules
    }
  };

  // Trigger initialization.
  initialize();

}).call(this);
