/*
 * Create and send a metric event when the user opens an HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */
sitecues.def('metrics/badge-hovered', function(badgeHovered, callback, log) {
    
    var DEFAULT_STATE = {
        'name': 'badge-hovered',
    };

    var instance = null;
    
   var toClass = {}.toString;

    sitecues.use('jquery', 'ui', function($) {

        var BadgeHovered = (function() {
            // Constructor.
            function BadgeHovered() {
                // Default state.
                this.data = $.extend({}, DEFAULT_STATE);
                // Initialize.
            };

            // Singleton.
            return {
                createInstance: function(options) {
                    return (new BadgeHovered(options) || null);
                },
                updateInstance: function(newData) {
                        // Flat structure.
                        if (arguments.length === 2) {
                            var prop = arguments[0],
                                    value = arguments[1];
                            instance.data[prop] = value;
                        } else {
                            // Object is passed.
                            var newDataType = newData ? toClass.call(newData).slice(8, -1) : undefined;
                            if (newDataType === 'Object') {
                                for (var prop in newData) {
                                    instance.data[prop] = newData[prop];
                                }
                            }
                        }
                        sitecues.emit('metrics/badge-hovered/update', instance);
                },
                fillData: function(data) {
                   $.extend(instance.data, data);
                },
                sendData: function() {
                    // Send data in JSON format to backend using end point.
                    console.log('Panel close sending data...');
                    console.log(JSON.stringify(instance.data));
                    sitecues.emit('metrics/badge-hovered/sent', this);
                },
                // todo: only clear panel-closed event type data.
                clearData: function() {
                    this.updateInstance(DEFAULT_STATE);
                    console.log('Clear panel-closed data....');
                    sitecues.emit('metrics/badge-hovered/clear', instance);
                }
            };
        })();

        instance = BadgeHovered.createInstance();

        sitecues.on('metrics/create', function(metrics) {
            console.log('== PANEL CLOSED == ');
            BadgeHovered.fillData(metrics.data);
        });

        sitecues.on('metrics/update', function(metrics) {
            BadgeHovered.fillData(metrics.data);
        });
        
        sitecues.on('panel/show', function() {
            BadgeHovered.clearData();
        });

        sitecues.on('panel/hide', function() {
            BadgeHovered.sendData();
        });

        // Done.
        callback();
    });
});