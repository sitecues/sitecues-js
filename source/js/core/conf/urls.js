define(['core/conf/site'], function(site) {

  var apiDomain,  // Either ws.sitecues.com/ or ws.dev.sitecues.com/
    prefsDomain,  // Either up.sitecues.com/ or up.dev.sitecues.com/
    BASE_URL = getRawScriptUrl().split('/js/')[0] + '/';

  function getApiUrl(restOfUrl) {
    return '//' + apiDomain + 'sitecues/api/' + restOfUrl;
  }

  function getPrefsUrl(restOfUrl) {
    return '//' + prefsDomain + restOfUrl;
  }

  function getRawScriptUrl() {
    return site.get('scriptUrl') || site.get('script_url');
  }

  function getLibraryUrl() {
    // Underscore names deprecated
    var url = getRawScriptUrl();
    return url && parseUrl(url);
  }

  // Returns 'release' if production, or a branch name for dev versions, or '' if running locally
  function getBranch() {
    console.log('Branch name = ' + sitecues.branch);
    return isProduction() ? 'release' :
      (isLocal() ? '' : sitecues.branch);
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
  function resolveResourceUrl(urlStr, paramsMap) {
    var url = BASE_URL + urlStr;

    function addParam(name) {
      url += name + '=' + encodeURIComponent(paramsMap[name]) + '&';
    }

    Object.keys(paramsMap || {}).forEach(addParam);
    return url;
  }

  function resolveSitecuesUrl(urlStr) {
    return getLibraryUrl() + '/' + urlStr;
  }

  function isProduction() {
    return getLibraryUrl().hostname === 'js.sitecues.com';
  }

  function isLocal() {
    return getLibraryUrl().hostname.indexOf('sitecues.com') < 0;
  }

  function init() {
    var domainEnding = isProduction() ? '.sitecues.com/' : '.dev.sitecues.com/';
    apiDomain = 'ws' + domainEnding;
    prefsDomain = 'up' + domainEnding;
  }

  var publics = {
    init: init,
    getApiUrl: getApiUrl,
    getPrefsUrl: getPrefsUrl,
    getLibraryUrl: getLibraryUrl,
    getBranch: getBranch,
    resolveResourceUrl: resolveResourceUrl,
    resolveSitecuesUrl: resolveSitecuesUrl,
    parseUrl: parseUrl,
    resolveUrl: resolveUrl
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
