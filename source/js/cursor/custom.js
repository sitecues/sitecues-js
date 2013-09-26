sitecues.def('cursor/custom', function (element, callback, log) {

    // cursor types
    var types = {
        'auto':      'A',
        'default':   'A',
        'pointer':   'B'
    }
    var defaultType = 'default';

    sitecues.use('cursor/images/manager', 'zoom', function (images, zoomModule) {
        /*
         * Initialize cursor according to zoom level given.
         */
        element.init = function() {
            this.data = {};

            for(var type in types) {
                if (!types.hasOwnProperty(type) || type === 'auto') {
                    type = defaultType;                
                }
                // if we want dynamic drawning
                //images[type] = element.paint(type);

                // if static images
                var delimiter = '.';
                // todo: remove this line, this is shim for prototype purpose
                for (var zoom = zoomModule.min; zoom <= zoomModule.max + zoomModule.step; zoom += zoomModule.step) {
                    var parts = zoom.toString().split(delimiter);
                    var name = type + '_' + parts[0] + '_';
                    name += parts[1] ? parts[1].charAt(0) : '0';
                    this.data[name] = eval('images.urls.' +name);
                }
            }
        };

        // if we want dynamic drawning
        element.paint = function(type, zoom) {

        }

        element.getImages = function() {
            return this.data;
        }

        element.getImage = function(type, zoom) {
            // 'auto' type takes 'default' image.
            // TODO: we need to finally removethe right hardcode part of check "|| type === 'auto'"
            if (!types.hasOwnProperty(type) || type === 'auto') {
                type = defaultType;                
            }
            // todo: remove this line, this is shim for prototype purpose
            //var type = type || 'default';
            var zoom = zoom || 1;
            var delimiter = '.';
            var parts = zoom.toString().split(delimiter);
            var name = type + '_' + parts[0] + '_';
            name += parts[1] ? parts[1].charAt(0) : '0';

            return this.data[name];
        }

        element.init();

        // Done.
        callback();
    });
});