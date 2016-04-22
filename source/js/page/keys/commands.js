define(['page/zoom/zoom', 'page/highlight/move-keys', 'core/conf/user/manager', 'page/highlight/highlight'],
  function(zoomMod, moveKeys, conf, mh) {
  return {
    decreaseZoom: function(event) {
      zoomMod.init();
      zoomMod.beginZoomDecrease(event);
    },
    increaseZoom: function(event) {
      zoomMod.init();
      zoomMod.beginZoomIncrease(event);
    },
    stopZoom: function() {
      zoomMod.zoomStopRequested();
    },
    queueKey: function(event, keyName) {
      moveKeys.init();
      moveKeys.queueKey(event, keyName);
    },
    resetSitecues: function(event) {
      // 0 by itself -> reset zoom
      // Alt+0 -> Also reset speech
      // Alt+Shift+0 -> Full reset for all of sitecues, including themes, cursors, cues ... everything
      // Turn off zoom
      zoomMod.resetZoom();
      if (event.altKey) {
        require(['audio/audio'], function(audio) {
          audio.init();

          // Turn off speech
          audio.setSpeechState(false, true);
          audio.stopAudio();

          if (event.shiftKey) {
            conf.reset();
            audio.playEarcon('quit-organ');
          }
        });
      }
    },
    speakHighlight: function () {
      var highlight = mh.getHighlight();
      if (highlight) {
        require(['audio/audio'], function (audio) {
          audio.init();
          audio.speakContent(highlight.picked);
        });
      }
    },
    stopAudio: function() {
      require(['audio/audio'], function (audio) {
        audio.init();
        audio.stopAudio();
      });
    },
    toggleSpeech:  function() {
      require(['audio/audio'], function(audio) {
        audio.init();
        audio.toggleSpeech();
      });
    },
    notImplemented: function() {}
  };
});
