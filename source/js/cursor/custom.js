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
    view.init = function() {

      var zoomLimit = zoomModule.max + zoomModule.step
        , zoomStep  = zoomModule.step
        , zoom      = zoomModule.min
        , parts
        , name
        , type
        ;

      this.data = {};

      for (type in view.TYPES) {
        if(view.TYPES.hasOwnProperty(type) || view.TYPES.hasOwnProperty('auto')){
          
          for (zoom = zoomModule.min; zoom <= zoomLimit; zoom += zoomStep) {
            parts = zoom.toString().split('.');
            name = type + '_' + parts[0] + '_';
            name += parts[1] ? parts[1].charAt(0) : '0';
            this.data[name] = images.urls[name];
          }

        }
      }
    };


    view.getImage = function(type, zl) {
      
      var zoom  = zl || 1
        , parts = zoom.toString().split('.')
        , name  = type + '_' + parts[0] + '_'
        ;

      // 'auto' type takes 'default' image.
      // TODO: we need to finally removethe right hardcode part of check "|| type === 'auto'"
      if (!view.TYPES.hasOwnProperty(type) || type === 'auto') {
        type = defaultType;
      }

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