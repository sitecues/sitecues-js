/**
 * This is the audio player we use for Safari, because Safari's implementation of the audio API
 * does two separate fetches for the content (for performance reasons, it tries to fetch
 * the beginning of the audio first, then the rest of it).
 */
sitecues.def('audio/safari-player', function (player, callback) {

  'use strict';

  // Best practice is to use a single audio context per window.
  var context,
    volumeNode,
    soundSource,
    isCancelled,
    allRequests = [];

  player.init = function() {
    // Create a reusable audio context object
    context = new webkitAudioContext();

    // Connect a volume node to the output
    volumeNode = context.createGain();
    volumeNode.gain.value = 1;
    volumeNode.connect(context.destination);
  };

  /**
   * Play the audio src at the given url
   * @param url source of audio to play
   */
  player.playAudioSrc = function(baseMediaUrl) {
    isCancelled = false;

    // Create a reusable request object
    var request = new XMLHttpRequest();
    request.open('GET', baseMediaUrl, true);
    request.responseType = 'arraybuffer';
    // Our asynchronous callback
    request.onload = function () {
      if (isCancelled) {
        return;
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
  };

  player.isBusy = function() {
    return allRequests.length > 0;
  };

  /**
   * Stop any currently playing audio and abort the request
   */
  player.stop = function () {
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
  };

  callback();
});