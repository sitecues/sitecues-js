/**
 * This is the audio player we use for all modern browsers (even IE!)
 */
// Represents the ready state of the audio/video element:
// 0 = HAVE_NOTHING      - no information whether or not the audio/video is ready
// 1 = HAVE_METADATA     - metadata for the audio/video is ready
// 2 = HAVE_CURRENT_DATA - data for the current playback position is available, but not enough data to play next frame/millisecond
// 3 = HAVE_FUTURE_DATA  - data for the current and at least the next frame is available
// 4 = HAVE_ENOUGH_DATA  - enough data available to start playing
define(['$'], function ($) {

  var audioElements    = [],
      HAVE_FUTURE_DATA = 3;

  function init() { }

  /**
   * Play the audio src at the given url
   * @param url source of audio to play
   */
  function playAudioSrc(url, onCompleteFn) {
    var audioElement = new Audio();

    if (onCompleteFn) {
      audioElement.addEventListener('playing', onCompleteFn);
    }

    audioElement.src = ''; // Clean up
    $(audioElement).one('canplay', playIt);
    audioElement.src = url;
    audioElements.push(audioElement);
  }

  function playIt(event) {
    var audioElement = event.target;
    $(audioElement).one('ended', onEnded);
    audioElement.play();
  }

  function onEnded(event) {
    var audioElement = event.target;
    audioElements.splice(audioElements.indexOf(audioElement), 1);
  }

  function isBusy() {
    return audioElements.length > 0;
  }

  /**
   * Stop any currently playing audio and abort the request
   */
  function stop() {
    audioElements.forEach(function(audioElement) {
      $(audioElement).off('canplay'); // Don't fire notification to play if we haven't played yet
      $(audioElement).off('ended');
      // We can only pause in IE9 if there is enough data
      // for the current and at least the next frame
      if (audioElement.readyState >= HAVE_FUTURE_DATA) {
        audioElement.pause();
      }
    });
    audioElements = [];
  }

  return {
    init: init,
    playAudioSrc: playAudioSrc,
    isBusy: isBusy,
    stop: stop
  };
});

