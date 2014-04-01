/*
 * Create and send a metric event when the user opens an HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */
sitecues.def('metrics/hlb-opened', function(hlbOpened, callback, log) {
    
    var DEFAULT_STATE = {
        'name': 'hlb-opened',
    };

    var instance = null;

    sitecues.use('metrics/util', 'jquery', 'ui', function(metricsUtil, $) {

        var HlbOpened = (function() {
            // Constructor.
            function HlbOpened() {
                // Default state.
                this.data = $.extend({}, DEFAULT_STATE);
                // Initialize.
            };

            // Singleton.
            return {
                createInstance: function(options) {
                    return (new HlbOpened(options) || null);
                },
                updateInstance: metricsUtil.update,
                fillData: function(data) {
                   $.extend(instance.data, data);
                },
                sendData: metricsUtil.send,
                // todo: only clear panel-closed event type data.
                clearData: function() {
                    this.updateInstance(instance,DEFAULT_STATE, 'metrics/hlb-opened/clear');
                    console.log('Clear hlb-opened data....');
                }
            };
        })();

        instance = HlbOpened.createInstance();

        sitecues.on('metrics/create', function(metrics) {
            console.log('== HLB OPENED == ');
            HlbOpened.fillData(metrics.data);
        });

        sitecues.on('metrics/update', function(metrics) {
            HlbOpened.fillData(metrics.data);
        });

        // Done.
        callback();
    });
});