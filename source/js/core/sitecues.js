define([], function () {
   // Array's prototype
  var arr = Array.prototype,

  // Either ws.sitecues.com/ or ws.dev.sitecues.com/
  apiDomain,

  // Either up.sitecues.com/ or up.dev.sitecues.com/
  prefsDomain;

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
    sitecues.getVersion = getVersion;
    sitecues.getApiUrl = getApiUrl;
    sitecues.getPrefsUrl = getPrefsUrl;
    sitecues.getLibraryUrl = getLibraryUrl;
    sitecues.getSiteConfig = getSiteConfig;
    sitecues.getEverywhereConfig = getEverywhereConfig;
    sitecues.on = on;
    sitecues.off = off;
    sitecues.emit = emit;
    sitecues.resolveSitecuesUrl = resolveSitecuesUrl;
    sitecues.parseUrl = parseUrl;
    sitecues.resolveUrl = resolveUrl;
    sitecues.status = getStatus;
  }


  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  Getters
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  function getVersion() {
    return sitecues.version;
  }

  function isProduction() {
    return getLibraryUrl().hostname === 'js.sitecues.com';
  }

  function initServices() {
    var domainEnding = isProduction() ? '.sitecues.com/' : '.dev.sitecues.com/';
    apiDomain = 'ws' + domainEnding;
    prefsDomain = 'up' + domainEnding;
  }

  function getApiUrl(restOfUrl) {
    return 'https://' + apiDomain + 'sitecues/api/' + restOfUrl;
  }

  function getPrefsUrl(restOfUrl) {
    return 'https://' + prefsDomain + restOfUrl;
  }

  function getLibraryUrl() {
    // Underscore names deprecated
    var url = getEverywhereConfig().scriptUrl || getSiteConfig().scriptUrl || getSiteConfig().script_url;
    return url && parseUrl(url);
  }

  function getSiteConfig() {
    return sitecues.config || {};
  }

  function getEverywhereConfig() {
    return sitecues.everywhereConfig || {};
  }

  function getStatus() {
    var args = arguments;
    require(['util/status'], function(statusFn) {
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
  // same arguments as `trigger` is, apart from the event name.
  // listening for `'*'` passes the true event name as the first argument
  function emit(events) {
    /* jshint validthis: true */
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
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  URL Processing
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // Parse a URL query into key/value pairs.
  function parseUrlQuery(queryStr) {
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
      if (end < 0) {
        end = queryStr.length;
      }

      var key = decodeURIComponent(queryStr.substring(start, end));
      start = end + 1;

      var value = null;
      if (start <= queryStr.length) {
        end = queryStr.indexOf('&', start);
        if (end < 0) {
          end = queryStr.length;
        }

        value = decodeURIComponent(queryStr.substring(start, end));
        start = end + 1;
      }
      query.parameters[key] = value;
    }
  }

  // Parse a URL into its components.
  function parseUrl(urlStr) {
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
  }

  // The regular expression for an absolute URL. There is a capturing group for
  // the protocol-relative portion of the URL.
  var ABSOLUTE_URL_REQEXP = /^[a-zA-Z0-9-]+:(\/\/.*)$/i;

  // Resolve a URL as relative to a base URL.
  function resolveUrl(urlStr, baseUrl) {
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
  }

  // Resolve a URL as relative to the main script URL.
  // Add a version parameter so that new versions of the library always get new versions of files we use, rather than cached versions.
  function resolveSitecuesUrl(urlStr, paramsMap) {
    var url = resolveUrl(urlStr, getLibraryUrl()) + '?version=' + sitecues.version;

    function addParam(name) {
      url += name + '=' + encodeURIComponent(paramsMap[name]) + '&';
    }

    Object.keys(paramsMap || {}).forEach(addParam);
    return url;
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
    var everywhereConfig = getEverywhereConfig();

    // siteId is required and must be a string
    var siteId = everywhereConfig.siteId || sitecues.config.siteId || sitecues.config.site_id;
    if (typeof siteId !== 'string') {
      console.error('The siteId parameter is not provided or not a string.');
      return;
    }

    // Library URL must be a valid URL
    if (!getLibraryUrl()) {
      console.error('Unable to get sitecues script url. Library can not initialize.');
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

    // If the sitecues global object does not exist, then there is no basic site configuration

    // Set the internal reference.
    sitecues = window.sitecues;

    if (!sitecues || typeof sitecues !== 'object') {
      safe_production_msg('The base ' + window.sitecues + ' namespace was not found. The sitecues library will not load.');
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
      initServices();
      require(['core/run'], function(run) {
        run();
      });
    }
  };

  // Trigger initialization.
  initialize();
});

