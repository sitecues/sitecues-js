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
      pref.reset();
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
