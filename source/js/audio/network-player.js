/**
 * This is the audio player we use for remote speech and anything
 * that is not speech.
 */
define(['$'], function ($) {

  var audioElements = [];

  /**
   * Retrieve and play audio from a URL.
   * @param option, settings such as source of audio to play
   */
  function play(option) {
    var
      url = option.url,
      onStart = option.onStart,
      audioElement = new Audio();

    if (onStart) {
      $(audioElement).one('playing', onStart);
    }

    // TODO: Can we remove this? Test across browsers.
    audioElement.src = ''; // Clean up

    $(audioElement).one('canplay', onCanPlay);
    audioElement.src = url;
    audioElements.push(audioElement);
  }

  function onCanPlay(event) {
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
    play   : play,
    stop   : stop,
    isBusy : isBusy
  };
});

