/*
 * Sitecues:  core.js
 *
 * The core module for loading Sitecues.
 *
 */

(function(){

  // Create the logger for this module
  var log = window.sitecues.logger.log('core');

  // Return if there is sitecues instance on the page
  if (window.sitecues && window.sitecues.coreConfig) {
    log.warn("sitecues already defined.");
    return;
  }

  // Create a sitecues namespace if it does not already exist
  // Logging will attach itself to this namespace on window.sitecues.log
  if (!window.sitecues) {
    window.sitecues = {};
  }

  // Private variables
  var arr               = Array.prototype                 // Array's prototype
    , has               = Object.prototype.hasOwnProperty // Object's has own property
    , noop              = function(){}                    // Empty function
    , coreConfig        = {}                              // Core config container
    , modules           = {}                              // Modules container

    // Siteuces top-level namespace: all public classes and modules will be
    // attached to this name space and aliased on "window.sitecues"
    , sitecues    = window.sitecues

  // Private Functions
    , resolveUrl
    , parseUrlQuery
    , parseUrl
    
    , lastModuleDefined
    
    , APP_VERSION = '0.0.0-UNVERSIONED'
  ;


  // More convenient way to get epoch time in milliseconds when working with the code
  function time(){
    return + new Date();
  };

  // Return the core config.
  sitecues.getCoreConfig = function() {
    return coreConfig;
  };

  // bind an event, specified by a string name, `events`, to a `callback`
  // function. passing `"*"` will bind the callback to all events fired
  sitecues.on = function(events, callback, context){
    var ev, list, tail;
    events = events.split(/\s+/);
    var calls = this._events || (this._events = {});
    while (ev = events.shift()){
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
  sitecues.off = function(events, callback, context){
    var ev, calls, node;
    if (!events){
      delete this._events;
    } else if (calls = this._events){
      events = events.split(/\s+/);
      while (ev = events.shift()){
        node = calls[ev];
        delete calls[ev];
        if (!callback || !node) continue;

        // create a new list, omitting the indicated event/context pairs
        while ((node = node.next) && node.next) {
          if (node.callback === callback &&
            (!context || node.context === context)) continue;
          this.on(ev, node.callback, node.context);
        }
      }
    }

    return this;
  };

  // emit an event, firing all bound callbacks. callbacks are passed the
  // same arguments as `trigger` is, apart from the event name.
  // listening for `"*"` passes the true event name as the first argument
  sitecues.emit = function(events){
    var event, node, calls, tail, args, all, rest;
    if (!(calls = this._events)) return this;

    all = calls['*'];
    (events = events.split(/\s+/)).push(null);

    // save references to the current heads & tails
    while (event = events.shift()){
      if (all) events.push({next: all.next, tail: all.tail, event: event});
      if (!(node = calls[event])) continue;
      events.push({next: node.next, tail: node.tail});
    }

    // traverse each list, stopping when the saved tail is reached.
    rest = arr.slice.call(arguments, 1);
    while (node = events.pop()){
      tail = node.tail;
      args = node.event ? [node.event].concat(rest) : rest;
      while ((node = node.next) !== tail){
        node.callback.apply(node.context || this, args);
      }
    }

    return this;
  };

  // Module states management:
  var MODULE_STATE = {
    NONE: 1,         // A 'def' or 'use' call has never been made for the module.
    LOADING: 2,      // A 'use' call has been made for a module, and a load request has been started.
    INITIALIZING: 3, // A 'def' call has been made for a module, and the module is initializing.
    READY: 4         // The module is initialized and ready for use.
  };

  // Returns the state of the requested module.
  var getModuleState = function(name) {
    var module = modules[name];

    if (!module) {
      // There is no entry, so the there is no state.
      return MODULE_STATE.NONE;
    }

    // The entry is a number, so just return that saved state.
    if (typeof module === "number") {
      return module;
    }

    // Otherwise, the entry is an object, so the module is ready.
    return MODULE_STATE.READY;
  };

  function checkDefinedModulesAreAllLoaded () {
    var defCount = 0
    ,   length     = LOAD_LIST.length
    ;

    for (var i=0; i< length; i++) {

      var i_module = modules[LOAD_LIST[i]];

      if (i_module) {
        defCount += i_module.defined === true ? 1 : 0 ;
      }
    }

    if (defCount === length) {
      sitecues.emit('core/allModulesLoaded');
    }
  };

  // define equinox module
  var _def = function(name, constructor){
    
    // do not define modules twice.
    if (getModuleState(name) >= MODULE_STATE.INITIALIZING) {
      log.warn("sitecues: module '" + name + "' already defined.");
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
      
      if (name===lastDefinedModuleName) {
        definedLastModule = true;
      }

      // Only spend the cpu-clicks required to test,after last module has been defined
      if (definedLastModule) {
        checkDefinedModulesAreAllLoaded();
      }

    // Pass a new logger into the constructor scope of the module
    }, window.sitecues.logger.log(name));
  };

  // exposed function for defining modules: queues until core is ready.
  var READY_FOR_DEF_CALLS = false
  ,   DEF_QUEUE           = []
  ,   LOAD_LIST           = []
  ,   definedLastModule   = false
  ,   lastDefinedModuleName
  ;
  sitecues.def = function(name, constructor){
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

  // Called to initialize the sitecues library.
  var _initialize = function() {
    _processDefQueue();
  };

  // load equinox modules
  sitecues.use = function(){
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
      }(args[i], register(i, args[i])));

      // load all needed modules
      load.length && t.load.apply(t, load);

    }, 0);
  };

  //////////////////////////////////////////////////
  //
  //  START: URL Processing Helper Methods
  //
  //////////////////////////////////////////////////

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
    var url = {};
    var parser = document.createElement('a');
    parser.href = urlStr;

    // No one ever wants the hash on a full URL...
    if (parser.hash)
      url.raw = parser.href.substring(parser.href.length - parser.hash.length);
    else
      url.raw = parser.href;

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



  var scriptSrcUrl    = null
  ,   scriptSrcRegExp = new RegExp('^[a-zA-Z]*:/{2,3}.*/(equinox|sitecues)\.js')
  ,   scriptTags      = document.getElementsByTagName('script')
  ;

  sitecues.getScriptSrcUrl = function() {
    return scriptSrcUrl;
  };

  // Obtain all script tags, and search util we find our script.
  for (var i = 0; i < scriptTags.length; i++){
    var match = scriptTags[i].src.match(scriptSrcRegExp);
    if (match){
      scriptSrcUrl = parseUrl(match[0]);
      break;
    }
  }

  // TODO: What if we don't find the base URL?
  // The regular expression for an absolute URL. There is a capturing group for
  // the protocol-relative portion of the URL.
  var ABSOLUTE_URL_REQEXP = /^[a-z]+:(\/\/.*)$/i;

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
  sitecues.resolveSitecuesUrl = function(urlStr){
    return resolveUrl(urlStr, scriptSrcUrl);
  };

  //////////////////////////////////////////////////
  //
  //  END: URL Processing Helper Methods
  //
  //////////////////////////////////////////////////

  // async script loading
  sitecues.loadScript = function(url, callback){
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

    // add callback to track when it will be loaded
    script.onload = script.onreadystatechange = callback;

    // add element to head to start loading
    document.getElementsByTagName('head')[0].appendChild(script);
  };

  // trigger module loading
  sitecues.load = function(){
    // iterate over passed module names
    for(var i=0, l=arguments.length; i<l; i++){
      // and initiate loading of code for each
      sitecues.loadScript(arguments[i] + '.js');
    }
  };

  // The default status formatter: simply log all data to the log.
  var DEFAULT_STATUS_CALLBACK = function(info) {
    var printObj = function(o, prefix) {
        var p, v, s = '';
        prefix = prefix || '';
        for (p in o) {
          if (o.hasOwnProperty(p)) {
            v = o[p];
            s += prefix + p + ':';
            if (typeof v == 'object') {
              s += '\n' + printObj(v, prefix + '  ');
            } else {
              s += ' ' + v + '\n';
            }
          }
        }
        return s;

      };

    log.info('\n===== BEGIN: SITECUES STATUS =====================\n'
      + printObj(info)
      + '===== END: SITECUES STATUS =======================');
  };

  sitecues.status = function (callback) {
    callback = callback || DEFAULT_STATUS_CALLBACK;

    sitecues.use("jquery", "speech", 'conf', function ( $, speech, conf ) {

      // Set the ajax URLs
      var ajax_urls = {
        up: ( "//" + ( sitecues.getCoreConfig() )[ "hosts" ].up + "/status" ),
        ws: ( "//" + ( sitecues.getCoreConfig() )[ "hosts" ].ws + "/equinox/api/util/status" )
      };
      
      // Define the info object to be formatted by the log
      var info = {
        version: {
          "sitecues_js": APP_VERSION,
          "sitecues_up": null,
          "sitecues_ws": null
        },
        "current_url": window.location.href,
        "sitecues_js_url": ( sitecues.getScriptSrcUrl() ).raw,
        "user_agent":  navigator.userAgent,
        "tts_status": ( ( speech.isEnabled() ) ? "on" : "off" ),
      };

      var data = conf.data();
      for (var setting in data) {
        info[setting] = data[setting];
      }

      // Defer the ajax calls so we can respond when both are complete
      var ajaxCheck = function(){
        if ( typeof info.version.sitecues_up === 'string' && 
             typeof info.version.sitecues_ws === 'string' ) {
          callback(info);
        }
      };

      $.ajax({
        cache:    false,
        dataType: "json",
        type:     "GET",
        url:      ajax_urls.up,
        success: function(response){
          
          // Set the version based on the AJAX response object
          info.version.sitecues_up = response.version;
          ajaxCheck();
        },
        error: function(){
          
          // Set an error message if the AJAX object did not return
          info.version.sitecues_up = 'Error Fetching Version from Service URL';
          ajaxCheck();
        }
      });
        
      $.ajax({
        cache:    false,
        dataType: "json",
        type:     "GET",
        url:      ajax_urls.ws,
        success: function(response){
          
          // Set the version based on the AJAX response object
          info.version.sitecues_ws = response.version;
          ajaxCheck();
        },
        error: function(){

          // Set an error message if the AJAX object did not return
          info.version.sitecues_ws = 'Error Fetching Version from Service URL';
          ajaxCheck();
        }
      });

    }); // end of use

    // Popup the logger and report status
    var popup = sitecues.logger.appenders.popup;
    popup.show();
    popup.focus();
    return 'Getting sitecues status.'
  };

  //////////////////////////////////////////////////
  //
  //  START: Core Configuration
  //      This section loads the core configuration,
  //      whose absence will prevent the library
  //      from loading.
  //
  //////////////////////////////////////////////////

  var CORE_CONFIG_NAMES = [ "hosts" ], coreLoadCount;

  // Validation method for core configuration. If valid, initialize sitecues.
  var _validateCoreConfigs = function() {
    var valid = true;

      //log.info( coreConfig, 1 );

    if (window.sitecues.coreConfig) {
      coreConfig = window.sitecues.coreConfig;

      log.info( coreConfig );

      //window.sitecues.coreConfig = undefined;

      if (coreConfig.hosts) {
        if (coreConfig.hosts.ws) {
          log.info("sitecues ws host: " + coreConfig.hosts.ws);
        } else {
          log.warn("sitecues ws host not specified.");
          valid = false;
        }

        if (coreConfig.hosts.up) {
          log.info("sitecues up host: " + coreConfig.hosts.up);
        } else {
          log.warn("sitecues up host not specified.");
          valid = false;
        }
      } else {
        log.warn("sitecues core hosts config not found.");
        valid = false;
      }
    } else {
      log.warn("sitecues core config not found.");
      valid = false;
    }

    // If the core configs are valid, initialize the library.
    if (valid) {
      _initialize();
    } else {
      log.error("invalid sitecues core config. aborting.");
    }
  };

  // Called after all core configs that require loading are loaded, triggering validation.
  var onCoreLoadComplete = function() {
    coreLoadCount--;
    if (coreLoadCount <= 0) {
      _validateCoreConfigs();
    }
  };

  // Determine which core configs require loading.
  var coreLoadNames = [];
  if (!window.sitecues.coreConfig) {
    // We need all of the core configs.
    coreLoadNames = CORE_CONFIG_NAMES.splice(0, CORE_CONFIG_NAMES.length);
  } else {
    for (i=0; i<CORE_CONFIG_NAMES.length; i++) {
      if (!window.sitecues.coreConfig[CORE_CONFIG_NAMES[i]]) {
        coreLoadNames.push(CORE_CONFIG_NAMES[i]);
      }
    }
  }
  // Set the counter of outstanding core configs.
  coreLoadCount = coreLoadNames.length;

  // If there are no outstanding core configs, trigger validation.
  if (coreLoadCount <= 0) {
    _validateCoreConfigs();
  } else { // Trigger loading of missing core configs.
    for (i=0; i<coreLoadNames.length; i++) {
      sitecues.loadScript(".cfg/" + coreLoadNames[i] + ".js", onCoreLoadComplete);
    }
  }

  //////////////////////////////////////////////////
  //
  //  END: Core Configuration
  //
  //////////////////////////////////////////////////

}).call(this);
