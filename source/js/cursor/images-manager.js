/*
 * This file contains cursor images for every single zoom level we need now.
 * It aims to isolate images storage from the code. We might want to change the
 * format or the way they are represented, so encapsulation sounds like a good idea.
 */
// todo: add deps to make file
sitecues.def('cursor/images-manager', function (images, callback) {

    // EQ-723: Cursor URLs have offset for their hotspots. Let's add the coordinates, using CSS 3 feature.
    images.offsets = {
     'auto'   : {x: 0, y: 5,  step: 2.5},
     'default': {x: 0, y: 5,  step: 2.5},
     'pointer': {x: 10, y: 5, step: 3.5}
    }

    var systemDetect = {
      'OS': navigator.platform || "Unknown OS",
    };
    
    var systemOS = {
      'Windows': 'WIN',
      'Mac': 'MAC',
      'Linux': 'LINUX'
    };

    var isMac     = systemDetect.OS.toUpperCase().indexOf(systemOS['Mac'])      !==-1,
        isWindows = systemDetect.OS.toUpperCase().indexOf(systemOS['Windows'])  !==-1,
        isLinux   = systemDetect.OS.toUpperCase().indexOf(systemOS['Linux'])    !==-1;

    var imageModuleName = 'images-'; // default
    if (isWindows) {
      imageModuleName += 'win';
    } else {
      imageModuleName += 'mac';
    }
    
    // Get dependencies.
    sitecues.use('cursor/' + imageModuleName, function (osImages) {
       images.urls = osImages.urls;

        // Done.
        callback();
    });

});