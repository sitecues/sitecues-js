/*
 * This file manages retrival of images depending on the current user's platform.
 */
sitecues.def('cursor/images/manager', function (imagesManager, callback) {
  'use strict';

  var platform, os;
  
  // EQ-723: Cursor URLs have offset for their hotspots. Let's add the coordinates, using CSS 3 feature.
  imagesManager.offsets = {
    'auto'    : {x: 0,  y: 5, step: 2.5},
    'default' : {x: 0,  y: 5, step: 2.5},
    'pointer' : {x: 10, y: 5, step: 3.5}
  };

  os = navigator.platform.toLowerCase();

  platform = os.indexOf('mac')   >-1 ? 'mac'   :
             os.indexOf('win')   >-1 ? 'win'   :
             os.indexOf('linux') >-1 ? 'linux' : 'mac' ;

  // Get dependencies: either images for Windows, or for MacOs.
  sitecues.use('cursor/images/' + platform, function (osImages) {

    imagesManager.urls = osImages.urls;

   // Export manager object for unit testing purposes.
    if (sitecues.tdd) {
      exports.manager = imagesManager;
    }

    // Done.
    callback();

  });

});