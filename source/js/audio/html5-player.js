/**
 * This is the audio player we use for all modern browsers (even IE!)
 */
sitecues.def('audio/html5-player', function (player, callback) {

  'use strict';

  var audioElement;
  player.init = function() {
    audioElement = new Audio();
  };

  /**
   * Play the audio src at the given url
   * @param url source of audio to play
   */
  player.playAudioSrc = function(url) {
    player.stop();
    sitecues.$(audioElement).one('canplay', playIt);
    audioElement.src = url;
  };

  function playIt() {
    audioElement.play();
    sitecues.$(audioElement).off('canplay');
  }

  /**
   * Stop any currently playing audio and abort the request
   */
  player.stop = function () {
    sitecues.$(audioElement).off('canplay'); // Don't fire notification to play if we haven't played yet
    audioElement.pause();
    audioElement.src = ''; // Clean up
  };

  callback();
});

