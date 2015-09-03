define([], function() {
  return {
    'decrease-zoom': function(event) {
      require(['zoom/zoom'], function (zoomMod) {
        zoomMod.init(true);
        zoomMod.beginZoomDecrease(event);
      });
    },
    'increase-zoom': function(event) {
      require(['zoom/zoom'], function (zoomMod) {
        zoomMod.init(true);
        zoomMod.beginZoomIncrease(event);
      });
    },
    'queue-key': function(event, keyName) {
      require(['mouse-highlight/move-keys'], function(moveKeys) {
        moveKeys.init();
        moveKeys.queueKey(event, keyName);
      });
    },
    'reset-sitecues': function(event) {
      require(['conf/user/manager', 'zoom/zoom', 'audio/audio'], function (conf, zoomMod, audio) {
        // 0 by itself -> reset zoom
        // Shift+0 -> Also reset speech
        // Alt+Shift+0 -> Full reset for all of sitecues, including themes, cursors, cues ... everything
        // Turn off zoom
        zoomMod.resetZoom();
        if (event.shiftKey) {
          // Turn off speech
          audio.setSpeechState(false, true);
          audio.stopAudio();
          if (event.altKey) {
            // Full reset
            // For each key in the settings data
            var data = conf.data();
            Object.keys(data).forEach(function(keyName) {
              conf.set(keyName, null);
            });
            audio.playEarcon('quit-organ');
          }
        }
      });
    },
    'speak-highlight': function() {
      require(['audio/audio', 'mouse-highlight/mouse-highlight'], function(audio, mh) {
        audio.init();
        var highlight = mh.getHighlight();
        if (highlight) {
          audio.playHighlight(highlight.picked, true);
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