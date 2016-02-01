/**
 * This is the audio player we use for remote speech and anything
 * that is not speech.
 */
define(['$'], function ($) {

  var audioElements    = [];

  /**
   * Play the audio src at the given url
   * @param url source of audio to play
   */
  function playAudioSrc(url, onPlaying) {
    var audioElement = new Audio();

    if (onPlaying) {
      audioElement.addEventListener('playing', onPlaying);
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
      if (audioElement.readyState >= audioElement.HAVE_FUTURE_DATA) {
        audioElement.pause();
      }
    });
    audioElements = [];
  }

  return {
    playAudioSrc: playAudioSrc,
    isBusy: isBusy,
    stop: stop
  };
});

