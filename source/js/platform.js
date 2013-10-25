/**
 * platform.js
 * Determines the Browser Version and Operating System version constants
 */
sitecues.def('platform', function (platformModule, callback) {
  
  'use strict';

  // Store the agent and platform variables for later use
  var agent    = navigator && navigator.userAgent ? navigator.userAgent : null
    , platform = navigator.platform.toLowerCase()
    , browser
    , os
    ;

  // Determine which browser is being used
  browser = agent.indexOf(' Firefox/') > 0 ? 'fx'    : 
            agent.indexOf(' MSIE')     > 0 ||
            agent.indexOf(' Trident')  > 0 ? 'ie'    : 'Unknown Browser' ;

  // Set globally accessible browser constants
  platformModule.browser = {
    zoom      : 'zoom' in document.createElement('div').style,
    is        : browser,
    isFirefox : browser === 'fx',
    isIE      : browser === 'ie'
  };
    
  // Determine which opperating system is being used
  os = platform.indexOf('mac')   >-1       ? 'mac'   :
       platform.indexOf('win')   >-1       ? 'win'   : 
       platform.indexOf('linux') >-1       ? 'mac'   : 'Unknown OS' ;

  
  // Set globally accessible operating system constants
  platformModule.os = {
    is        : os,
    isMac     : os === 'mac',
    isWin     : os === 'win',
    isLinux   : os === 'linux'
  };

  // Done
  callback();

});