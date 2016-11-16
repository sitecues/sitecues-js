// Functionality for resetting Sitecues or turning it off

define(
  [
    'page/zoom/zoom',
    'run/conf/preferences'
  ],
  function (
    zoomMod,
    pref
  ) {
  'use strict';

    function resetZoom() {
      zoomMod.resetZoom();
    }

    function resetAudio(callback) {
      require(['audio/audio'], function (audio) {
        audio.init();
        audio.setSpeechState(false, true);
        audio.stopAudio();
        if (callback) {
          callback();
        }
      });
    }

    function resetMinorSettings() {
      // Don't reset zoom or TTS on as those were done first
      // Don't reset isTester as that must remain as it was
      var BLACKLIST = new Set([ 'isTester', 'zoom', 'ttsOn' ]);
      pref.reset(BLACKLIST);
    }

    function resetAll() {
      resetZoom();
      resetAudio(resetMinorSettings);
    }

    function init() {
      // Redefine (previously exported as noop function when Sitecues was off)
      sitecues.reset = resetAll;
    }

    return {
      resetZoom: resetZoom,
      resetAudio: resetAudio,
      resetMinorSettings: resetMinorSettings,
      resetAll: resetAll,
      init: init
    };
  });
