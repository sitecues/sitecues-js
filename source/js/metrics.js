/**
 * Basic metrics.
 */
sitecues.def('metrics', function(metrics, callback, log) {
    /**
     * *Session ID:* A random UUID generated for this library session.
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
    
    var instance = null;

    sitecues.use('metrics/util', 'jquery', 'conf', 'ui',
        function(metricsUtil, $, conf) {

            var Metrics = (function() {

                // Constructor.
                function Metrics() {
                    // todo: extend with pre-defined state.
                    this.options = {};
                    // Default state.
                    this.data = $.extend({}, DEFAULT_STATE);
                    // Initialize.
                    // todo: this is just an example, later we will fill the props with better data.
                    this.data.session_id = Math.random();
                    this.data.client_time_ms = +new Date; // epoch time in milliseconds  when the event occurred
                    this.data.page_url = location && location.href? location.href: '';
                    this.data.zoom_level = conf.get('zoom') || 1;
                    this.data.browser_user_agent = navigator && navigator.userAgent ? navigator.userAgent : '';
                    this.data.client_language = navigator && navigator.language ? navigator.language: '';
                    sitecues.emit('metrics/create', this, $.extend(true, {}, this.options));
                };

                // Singleton.
                return {
                    createInstance: function(options) {
                        return (new Metrics(options) || null);
                    },
                    // todo: take out the dubs(here and in the other metrics).
                    updateInstance: metricsUtil.update,
                };
            })();

            sitecues.on('zoom', function(zoomLevel) {
                if (!instance) {
                    // New instance
                    instance = Metrics.createInstance();
                    sitecues.emit('metrics/ready', instance);
                    return;
                }
                // Update zoom.
                var data = {'zoom_level': parseFloat(zoomLevel)};
                Metrics.updateInstance(instance, data, 'metrics/update');
            });

            // todo: find an event and add callback
            sitecues.on('speech/toggle', function() {
                console.log('Changing tts....');
                // shim
                // todo: test 'ttsEnable' 'siteTTSEnable'
                var data = {'tts_state': conf.get('ttsEnable') === true
                                         ? TTS_STATES['disabled']
                                         : TTS_STATES['enabled']};
                Metrics.updateInstance(instance, data, 'metrics/update');
            });

            // Update the basic metrics when panel is showed.
            sitecues.on('metrics/panel-closed/create metrics/badge-hovered/create metrics/hlb-opened/create', function() {
                var data = {
                    'client_time_ms':  +new Date
                };
                Metrics.updateInstance(instance, data, 'metrics/update');
            });

            // Done.
            callback();
    });
});