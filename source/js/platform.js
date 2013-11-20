/**
 * platform.js
 * Determines the Browser Version and Operating System version constants
 */
sitecues.def('platform', function (platformModule, callback, log) {
  
  'use strict';

  // Store the agent and platform variables for later use
  var agent    = navigator && navigator.userAgent ? navigator.userAgent : null
    , platform = navigator.platform.toLowerCase() 
    , browser
    , os
    , requiresFallback = true
    , ieVersion = false
    , isTouchDevice = false
    ;

  // Determine which browser is being used
  browser = agent.indexOf(' Firefox/') > 0 ? 'Firefox' : 
            agent.indexOf(' MSIE') > 0 || agent.indexOf(' Trident') > 0 ? 'IE' :
            agent.indexOf(' Chrome') > 0 ? 'Chrome'  :
            agent.indexOf(' Safari') > 0 ? 'Safari'  :
            agent.indexOf(' Opera') > 0 ? 'Opera'  :  'Unknown Browser';


  // Set globally accessible browser constants
  platformModule.browser = {
            zoom        : 'zoom' in document.createElement('div').style,
            is          : browser,
            isFirefox   : browser === 'Firefox',
            isIE        : browser === 'IE',
            isChrome    : browser === 'Chrome',
            isOpera     : browser === 'Opera',
            isSafari    : browser === 'Safari'
      };

        // If IE is being used, determine which version
        if( platformModule.browser.isIE ){
          // Get the current IE version to serve the appropriate fallback message
          // platformModule.ieVersion = ieVersion;
          ieVersion = agent.indexOf('MSIE 6') >= 0 ? 'IE6' : 
                      agent.indexOf('MSIE 7') >= 0 ? 'IE7' :
                      agent.indexOf('MSIE 8') >= 0 ? 'IE8' :
                      agent.indexOf('MSIE 9') >= 0 ? 'IE9' :
                      agent.indexOf('MSIE 10') >= 0 ? 'IE10' :
                      agent.indexOf('MSIE 11') >= 0 ? 'IE11' : 'Unknown IE Version';
          }; 

          // Set globally accessible IE version constants 
          platformModule.ieVersion = {
                      vNA       : ieVersion === false,
                      isIE6     : ieVersion === 'IE6',
                      isIE7     : ieVersion === 'IE7',
                      isIE8     : ieVersion === 'IE8',
                      isIE9     : ieVersion === 'IE9',
                      isIE10    : ieVersion === 'IE10',
                      isIE11    : ieVersion === 'IE11',
                      isUnknown : ieVersion === 'Unknown IE Version'
                      }
                  

        // Determine which opperating system is being used
        os = platform.indexOf('mac') >-1 ? 'mac' :
             platform.indexOf('win') >-1 ? 'win' : 
             platform.indexOf('linux') >-1 ? 'linux' : 'Unknown OS';
        
        // Set globally accessible operating system constants
        platformModule.os = {
            is        : os,
            isMac     : os === 'mac',
            isWin     : os === 'win',
            isLinux   : os === 'linux'
            };

      // EQ-881 - As a customer, I want sitecues to degrade gracefully or provide a useful
      // fallback when it can't work, so that my users aren't confused by the icon.
      // Set globally accessible operating fallback constants

       function hasTouch(success){
          return !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator);
         }

      if( platformModule.browser.isChrome ){ 
        requiresFallback = false;
      }
      if( platformModule.browser.isSafari && platformModule.os.isMac ){ 
        requiresFallback = false;
      }

        // Requires fallback - current browser is not supported by sitecues
        // specific message [browser/os/supports touch] is assembled in ./fallback.js
        platformModule.requiresFallback = requiresFallback;
        // Device has touch capabilities
        platformModule.isTouchDevice = hasTouch();

  // Determine the device pixel ratio of the
  platformModule.pixel = {
    ratio: window.devicePixelRatio,
    support: {
      Chrome: true
    }
  };

  // Done
  callback();
});



