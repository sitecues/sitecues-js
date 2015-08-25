define([], function() {
  return function() {
    require(['zoom/zoom', 'audio/audio'], function(zoomMod, audio) {
      zoomMod.resetZoom();
      audio.stopAudio();
      audio.playEarcon('quit-organ');
    });
  };
});
