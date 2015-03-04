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
    console.log('playIt');
    var audioElement = event.target;
    sitecues.$(audioElement).one('ended', onEnded);
    audioElement.play();
  }

  function onEnded(event) {
    console.log('ended');
    var audioElement = event.target;
    audioElements.splice(audioElements.indexOf(audioElement), 1);
  }

  player.isBusy = function() {
    return audioElements.length > 0;
  };

  /**
   * Stop any currently playing audio and abort the request
   */
  player.stop = function () {
    console.log('stop');
    audioElements.forEach(function(audioElement) {
      sitecues.$(audioElement).off('canplay'); // Don't fire notification to play if we haven't played yet
      sitecues.$(audioElement).off('ended');
      // We can only pause in IE9 if there is enough data to play
      if (audioElement.readyState === 4) {
        audioElement.pause();
      }
    });
    audioElements = [];
  };

  callback();
});

