define(
  [
    'Promise',
  ],
  function (Promise) {

    // This module is responsible for creating audio snippets of synthetic speech,
    // natively in the browser, completely offline.

    'use strict';

    var
      speechSynthesis = window.speechSynthesis,
      SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

    function getVoices() {

      var
        voices,
        errMessage = {
          NO_VOICES : 'Sitecues cannot find voices to speak with.',
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

    // Based on a given set of voice and language restrictions,
    // get sitecues' favorite voice.
    function getBestVoice(option) {

      var
        voices = option.voices,
        locale = option.locale,
        localeHasAccent = locale && locale.indexOf('-'),
        lang,
        localeVoices,
        langVoices,
        filteredVoices,
        bestVoice;

      localeVoices = voices.filter(function (voice) {
        return voice.lang.indexOf(locale) === 0 && (SC_BROWSER_NETWORK_SPEECH || voice.localService);
      });

      // If the incoming locale has an accent but we couldn't find any
      // voices for it, we might still be able to find a voice for the
      // correct language.
      if (localeHasAccent && localeVoices.length < 1) {
        lang = locale.split('-')[0];
        langVoices = voices.filter(function (voice) {
          return voice.lang.indexOf(lang) === 0 && (SC_BROWSER_NETWORK_SPEECH || voice.localService);
        });
        filteredVoices = langVoices;
      }
      else {
        filteredVoices = localeVoices;
      }

      if (filteredVoices.length < 1) {
        throw new Error('No local voice available for ' + (lang || locale));
      }

      // Voices come in ordered from most preferred to least, so using the
      // first voice chooses the user's favorite.
      bestVoice = filteredVoices[0];

      return bestVoice;
    }

    function stop() {
      // It is safe to call cancel() regardless of whether speech is
      // currently playing. Checking beforehand would be wasteful.
      speechSynthesis.cancel();
    }

    // Turn text into speech.
    function speak(option) {

      var
        text    = option.text,
        locale  = option.locale,
        voice   = option.voice,
        polite  = option.polite,
        onStart = option.onStart,
        prom    = Promise.resolve();

      // TODO: Replace this poor excuse for a speech dictionary.
      text = option.text.replace(/sitecues/gi, 'sightcues').trim();

      if (!text) {
        return prom;
      }

      if (!voice) {
        prom = getVoices()
          .then(function (voices) {
            return getBestVoice({
              voices : voices,
              locale : locale
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

      // When and if we have a voice to use, finish setting up
      // and then play speech.
      prom = prom.then(function () {

        var speech = new SpeechSynthesisUtterance(text);
        if (SC_DEV) {
          console.log('Using voice:', voice);
        }
        speech.voice = voice;
        // Note: Some voices do not support altering these settings and will break silently!
        speech.lang  = locale;
        // speech.voiceURI = 'native';
        // speech.volume = 1;  // float from 0 to 1, default is 1
        // speech.rate   = 1;  // float from 0 to 10, default is 1
        // speech.pitch  = 1;  // float from 0 to 2, default is 1

        // Event listeners...

        if (onStart) {
          speech.addEventListener('start', onStart);
        }

        // Examples of other things we could do:

        // speech.addEventListener('end', function onSpeechEnd(event) {
        //     console.log('Finished in ' + event.elapsedTime + ' seconds.');
        // });
        // speech.addEventListener('error', function onSpeechError(event) {
        //     console.log('Speech error.');
        // });
        // speech.addEventListener('pause', function onSpeechPause(event) {
        //     console.log('Speech was paused.');
        // });
        // speech.addEventListener('resume', function onSpeechResume(event) {
        //     console.log('Speech has resumed from a paused state.');
        // });
        // speech.addEventListener('boundary', function onSpeechBoundary(event) {
        //     console.log('Encountered a word or sentence boundary.');
        // });
        // speech.addEventListener('mark', function onSpeechMark(event) {
        //     console.log('Encountered an SSML mark tag.');
        // });

        speechSynthesis.speak(speech);
      });

      return prom;
    }

    // "Polite" mode means wait your turn and let others finish speaking.
    // It adds speech to the queue and does not play it immediately.
    function speakPolitely(option) {
      option = Object.create(option);
      option.polite = true;
      speak(option);
    }

    function isBusy() {
      return speechSynthesis.pending || speechSynthesis.speaking;
    }

    return {
      stop          : stop,
      speak         : speak,
      speakPolitely : speakPolitely,
      isBusy        : isBusy
    };
  }
);
