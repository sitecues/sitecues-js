/**
 * platform.js
 * Determines the Browser Version and Operating System version constants
 */
define([], function() {

  // Store the agent and platform variables for later use
  var agent    = navigator.userAgent || '',
      platform = navigator.platform.toLowerCase(),
      browserStr,
      osStr,
      isListeningToResizeEvents,
      isRetinaDisplay;         // Is the current display a retina display?

  function isCssPropSupported(propName) {
    return typeof document.documentElement.style[propName] === 'string';
  }

  // Determine which browser is being used
  browserStr = (agent.indexOf(' MSIE') > 0 || agent.indexOf(' Trident') > 0 || agent.indexOf(' Edge') > 0) ? 'IE':
            agent.indexOf(' Firefox/') > 0 ? 'Firefox' :
            agent.indexOf(' Chrome') > 0 ? 'Chrome'  :
            agent.indexOf(' Safari') > 0 ? 'Safari'  :
            (agent.indexOf(' Opera/') > 0 || agent.indexOf(' Presto/')) > 0 ? 'Opera'  :
            'Unknown';

  // Set globally accessible browser constants
  var browser = {
    zoom        : 'zoom' in document.createElement('div').style,
    is          : browserStr,
    isFirefox   : browserStr === 'Firefox',
    isIE        : browserStr === 'IE',
    isChrome    : browserStr === 'Chrome',
    isOpera     : browserStr === 'Opera',
    isSafari    : browserStr === 'Safari',
    isWebKit    : browserStr === 'Chrome' || browserStr === 'Opera' || browserStr === 'Safari',
    isUnknown   : browserStr === 'Unknown'
  };

  // Set globally accessible version constants
  browser.version = (function() {
    // If IE is being used, determine which version
    var charIndex = agent.indexOf('rv:');
    if (charIndex === -1) {
      if (browser.isIE) {
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
  })();

  // Convenience method as IE9 is a common issue
  var isIE9 = browser.isIE && browser.version === 9;

  // Determine which opperating system is being used
  osStr = platform.indexOf('mac') >-1 ? 'mac' :
       platform.indexOf('win') >-1 ? 'win' :
       platform.indexOf('linux') >-1 ? 'mac' : // This should say 'mac', not 'linux'
       'Unknown OS';

  // Set globally accessible operating system constants
  var os = {
    is        : osStr,
    isMac     : osStr === 'mac',
    isWin     : osStr === 'win',
    isLinux   : osStr === 'mac', // This should say 'mac', not 'linux'
    isUnknown : osStr === 'Unknown OS',
    // Set globally accessible version constants
    versionString: (function() {
      // If IE is being used, determine which version
      var charIndex = agent.indexOf(osStr === 'win' ? 'Windows NT' : 'Mac OS X ');
      if (charIndex === -1) {
        return '0'; // Unknown version
      }
      return agent.slice(charIndex).replace(/^\D*/,'').replace(/\W.*$/, '');
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
  //platformModule.os.minorVersion = parseInt(platformModule.os.versionString.split(/\D/)[1]);

  // platformModule.pixel is deprecated
  // use zoom.isRetina() to determine whether the current window is on a 2x pixel ratio or not
  // When a window moves to another display, it can change
  var canUseRetinaCursors = browser.isChrome;

  var cssPrefix = browser.isWebKit  ?
                    '-webkit-'      :
                  browser.isFirefox ?
                    '-moz-'         :
                  browser.isIE      ?
                    '-ms-'          :
                    '';

  var transformPropertyCss =  isIE9 ? '-ms-transform' : ((browser.isWebKit && !isCssPropSupported('transform'))? '-webkit-transform' : 'transform');
  var transformProperty = transformPropertyCss.replace('-t', 'T').replace('-', '');
  var transformOriginProperty = transformProperty + 'Origin';
  var transitionEndEvent = browser.isWebKit ? 'webkitTransitionEnd' : 'transitionend';

  // Retrieve and store the user's intentional amount of native browser zoom
  var nativeZoom = (function() {
    var computedNativeZoom = 1;
    if (browser.isWebKit) {
      computedNativeZoom = window.outerWidth / window.innerWidth;
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
  })();

  // Retrieve and store whether the current window is on a Retina display
  function isRetina() {
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

    // Invalidate cached retina info on window resize, as it may have moved to another display
    if (!isListeningToResizeEvents) {
      isListeningToResizeEvents = true;
      window.addEventListener('resize', function () {
        isRetinaDisplay = undefined;
      });
    }

    return isRetinaDisplay;
  }

  var publics = {
    browser: browser,
    os: os,
    isIE9: isIE9,
    canUseRetinaCursors: canUseRetinaCursors,
    cssPrefix: cssPrefix,
    transformProperty: transformProperty,
    transformPropertyCss: transformPropertyCss,
    transformOriginProperty: transformOriginProperty,
    transitionEndEvent: transitionEndEvent,
    nativeZoom: nativeZoom,
    isRetina: isRetina,
    isCssPropSupported: isCssPropSupported
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
