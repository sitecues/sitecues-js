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
    ;

  // Determine which browser is being used
  browser = agent.indexOf(' Firefox/') > 0 ? 'Firefox' : 
            agent.indexOf(' MSIE')     > 0 || 
            agent.indexOf(' Trident')  > 0 ? 'IE'      :
            agent.indexOf(' Chrome')   > 0 ? 'Chrome'  :
            agent.indexOf(' Safari')   > 0 ? 'Safari'  :
            'Unknown Browser';


  // Set globally accessible browser constants
  platformModule.browser = {
    zoom      : 'zoom' in document.createElement('div').style,
    is        : browser,
    isFirefox : browser === 'Firefox',
    isIE      : browser === 'IE',
    isChrome  : browser === 'Chrome'
  };

    ieVersion = 'NA';

  if( platformModule.browser.isIE ){

    ieVersion = agent.indexOf('MSIE 6') >= 0 ? 'IE6' :
                agent.indexOf('MSIE 7') >= 0 ? 'IE7' :
                agent.indexOf('MSIE 8') >= 0 ? 'IE8' :
                agent.indexOf('MSIE 9') >= 0 ? 'IE9' :
                agent.indexOf('MSIE 10') >= 0 ? 'IE10' :
                agent.indexOf('MSIE 11') >= 0 ? 'IE11' :
                'Unknown IE Version';
            }




  platformModule.ieVersion = ieVersion;



  if( !platformModule.browser.isChrome  ) {
    requiresFallback = true;
  }

platformModule.requiresFallback = requiresFallback;

//console.log(browser, ieVersion) 


    
  // Determine which opperating system is being used
  os = platform.indexOf('mac')   >-1       ? 'mac'   :
       platform.indexOf('win')   >-1       ? 'win'   : 
       platform.indexOf('linux') >-1       ? 'linux'   : 'Unknown OS' ;

  
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