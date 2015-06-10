/**
 * Created by akhabibullina on 5/4/2015.
 */
/*
 * Create and send a metric event when the user requests TTS with HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */

sitecues.def('metrics/tts-requested', function (TTSRequested, callback) {

  var SPEECH_TRIGGERS = ['space', 'shift', 'shift+m', 'shift+a'];
  var TTS_AUDIO_FORMATS = ['ogg', 'mp3', 'aac'];

  var DEFAULT_STATE = {
    'name': 'tts-requested',
    'trigger': SPEECH_TRIGGERS[0],       // For now, it's always HLB
    'audio_format': TTS_AUDIO_FORMATS[0],
    'char_count': 0,
    'request_time': 0                   // The number of milliseconds the TTS request took to complete.
  };

  sitecues.use('metrics/util', 'jquery', function (metricsUtil) {

    // ============= The API ======================
    TTSRequested.init = initTTSRequestedData;
    TTSRequested.update = function (data) {
        metricsUtil.update(TTSRequested, data);
    };
    TTSRequested.send = function () {
        metricsUtil.send(TTSRequested);
    };
    TTSRequested.reset = function() {
        TTSRequested.update(DEFAULT_STATE);
    };

    function initTTSRequestedData(TTSUrl) {
      TTSRequested.data = DEFAULT_STATE;

      var text = getQueryVariable(new URL(TTSUrl), 't');

      TTSRequested.data.audio_format = getTTSAudioFormat(TTSUrl);
      TTSRequested.data.char_count = decodeURIComponent(text.replace(/\+/g,  " ")).length;
      TTSRequested.data.request_time = 1;
    };

    function getTTSAudioFormat(TTSUrl) {
      var TTSQueryURL = TTSUrl.split('/')[8];
      var TTSFileName = TTSQueryURL.split('?')[0];
      return TTSFileName.split('.')[1];
    }

    function getQueryVariable(url, variable)
    {
      var query = url.search.substring(1);
      var vars = query.split("&");
      for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
      }
      return(false);
    }

    // ============= Events Handlers ======================
    // Create an instance on hlb create event.
    sitecues.on('audio/speech-play', function(TTSUrl) {
      if (!TTSRequested['data']) {
        TTSRequested.init(TTSUrl);
      }
      sitecues.emit('metrics/tts-requested/create');
    });

    sitecues.on('metrics/update', function(metrics) {
      TTSRequested['data'] && TTSRequested.update(metrics.data);
    });

    // Update requested time
    sitecues.on('audio/playing', function(metrics) {
      if (TTSRequested['data']) {
        TTSRequested.update(metrics.data);

        // Send the metric data and clear an instance data on hlb opened(ready) event.
        TTSRequested.send();
        TTSRequested.reset();
      }
    });

    // Done.
    callback();
  });
});
