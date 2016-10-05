define([
  'page/zoom/zoom',
  'page/highlight/move-keys',
  'page/reset/reset'
  ],
  function(zoomMod,
           moveKeys,
           reset) {
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
      reset.resetZoom();
      if (event.altKey) {
        reset.resetAudio(function() {
          if (event.shiftKey) {
            reset.resetMinorSettings();
            require(['audio/audio'], function (audio) {
              audio.playEarcon('quit-organ');
            });
          }
        });
      }
    },
    speakHighlight: function(doAllowRepeat, doClearRememberedHighlight) {
      require(['audio/text-select', 'page/highlight/highlight', 'audio/audio'], function(textSelect, mh, audio) {
        // Speech enabled?
        if (!audio.isSpeechEnabled()) {
          return;
        }

        var textSelection = textSelect.getSelectedText(),
          highlight = mh.getHighlight();

        // Text selection takes precedence over mouse highlight
        if (textSelection) {
          audio.speakText(textSelection);
          return;
        }

        // Use mouse highlight
        if (highlight && (doAllowRepeat || highlight !== this.lastHighlight)) {
          this.lastHighlight = highlight;
          audio.init();
          audio.speakContent(highlight.picked);
        }
        if (doClearRememberedHighlight) {
          this.lastHighlight = null;
        }
      });
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
