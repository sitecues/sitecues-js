define(['core/conf/site', 'core/conf/urls', 'core/run', 'core/constants'], function (site, urls, run, constants) {
      // Array's prototype
  var arr    = Array.prototype,
      // Enums for sitecues loading state
      state = constants.READY_STATE;

  function safe_production_msg (text) {
    if (window.navigator.userAgent.indexOf('MSIE ') > 0) {
      // Using console.log in IE9 too early can cause "Invalid pointer" errors -- see SC-2237.
      // To be safe, do not use console.log in sitecues.js in IE.
      return;
    }
    if (console) {
      console.log('**** '+text+' ****');
    }
  }

  if (SC_DEV) {
    safe_production_msg('SITECUES MODE: SC_DEV');
    safe_production_msg('SITECUES VERSION: ' + sitecues.version);
  }

  // This function is called when we are sure that no other library already exists in the page. Otherwise,
  // we risk overwriting the methods of the live library.
  function exportPublicFields() {
    // Events
    sitecues.on = on;      // Start listening for an event.
    sitecues.emit = emit;  // Tell listeners about an event.
    sitecues.off = off;    // Stop listening for an event.

    // Get info about the currently running sitecues client
    sitecues.status = getStatus;
    sitecues.getVersion = getVersion;
    sitecues.isOn = run.isOn;

    //Loading state enumerations
    sitecues.readyStates = state;

    // 'Plant our flag' on this page.
    sitecues.exists = true;
  }


  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Getters
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  function getVersion() {
    return sitecues.version;
  }

  function getStatus() {
    var args = arguments;
    require(['status/status'], function(statusFn) {
      statusFn.apply(this, args);
    });
  }



  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Event Management
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // bind an event, specified by a string name, `events`, to a `callback`
  // function. passing `'*'` will bind the callback to all events fired
  function on(events, callback, context) {
    /* jshint validthis: true */
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
  }

  // remove one or many callbacks. if `context` is null, removes all callbacks
  // with that function. if `callback` is null, removes all callbacks for the
  // event. if `events` is null, removes all bound callbacks for all events
  function off(events, callback, context) {
    /* jshint validthis: true */
    var ev,
      calls = this._events,
      node;

    if (!events) {
      delete this._events;
    } else if (calls) {
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
  }

  // emit an event, firing all bound callbacks. callbacks are passed the
  // same arguments as `emit` is, apart from the event name.
  function emit(events) {
    /* jshint validthis: true */
    var event, node, calls, tail, args, rest;
    if (!(calls = this._events)) {
      return this;
    }

    (events = events.split(/\s+/)).push(null);

    // save references to the current heads & tails
    while ((event = events.shift())) {
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
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Basic Site Configuration
  //    This section process the basic site configuration, whose absence will
  //    prevent the library from loading.
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  var validateConfiguration = function() {
    if (!sitecues.config) {
      console.error('The ' + sitecues.config + ' object was not provided.');
      return;
    }

    if (typeof sitecues.config !== 'object') {
      console.error('The ' + sitecues.config + ' is not an object.');
      return;
    }

    // Underscore parameters deprecated
    var everywhereConfig = site.getEverywhereConfig();

    // siteId is required and must be a string
    var siteId = everywhereConfig.siteId || sitecues.config.siteId || sitecues.config.site_id;
    if (typeof siteId !== 'string') {
      console.error('The siteId parameter is not provided or not a string.');
      return;
    }

    // Library URL must be a valid URL
    if (!urls.isValidLibraryUrl()) {
      console.error('Unable to get valid sitecues script url. Library can not initialize.');
      return;
    }

    // Continue loading sitecues
    return true;
  };

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Library Initialization
  //    This section is responsible for the initialization of the sitecues library.
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // If the sitecues global object does not exist, then there is no basic site configuration
  if (!sitecues || typeof sitecues !== 'object') {
    safe_production_msg('The base ' + window.sitecues + ' namespace was not found. The sitecues library will not load.');
    return;
  }

  // Extension script: is extension allowed on this page?
  var data = window.localStorage.getItem('sitecues-disabled');
  if (data && data !== 'false') {
    console.log('sitecues has been disabled on this page.');
    return;
  }

  // See if another sitecues library has 'planted it's flag' on this page.
  if (sitecues.exists) {
    console.error('The sitecues library already exists on this page.');
    return;
  }

  // As we have now 'planted our flag', export the public fields.
  exportPublicFields();

  // Process the basic configuration needed for library initialization.
  if (!validateConfiguration()) {
    console.error('Unable to load basic site configuration. Library can not initialize.');
  } else if (window !== window.top && !sitecues.config.iframe) {
    // Stop sitecues from initializing if:
    // 1) sitecues is running in an IFRAME
    // 2) sitecues.config.iframe = falsey
    safe_production_msg('Developer note (sitecues): the following iframe attempted to load sitecues, which does not currently support iframes: '+window.location +
      ' ... email support@sitecues.com for more information.');
  }
  else {
    // Do not allow the sitecues object to be wiped out or changed to something else,
    // but allow properties to be added to it, e.g. sitecues.$ = Zepto
    Object.defineProperty(window, 'sitecues', { writable: false });
    // Freeze sitecues.config -- do not allow it to be modified in any way
    Object.defineProperty(sitecues, 'config', { writable: false }); // Do not allow reassignment, e.g. sitecues.config = {};
    Object.freeze(sitecues.config); // Do not allow properties of sitecues.config to be changed, e.g. sitecues.config.siteId = 's-xxxx';

    // Initialize API and services URLs
    urls.init();

    //Set sitecues state to initializing
    sitecues.readyState = state.INITIALIZING;

    // Run sitecues
    run.init();
  }
});

