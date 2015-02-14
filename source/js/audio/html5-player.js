/**
 * This is the audio player we use for all modern browsers (even IE!)
 */
sitecues.def('audio/html5-player', function (player, callback) {

  'use strict';

  var audioElements = [];

  player.init = function() { };

  /**
   * Play the audio src at the given url
   * @param url source of audio to play
   */
  player.playAudioSrc = function(url) {
    var audioElement = new Audio();
    audioElement.src = ''; // Clean up
    sitecues.$(audioElement).one('canplay', playIt);
    audioElement.src = url;

    audioElements.push(audioElement);
  };

  function playIt(event) {
    var audioElement = event.target;
    audioElement.play();

    // sitecues.$(event.target).off('canplay'); // TODO why would we need this when we use .one() which should clean itself up
  }

  /**
   * Stop any currently playing audio and abort the request
   */
  player.stop = function () {
    audioElements.forEach(function(audioElement) {
      sitecues.$(audioElement).off('canplay'); // Don't fire notification to play if we haven't played yet
      // We can only pause in IE9 if there is enough data to play
      if (audioElement.readyState === 4) {
        audioElement.pause();
      }
    });
    audioElements = [];
  };

  callback();
});

