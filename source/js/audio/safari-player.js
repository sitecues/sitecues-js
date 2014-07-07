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
    request;

  player.init = function() {
    // Create a reusable audio context object
    context = new webkitAudioContext();

    // Connect a volume node to the output
    volumeNode = context.createGain();
    volumeNode.gain.value = 1;
    volumeNode.connect(context.destination);

    // Create a reusable request object
    request = new XMLHttpRequest();
  };

  /**
   * Play the audio src at the given url
   * @param url source of audio to play
   */
  player.playAudioSrc = function(baseMediaUrl) {
    player.stop();

    // Create a buffer containing the binary data that the Web Audio API uses
    soundSource = context.createBufferSource();
    // Connect the source to the node that controls volume
    soundSource.connect(volumeNode);

    request.open('GET', baseMediaUrl, true);
    request.responseType = 'arraybuffer';
    // Our asynchronous callback
    request.onload = function () {
      // Asynchronously decodes the audio file data contained in the ArrayBuffer.
      context.decodeAudioData(request.response, function (buffer) {
        soundSource.buffer = buffer;
        soundSource.noteOn(0);
      });
    };

    request.send();
  };

  /**
   * Stop any currently playing audio and abort the request
   */
  player.stop = function () {
    request.abort();
    if (soundSource) {
      soundSource.noteOff(context.currentTime);
    }
  };

  callback();
});