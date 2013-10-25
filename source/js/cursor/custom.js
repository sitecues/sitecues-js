sitecues.def('cursor/custom', function (element, callback, log) {
  'use strict';

  // Cursor types.
  element.TYPES = {
    'default': 'A',
    'pointer': 'B'
  };
  
  var defaultType = 'default';

  sitecues.use('cursor/images/manager', 'zoom', function (images, zoomModule) {
    
    /*
     * Initialize cursor according to zoom level given.
     */
    element.init = function() {

      var zoomLimit = zoomModule.max + zoomModule.step
        , zoomStep  = zoomModule.step
        , zoom      = zoomModule.min
        , parts
        , name
        , type
        ;

      this.data = {};

      for (type in element.TYPES) {
        if(element.TYPES.hasOwnProperty(type) || element.TYPES.hasOwnProperty('auto')){
          
          for (zoom = zoomModule.min; zoom <= zoomLimit; zoom += zoomStep) {
            parts = zoom.toString().split('.');
            name = type + '_' + parts[0] + '_';
            name += parts[1] ? parts[1].charAt(0) : '0';
            this.data[name] = images.urls[name];
          }

        }
      }
    };


    element.getImage = function(type, zl) {
      
      var zoom  = zl || 1
        , parts = zoom.toString().split('.')
        , name  = type + '_' + parts[0] + '_'
        ;

      // 'auto' type takes 'default' image.
      // TODO: we need to finally removethe right hardcode part of check "|| type === 'auto'"
      if (!element.TYPES.hasOwnProperty(type) || type === 'auto') {
        type = defaultType;
      }

      name += parts[1] ? parts[1].charAt(0) : '0';

      return this.data[name];
    };

    element.init();

    // Export object fro unit-tests.
    if (sitecues.tdd) {
      exports.custom = element;
    }

    // Done.
    callback();
  
  });

});