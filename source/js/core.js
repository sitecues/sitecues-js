/*
 * Sitecues: core.js
 *   The core module of the sitecues library.
 */
(function () {
  
  'use strict';

  // NOTE: initialization of this module is at the bottom of this page.

  var
  // The compiled-in library version.
    version = '0.0.0-UNVERSIONED'

  // Private variables
    , arr               = Array.prototype  // Array's prototype
    , libraryConfig     = null             // Library config container
    , libraryUrl        = null             // The parsed library URL object
    , siteConfig        = null             // Site config container
    , modules           = {}               // Modules container
    , allModulesLoaded  = false
    // Sitecues top-level namespace: all public classes and modules will be
    // attached to this name space and aliased on "window.sitecues". This
    // variable is initialized at the bottom of this script.
    , sitecues      = null
    
  // Private Functions
    , exportPublicFields
    , resolveUrl
    , parseUrlQuery
    , parseUrl

  // Public Functions (these should be registered in the exportPublicFields() function)
    , getVersion
    , getLibraryConfig
    , getLibraryUrl
    , getSiteConfig
    , getAllModulesLoaded
    , on
    , off
    , emit
    , def
    , use
    , resolveSitecuesUrl
    , loadScript
    , load

  // Define place-holder for Logger
  , log = {
      fatal: function () {},
      error: function () {},
      warn : function () {},
      info : function () {},
      debug: function () {},
      trace: function () {},
      newLogger: function(){ return this; }
    };

  // This function is called when we are sure that no other library already exists in the page. Otherwise,
  // we risk overwriting the methods of the live library.
  exportPublicFields = function() {
    sitecues.getVersion = getVersion;
    sitecues.getLibraryConfig = getLibraryConfig;
    sitecues.getLibraryUrl = getLibraryUrl;
    sitecues.getAllModulesLoaded = getAllModulesLoaded;
    sitecues.getSiteConfig = getSiteConfig;
    sitecues.on = on;
    sitecues.off = off;
    sitecues.emit = emit;
    sitecues.def = def;
    sitecues.use = use;
    sitecues.resolveSitecuesUrl = resolveSitecuesUrl;
    sitecues.loadScript = loadScript;
    sitecues.load = load;
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Getters
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  getVersion = function() {
    return version;
  };

  getLibraryConfig = function() {
    return libraryConfig;
  };

  getLibraryUrl = function() {
    return libraryUrl;
  };

  getSiteConfig = function() {
    return siteConfig;
  };

  getAllModulesLoaded = function() {
    return allModulesLoaded;
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Event Management
  //
  //////////////////////////////////////////////////////////////////////////////////////////
  
  // bind an event, specified by a string name, `events`, to a `callback`
  // function. passing `"*"` will bind the callback to all events fired
  on = function(events, callback, context){
    var ev, list, tail;
    events = events.split(/\s+/);
    var calls = this._events || (this._events = {});
    while ((ev = events.shift())){
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
  off = function(events, callback, context){
    var ev, calls, node;
    if (!events){
      delete this._events;
    } else if (calls = this._events){
      events = events.split(/\s+/);
      while ((ev = events.shift())){
        node = calls[ev];
        delete calls[ev];
        if (!callback || !node){
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
  // listening for `"*"` passes the true event name as the first argument
  emit = function(events){
    var event, node, calls, tail, args, all, rest;
    if (!(calls = this._events)){
      return this;
    }

    all = calls['*'];
    (events = events.split(/\s+/)).push(null);

    // save references to the current heads & tails
    while ((event = events.shift())){
      if (all){
        events.push({next: all.next, tail: all.tail, event: event});
      }
      if (!(node = calls[event])) {
        continue;
      }
      events.push({next: node.next, tail: node.tail});
    }

    // traverse each list, stopping when the saved tail is reached.
    rest = arr.slice.call(arguments, 1);
    while ((node = events.pop())){
      tail = node.tail;
      args = node.event ? [node.event].concat(rest) : rest;
      while ((node = node.next) !== tail){
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

  // Module states management:
  var MODULE_STATE = {
    NONE:         1,  // A 'def' or 'use' call has never been made for the module.
    LOADING:      2,  // A 'use' call has been made for a module, and a load request has been started.
    INITIALIZING: 3,  // A 'def' call has been made for a module, and the module is initializing.
    READY:        4   // The module is initialized and ready for use.
  }
  , READY_FOR_DEF_CALLS   = false
  , DEF_QUEUE             = []
  , LOAD_LIST             = []
  , definedLastModule     = false
  , lastDefinedModuleName = undefined
  , moduleLoadAttempts    = 0
  ;

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

  var checkDefinedModulesAreAllLoaded = function() {
    var defCount = 0
    , l     = LOAD_LIST.length
    , i
    , iModule
    ;

    for (i=0; i< l; i++) {
      iModule = modules[LOAD_LIST[i]];

      if (iModule) {
        defCount += iModule.defined === true ? 1 : 0 ;
      }
    }

    if (defCount === LOAD_LIST.length) {
      allModulesLoaded = true;
      sitecues.emit('core/allModulesLoaded');
    } else if (moduleLoadAttempts++ < 10) {
      // Keep trying to load, up to 10 times
      setTimeout(checkDefinedModulesAreAllLoaded, 200);
    }
  };

  // define equinox module
  var _def = function(name, constructor) {
    
    // do not define modules twice.
    if (getModuleState(name) >= MODULE_STATE.INITIALIZING) {
      log.warn('sitecues: module "' + name + '" already defined.');
      return;
    }

    var module = {};

    // module is initializing
    modules[name] = MODULE_STATE.INITIALIZING;

    // call constructor for module
    constructor(module, function (result) {

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

      if (name === lastDefinedModuleName) {
        definedLastModule = true;
      }

      // Only spend the cpu-clicks required to test,after last module has been defined
      if (definedLastModule) {
        // This behavior is unreliable on IE9 so we'll use the loop (see below)
        //checkDefinedModulesAreAllLoaded();
      }

    // Pass a new logger into the constructor scope of the module
    }, log.newLogger(name));
  };

  // This kicks off a loop that will wait until modules are loaded
  setTimeout(checkDefinedModulesAreAllLoaded, 50);

  // exposed function for defining modules: queues until library is ready.
  def = function(name, constructor){
    if (READY_FOR_DEF_CALLS) {
      _def(name, constructor);
    } else {
      DEF_QUEUE.push({
        name: name,
        constructor: constructor
      });
      LOAD_LIST.push(name);
      lastDefinedModuleName = name;
    }
  };

  // processes the def queue once initialization has completed.
  var _processDefQueue = function() {
    var defObj;
    while (DEF_QUEUE.length) {
      defObj = DEF_QUEUE.shift();
      _def(defObj.name, defObj.constructor);
    }

    READY_FOR_DEF_CALLS = true;
  };

  // load equinox modules
  use = function(){
    var i, l, t = this, count = 0,
      args, load, result, callback, register;

    // prepare result
    result = [];

    // get all arguments as array
    args = arr.slice.call(arguments, 0);

    // get callback as last argument
    callback = 'function' === typeof args[args.length - 1]
      ? args.pop()
      : undefined;

    // count of modules
    count = args.length;

    // register helper
    register = function(index, name){
      // return push result function
      return function(){
        // put module in result set
        result[index] = modules[name];

        // call callback if finished
        if (--count === 0 && 'function' === typeof callback) {
          callback.apply(t, result);
        }
      }
    };

    // perform all actions in next tick
    // this needed for correct loading
    // modules defined below `use` call
    count && setTimeout(function(){
      // modules to load
      load = [];

      // iterate over module names
      for(i=0, l=count; i<l; i++) (function(name, push){
        var moduleState = getModuleState(name);

        if (moduleState === MODULE_STATE.NONE) {
          // The module has never been used or defined.

          // mark module as loading
          modules[name] = MODULE_STATE.LOADING;

          // add to load queue
          load.push(name);

          // wait for module load
          t.on('load/' + name, push);
        } else if (moduleState === MODULE_STATE.READY) {
          // The module is ready for use, so no need to load it
          push();
        } else {
          // A previous request to either use or define the module has occurred,
          // but it is not yet ready
          t.on('load/' + name, push);
        }
      } (args[i], register(i, args[i])));

      // load all needed modules
      load.length && t.load.apply(t, load);

    }, 0);
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  URL Processing
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // Parse a URL query into key/value pairs.
  parseUrlQuery = function(queryStr){
    var query = {};
    query.raw = queryStr;
    query.parameters = {};

    // Parse the query into key/value pairs.
    var start = 0, end = 0;
    if (queryStr[start] == '?')
      start++;

    while (start < queryStr.length){
      end = queryStr.indexOf('=', start);
      if (end < 0) end = queryStr.length;

      var key = decodeURIComponent(queryStr.substring(start, end));
      start = end + 1;

      var value = null;
      if (start <= queryStr.length){
        end = queryStr.indexOf('&', start);
        if (end < 0) end = queryStr.length;

        value = decodeURIComponent(queryStr.substring(start, end));
        start = end + 1;
      }
      query.parameters[key] = value;
    }
  };

  // Parse a URL into its components.
  parseUrl = function(urlStr){
    // Ran across this in a Google search... loved the simplicity of the solution.
    var url = {}
      , parser = document.createElement('a')
      ;
    parser.href = urlStr;

    // No one ever wants the hash on a full URL...
    if (parser.hash){
      url.raw = parser.href.substring(parser.href.length - parser.hash.length);
    } else {
      url.raw = parser.href;
    }

    url.protocol = parser.protocol.substring(0, parser.protocol.length - 1).toLowerCase();
    url.secure   = (url.protocol == "https");
    url.hostname = parser.hostname;
    url.host     = parser.host;

    if (parser.search)
      url.query = parseUrlQuery(parser.search);
    else
      url.query = null;

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
    var absRegExpResult =  ABSOLUTE_URL_REQEXP.exec(urlStr);
    if (absRegExpResult){
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
  resolveSitecuesUrl = function(urlStr){
    return resolveUrl(urlStr, libraryUrl);
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Script Loading
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // async script loading
  loadScript = function(url, callback){
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

  // trigger module loading
  load = function(){
    // iterate over passed module names
    for(var i=0, l=arguments.length; i<l; i++){
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

  var processBasicSiteConfiguration = function() {
    if (!validateBasicSiteConfiguration()) {
      return false;
    }

    // Now that the basic site configuration has been validated, we can populate
    // internal references.

    // Internal reference to the site config object.
    siteConfig = sitecues.config;

    // The parsed library URL.
    libraryUrl = parseUrl(siteConfig.script_url);

    return true;
  };

  var validateBasicSiteConfiguration = function() {
    if (!sitecues.config) {
      log.error("The 'sitecues.config' object was not provided.");
      return false;
    }

    if (typeof sitecues.config != "object") {
      log.error("The 'sitecues.config' is not an object.");
      return false;
    }

    if (!sitecues.config.site_id) {
      log.error("The 'sitecues.config.site_id' parameter was not provided.");
      return false;
    }

    if (typeof sitecues.config.site_id != "string") {
      log.error("The 'sitecues.config.site_id' parameter is not a string.");
      return false;
    }

    if (!sitecues.config.script_url) {
      log.error("The 'sitecues.config.script_url' parameter was not provided.");
      return false;
    }

    if (typeof sitecues.config.script_url != "string") {
      log.error("The 'sitecues.config.script_url' parameter is not a string.");
      return false;
    }

    return true;
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Library Configuration
  //    This section loads the library configuration, whose absence will prevent the
  //    library from loading.
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  var LIB_CONFIG_NAMES = [ "hosts", "fallback" ], libraryConfigLoadCount;

  // Validation method for library configuration. If valid, initialize sitecues.
  var validateLibraryConfigs = function(cb) {
    var valid = true;

    if (window.sitecues.libConfig) {
      libraryConfig = window.sitecues.libConfig;

      log.info(libraryConfig);


      if (!libraryConfig.fallback) {
          log.warn("fallback library configuration not found: Defaulting to true.");
          libraryConfig.fallback = { enabled: true};
        } else {
          log.info("fallback library configuration set to :: "+libraryConfig.fallback.enabled);
        }



      if (libraryConfig.hosts) {
        if (libraryConfig.hosts.ws) {
          log.info("sitecues ws host: " + libraryConfig.hosts.ws);
        } else {
          log.warn("sitecues ws host not specified.");
          valid = false;
        }

        if (libraryConfig.hosts.up) {
          log.info('sitecues up host: ' + libraryConfig.hosts.up);
        } else {
          log.warn("sitecues up host not specified.");
          valid = false;
        }
      } else {
        log.warn("sitecues hosts library config not found.");
        valid = false;
      }
    } else {
      log.warn("sitecues library config not found.");
      valid = false;
    }



    if (!valid) {
      log.error("Invalid sitecues library config.");
    }
    cb(!valid);
  };

  var processLibraryConfiguration = function(cb) {
    // Called after all library configs that require loading are loaded, triggering validation.
    var onLibraryConfigLoadComplete = function() {
      libraryConfigLoadCount--;
      if (libraryConfigLoadCount <= 0) {
        validateLibraryConfigs(cb);
      }
    };

    // Determine which library configs require loading.
    var libraryConfigLoadNames = [], i;
    if (!window.sitecues.libConfig) {
      // We need all of the library configs.
      libraryConfigLoadNames = LIB_CONFIG_NAMES.splice(0, LIB_CONFIG_NAMES.length);
    } else {
      for (i = 0; i < LIB_CONFIG_NAMES.length; i++) {
        if (!window.sitecues.libConfig[LIB_CONFIG_NAMES[i]]) {
          libraryConfigLoadNames.push(LIB_CONFIG_NAMES[i]);
        }
      }
    }
    // Set the counter of outstanding library configs.
    libraryConfigLoadCount = libraryConfigLoadNames.length;

    // If there are no outstanding library configs, trigger validation.
    if (libraryConfigLoadCount <= 0) {
      validateLibraryConfigs(cb);
    } else { // Trigger loading of missing library configs.
      for (i = 0; i < libraryConfigLoadNames.length; i++) {
        loadScript("_config/" + libraryConfigLoadNames[i] + ".js", onLibraryConfigLoadComplete);
      }
    }
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Library Initialization
  //    This section is responsible for the initialization of the sitecues library.
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  var initialize = function() {
    // If the sitecues global object does not exist, then there is no basic site configuration, nor
    // is there a logger. Simply print an error to the console and abort initialization.
    if (!window.sitecues || (typeof window.sitecues != "object")) {
      console.error("The base 'windows.sitecues' namespace was not found. The sitecues library will not load.");
      return;
    }

    // Set the internal reference.
    sitecues = window.sitecues;

    // See if another sitecues library has "planted it's flag" on this page.
    if (sitecues.exists) {
      console.error("The sitecues library already exists on this page.");
      return;
    }
    // "Plant our flag" on this page.
    sitecues.exists = true;

    // As we have now "planted our flag", export the public fields.
    exportPublicFields();

    // Create the logger for this module
    if (sitecues.logger) {
      log = sitecues.logger.log('core');
    }

    // Process the basic configuration needed for library initialization.
    if (!processBasicSiteConfiguration()) {
        log.error("Unable to load basic site configuration. Library can not initialize.")
    } else {
      processLibraryConfiguration(function(err) {
        if (err) {
          log.error("Unable to load library configuration. Library can not initialize.")
        } else {
          // Start processing the queued-up module definition requests (in essence, load the library).
          _processDefQueue();
        }
      });
    }
  };

  // Trigger initialization.
  initialize();
}).call(this);
