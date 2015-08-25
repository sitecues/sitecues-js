define([], function() {
  return function(event) {
    require(['conf/user/manager', 'command/reset-zoom', 'audio/audio'], function (conf, resetZoom, audio) {
      resetZoom();
      audio.setSpeechState(false, true);
      if (event.shiftKey) {
        conf.data({});
      }
    });
  };
});
