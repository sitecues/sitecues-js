// This module is responsible for creating audio snippets of synthetic speech,
// natively in the browser, completely offline.
define(
  [
    'Promise',
    'core/native-functions'
  ],
  function (
    Promise,
    nativeFn
  ) {
  'use strict';

    var
      speechSynthesis = window.speechSynthesis,
      SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

    function getVoices() {

      var
        errMessage = {
          NO_VOICES : 'Sitecues cannot find voices to speak with.',
          TIMEOUT   : 'Timed out getting voices. The system may not have any.'
        };

      // Promise handler for when loading voices is asynchronous.
      function waitForVoices(resolve, reject) {
        speechSynthesis.addEventListener('voiceschanged', onVoicesChanged, true);

        // Don't wait forever for a voice.
        var voicesTimeout = nativeFn.setTimeout(onTimeout, 3000);

        // Handle timeouts so we don't wait forever in any case where
        // the voiceschanged event never fires.
        function onTimeout() {
          reject(new Error(errMessage.TIMEOUT));
        }

        // At least one voice has loaded asynchronously. We don't know if/when
        // any more will come in, so it is best to consider the job done here.
        function onVoicesChanged(event) {
          clearTimeout(voicesTimeout);
          // Give the available voices as the result.
          resolve(speechSynthesis.getVoices());
          // Remove thyself.
          event.currentTarget.removeEventListener(event.type, onVoicesChanged, true);
        }
      }

      // Tickle the browser with a feather to get it to actually load voices.
      // In some environments this happens synchronously and we can use the
      // result right away. In others, it returns an empty array and we will
      // take care of that during the voiceschanged event.
      var voices = speechSynthesis.getVoices();

      // If the browser has voices available right now, return those.
      // Safari gets voices synchronously, so will be true there.
      if (voices.length > 0) {
        return Promise.resolve(voices);
      }

      // If the browser gave us an empty voice list, it may mean that an async
      // load of voices is not yet complete. At least Chrome 44 does this in a
      // very annoying way: we must call speechSynthesis.getVoices() to begin
      // loading voices, but it returns a useless empty array synchronously,
      // with no option for a callback or promise. We must then listen to the
      // 'voiceschanged' event to determine when at least one voice is ready.
      // Who knows when they all are! Grrr. See errata 11 in the spec:
      // https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi-errata.html
      else if (typeof speechSynthesis.addEventListener === 'function') {
        return new Promise(waitForVoices);
      }

      // In theory, a platform could support the synthesis API but not have any
      // voices available. Or all the voices could suddenly be uninstalled.
      // We have not encountered that, but we try to take care of it here.
      throw new Error(errMessage.NO_VOICES);
    }

    // Based on a given set of voices and locale restrictions, get sitecues'
    // favorite voice. We want to sound the best.
    function getBestVoice(option) {

      var
        voices = option.voices,
        locale = option.locale,
        lang = locale.split('-')[0];

      var acceptableVoices = voices.filter(function (voice) {
          var voiceLocale = voice.lang;
          // Allow universal speech engines, which exist on Windows. These can
          // speak just about any language.
          if (!voiceLocale) {
            return true;
          }
          return voiceLocale === lang || voiceLocale.startsWith(lang + '-');
        }).filter(function (voice) {
          return SC_BROWSER_NETWORK_SPEECH || voice.localService;
        });

      if (acceptableVoices.length > 0) {
        return acceptableVoices.sort(compareVoices)[0];
      }

      throw new Error('No local voice available for ' + locale);

      function compareVoices(a, b) {

        var
          aLocale = a.lang,
          bLocale = b.lang;

        // Prefer voices with the perfect accent (or lack thereof).
        if (aLocale === locale && bLocale !== locale) {
          return -1;
        }
        if (bLocale === locale && aLocale !== locale) {
          return 1;
        }

        // Prefer to respect the user's default voices.
        if (a.default && !b.default) {
          return -1;
        }
        if (b.default && !a.default) {
          return 1;
        }

        // Prefer voices without an accent, to avoid mapping one accent to
        // another if at all possible.
        if (aLocale === lang && bLocale !== lang) {
          return -1;
        }
        if (bLocale === lang && aLocale !== lang) {
          return 1;
        }
      }
    }

    // Stop speech. This method is idempotent. It does not matter if we are
    // currently playing or not.
    function stop() {
      speechSynthesis.cancel();
    }

    // Turn text into speech.
    function speak(option) {

      var
        // TODO: Replace this poor excuse for a speech dictionary.
        text = option.text.replace(/sitecues/gi, 'sightcues').trim(),
        locale  = option.locale;

      var
        voice = option.voice,
        prom = Promise.resolve();

      if (!text) {
        return prom;
      }

      if (!voice) {
        prom = getVoices().then(function (voices) {
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
      if (!option.polite) {
        // Immediately discontinue any currently playing speech.
        stop();
      }

      // When and if we have a voice to use, finish setting up
      // and then play speech.
      prom = prom.then(function () {
        return new Promise(function (resolve, reject) {

          var speech = new SpeechSynthesisUtterance(text);

          speech.voice = voice;
          // Note: Some voices do not support altering these settings and will break silently!
          speech.lang = locale;
          // speech.voiceURI = 'native';
          // speech.volume = 1;  // float from 0 to 1, default is 1
          // speech.rate   = 1;  // float from 0 to 10, default is 1
          // speech.pitch  = 1;  // float from 0 to 2, default is 1

          // Event listeners...

          var onStart = option.onStart;

          if (onStart) {
            speech.addEventListener('start', onStart);
          }

          function removeListeners() {
            if (onStart) {
              speech.removeEventListener('start', onStart);
            }
            speech.removeEventListener('end', onSpeechEnd);
            speech.removeEventListener('error', onSpeechError);
          }

          function onSpeechEnd() {
            if (SC_DEV) {
              console.log('Finished in ' + event.elapsedTime + ' seconds.');
            }
            removeListeners();
            resolve();
          }

          function onSpeechError(event) {
            removeListeners();
            reject(event.error);
          }

          speech.addEventListener('end', onSpeechEnd);
          speech.addEventListener('error', onSpeechError);

          // Examples of other things we could do:
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

    // NOTE: This method will be fooled by another app besides sitecues speaking.
    //       Prefer to keep track of state based on the promise from speak().
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
