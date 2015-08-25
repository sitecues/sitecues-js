define([], function() {
  return function() {
    require(['audio/audio'], function(audio) {
      audio.toggleSpeech();
    });
  };
});
