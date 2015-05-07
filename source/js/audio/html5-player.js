/**
 * This is the audio player we use for all modern browsers (even IE!)
 */
// Represents the ready state of the audio/video element:
// 0 = HAVE_NOTHING      - no information whether or not the audio/video is ready
// 1 = HAVE_METADATA     - metadata for the audio/video is ready
// 2 = HAVE_CURRENT_DATA - data for the current playback position is available, but not enough data to play next frame/millisecond
// 3 = HAVE_FUTURE_DATA  - data for the current and at least the next frame is available
// 4 = HAVE_ENOUGH_DATA  - enough data available to start playing
sitecues.def('audio/html5-player', function (player, callback) {

  'use strict';

  var audioElements    = [],
      HAVE_FUTURE_DATA = 3;

  player.init = function() { };

  /**
   * Play the audio src at the given url
   * @param url source of audio to play
   */
  player.playAudioSrc = function(url) {
    var t = 0;
    var audioElement = new Audio();

    // Metrics Start
    sitecues.$(audioElement)[0].addEventListener('playing', function() {
      sitecues.emit('audio/playing', new Date - t);
    });

    sitecues.$(audioElement)[0].addEventListener('loadstart', function() {
      t = new Date();
    });

    // Metrics End
    audioElement.src = ''; // Clean up
    sitecues.$(audioElement).one('canplay', playIt);
    audioElement.src = url;
    audioElements.push(audioElement);
  };

  function playIt(event) {
    var audioElement = event.target;
    sitecues.$(audioElement).one('ended', onEnded);
    audioElement.play();
  }

  function onEnded(event) {
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
    audioElements.forEach(function(audioElement) {
      sitecues.$(audioElement).off('canplaythrough'); // Don't fire notification to play if we haven't played yet
      sitecues.$(audioElement).off('ended');
      // We can only pause in IE9 if there is enough data
      // for the current and at least the next frame
      if (audioElement.readyState >= HAVE_FUTURE_DATA) {
        audioElement.pause();
      }
    });
    audioElements = [];
  };

  callback();
});

