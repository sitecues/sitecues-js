define([], function() {
  return function() {
    require(['audio/audio', 'mouse-highlight/mouse-highlight'], function(audio, mh) {
      audio.speakHighlight(mh.getHighlight().picked, true);
    });
  };
});
