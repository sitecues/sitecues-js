define(['core/conf/site' ], function(site) {

  var apiDomain,  // Either ws.sitecues.com/ or ws.dev.sitecues.com/
    scriptOrigin,  // Either http[s]://js.sitecues.com/ or http[s]://js.dev.sitecues.com/
    BASE_RESOURCE_URL;

  function getBaseResourceUrl() {
    var basis = SC_EXTENSION ? getRawScriptUrl() : sitecues.requirejs.nameToUrl('');
    return basis.split('/js/')[0] + '/';
  }

  // URL string for API calls
  function getApiUrl(restOfUrl) {
    return '//' + apiDomain + 'sitecues/api/' + restOfUrl;
  }

  // URL string for sitecues.js
  function getRawScriptUrl() {
    return site.get('scriptUrl') || site.get('script_url');
  }

  // Parsed URL object for sitecues.js
  function getParsedLibraryURL() {
    // Underscore names deprecated
    var url = getRawScriptUrl();
    return url && parseUrl(url);
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  //
  //  URL Processing
  //
  //////////////////////////////////////////////////////////////////////////////////////////

  // Parse a URL into { protocol, hostname, origin, path }
  // Does not support mailto links (or anything where the protocol isn't followed by //)
  // TODO After we kill IE11, we can move to new URL(), but be careful of IE incompatibilities (e.g. port, origin, host)
  function parseUrl(urlStr) {
    if (typeof urlStr !== 'string') {
      return;
    }

    var parser = document.createElement('a'),
      pathname,
      lastSlashIndex,
      protocol,
      path,
      hostname,
      origin;

    // Set up parser
    parser.href = urlStr;

    // Extract the path of the pathname.
    pathname = parser.pathname;

    // Ensure pathname begins with /
    // TODO is this necessary in any browser? Used to be for IE9
    if (pathname.indexOf('/') > 0) {
      pathname = '/' + pathname;
    }
    lastSlashIndex = pathname.lastIndexOf('/') + 1;

    protocol = parser.protocol || document.location.protocol;  // IE does not include protocol unless it was specified. If not specified, get from current document.
    path = pathname.substring(0, lastSlashIndex);
    hostname = parser.hostname;
    origin = parser.origin;
    if (!origin) {
      origin = protocol + '//' + hostname;
      // Fallback approach for IE -- note this doesn't include @username or password info
      // Add the port if it's specified in the url (80 is the default port, so only add that if it's really present in the url)
      if (parser.port && parser.port !== '80' || urlStr.indexOf(':80/') > 0) {
        origin += ':' + parser.port;  // Add :portnumber but only if it exists in urlstr
      }
    }

    return {
      protocol: protocol,
      path: path,
      hostname: hostname,
      origin: origin
    };
  }

  function isValidLibraryUrl() {
    return !! getParsedLibraryURL().hostname;
  }

  // Resolve a URL as relative to the main script URL.
  // Add a version parameter so that new versions of the library always get new versions of files we use, rather than cached versions.
  function resolveResourceUrl(urlStr, paramsMap) {
    var url = BASE_RESOURCE_URL + urlStr,
      params = paramsMap && Object.keys(paramsMap);

    function addParam(name) {
      url += name + '=' + encodeURIComponent(paramsMap[name]) + '&';
    }

    if (params) {
      url += '?';
      params.forEach(addParam);
    }

    return url;
  }

  // Is this production sitecues?
  function isProduction() {
    return getParsedLibraryURL().hostname === 'js.sitecues.com';
  }

  function getScriptOrigin() {
    if (!scriptOrigin) {
      scriptOrigin = getParsedLibraryURL().origin;
    }
    return scriptOrigin;
  }

  // The regular expression for an absolute URL. There is a capturing group for
  // the protocol-relative portion of the URL.
  var ABSOLUTE_URL_REGEXP = /^[a-zA-Z0-9-]+:(\/\/.*)$/i;

  // Return an absolute URL. If the URL was relative, return an absolute URL that is relative to a base URL.
  // @optional parsedBaseUrl If not provided, will use the current page.
  function resolveUrl(urlStr, baseUrl) {
    if (typeof URL === 'function') {
      // URL object exists in IE11 but "new URL()" throws error "Object doesn’t support this action"
      var parsedUrl = new URL(urlStr, baseUrl || document.location);
      return parsedUrl.toString();
    }

    // IE 9-11 polyfill (also Edge 12)
    // TODO remove if IE11 ever goes away!!
    var parsedBaseUrl = parseUrl(baseUrl || '.');

    var absRegExpResult = ABSOLUTE_URL_REGEXP.exec(urlStr);
    if (absRegExpResult) {
      // We have an absolute URL, with protocol. That's a no-no, so, convert to a
      // protocol-relative URL.
      urlStr = urlStr;
    } else if (urlStr.indexOf('//') === 0) {
      // Protocol-relative. Add parsedBaseUrl's protocol.
      urlStr = parsedBaseUrl.protocol + urlStr;
    } else if (urlStr.indexOf('/') === 0) {
      // Host-relative URL.
      urlStr = parsedBaseUrl.origin + urlStr;
    } else {
      // A directory-relative URL.
      urlStr = parsedBaseUrl.origin + parsedBaseUrl.path + urlStr;
    }

    // Replace ../ at beginning of path with just / as there is no parent folder to go to
    urlStr = urlStr.replace(/(^http[^\/]+\/\/[^\/]+\/)(?:\.\.\/)/, '$1', 'i');

    return urlStr;
  }

  function isOnDifferentDomain(url) {
    // Will cross-domain restrictions possibly burn us?
    var hostName = parseUrl(url).hostname;
    // For our purposes, hostname is the same as the domain
    return hostName !== document.location.hostname;
  }

  function init() {
    var domainEnding = isProduction() ? '.sitecues.com' : '.dev.sitecues.com';
    BASE_RESOURCE_URL = getBaseResourceUrl();
    apiDomain = 'ws' + domainEnding + '/';
  }

  return {
    init: init,
    getApiUrl: getApiUrl,
    getScriptOrigin: getScriptOrigin,
    isValidLibraryUrl: isValidLibraryUrl,
    getRawScriptUrl: getRawScriptUrl,
    resolveResourceUrl: resolveResourceUrl,
    parseUrl: parseUrl,
    isOnDifferentDomain: isOnDifferentDomain,
    isProduction: isProduction,
    resolveUrl: resolveUrl
  };

});
