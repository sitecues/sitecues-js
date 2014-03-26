/**
 * 
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
        'tts_state': '',
        'sitecues_on': '',
        'browser_user_agent': '',
        'client_language': ''
    };
    
    var instance = null;

    sitecues.use('jquery', 'conf', 'ui',
        function($, conf) {

            var Metrics = (function() {

                // Constructor.
                function Metrics() {
                    // todo: extend with pre-defined state.
                    this.options = {};
                    sitecues.emit('metrics/create', this, $.extend(true, {}, this.options));
                    // Default state.
                    this.metrics = DEFAULT_STATE;
                    // Initialize.
                    // todo: think over a better UUID
                    this.metrics.session_id = Math.random();
                }
                ;

                // Singleton.
                return {
                    createInstance: function(options) {
                        return (new Metrics(options) || null);
                    }
                };

                sitecues.on('zoom/increase', function() {
                    instance = Metrics.createInstance();
                    console.log(instance);
                });
            })();

            // Done.
            callback();
    });
});