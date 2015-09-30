/**
 * This is the audio player we use for Safari, because Safari's implementation of the audio API
 * does two separate fetches for the content (for performance reasons, it tries to fetch
 * the beginning of the audio first, then the rest of it).
 */
define([], function () {

  // Best practice is to use a single audio context per window.
  var context,
    volumeNode,
    soundSource,
    isCancelled,
    allRequests = [];

  function init() {
    // Create a reusable audio context object
    context = new webkitAudioContext();

    // Connect a volume node to the output
    volumeNode = context.createGain();
    volumeNode.gain.value = 1;
    volumeNode.connect(context.destination);
  }

  /**
   * Play the audio src at the given url
   * @param url source of audio to play
   */
  function playAudioSrc(baseMediaUrl, onCompleteFn) {
    isCancelled = false;

    // Create a reusable request object
    var request = new XMLHttpRequest();
    request.open('GET', baseMediaUrl, true);
    request.responseType = 'arraybuffer';
    // Our asynchronous callback
    request.onload = function() {
      if (isCancelled) {
        return;
      }

      if (onCompleteFn) {
        onCompleteFn();
      }

      // Asynchronously decodes the audio file data contained in the ArrayBuffer.
      context.decodeAudioData(request.response, function (buffer) {
        if (isCancelled) {
          return;
        }
        // Create a buffer containing the binary data that the Web Audio API uses
        soundSource = context.createBufferSource();
        // Connect the source to the node that controls volume
        soundSource.connect(volumeNode);
        soundSource.buffer = buffer;
        soundSource.noteOn(0);

        allRequests.splice(allRequests.indexOf(request), 1);
      });
    };

    request.send();
    allRequests.push(request);
  }

  function isBusy() {
    return allRequests.length > 0;
  }

  /**
   * Stop any currently playing audio and abort the request
   */
  function stop() {
    if (isCancelled) {
      return;  // Make sure we don't try to stop twice
    }
    isCancelled = true; // Make sure we don't play after stopped
    allRequests.forEach(function(request) {
      request.abort();
    });
    allRequests = [];
    if (soundSource) {  // Sanity check
      soundSource.noteOff(context.currentTime);
      soundSource = null;
    }
  }

  return {
    init: init,
    playAudioSrc: playAudioSrc,
    isBusy: isBusy,
    stop: stop
  };
});
