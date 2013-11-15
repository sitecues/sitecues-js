/**
 * platform.js
 * Determines the Browser Version and Operating System version constants
 */
sitecues.def('platform', function (platformModule, callback) {
  
  'use strict';

  // Store the agent and platform variables for later use
  var agent    = navigator && navigator.userAgent ? navigator.userAgent : null
    , platform = navigator.platform.toLowerCase()
    , requiresFallback = false
    , browser
    , ieVersion
    , os
    , isTouchDevice
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

   function hasTouch(){
    return !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator);
   }

   platformModule.isTouchDevice = hasTouch();



  ieVersion = 'NA';



  if( !platformModule.browser.isChrome  ) {
        requiresFallback = true;
      }
  if( platformModule.browser.isIE ){

    ieVersion = agent.indexOf('MSIE 6') >= 0 ? 'IE6' : 
                agent.indexOf('MSIE 7') >= 0 ? 'IE7' :
                agent.indexOf('MSIE 8') >= 0 ? 'IE8' :
                agent.indexOf('MSIE 9') >= 0 ? 'IE9' :
                agent.indexOf('MSIE 10') >= 0 ? 'IE10' :
                agent.indexOf('MSIE 11') >= 0 ? 'IE11' : 'Unknown IE Version';
            }; 


    platformModule.ieVersion = {
            vNA       : ieVersion,
            isIE6     : ieVersion === 'IE6',
            isIE7     : ieVersion === 'IE7',
            isIE8     : ieVersion === 'IE8',
            isIE9     : ieVersion === 'IE9',
            isIE10    : ieVersion === 'IE10',
            isIE11    : ieVersion === 'IE11',
            isUnknown : ieVersion === 'Unknown IE Version'
            };

    platformModule.requiresFallback = requiresFallback;

    
  // Determine which opperating system is being used
  os = platform.indexOf('mac') >-1 ? 'mac' :
       platform.indexOf('win') >-1 ? 'win' : 
       platform.indexOf('linux') >-1 ? 'linux' : 'Unknown OS' ;

  
  // Set globally accessible operating system constants
  platformModule.os = {
      is        : os,
      isMac     : os === 'mac',
      isWin     : os === 'win',
      isLinux   : os === 'linux'
      };

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