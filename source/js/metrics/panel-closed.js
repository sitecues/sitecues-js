/*
 * Create and send a metric event when the user opens an HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */
sitecues.def('metrics/panel-closed', function(panelClosed, callback, log) {
    
    var DEFAULT_STATE = {
        'name': 'panel-closed',
        'slider_interacted': false,
        'large_a_clicked': false,
        'small_a_clicked': false,
        'tts_clicked': false
    };

    var instance = null;

    sitecues.use('jquery', 'ui', function($) {

        var PanelClosed = (function() {
            // Constructor.
            function PanelClosed() {
                // Default state.
                this.data = DEFAULT_STATE;
                // Initialize.
                var _this = this;
                $('.track, .trackBack, .thumb').mousedown(function() {
                    _this.data.slider_interacted = true;
                });

                $('.letterBig, .letterBigBack').mousedown(function() {
                    _this.data.large_a_clicked = true;
                });

                $('.letterSml, .letterSmlBack').mousedown(function() {
                    _this.data.small_a_clicked = true;
                });

                $('.tts').mousedown(function() {
                    _this.data.tts_clicked = true;
                });

            };

            // Singleton.
            return {
                createInstance: function(options) {
                    return (new PanelClosed(options) || null);
                },
                fillData: function(data) {
                   $.extend(instance.data, data);
                },
                sendData: function() {
                    // Send data in JSON format to backend using end point.
                    console.log('Panel close sending data...');
                    console.log(JSON.stringify(instance.data));
                    sitecues.emit('metrics/panel-closed/sent', this);
                },
                // todo: only clear panel-closed event type data.
                clearData: function() {
//                    this.data = {};
//                    instance = null;
                }
            };
        })();

        instance = PanelClosed.createInstance();

        sitecues.on('metrics/create', function(metrics) {
            console.log('== PANEL CLOSED == ');
            PanelClosed.fillData(metrics.data);
        });

        sitecues.on('metrics/update', function(metrics) {
            PanelClosed.fillData(metrics.data);
        });

        sitecues.on('panel/hide', function() {
            PanelClosed.sendData();
            PanelClosed.clearData();
        });

        // Done.
        callback();
    });
});