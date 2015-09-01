define([], function() {
  return {
    'decrease-zoom': function() {
      require(['zoom/zoom'], function (zoomMod) {
        zoomMod.init();
        zoomMod.beginZoomDecrease();
      });
    },
    'increase-zoom': function() {
      require(['zoom/zoom'], function (zoomMod) {
        zoomMod.init();
        zoomMod.beginZoomIncrease();
      });
    },
    'queue-key': function() {
      require(['mouse-highlight/move-keys'], function(moveKeys) {
        moveKeys.init();
        moveKeys.queueKey();
      });
    },
    'reset-sitecues': function(event) {
      require(['conf/user/manager', 'command/reset-zoom', 'audio/audio'], function (conf, resetZoom, audio) {
        resetZoom();
        audio.setSpeechState(false, true);
        if (event.shiftKey) {
          conf.data({});
        }
      });
    },
    'reset-zoom': function() {
      require(['zoom/zoom', 'audio/audio'], function(zoomMod, audio) {
        zoomMod.resetZoom();
        audio.stopAudio();
        audio.playEarcon('quit-organ');
      });
    },
    'speak-highlight': function() {
      require(['audio/audio', 'mouse-highlight/mouse-highlight'], function(audio, mh) {
        audio.init();
        var highlight = mh.getHighlight();
        if (highlight) {
          audio.speakHighlight(highlight.picked, true);
        }
      });
    },
    'toggle-speech':  function() {
      require(['audio/audio'], function(audio) {
        audio.init();
        audio.toggleSpeech();
      });
    }
  };
});
