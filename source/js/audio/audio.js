/**
 * This is the main audio library.  It manages all of the events
 * and requests and should be the only speech component referenced
 * by other parts of the application.
 *
 * Specifically, it is responsible for:
 * - Playing speech when HLB opens, if speech is on. In this case it must request
 *   a media type supported both by the server (provided via site preferences)
 * - Stopping speech when a key is pressed or the Lens closes
 * - Playing audio by key when requested by another module
 */

define(
  [
    'audio/constant',
    'core/conf/user/manager',
    'core/conf/site',
    '$',
    'audio/speech-builder',
    'core/platform',
    'core/locale',
    'core/metric',
    'core/conf/urls',
    'audio/text-select',
    'core/events'
  ],
  function(constant, conf, site, $, builder, platform, locale, metric, urls, textSelect, events) {

  var ttsOn = false,
    lastPlayer,
    isInitialized,
    // TODO add more trigger types, e.g. shift+arrow, shift+space
    TRIGGER_TYPES = {
      LENS: 'space',
      HIGHLIGHT: 'shift'
    },
    speechStrategy = constant.speechStrategy;

  function onLensOpened(lensContent, fromHighlight) {
    if (ttsOn) {
      speakContentImpl(fromHighlight.picked, TRIGGER_TYPES.LENS);
    }
  }

  function isBusy() {
    return lastPlayer && lastPlayer.isBusy();
  }

  function speakContent(content, doAvoidInterruptions) {
    if (doAvoidInterruptions && isBusy()) {
      return; // Already reading the highlight
    }
    if (!content) {
      return; // Nothing to read
    }
    stopAudio();

    speakContentImpl(content, TRIGGER_TYPES.HIGHLIGHT);
  }

  function speakContentImpl($content, triggerType) {
    var text = builder.getText($content);
    if (text) {
      speakText(text, getElementAudioLang($content[0]), triggerType);
    }
  }

  function noop() {
  }

  // text and triggerType are optional
  // @lang is the full or partial language for the speech as we know it, e.g. en-US or en
  function speakText(text, lang, triggerType) {
    stopAudio();  // Stop any currently playing audio and halt keydown listener until we're playing again
    if (!text.trim()) {
      return; // Nothing to speak
    }

    var startRequestTime = Date.now();
    addStopAudioHandlers();

    function onSpeechPlaying(isLocal) {
      var timeElapsed = Date.now() - startRequestTime;
      new metric.TtsRequest({
        requestTime : timeElapsed,
        audioFormat : isLocal ? null : getMediaTypeForNetworkAudio(),
        charCount   : text.length,
        trigger     : triggerType,
        isLocalTTS  : isLocal
      }).send();
    }

    function speakLocally(onUnavailable) {
      var onUnavailableFn = onUnavailable || noop;
      if (isLocalSpeechAllowed()) {
        require(['local-player/local-player'], function (localPlayer) {
          lastPlayer = localPlayer;
          return localPlayer
            .speak({
              text: text,
              locale: lang,
              onStart: function () {
                onSpeechPlaying(true);
              }
            })
            .catch(onUnavailableFn);
        });
      }
      else {
        onUnavailableFn();
      }
    }

    function speakViaNetwork(onUnavailable) {
      var onUnavailableFn = onUnavailable || noop;
      if (isNetworkSpeechAllowed(lang)) {
        require(['network-player/network-player'], function (networkPlayer) {
          lastPlayer = networkPlayer;

          var TTSUrl = getTTSUrl(text, lang);

          networkPlayer
            .play({
              url: TTSUrl,
              onStart: function () {
                onSpeechPlaying(false);
              }
            })
            .catch(function() {
              rerouteNetworkSpeechLang(lang);
              onUnavailableFn();
            });
        });
      }
      else {
        onUnavailableFn();
      }
    }

    var speakViaNetworkFn = SC_LOCAL ? noop : speakViaNetwork; // Helps the minifier

    if (isLocalSpeechPreferred()) {
      speakLocally(speakViaNetworkFn);
    }
    else {
      speakViaNetworkFn(speakLocally);
    }
  }

  function addStopAudioHandlers() {
    // Stop speech on any key down.
    // Wait a moment, in case it was a keystroke that just got us here,
    // for example down arrow to read next Lens or a hotkey to toggle speech
    removeBlurHandler();
    $(window).one('blur', stopAudio);
  }

  // Remove handler that stops speech on any key down.
  function removeBlurHandler() {
    $(window).off('blur', stopAudio);
  }

  /*
   * Stops the player that is attached to a highlight box.
   * This is safe to call if the player has not been initialized
   * or is not playing.
   */
  function stopAudio() {
    if (isBusy()) {
      lastPlayer.stop();
      removeBlurHandler();
    }
  }

  // Get language that applies to element (optional param)
  // Fallback on document and then browser default language
  function getElementAudioLang(element) {
    while (element) {
      var lang = element.getAttribute('lang') || element.getAttribute('xml:lang');
      if (lang) {
        return locale.getAudioLang(lang);
      }
      element = element.parentElement;
    }

    return locale.getAudioLang();
  }

  function getDocumentAudioLang() {
    return getElementAudioLang(document.body);
  }

  // Puts in delimiters on both sides of the parameter -- ? before and & after
  // lang is an optional parameter. If it doesn't exist, the document language will be used.
  function getLanguageParameter(lang) {
    return '?l=' + (lang || getDocumentAudioLang()) + '&';
  }

  function getAudioKeyUrl(key, lang) {  // TODO why does an audio cue need the site id?
    var restOfUrl = 'cue/site/' + site.getSiteId() + '/' +
      key + '.' + getMediaTypeForNetworkAudio() + getLanguageParameter(lang);
    return urls.getApiUrl(restOfUrl);
  }

  /**
   * Get URL for speaking text
   * @param text  Text to be spoken
   * @param lang  Optional language parameter -- defaults to document language
   * @returns {string} url
   */
  function getTTSUrl(text, lang) {
    var restOfUrl = 'tts/site/' + site.getSiteId() + '/tts.' + getMediaTypeForNetworkAudio() + getLanguageParameter(lang) + 't=' + encodeURIComponent(text);
    return urls.getApiUrl(restOfUrl);
  }

  /**
   * Turn speech on or off
   * @param isOn Whether to turn speech on or off
   */
  function setSpeechState(isOn, doSuppressAudioCue) {
    if (ttsOn !== isOn) {
      ttsOn = isOn;
      conf.set('ttsOn', ttsOn);
      events.emit('speech/did-change', ttsOn);
      if (!doSuppressAudioCue) {
        require(['audio-cues/audio-cues'], function(audioCues) {
          audioCues.playSpeechCue(ttsOn);
        });
      }
    }
  }

  function toggleSpeech() {
    setSpeechState(!ttsOn);
  }

  /*
   * Uses a provisional player to play back audio by key, used for audio cues.
   */
  function speakByKey(key) {
    stopAudio();  // Stop any currently playing audio

    var lang = getDocumentAudioLang(); // Use document language for cues, e.g. en-US or en
    addStopAudioHandlers();

    function speakLocally(onUnavailable) {
      var onUnavailableFn = onUnavailable || noop,
        cueLang = getCueLanguage(lang);
      if (cueLang && isLocalSpeechAllowed()) {
        require(['local-player/local-player'], function (localPlayer) {
          lastPlayer = localPlayer;
          locale.getAudioCueTextAsync(key, function (cueText) {
            if (cueText) {
              localPlayer
                .speak({
                  text: cueText,
                  locale: cueLang
                })
                .catch(onUnavailableFn);
            }
          });
        });
      }
      else {
        onUnavailableFn();
      }
    }

    function speakViaNetwork(onUnavailable) {
      var onUnavailableFn = onUnavailable || noop;
      if (isNetworkSpeechAllowed(lang)) {
        require(['network-player/network-player'], function (networkPlayer) {
          lastPlayer = networkPlayer;
          var url = getAudioKeyUrl(key, lang);
          networkPlayer
            .play({
              url: url
            })
            .catch(onUnavailableFn);
          });
      }
      else {
        onUnavailableFn();
      }
    }

    var speakViaNetworkFn = SC_LOCAL ? noop : speakViaNetwork;

    if (isLocalSpeechPreferred()) {
      speakLocally(speakViaNetworkFn);
    }
    else {
      speakViaNetworkFn(speakLocally);
    }
  }

  function playEarcon(earconName) {
    if (!SC_LOCAL) {
      // TODO can we play earcons in the extension without the heavyweight network player?
      stopAudio();

      var url = urls.resolveResourceUrl('earcons/' + earconName + '.' + getMediaTypeForNetworkAudio());

      require(['network-player/network-player'], function (networkPlayer) {
        networkPlayer.play({
          url: url
        });
      });
    }
  }

  function getBrowserSupportedTypeFromList(listOfAvailableExtensions) {
    var audioApi,
      index = 0,
      MEDIA_TYPES = {
        ogg : 'audio/ogg',
        mp3 : 'audio/mpeg'
        // aac : 'audio/aac'    // Not currently used
      };

    try {
      audioApi = new Audio();
    } catch (e) {}

    if (audioApi) {
      for (; index < listOfAvailableExtensions.length; index++) {
        var extension = listOfAvailableExtensions[index];
        if (audioApi.canPlayType(MEDIA_TYPES[extension])) {
          return extension;
        }
      }
    }

    // Must be Safari version <= 6, because we don't support other browsers without Audio() support
    return listOfAvailableExtensions.indexOf('aac') >= 0 ? 'aac' : 'mp3';  // Prefer aac, otherwise use mp3
  }

  // What audio format will we use for prerecorded audio?
  function getMediaTypeForNetworkAudio() {
    if (!getMediaTypeForNetworkAudio.cached) {
      getMediaTypeForNetworkAudio.cached = getBrowserSupportedTypeFromList(['mp3','ogg']);
    }
    return getMediaTypeForNetworkAudio.cached;
  }

  /**
   * Returns if TTS is enabled or not.  Always returns true or false.
   */
  function isSpeechEnabled() {
    // Flag indicating that this site is enabled for TTS.
    return ttsOn;
  }

  // Get the client's preferred speech strategy.
  // This may not be the ultimate speech strategy used, because
  // 1) network speech will not play if ttsAvailable = false in served site preferences
  function getClientSpeechStrategy() {
    if (SC_LOCAL) {
      return speechStrategy.LOCAL;
    }
    if (!getClientSpeechStrategy.cached) {
      getClientSpeechStrategy.cached = (site.get('speech') || {}).strategy || speechStrategy.AUTO;
      if (getClientSpeechStrategy.cached === speechStrategy.AUTO) {
        getClientSpeechStrategy.cached = constant.autoStrategy;
      }
      if (SC_DEV) {
        console.log('Speech strategy: ' + getClientSpeechStrategy.cached);
      }
    }

    return getClientSpeechStrategy.cached;
  }

  function isLocalSpeechAllowed() {
    return getClientSpeechStrategy() !== speechStrategy.NETWORK && window.speechSynthesis;
  }

  function isLocalSpeechPreferred() {
    var clientSpeechStrategy = getClientSpeechStrategy();
    return clientSpeechStrategy === speechStrategy.LOCAL || clientSpeechStrategy === speechStrategy.PREFER_LOCAL;
  }

  function getRerouteNetworkSpeechLangKey(lang) {
    return constant.REROUTE_NETWORK_SPEECH_KEY + lang;
  }

  function isNetworkSpeechAllowed(lang) {
    return getClientSpeechStrategy() !== speechStrategy.LOCAL &&
      !window.sessionStorage.getItem(getRerouteNetworkSpeechLangKey(lang));
  }

  // This language failed on the network -- disallow it for this tab (uses sessionStorage)
  function rerouteNetworkSpeechLang(lang) {
    // Set to any value to reroute this language to local speech
    window.sessionStorage.setItem(getRerouteNetworkSpeechLangKey(lang), true);
  }

  function getCueLanguage(lang) {
    var longLang = lang.toLowerCase(),
      shortLang;

    function useIfAvailable(tryLang) {
      return constant.AVAILABLE_CUES[tryLang] && tryLang;
    }

    shortLang = longLang.split('-')[0];

    return useIfAvailable(longLang) || useIfAvailable(shortLang);
  }

  function init() {

    if (isInitialized) {
      return;
    }

    isInitialized = true;

    // Speak on text selection
    textSelect.init();

    // TODO: It would be better to listen for 'hlb/create' here so that
    //       speech synthesis happens during the opening animation.
    //       Unfortunately, this currently causes browsers to choke
    //       on the animation when using local speech. But that
    //       will likely improve in time.
    /*
     * Speak whenever the lens is opened, if speech is on, etc.
     */

    events.on('hlb/ready', onLensOpened);

    /*
     * A highlight box was closed.  Stop/abort/dispose of the player
     * attached to it.
     */
    events.on('hlb/closed keys/non-shift-key-pressed', stopAudio);

    if (SC_DEV) {
      // For debugging purposes
      // Takes one of the strategies from audio/constant.js
      sitecues.setSpeechStrategy = function setSpeechStrategy(newStrategy) {
        getClientSpeechStrategy.cached = newStrategy;
      };
    }

    ttsOn = conf.get('ttsOn');
  }

  return {
    stopAudio: stopAudio,
    setSpeechState: setSpeechState,
    toggleSpeech: toggleSpeech,
    isSpeechEnabled: isSpeechEnabled,
    speakByKey: speakByKey,
    speakContent: speakContent,
    speakText: speakText,
    playEarcon: playEarcon,
    getTTSUrl: getTTSUrl,
    init: init
  };
});
