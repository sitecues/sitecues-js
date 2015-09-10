define([], function() {
  return {
    decreaseZoom: function(event) {
      require(['zoom/zoom'], function (zoomMod) {
        zoomMod.init(true);
        zoomMod.beginZoomDecrease(event);
      });
    },
    increaseZoom: function(event) {
      require(['zoom/zoom'], function (zoomMod) {
        zoomMod.init(true);
        zoomMod.beginZoomIncrease(event);
      });
    },
    queueKey: function(event, keyName) {
      require(['mouse-highlight/move-keys'], function(moveKeys) {
        moveKeys.init();
        moveKeys.queueKey(event, keyName);
      });
    },
    resetSitecues: function(event) {
      require(['core/conf/user/manager', 'core/conf/user/server', 'zoom/zoom', 'audio/audio'], function (conf, server, zoomMod, audio) {
        // 0 by itself -> reset zoom
        // Shift+0 -> Also reset speech
        // Alt+Shift+0 -> Full reset for all of sitecues, including themes, cursors, cues ... everything
        // Turn off zoom
        zoomMod.resetZoom();
        if (event.shiftKey) {
          if (event.altKey) {
            // Turn off speech
            audio.setSpeechState(false, true);
            audio.stopAudio();

            server.reset();
            audio.playEarcon('quit-organ');
          }
        }
      });
    },
    speakHighlight: function() {
      require(['audio/audio', 'mouse-highlight/mouse-highlight'], function(audio, mh) {
        audio.init();
        var highlight = mh.getHighlight();
        if (highlight) {
          audio.speakContent(highlight.picked, true);
        }
      });
    },
    toggleSpeech:  function() {
      require(['audio/audio'], function(audio) {
        audio.init();
        audio.toggleSpeech();
      });
    }
  };
});
