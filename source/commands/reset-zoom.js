define(['zoom/zoom', 'audio/audio'], function(zoomMod, audio) {
  'use strict';

  return function() {
    zoomMod.resetZoom();
    audio.stopAudio();
    audio.playEarcon('quit-organ');
  };
});
