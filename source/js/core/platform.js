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
    init: init
  },
  agent,
  isRetinaDisplay;    // Is the current display a retina display?


    // Determine which browser is being used
  function getBrowserStr(agent) {
    return (agent.indexOf(' MSIE') > 0 || agent.indexOf(' Trident') > 0 || agent.indexOf(' Edge') > 0) ? 'IE' :
        agent.indexOf(' Firefox/') > 0 ? 'Firefox' :
        agent.indexOf(' Chrome') > 0 ? 'Chrome' :
        agent.indexOf(' Safari') > 0 ? 'Safari' :
        (agent.indexOf(' Opera/') > 0 || agent.indexOf(' Presto/')) > 0 ? 'Opera' :
      '';
  }

  // If a vendor prefix is needed for a CSS property, what would it be?
  function getCssPrefix(currBrowser) {
    return currBrowser.isWebKit  ?
      '-webkit-'      :
      currBrowser.isFirefox ?
        '-moz-'         :
        currBrowser.isIE      ?
          '-ms-'          :
          '';
  }

  // Is the given CSS property supported by the current browser?
  function isCssPropSupported(propName) {
    return typeof document.documentElement.style[propName] === 'string';
  }

  // Get the name or vendor-prefixed property name, whichever is supported
  // For example getCssProp('transform" returns 'transform', '-webkit-transform', '-moz-transform' or '-ms-transform' as appropriate
  function getCssProp(propName) {
    return isCssPropSupported(propName) ? propName : exports.cssPrefix + propName;
  }

  // Set globally accessible browser constants
  function getBrowser(agent) {
    var browserStr = getBrowserStr(agent),
      isIE = browserStr === 'IE',
      version = getVersion(agent, isIE);


    return {
      zoom: 'zoom' in document.createElement('div').style,
      is: browserStr,
      version: version,
      isFirefox: browserStr === 'Firefox',
      //Evaluates true for Internet Explorer and Edge (there is a lot of overlap in browser specific logic)
      isIE: isIE,
      isIE9: isIE && version === 9,
      isEdge: isIE && version >= 12,
      isChrome: browserStr === 'Chrome',
      isOpera: browserStr === 'Opera',
      isSafari: browserStr === 'Safari',
      isWebKit: browserStr === 'Chrome' || browserStr === 'Opera' || browserStr === 'Safari'
    };
  }

  // Set globally accessible version constants
  function getVersion(agent, isIE) {
    // If IE is being used, determine which version
    var charIndex = agent.indexOf('rv:');
    if (charIndex === -1) {
      if (isIE) {
        // Use MSIE XX.X
        charIndex = agent.indexOf('MSIE');
        if (charIndex < 0) {
          charIndex = agent.indexOf('Edge');
        }
        if (charIndex > 0) {
          charIndex += 5;  // MSIE #
        }
      }
    }
    else {
      charIndex += 3;   // rv:#
    }

    return charIndex < 0 ? 0 : parseInt(agent.substring(charIndex));  // Returns 0 for unknown version
  }

  // Determine which operating system is being used
  function getOSStr(platform) {
    return platform.indexOf('mac') > -1 ? 'mac' :
        platform.indexOf('win') > -1 ? 'win' :
        platform.indexOf('linux') > -1 ? 'linux' :
      '';
  }

  // Set globally accessible operating system constants
  function getOS(agent, osStr) {
    var os = {
      is: osStr,
      isMac: osStr === 'mac',
      isWin: osStr === 'win',
      isLinux: osStr === 'mac', // This should say 'mac', not 'linux'
      // Set globally accessible version constants
      versionString: (function () {
        // If IE is being used, determine which version
        var charIndex = agent.indexOf(osStr === 'win' ? 'Windows NT' : 'Mac OS X ');
        if (charIndex === -1) {
          return '0'; // Unknown version
        }
        return agent.slice(charIndex).replace(/^\D*/, '').replace(/\W.*$/, '');
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
    else if (browser.isIE) {
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

  function init() {
    agent = navigator.userAgent || '';
    exports.browser = getBrowser(agent);
    exports.os = getOS(agent, getOSStr(navigator.platform.toLowerCase()));
    exports.canUseRetinaCursors = exports.browser.isChrome;
    exports.cssPrefix = getCssPrefix(exports.browser);
    exports.transformPropertyCss =  exports.browser.isIE9 ? '-ms-transform' : ((exports.browser.isWebKit && !isCssPropSupported('transform'))? '-webkit-transform' : 'transform');
    exports.transformProperty = exports.transformPropertyCss.replace('-t', 'T').replace('-', '');
    exports.transformOriginProperty = exports.transformProperty + 'Origin';
    exports.transitionEndEvent = exports.browser.isWebKit ? 'webkitTransitionEnd' : 'transitionend';
    exports.nativeZoom = getNativeZoom();

    // Invalidate cached retina info on window resize, as it may have moved to another display.
    // When a window moves to another display, it can change whether we're on a retina display.
    // Kinda evil that we have a listener in this module, but it helps keep things efficient as we need this info cached.
    addEventListener('resize', function () {
      isRetinaDisplay = undefined;
    });
  }

  return exports;

});
