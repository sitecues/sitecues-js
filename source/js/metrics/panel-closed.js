/*
 * Create and send a metric event when the user opens an HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */
sitecues.def('metrics/panel-closed', function(panelClosed, callback, log) {

    var DEFAULT_STATE = {
        'name': 'panel-closed',
        'slider_interacted': 0,
        'large_a_clicked': 0,
        'small_a_clicked': 0,
        'tts_clicked': 0
    };


    sitecues.use('metrics/util', 'jquery', 'ui', function(metricsUtil, $) {

        // ============= Objects methods ======================
        panelClosed.init = function() {
            panelClosed.data = $.extend({}, DEFAULT_STATE);
            var $slider = $('#sitecues-panel .track, #sitecues-panel .trackBack, #sitecues-panel .thumb'),
                $letterBig = $('#sitecues-panel .letterBig, #sitecues-panel .letterBigBack'),
                $letterSmall = $('#sitecues-panel .letterSml, #sitecues-panel .letterSmlBack'),
                $ttsButton = $('#sitecues-panel .tts');

            $slider.mousedown(function() {
                panelClosed.data.slider_interacted = 1;
            });

            $letterBig.mousedown(function() {
                panelClosed.data.large_a_clicked = 1;
            });

            $letterSmall.mousedown(function() {
                panelClosed.data.small_a_clicked = 1;
            });

            $ttsButton.mousedown(function() {
                panelClosed.data.tts_clicked = 1;
            });
        };
        panelClosed.update = function(data) {
            metricsUtil.update(panelClosed, data);
        };
        panelClosed.send = function() {
            metricsUtil.send(panelClosed);
        };
        panelClosed.reset = function() {
            panelClosed.update(DEFAULT_STATE);
        };

        // ============= Events Handlers ======================
        // Create an instance on panel show event.
        sitecues.on('panel/show', function() {
            if (!panelClosed['data']) {
                panelClosed.init();
            }
            sitecues.emit('metrics/panel-closed/create');
        });

        sitecues.on('metrics/update', function(metrics) {
            panelClosed['data'] && panelClosed.update(metrics.data);
        });

        // Clear an instance data on panel hide event.
        sitecues.on('panel/hide', function() {
            panelClosed.send();
            panelClosed.reset();
        });

        // Done.
        callback();
    });
});