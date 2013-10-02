/*
 * This file manages retrival of images depending on the current user's platform.
 */
sitecues.def('cursor/images/manager', function (images, callback) {
    // EQ-723: Cursor URLs have offset for their hotspots. Let's add the coordinates, using CSS 3 feature.
    images.offsets = {
     'auto'   : {x: 0, y: 5,  step: 2.5},
     'default': {x: 0, y: 5,  step: 2.5},
     'pointer': {x: 10, y: 5, step: 3.5}
    }

    var systemDetect = {
      'OS': navigator.platform || "Unknown OS"
    };

    var systemOS = {
      'Windows': 'WIN',
      'Mac': 'MAC',
      'Linux': 'LINUX'
    };

    var isMac     = systemDetect.OS.toUpperCase().indexOf(systemOS['Mac'])     !== -1,
        isWindows = systemDetect.OS.toUpperCase().indexOf(systemOS['Windows']) !== -1,
        isLinux   = systemDetect.OS.toUpperCase().indexOf(systemOS['Linux'])   !== -1;

    var imageModuleName = 'mac'; // default
    if (isWindows) {
      imageModuleName = 'win';
    } else {
      imageModuleName = 'mac';
    }
    
    // Get dependencies: either images for Windows, or for MacOs.
    sitecues.use('cursor/images/' + imageModuleName, function (osImages) {
       images.urls = osImages.urls;

       // Export manager object for unit testing purposes.
        if (sitecues.tdd) {
          exports.manager = images;
        }

        // Done.
        callback();
    });

});