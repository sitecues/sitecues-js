define(['core/conf/site' ], function(site) {

  var apiDomain,  // Either ws.sitecues.com/ or ws.dev.sitecues.com/
    scriptOrigin,  // Either http[s]://js.sitecues.com/ or http[s]://js.dev.sitecues.com/
    BASE_RESOURCE_URL;

  function getBaseResourceUrl() {
    var basis = SC_EXTENSION ? getRawScriptUrl() : sitecues.require.toUrl(''),
      unsecureBaseUrl = basis.substring(0, basis.lastIndexOf('/js/') + 1);

    return enforceHttps(unsecureBaseUrl);
  }

  // Change http:// or protocol-relative (just //) urls to use https
  // TODO Occasionally the sitecues.js core is loaded with http -- we will change that in the minicore. Remove this once we do that.
  function enforceHttps(absoluteUrl) {
    return 'https:' + absoluteUrl.replace(/^https?:/, '');
  }

  // URL string for API calls
  function getApiUrl(restOfUrl) {
    return 'https://' + apiDomain + 'sitecues/api/' + restOfUrl;
  }

  // Get an API like http://ws.sitecues.com/sitecues/api/css/passthrough/?url=http%3A%2F%2Fportal.dm.gov.ae%2FHappiness...
  // We use this for the image and CSS proxy services
  // Pass in the proxyApi, e.g. 'image/invert' or 'css/passthrough'
  function getProxyApiUrl(proxyApi, url) {
    var absoluteUrl = resolveUrl(url);

    return getApiUrl(proxyApi + '/?url=' + encodeURIComponent(absoluteUrl)); // If testing with production: .replace('//ws.dev', '//ws');
  }

  // URL string for sitecues.js
  // Enforces https so that all the resources we fetch and origin checking also uses https
  function getRawScriptUrl() {
    return enforceHttps(site.get('scriptUrl') || site.get('script_url'));
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
      origin,
      port;

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
    if (!origin) {  // IE didn't give us the origin, so we construct it from the protocol, hostname and maybe the port
      origin = protocol + '//' + hostname;
      port = parser.port;
      // Fallback approach for IE -- note this doesn't include @username or password info
      // Add the port if it's specified in the url (80/443 is the default port, so only add that if it's really present in the url)
      if (port && urlStr.indexOf(':' + port + '/') > 0) {
        origin += ':' + port;  // Add :portnumber but only if it exists in urlstr
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

  // Most sitecues scripts are loaded with https
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
      // TODO Strangely, saw an exception in Firefox 38: -- Illegal constructor
      // {"eventId":"87611cd9-5e0c-4ad9-b338-f4ce5b312e09","serverTs":1463709667327,"clientIp":"10.235.39.83","siteKey":"s-1e3f787a","isTest":false,"userId":null,"clientData":{"scVersion":"4.0.73-RELEASE","metricVersion":12,"sessionId":"12d5eb35-2f8b-4dd3-8006-722f6cfec4a5","pageViewId":"ac606acb-b05c-42b8-adba-13a764ee7372","siteId":"s-1e3f787a","userId":"cdbb986e-29e2-4a27-b07f-c1f253b2c645","pageUrl":"http://bestfriends.org/sanctuary/animals-special-needs/current/harvard?utm_medium=email&utm_source=bsd&utm_campaign=newsletter&utm_content=20160519&utm_term=2016national","browserUserAgent":"Mozilla/5.0 (Windows NT 6.1; rv:38.9) Gecko/20100101 Goanna/2.0 Firefox/38.9 PaleMoon/26.1.1","isClassicMode":false,"clientLanguage":"en-US","source":"page","isTester":false,"name":"error","clientTimeMs":1463709666975,"zoomLevel":1,"ttsState":false,"details":{"message":"Illegal constructor.","stack":".resolveUrl@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:28\nr@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\na@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\no@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nh@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\ns@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\n.each@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:1\nZ.prototype.each@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:1\nx@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nZ.Callbacks/c@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:1\nZ.Callbacks/f.add@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:1\nZ.fn.ready@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:1\ny@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nc@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nv@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\ng@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nm@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/page.js:4\nr/<@https://js.sitecues.com/l/s;id=s-1e3f787a/4.0.73-RELEASE/js/bp-toolbar-badge.js:1\nW@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:8\nO@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:9\nP/<@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:10\nk@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:20\nO/k.then/</<@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:21\nc/</<@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:19\nc/<@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:19\na@https://js.sitecues.com/l/s;id=s-1e3f787a/js/sitecues.js:19\n"}}}
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

  function isCrossDomain(url) {
    // Will cross-domain restrictions possibly burn us?
    var hostName = parseUrl(url).hostname;
    // For our purposes, hostname is the same as the domain
    return hostName !== document.location.hostname;
  }

  function isSameDomain(url) {
    return !isCrossDomain(url);
  }

  function init() {
    var domainEnding = isProduction() ? '.sitecues.com' : '.dev.sitecues.com';
    BASE_RESOURCE_URL = getBaseResourceUrl();
    apiDomain = 'ws' + domainEnding + '/';
  }

  return {
    init: init,
    getApiUrl: getApiUrl,
    getProxyApiUrl: getProxyApiUrl,
    getScriptOrigin: getScriptOrigin,
    isValidLibraryUrl: isValidLibraryUrl,
    getRawScriptUrl: getRawScriptUrl,
    resolveResourceUrl: resolveResourceUrl,
    parseUrl: parseUrl,
    isCrossDomain: isCrossDomain,
    isSameDomain: isSameDomain,
    isProduction: isProduction,
    resolveUrl: resolveUrl
  };

});
