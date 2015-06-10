/**
 * Created by akhabibullina on 5/4/2015.
 */
/*
 * Create and send a metric event when the user requests TTS with HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */

sitecues.def('metrics/tts-requested', function (ttsRequested, callback) {

  var SPEECH_TRIGGERS = ['space', 'shift', 'shift+m', 'shift+a'];
  var TTS_AUDIO_FORMATS = ['ogg', 'mp3', 'aac'];

  var DEFAULT_STATE = {
    'name'         : 'tts-requested',
    'trigger'      : SPEECH_TRIGGERS[0],   // For now, it's always HLB.
    'audio_format' : TTS_AUDIO_FORMATS[0],
    'char_count'   : 0,
    'request_time' : 0                     // Number of milliseconds the TTS request took to complete.
  };

  sitecues.use('metrics/util', 'jquery', function (metricsUtil) {

    function init(ttsUrl) {

      // TODO: The "URL" constructor does not exist in any version of IE.
      //       Is this expected to work there?
      var text = getQueryVariable(new URL(ttsUrl), 't');

      ttsRequested.data = DEFAULT_STATE;
      ttsRequested.data.audio_format = getTTSAudioFormat(ttsUrl);
      ttsRequested.data.char_count   = decodeURIComponent(text.replace(/\+/g,  " ")).length;
      ttsRequested.data.request_time = 1;
    }

    function update(data) {
      metricsUtil.update(ttsRequested, data);
    }

    function send() {
      metricsUtil.send(ttsRequested);
    }

    function reset() {
        ttsRequested.update(DEFAULT_STATE);
    }

    function getTTSAudioFormat(ttsUrl) {
      var ttsQueryURL = ttsUrl.split('/')[8];
      var ttsFileName = ttsQueryURL.split('?')[0];
      return ttsFileName.split('.')[1];
    }

    function getQueryVariable(url, variable) {

      var query = url.search.substring(1),
          vars = query.split("&"),
          i, pair;

      for (i = 0; i < vars.length; i++) {
        pair = vars[i].split("=");
        if (pair[0] == variable) {
          return pair[1];
        }
      }

      return(false);
    }

    // ============= Events Handlers ======================
    // Create an instance on audio speech-play event.
    sitecues.on('audio/speech-play', function (ttsUrl) {
      if (!ttsRequested.data) {
        ttsRequested.init(ttsUrl);
      }
      sitecues.emit('metrics/tts-requested/create');
    });

    sitecues.on('metrics/update', function (metrics) {
      if (ttsRequested.data) {
        ttsRequested.update(metrics.data);
      }
    });

    // Update requested time
    sitecues.on('audio/playing', function (metrics) {
      if (ttsRequested.data) {
        ttsRequested.update(metrics.data);

        // Send the metric data and clear an instance data on hlb opened(ready) event.
        ttsRequested.send();
        ttsRequested.reset();
      }
    });

    // ============= The API ======================
    ttsRequested.init = init;
    ttsRequested.update = update;
    ttsRequested.send = send;
    ttsRequested.reset = reset;

    // Done.
    callback();
  });
});
