/**
 * platform.js
 * Determines the Browser Version and Operating System version constants
 */
define([], function() {

  // Store the agent and platform variables for later use
  var exports = {
    browser: null,
    os: null,
    canUseRetinaCursors: null,
    cssPrefix: null,
    transformPropertyCss: null,
    transformProperty: null,
    transformOriginProperty: null,
    transitionEndEvent: null,
    nativeZoom: null,
    isRetina: isRetina,
    isCssPropSupported: isCssPropSupported,
    getCssProp: getCssProp,
    isUnsupportedPlatform: false,
    platformWarning: null,
    init: init
  },
  agent,
  isInitialized,
  isRetinaDisplay;    // Is the current display a retina display?


    // Determine which browser is being used
  function getBrowserStr(agent) {
    return (agent.indexOf(' MSIE') > 0 || agent.indexOf(' Trident') > 0 || agent.indexOf(' Edge') > 0) ? 'IE' :
        agent.indexOf(' Firefox/') > 0 ? 'Firefox' :
        agent.indexOf(' Chrome') > 0 ? 'Chrome' :
        agent.indexOf(' Safari') > 0 ? 'Safari' :
        (agent.indexOf(' Opera/') > 0 || agent.indexOf(' Presto/') > 0) ? 'Opera' :
      '';
  }

  // If a vendor prefix is needed for a CSS property, what would it be?
  function getCssPrefix(currBrowser) {
    return currBrowser.isWebKit  ?
      '-webkit-'        :
      currBrowser.isFirefox ?
        '-moz-'         :
        currBrowser.isMS    ?
          '-ms-'        :
          '';
  }

  // Is the given CSS property supported by the current browser?
  function isCssPropSupported(propName) {
    return typeof document.documentElement.style[propName] === 'string';
  }

  // Get the name or vendor-prefixed property name, whichever is supported
  // For example getCssProp('transform" returns 'transform', '-webkit-transform', '-moz-transform' or 'transform' as appropriate
  // Note: Regarding 'transform', we only need to do this for Safari 8 at this point
  function getCssProp(propName) {
    return isCssPropSupported(propName) ? propName : exports.cssPrefix + propName;
  }

  // Set globally accessible browser constants
  function getBrowser(agent) {
    var browserStr = getBrowserStr(agent),
      isMS = browserStr === 'IE',
      version,
      browser = {
        zoom: 'zoom' in document.createElement('div').style,
        is: browserStr,
        isFirefox: browserStr === 'Firefox',
        //Evaluates true for Internet Explorer and Edge (there is a lot of overlap in browser specific logic)
        isMS: isMS, // Includes Edge
        isIE: isMS && version < 12,  // Does not include Edge
        isEdge: isMS && version >= 12,
        isChrome: browserStr === 'Chrome',
        isOpera: browserStr === 'Opera',
        isSafari: browserStr === 'Safari',
        isWebKit: browserStr === 'Chrome' || browserStr === 'Opera' || browserStr === 'Safari'
      };

    browser.version = version = getVersion(agent, browser);
    browser.isIE = isMS && version < 12;
    browser.isEdge = isMS && version >= 12;

    return browser;
  }

  // Set globally accessible version constants
  function getVersion(agent, browser) {
    var charIndex = -1;
  
    // If IE is being used, determine which version
    if (browser.isChrome) {
      charIndex = agent.indexOf('Chrome/');
      if (charIndex > 0) {
        charIndex += 7;
      }
    }
    else if (browser.isSafari) {
      charIndex = agent.indexOf('Version/');
      if (charIndex > 0) {
        charIndex += 8;
      }
    }
    else if (browser.isMS) {
      // Use MSIE XX.X
      charIndex = agent.indexOf('MSIE');
      if (charIndex < 0) {
        charIndex = agent.indexOf('Edge');
      }
      if (charIndex > 0) {
        charIndex += 5;  // MSIE #
      }
    }
    if (charIndex < 0) {
      charIndex = agent.indexOf('rv:');
      if (charIndex > 0) {
        charIndex += 3;   // rv:#
      }
    }

    return charIndex < 0 ? 0 : parseInt(agent.substring(charIndex));  // Returns 0 for unknown version
  }

  // Determine which operating system is being used
  function getOSStr(agent) {
    return agent.indexOf('Mac OS X ') > -1 ? 'mac' :
        agent.indexOf('Windows NT') > -1 ? 'win' :
        agent.indexOf('Linux') > -1 ? 'linux' :
      'other';
  }

  // Set globally accessible operating system constants
  function getOS(agent) {
    var osStr = getOSStr(agent);
    var os = {
      is: osStr,
      isMac: osStr === 'mac',
      isWin: osStr === 'win',
      // Set globally accessible version constants
      versionString: (function () {
        // If IE is being used, determine which version
        var charIndex = agent.indexOf(osStr === 'win' ? 'Windows NT' : 'Mac OS X '),
          UNKNOWN_VERSION = '0';
        if (charIndex === -1) {
          return UNKNOWN_VERSION; // Unknown version
        }

        var versionMatches = agent.slice(charIndex)
          .replace(/^\D*/, '')
          .replace('_', '.')  // Mac OS X 10_4_3 -> 10.4_3   (we will be parsing this as a float)
          .match(/[\d\.]+/);

        return versionMatches ? versionMatches[0] : UNKNOWN_VERSION;
      })()
    };

    // Windows versions are weird:
    // 5.1, 5.2 = Windows XP
    // 5 = Windows Vista, Windows Server 2008
    // 6.1 = Windows 7
    // 6.2 = Windows 8
    // 6.3 = Windows 8.1
    // 10 = Windows 10
    // For more details see https://en.wikipedia.org/?title=Windows_NT
    os.majorVersion = parseInt(os.versionString);
    os.fullVersion = parseFloat(os.versionString);

    // Restore if needed
    // os.minorVersion = parseInt(platformModule.os.versionString.split(/\D/)[1]);

    return os;
  }


  // Retrieve and store the user's intentional amount of native browser zoom
  function getNativeZoom() {
    var browser = exports.browser,
        computedNativeZoom = 1;

    if (browser.isWebKit) {
      computedNativeZoom = outerWidth / innerWidth;
    }
    else if (browser.isMS) {
      // Note: on some systems the default zoom is > 100%. This happens on our Windows 7 + IE10 Dell Latitude laptop
      // See http://superuser.com/questions/593162/how-do-i-change-the-ctrl0-zoom-level-in-ie10
      // This means the actual zoom may be 125% but the user's intentional zoom is only 100%
      // To get the user's actual zoom use screen.deviceXDPI / screen.logicalXDPI
      computedNativeZoom = screen.deviceXDPI / screen.systemXDPI; // User's intentional zoom
    }
    else if (browser.isFirefox) {
      // Since isRetina() is not 100% accurate, neither will this be
      computedNativeZoom = isRetina() ? devicePixelRatio / 2 : devicePixelRatio;
    }

    return computedNativeZoom;
  }

  // Retrieve and store whether the current window is on a Retina display
  function isRetina() {
    var browser         = exports.browser,
        nativeZoom      = exports.nativeZoom;

    if (typeof isRetinaDisplay !== 'undefined') {
      return isRetinaDisplay;
    }

    isRetinaDisplay = false;

    // Safari doesn't alter devicePixelRatio for native zoom
    if (browser.isSafari) {
      isRetinaDisplay = devicePixelRatio === 2;
    }
    else if (browser.isChrome) {
      isRetinaDisplay = Math.round(devicePixelRatio / nativeZoom) === 2;
    }
    else if (browser.isFirefox) {
      // This is only a guess, unfortunately
      // The following devicePixelRatios can be either on a retina or not:
      // 2, 2.4000000953674316, 3
      // Fortunately, these would correspond to a relatively high level of zoom on a non-Retina display,
      // so hopefully we're usually right (2x, 2.4x, 3x)
      // We can check the Firefox zoom metrics to see if they are drastically different from other browsers.
      isRetinaDisplay = devicePixelRatio >= 2;
    }

    return isRetinaDisplay;
  }

  // Returns a string if the current OS/browser combo is not supported.
  // The reason string is human-readable description as to why the platform is not supported
  // TODO localize
  function getPlatformWarning(os, browser) {
    if (!os.isWin && !os.isMac) {
      return 'Microsoft Windows or Mac OS X is required';
    }


    var version = browser.version;
    if (browser.isIE) {
      return version !== 11 && 'for Internet Explorer, version 11 is required';
    }
    if (browser.isEdge) {
      return version < 13 && 'for Microsoft Edge, version 13 or later is required';
    }
    if (browser.isFirefox) {
      return version < 34 && 'for Firefox, version 34 or later is required';
    }
    if (browser.isSafari) {
      return version < 8 && 'for Safari, version 8 or later is required';
    }
    if (browser.isChrome) {
      return version < 41 && 'for Chrome, version 41 or later is required';
    }

    return 'IE, Firefox, Chrome or Safari is required';
  }

  function isStorageUnsupported() {
    var TEST_KEY = '-sc-storage-test';
    if (localStorage.length === 0 && sessionStorage.length === 0) {
      try {
        sessionStorage.setItem(TEST_KEY, '');
        sessionStorage.removeItem(TEST_KEY);
      }
      catch(ex) {
        return true;
      }
    }
  }

  // return truthy if platform is supported
  function init() {
    if (isInitialized) {
      return;
    }

    isInitialized = true;

    agent = navigator.userAgent || '';
    exports.browser = getBrowser(agent);
    exports.os = getOS(agent);
    exports.nativeZoom = getNativeZoom();

    var platformWarning = getPlatformWarning(exports.os, exports.browser);
    if (platformWarning) {
      throw new Error(platformWarning);
    }

    exports.isStorageUnsupported = isStorageUnsupported();
    exports.canUseRetinaCursors = exports.browser.isChrome;
    exports.cssPrefix = getCssPrefix(exports.browser);
    exports.transformPropertyCss = exports.browser.isWebKit && !isCssPropSupported('transform') ? '-webkit-transform' : 'transform';
    exports.transformProperty = exports.transformPropertyCss.replace('-t', 'T').replace('-', '');
    exports.transformOriginProperty = exports.transformProperty + 'Origin';
    exports.transitionEndEvent = exports.browser.isWebKit ? 'webkitTransitionEnd' : 'transitionend';
    exports.featureSupport = {
      themes: !exports.browser.isMS
    };

    // Invalidate cached retina info on window resize, as it may have moved to another display.
    // When a window moves to another display, it can change whether we're on a retina display.
    // Kinda evil that we have a listener in this module, but it helps keep things efficient as we need this info cached.
    addEventListener('resize', function () {
      isRetinaDisplay = undefined;
    });
  }

  return exports;
});