/**
 * Basic metrics.
 */
sitecues.def('metrics', function(metrics, callback, log) {
    /**
     * *Session ID:* A random UUID v4 generated for this library session.
     * *Client time milliseconds:* The epoch time in milliseconds when the event occurred
     * *Page URL:* Full URL of the page being viewed.
     * *Site ID:* The s-XXXXXXXX site ID
     * *Zoom Level:* The current zoom level.
     * *TTS State:* enum indicating whether or not TTS is
     ** disabled : 0
     ** enabled : 1
     ** unavailable: -1
     * *sitecues on/off:* if the zoom > 1 OR TTS is on, sitecues is ON. Otherwise, if none of those criteria exist, sitecues is OFF.
     * *Browser User Agent:* the raw user agent, to be processed by the back-end
     * *User language*: (OPTIONAL) the language the browser is set to, not the page language.
     */

    var TTS_STATES = {
        'disabled': 0,
        'enabled': 1,
        'unavailable': -1
    };

    var DEFAULT_STATE = {
        'session_id': '',
        'client_time_ms': '',
        'page_url': '',
        'zoom_level': '',
        'tts_state': '', // not implemented yet!
        'browser_user_agent': '',
        'client_language': ''
    };

    // Taken from here(free puplic license): https://gist.github.com/jed/982883
    var UUIDv4 = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)};

    sitecues.use('metrics/util', 'jquery', 'conf', 'conf/site', 'conf/user', 'speech', 'zoom', 'ui',
            function(metricsUtil, $, conf, site, user, speech, zoom) {

                // ============= Objects methods ======================
                metrics.init = function() {
                    // Default state.
                    metrics.data = $.extend({}, DEFAULT_STATE);
                    // Initialization.
                    var data = {
                        // A random UUID v4 generated for this library session.
                        'session_id': UUIDv4(),
                        // Epoch time in milliseconds  when the event occurred
                        'client_time_ms': +new Date,
                        'page_url'  : location && location.href ? location.href : '',
                        'zoom_level': conf.get('zoom') || 1,
                        'tts_state' : !site.get('ttsAvailable')
                                     ? TTS_STATES['unavailable']
                                     // 1 - for 'enabled', 0 - for 'disabled'
                                     : +speech.isEnabled(),
                        'browser_user_agent': navigator && navigator.userAgent ? navigator.userAgent : '',
                        'client_language': navigator && navigator.language ? navigator.language : ''
                    };
                    metrics.update(data);
                    sitecues.emit('metrics/ready', metrics);
                };

                metrics.update = function(data) {
                    if (!metrics['data']) {
                        metrics.init();
                    }
                    metricsUtil.update(metrics, data, 'metrics/update');
                };

                // ============= Events Handlers ======================
                sitecues.on('zoom', function(zoomLevel) {
                    var data = {'zoom_level': parseFloat(zoomLevel)};
                    metrics.update(data);
                });

                sitecues.on('speech/enable speech/disable', function() {
                    var ttsState = conf.get('siteTTSEnable') ? TTS_STATES['enabled'] : TTS_STATES['disabled'];
                    var data = {'tts_state': ttsState};
                    metrics.update(data);
                });

                // Update the basic metrics when panel is showed.
                sitecues.on('metrics/panel-closed/create metrics/badge-hovered/create metrics/hlb-opened/create', function() {
                    var data = {'client_time_ms': +new Date};
                    metrics.update(data);
                });

                // Done.
                callback();
            });
});