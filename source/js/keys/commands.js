define(['zoom/zoom', 'mouse-highlight/move-keys', 'core/conf/user/manager', 'core/conf/user/server', 'audio/audio', 'mouse-highlight/mouse-highlight'],
  function(zoomMod, moveKeys, conf, server, audio, mh) {
  return {
    decreaseZoom: function(event) {
      zoomMod.init(true);
      zoomMod.beginZoomDecrease(event);
    },
    increaseZoom: function(event) {
      zoomMod.init(true);
      zoomMod.beginZoomIncrease(event);
    },
    queueKey: function(event, keyName) {
      moveKeys.init();
      moveKeys.queueKey(event, keyName);
    },
    resetSitecues: function(event) {
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
    },
    speakHighlight: function() {
      audio.init();
      var highlight = mh.getHighlight();
      if (highlight) {
        audio.speakContent(highlight.picked, true);
      }
    },
    toggleSpeech:  function() {
      audio.init();
      audio.toggleSpeech();
    }
  };
});
