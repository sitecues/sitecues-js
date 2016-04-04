define(['page/zoom/zoom', 'page/highlight/move-keys', 'core/conf/user/manager'],
  function(zoomMod, moveKeys, conf) {
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
    speakHighlight: function(doAllowRepeat, doClearRememberedHighlight) {
      require(['audio/text-select', 'page/highlight/highlight', 'audio/audio'], function(textSelect, mh, audio) {
        // Speech enabled?
        if (!audio.isSpeechEnabled()) {
          return;
        }

        // If already playing something, the speak command stops current speech
        if (audio.isBusy()) {
          audio.stopAudio();
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
    toggleSpeech:  function() {
      require(['audio/audio'], function(audio) {
        audio.init();
        audio.toggleSpeech();
      });
    },
    notImplemented: function() {}
  };
});
