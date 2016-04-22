/**
 * This is the audio player we use for remote speech and anything
 * that is not speech.
 */
define(['$', 'core/conf/urls', 'core/conf/site', 'Promise' ], function ($, urls, site, Promise) {

  var audioElements = [],
    ERR_NO_NETWORK_TTS = 'Sitecues network speech is not available on this website.';

  /**
   * Retrieve and play audio from a URL.
   * @param option, settings such as source of audio to play
   */
  function play(option) {
    var
      url = option.url,
      onStart = option.onStart,
      audioElement = new Audio();

    audioElements.push(audioElement);

    return new Promise(function(resolve, reject) {
      getNetworkSpeechConfig(function (speechConfig, error) {
        if (speechConfig.ttsAvailable) {
          beginRequest(resolve, reject);
        }
        else {
          // Fetched site config disallowed network speech
          // This is a network setting as opposed to a client strategy
          releaseAudioElement(audioElement);
          reject(new Error(error || ERR_NO_NETWORK_TTS));
        }
      });
    });

    function beginRequest(resolve, reject) {
      if (onStart) {
        $(audioElement).one('playing', onStart);
      }

      // TODO: Can we remove this? Test across browsers.
      audioElement.src = ''; // Clean up

      $(audioElement).one('canplay', onCanPlay);
      $(audioElement).one('error', function(event) {
        onEnded(event);
        reject(event);
      });
      $(audioElement).one('ended', function(event) {
        onEnded(event);
        resolve();
      });
      $(audioElement).one('pause', function(event) {
        onEnded(event);
        resolve();
      });
      audioElement.src = url;
    }

    function onCanPlay(event) {
      var audioElement = event.target;
      audioElement.play();
    }

    function releaseAudioElement() {
      audioElements.splice(audioElements.indexOf(audioElement), 1);
    }

    function onEnded(event) {
      var audioElement = event.target;
      removeListeners(audioElement);
      releaseAudioElement(audioElement);
    }
  }

  // Busy when 1) pending network request, or 2) currently playing audio
  function isBusy() {
    return audioElements.length > 0;
  }

  function removeListeners(audioElement) {
    var $audioElement = $(audioElement);
    $audioElement.off('canplay'); // Don't fire notification to play if we haven't played yet
    $audioElement.off('error');
    $audioElement.off('ended');
    $audioElement.off('pause');
  }

  /**
   * Stop any currently playing audio and abort the request
   */
  function stop() {
    audioElements.forEach(function(audioElement) {
      // We can only pause in IE9 if there is enough data
      // for the current and at least the next frame
      if (audioElement.readyState >= audioElement.HAVE_FUTURE_DATA) {
        audioElement.pause();
      }
    });
  }

  function getNetworkSpeechConfig(callbackFn) {
    if (getNetworkSpeechConfig.cached) {
      // Already retrieved
      callbackFn(getNetworkSpeechConfig.cached);
      return;
    }

    if (getNetworkSpeechConfig.isRetrieving) {
      // Currently retrieving -- this is a weird case -- as if network speech was requested again before the config was fetched
      callbackFn({});
      return;
    }

    getNetworkSpeechConfig.isRetrieving = true;

    fetchNetworkSpeechConfig(function(speechConfig, error) {
      getNetworkSpeechConfig.isRetrieving = false;
      getNetworkSpeechConfig.cached = speechConfig;
      callbackFn(speechConfig, error);
    });
  }

  function fetchNetworkSpeechConfig(callbackFn) {
    require(['core/util/xhr'], function(xhr) {
      console.log('Fetching speech config');
      xhr.getJSON({
        // The 'provided.siteId' parameter must exist, or else core would have aborted the loading of modules.
        url: urls.getApiUrl('2/site/' + site.getSiteId() + '/config'),
        success: function (data) {
          console.log('Speech config');
          console.log(data);
          var origSettings = data.settings,
            currentSetting,
            i = 0;
          // Map the incoming format
          // From:
          //   [ { key: foo, value: bar}, { key: foo2, value: bar2} ... ] to
          // To:
          //   { key: bar, key2: bar2 }

          // Copy the fetched key/value pairs into the speechConfig
          var speechConfig = {};
          for (; i < origSettings.length; i++) {
            currentSetting = origSettings[i];
            speechConfig[currentSetting.key] = currentSetting.value;
          }
          callbackFn(speechConfig);
        },
        error: function(error) {
          console.log(error);
          callbackFn({}, error);
        }
      });
    });
  }

  return {
    play   : play,
    stop   : stop,
    isBusy : isBusy
  };
});

