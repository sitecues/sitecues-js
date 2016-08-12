// Functionality for resetting Sitecues or turning it off

define(['page/zoom/zoom', 'core/conf/user/manager'],
  function(zoomMod, conf) {

    function resetZoom() {
      zoomMod.resetZoom();
    }

    function resetAudio() {
      require(['audio/audio'], function (audio) {
        audio.init();
        audio.setSpeechState(false, true);
        audio.stopAudio();
      });
    }

    function resetMinorSettings() {
      conf.reset();
    }

    function resetAll() {
      resetZoom();
      resetAudio();
      resetMinorSettings();
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
