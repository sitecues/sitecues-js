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
        'client_time_utc': '',
        'page_url': '',
        'zoom_level': '',
        'tts_state': '',
        'browser_user_agent': '',
        'client_language': ''
    };
    
    var toClass = {}.toString;
    
    var instance = null;

    sitecues.use('jquery', 'conf', 'ui',
        function($, conf) {

            var Metrics = (function() {

                // Constructor.
                function Metrics() {
                    // todo: extend with pre-defined state.
                    this.options = {};
                    // Default state.
                    this.data = DEFAULT_STATE;
                    // Initialize.
                    // todo: this is just an example, later we will fill the props with better data.
                    this.data.session_id = Math.random();
                    this.data.client_time_ms = +new Date; // epoch time in milliseconds  when the event occurred
                    this.data.client_time_utc = (new Date).toUTCString(); // epoch time in UTC when the event occurred
                    this.data.page_url = location && location.host? location.host: '';
                    this.data.zoom_level = conf.get('zoom') || 1;
                    this.data.tts_state = conf.get('speechOff') === true ? TTS_STATES['disabled']: TTS_STATES['enabled'];
                    this.data.browser_user_agent = navigator && navigator.userAgent ? navigator.userAgent : '';
                    this.data.client_language = navigator && navigator.language ? navigator.language: '';
                    sitecues.emit('metrics/create', this, $.extend(true, {}, this.options));
                };

                // Singleton.
                return {
                    createInstance: function(options) {
                        return (new Metrics(options) || null);
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
                            if (newDataType === 'Object' && Object.keys(newData).length === 1) {
                                for (var prop in newData) {
                                    instance.data[prop] = newData[prop];
                                }
                            }
                        }
                        sitecues.emit('metrics/update', instance);
                    }
                };

            })();

            instance = Metrics.createInstance();
            
            sitecues.on('zoom', function(zoomLevel) {
                console.log('Changing zoom....');
                console.log(instance);
                Metrics.updateInstance({'zoom_level': parseFloat(zoomLevel)});
            });

            // Done.
            callback();
    });
});