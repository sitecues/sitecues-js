define(['zoom/zoom', 'audio/audio'], function(zoomMod, audio) {
  return function() {
    zoomMod.resetZoom();
    audio.stopAudio();
    audio.playEarcon('quit-organ');
  };
});
