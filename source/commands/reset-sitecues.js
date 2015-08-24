define(['conf/user/manager', 'command/reset-zoom', 'audio/audio'], function(conf, resetZoom, audio) {
  return function(event) {
    resetZoom();
    audio.setSpeechState(false, true);
    if (event.shiftKey) {
      conf.data({});
    }
  };
});
