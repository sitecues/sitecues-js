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

    sitecues.use('metrics/util', 'jquery', 'ui', function(metricsUtil, $) {

        var PanelClosed = (function() {
            // Constructor.
            function PanelClosed() {
                // Default state.
                this.data = $.extend({}, DEFAULT_STATE);
                // Initialize.
                var _this = this;
                var $slider = $('#sitecues-panel .track, #sitecues-panel .trackBack, #sitecues-panel .thumb'),
                    $letterBig = $('#sitecues-panel .letterBig, #sitecues-panel .letterBigBack'),
                    $letterSmall = $('#sitecues-panel .letterSml, #sitecues-panel .letterSmlBack'),
                    $ttsButton = $('#sitecues-panel .tts');

                $slider.mousedown(function() {
                    _this.data.slider_interacted = true;
                });

                $letterBig.mousedown(function() {
                    _this.data.large_a_clicked = true;
                });

                $letterSmall.mousedown(function() {
                    _this.data.small_a_clicked = true;
                });

                $ttsButton.mousedown(function() {
                    _this.data.tts_clicked = true;
                });

            };

            // Singleton.
            return {
                createInstance: function(options) {
                    return (new PanelClosed(options) || null);
                },
                updateInstance: metricsUtil.update,
                fillData: function(data) {
                   $.extend(instance.data, data);
                },
                sendData: metricsUtil.send,
                // todo: only clear panel-closed event type data.
                clearData: function() {
                    this.updateInstance(instance, DEFAULT_STATE, 'metrics/panel-closed/clear');
                    console.log('Clear panel-closed data....');
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
        
        sitecues.on('panel/show', function() {
            PanelClosed.clearData();
        });

        sitecues.on('panel/hide', function() {
            PanelClosed.sendData(instance);
        });

        // Done.
        callback();
    });
});