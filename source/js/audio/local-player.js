define(
  [
    'Promise',
  ],
  function (Promise) {

    // This module is responsible for creating audio snippets of synthetic speech,
    // natively in the browser, completely offline.

    'use strict';

    var
      exports,
      speechSynthesis = window.speechSynthesis,
      SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
    function getVoices() {

      var
        voices,
        errMessage = {
          NO_VOICES : 'The system has no voices to speak with.',
          TIMEOUT   : 'Timed out getting voices. The system may not have any.'
        };

      // Promise handler for when loading voices is asynchronous.
      function waitForVoices(resolve, reject) {
        // At least one voice has loaded asynchronously.
        // We don't know if/when any more will come in,
        // so it is best to consider the job done here.
        function onVoicesChanged(event) {
          // Give the available voices as the result.
          resolve(speechSynthesis.getVoices());
          // Remove thyself.
          event.currentTarget.removeEventListener(event.type, onVoicesChanged, true);
        }

        // Handle timeouts so we don't wait forever in any case where
        // the voiceschanged event never fires.
        function onTimeout() {
          reject(new Error(
            errMessage.TIMEOUT
          ));
        }

        speechSynthesis.addEventListener('voiceschanged', onVoicesChanged, true);

        setTimeout(
          onTimeout,  // Code to run when we are fed up with waiting.
          3000        // The browser has this long to load voices.
        );
      }

      // Tickle the browser with a feather to get it to actually load voices.
      // In some environments this happens synchronously and we can use the
      // result right away. In others, it returns an empty array and we will
      // take care of that during the voiceschanged event.
      voices = speechSynthesis.getVoices();

      // If the browser has voices available right now, return those.
      // Safari gets voices synchronously, so will be true there.
      if (voices.length > 0) {
        return Promise.resolve(voices);
      }

      // If the current browser gives us an empty voice list, it may just
      // mean that an asynchronous load of voices is not yet complete.
      // As recently as Chrome 44, this happens in a very annoying way:
      // You must call speechSynthesis.getVoices() to trigger the loading
      // of voices, but it returns a useless empty array synchronously,
      // with no option for a callback or promise value. We must then
      // listen to the 'voiceschanged' event to determine when at least
      // one voice is ready. Who knows when they all are! Grrr.
      else if (typeof speechSynthesis.addEventListener === 'function') {
        return new Promise(waitForVoices);
      }

      // In theory, a platform could support the synthesis API but not
      // have any voices available, or all existing voices could
      // suddenly be uninstalled. No such situation has been
      // encountered, but we try to take care of that here.
      return Promise.reject(new Error(
        errMessage.NO_VOICES
      ));
    }

    function getBestVoice(options) {

      // At the moment, we assume the first voice in the list is the best
      // if we cannot find our favorite Google or OS X voices.

      // In the future, the intention is to compute the best voice based
      // on more data, such as the current document language, etc.

      var
        voices = options.voices,
        lang   = options.lang,
        filteredVoices,
        voice;

      // If no specific language is desired, it is best to
      // let the browser decide intelligently, on its own.
      if (!lang) {
        return null;
      }

      filteredVoices = voices.filter(function (voice) {
        return voice.lang.indexOf(lang) === 0;
      });

      if (filteredVoices.length < 1) {
        return null;
      }

      voice = filteredVoices[0];

      return voice;
    }

    function stop() {
      // It is safe to call cancel() regardless of whether speech is
      // currently playing. Checking beforehand would be wasteful.
      speechSynthesis.cancel();
    }

    // Turn text into speech.
    function speak(options) {

      var
        text   = options.text,
        lang   = options.lang,
        voice  = options.voice,
        polite = options.polite,
        prom   = Promise.resolve();

      // TODO: Replace this poor excuse for a speech dictionary.
      text = options.text.replace(/sitecues/gi, 'sightcues').trim();

      if (!text) {
        return prom;
      }

      if (!voice) {
        prom = getVoices()
          .then(function (voices) {
            return getBestVoice({
              voices : voices,
              lang   : lang
            });
          })
          .then(function (bestVoice) {
            voice = bestVoice;
          });
      }

      // By default, the Web Speech API queues up synthesis requests.
      // But this is typically not what is desired by sitecues.
      if (!polite) {
        // Immediately discontinue any currently playing speech.
        stop();
      }

      prom = prom.then(function () {

        var speech = new SpeechSynthesisUtterance(text);
        console.log('Using voice:', voice && voice.name);
        speech.voice = voice;
        // Note: Some voices do not support altering these settings.
        speech.lang  = lang;
        // speech.voiceURI = 'native';
        // speech.volume = 1;  // float from 0 to 1, default is 1
        // speech.rate   = 1;  // float from 0 to 10, default is 1
        // speech.pitch  = 1;  // float from 0 to 2, default is 1

        // Event listeners...

        // speech.addEventListener('start', function onSpeechStart(event) {
        //     log.info('Began speech.');
        //     log.info(Object.getOwnPropertyNames(event));
        // });
        // speech.addEventListener('end', function onSpeechEnd(event) {
        //     log.info('Finished in ' + event.elapsedTime + ' seconds.');
        //     log.info(Object.getOwnPropertyNames(event));
        // });
        // speech.addEventListener('error', function onSpeechError(event) {
        //     log.info('Speech error.');
        //     log.info(Object.getOwnPropertyNames(event));
        // });
        // speech.addEventListener('pause', function onSpeechPause(event) {
        //     log.info('Speech was paused.');
        //     log.info(Object.getOwnPropertyNames(event));
        // });
        // speech.addEventListener('resume', function onSpeechResume(event) {
        //     log.info('Speech has resumed from a paused state.');
        //     log.info(Object.getOwnPropertyNames(event));
        // });
        // speech.addEventListener('boundary', function onSpeechBoundary(event) {
        //     log.info('Encountered a word or sentence boundary.');
        //     log.info(Object.getOwnPropertyNames(event));
        // });
        // speech.addEventListener('mark', function onSpeechMark(event) {
        //     log.info('Encountered an SSML mark tag.');
        //     log.info(Object.getOwnPropertyNames(event));
        // });

        speechSynthesis.speak(speech);
      });

      return prom;
    }

    // "Polite" mode means wait your turn and let others finish speaking.
    // It adds speech to the queue and does not play it immediately.
    function speakPolitely(options) {
      options = Object.create(options);
      options.polite = true;
      speak(options);
    }

    exports = {
      stop          : stop,
      speak         : speak,
      speakPolitely : speakPolitely
    };

    return exports;
  }
);
