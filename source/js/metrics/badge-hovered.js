/*
 * Create and send a metric event when the user opens an HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */
sitecues.def('metrics/badge-hovered', function(badgeHovered, callback, log) {
    
    var DEFAULT_STATE = {
        'name': 'badge-hovered',
    };

    var instance = null;

    sitecues.use('metrics/util', 'jquery', 'ui', function(metricsUtil,$) {

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
                updateInstance: metricsUtil.update,
                fillData: function(data) {
                   $.extend(instance.data, data);
                },
                sendData: metricsUtil.send,
                // todo: only clear panel-closed event type data.
                clearData: function() {
                    this.updateInstance(instance, DEFAULT_STATE, 'metrics/badge-hovered/clear');
                    console.log('Clear badge-hovered data....');
                }
            };
        })();

        instance = BadgeHovered.createInstance();

        sitecues.on('metrics/create', function(metrics) {
            console.log('== BADGE HOVERED == ');
            BadgeHovered.fillData(metrics.data);
        });

        sitecues.on('metrics/update', function(metrics) {
            BadgeHovered.fillData(metrics.data);
        });
        
        sitecues.on('panel/show', function() {
            BadgeHovered.clearData();
        });

        sitecues.on('panel/hide', function() {
            BadgeHovered.sendData(instance);
        });

        // Done.
        callback();
    });
});