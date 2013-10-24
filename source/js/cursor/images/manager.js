/*
 * This file manages retrival of images depending on the current user's platform.
 */
sitecues.def('cursor/images/manager', function (imagesManager, callback) {
  'use strict';

  var imageModuleName
    , systemDetect
    , systemOS
    , isWindows
    , isLinux
    , isMac
    ;
  
  // EQ-723: Cursor URLs have offset for their hotspots. Let's add the coordinates, using CSS 3 feature.
  imagesManager.offsets = {
    'auto'   : {x: 0,  y: 5, step: 2.5},
    'default': {x: 0,  y: 5, step: 2.5},
    'pointer': {x: 10, y: 5, step: 3.5}
  };

  systemDetect = {
    'OS': navigator.platform || 'Unknown OS'
  };

  systemOS = {
    'Windows' : 'WIN',
    'Mac'     : 'MAC',
    'Linux'   : 'LINUX'
  };

  isMac     = systemDetect.OS.toUpperCase().indexOf(systemOS.Mac)     !== -1;
  isWindows = systemDetect.OS.toUpperCase().indexOf(systemOS.Windows) !== -1;
  isLinux   = systemDetect.OS.toUpperCase().indexOf(systemOS.Linux)   !== -1;

  imageModuleName = 'mac'; // default

  if (isWindows) {
    imageModuleName = 'win';
  } else {
    imageModuleName = 'mac';
  }
  
  // Get dependencies: either images for Windows, or for MacOs.
  sitecues.use('cursor/images/' + imageModuleName, function (osImages) {

    imagesManager.urls = osImages.urls;

   // Export manager object for unit testing purposes.
    if (sitecues.tdd) {
      exports.manager = imagesManager;
    }

    // Done.
    callback();

  });

});