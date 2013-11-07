sitecues.def('cursor/custom', function (view, callback, log) {
  'use strict';

  // Cursor types.
  view.TYPES = {
    'default': 'A',
    'pointer': 'B'
  };
  
  var defaultType = 'default';

  sitecues.use('cursor/images/manager', 'zoom', function (images, zoomModule) {
    
    /*
     * Initialize cursor according to zoom level given.
     */
    view.init = function () {

      var zoomStep = zoomModule.step
        , zoom     = zoomModule.min
        , parts
        , name
        , type
        ;

      this.data = {};

      function doSetData (type) {
        for (zoom = zoomModule.min; zoom <= zoomModule.max + zoomModule.step; zoom += zoomStep) {
          parts = zoom.toString().split('.');
          name = type + '_' + parts[0] + '_';
          name += parts[1] ? parts[1].charAt(0) : '0';
          view.data[name] = images.urls[name];
        }
      }

      for (type in view.TYPES) {
        if (view.TYPES.hasOwnProperty(type)) {
          doSetData(type);
        } else {
          if (type === 'auto') {
            type = defaultType;
            doSetData(type);
          }
        }
      }
    };

   view.getImage = function(type, zl) {

      var zoom  = zl || 1
        , parts = zoom.toString().split('.')
        , name
        ;

      // 'auto' type takes 'default' image.
      // TODO: we need to finally removethe right hardcode part of check "|| type === 'auto'"
      if (!view.TYPES.hasOwnProperty(type) || type === 'auto') {
        type = defaultType;
      }
      name = type + '_' + parts[0] + '_';
      name += parts[1] ? parts[1].charAt(0) : '0';

      return this.data[name];
    };

    view.init();

    // Export object fro unit-tests.
    if (sitecues.tdd) {
      exports.custom = view;
    }

    // Done.
    callback();
  
  });

});