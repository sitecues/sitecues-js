sitecues.def('cursor/custom', function (element, callback, log) {

    // Cursor types.
    element.TYPES = {
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

            for(var type in element.TYPES) {
                if (!element.TYPES.hasOwnProperty(type) || type === 'auto') {
                    type = defaultType;                
                }
                var delimiter = '.';

                for (var zoom = zoomModule.min; zoom <= zoomModule.max + zoomModule.step; zoom += zoomModule.step) {
                    var parts = zoom.toString().split(delimiter);
                    var name = type + '_' + parts[0] + '_';
                    name += parts[1] ? parts[1].charAt(0) : '0';
                    this.data[name] = images.urls[name];
                }
            }
        };

        element.getImage = function(type, zoom) {
            // 'auto' type takes 'default' image.
            // TODO: we need to finally removethe right hardcode part of check "|| type === 'auto'"
            if (!element.TYPES.hasOwnProperty(type) || type === 'auto') {
                type = defaultType;                
            }

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