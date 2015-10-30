define(['core/conf/site'], function(site) {

  var apiDomain,  // Either ws.sitecues.com/ or ws.dev.sitecues.com/
    prefsDomain,  // Either up.sitecues.com/ or up.dev.sitecues.com/
    BASE_RESOURCE_URL = sitecues.requirejs.nameToUrl('').split('/js/')[0] + '/';

  // URL string for API calls
  function getApiUrl(restOfUrl) {
    return '//' + apiDomain + 'sitecues/api/' + restOfUrl;
  }

  // URL string for preferences server
  function getPrefsUrl(restOfUrl) {
    return '//' + prefsDomain + restOfUrl;
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

  // Parse a URL into { host, path }
  function parseUrl(urlStr) {
    if (typeof urlStr !== 'string') {
      return;
    }

    var parser = document.createElement('a'),
      pathname,
      lastSlashIndex;

    // Set up parser
    parser.href = urlStr;

    // Extract the path of the pathname.
    pathname = parser.pathname;

    // IE9 versions pathname does not contains first slash whereas in other browsers it does.
    // So let's unify pathnames. Since we need '/' anyway, just add it to pathname when needed.
    if (pathname.indexOf('/') > 0) {
      pathname = '/' + pathname;
    }
    lastSlashIndex = pathname.lastIndexOf('/') + 1;

    return {
      path: pathname.substring(0, lastSlashIndex),
      host: parser.host
    };
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

  function resolveSitecuesUrl(urlStr) {
    return getParsedLibraryURL() + '/' + urlStr;
  }

  function isProduction() {
    return getParsedLibraryURL().hostname === 'js.sitecues.com';
  }

  function init() {
    var domainEnding = isProduction() ? '.sitecues.com/' : '.dev.sitecues.com/';
    apiDomain = 'ws' + domainEnding;
    prefsDomain = 'up' + domainEnding;
  }

  return {
    init: init,
    getApiUrl: getApiUrl,
    getPrefsUrl: getPrefsUrl,
    getParsedLibraryURL: getParsedLibraryURL,
    resolveResourceUrl: resolveResourceUrl,
    resolveSitecuesUrl: resolveSitecuesUrl,
    parseUrl: parseUrl,
    resolveUrl: resolveUrl
  };

});
