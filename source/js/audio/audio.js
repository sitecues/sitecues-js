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
    'core/locale',
    'core/metric/metric',
    'core/conf/urls',
    'audio/text-select',
    'core/data-map',
    'core/events',
    'audio/local-player',
    'audio/network-player'
  ],
  function(constant, conf, site, $, builder, locale, metric, urls, textSelect, dataMap, events, localPlayer, networkPlayer) {

  var ttsOn = false,
    lastPlayer,
    isInitialized,
    AUDIO_BUSY_EVENT = 'audio/did-toggle',
    speechStrategy = constant.speechStrategy;

  function onLensOpened(lensContent, fromHighlight) {
    if (ttsOn) {
      speakContentImpl(fromHighlight.picked, constant.TRIGGER_TYPES.LENS);
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

    speakContentImpl(content, constant.TRIGGER_TYPES.HIGHLIGHT);
  }

  function speakContentImpl($content, triggerType) {
    stopAudio();

    var text = builder.getText($content);
    if (text) {
      speakText(text, $content[0], triggerType);
    }
  }

  // text and triggerType are optional
  // @rootNode is root node of the text to be spoken, if available -- it will be used to get the locale
  function speakText(text, rootNode, triggerType) {
    stopAudio();  // Stop any currently playing audio and halt keydown listener until we're playing again
    if (!text.trim()) {
      return; // Nothing to speak
    }

    var startRequestTime = Date.now(),
      textLocale = getAudioLocale(rootNode);
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
      var onUnavailableFn = onUnavailable || fireNotBusyEvent;
      if (isLocalSpeechAllowed()) {
        lastPlayer = localPlayer;
        fireBusyEvent();
        return localPlayer
          .speak({
            text: text,
            locale: textLocale,
            onStart: function () {
              onSpeechPlaying(true);
            }
          })
          .then(fireNotBusyEvent)
          .catch(function() {
            onUnavailableFn(); // Call with no arguments (don't pass on the error value)
          });
      }
      else {
        onUnavailableFn();
      }
    }

    function speakViaNetwork(onUnavailable) {
      var onUnavailableFn = onUnavailable || fireNotBusyEvent;
      if (isNetworkSpeechAllowed(textLocale)) {
        lastPlayer = networkPlayer;
        fireBusyEvent();

        var ttsUrl = getTTSUrl(text, textLocale);

        networkPlayer
          .play({
            url: ttsUrl,
            onStart: function () {
              onSpeechPlaying(false);
            }
          })
          .then(fireNotBusyEvent)
          .catch(function() {
            rerouteNetworkSpeechLang(textLocale);
            onUnavailableFn();   // Call with no arguments (don't pass on the error value)
          });
      }
      else {
        onUnavailableFn();
      }
    }

    var speakViaNetworkFn = SC_LOCAL ? fireNotBusyEvent : speakViaNetwork; // Helps the minifier

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

  function fireBusyEvent() {
    if (isBusy()) {
      // Already fired
      return;
    }
    events.emit(AUDIO_BUSY_EVENT, true);
  }

  function fireNotBusyEvent() {
    if (isBusy()) {
      // Still has other audio to play -- one of the players is still busy
      return;
    }
    events.emit(AUDIO_BUSY_EVENT, false);
  }

  // Get language that applies to node (optional param), otherwise the document body
  // If no locale found, falls back on document and then browser default language
  // Returns a full country-affected language, like en-CA when the browser's language matches the site's language prefix.
  // For example, if an fr-CA browser visits an fr-FR website, then fr-CA is returned instead of the page code,
  // because that is the preferred accent for French.
  // However, if the fr-CA browser visits an en-US or en-UK page, the page's code is returned because the
  // user's preferred English accent in unknown
  function getAudioLocale(optionalStartNode) {
    function toPreferredRegion(contentLocale) {
      return locale.swapToPreferredRegion(contentLocale);
    }

    // Get this first, because Google translate overwrites all text in the document, but not lang attributes
    var translationLocale = locale.getTranslationLocale();
    if (translationLocale) {
      return toPreferredRegion(translationLocale);
    }

    var node = optionalStartNode || document.body;

    if (node.nodeType !== node.ELEMENT_NODE) {
      // May have started on text node
      node = node.parentElement;
    }

    while (node) {
      var nodeLocale = node.getAttribute('lang') || node.getAttribute('xml:lang');
      if (nodeLocale && locale.isValidLocale(nodeLocale)) {
        return toPreferredRegion(nodeLocale);
      }
      node = node.parentElement;
    }

    return toPreferredRegion(locale.getPageLocale());
  }

  function getAudioCueTextAsync(cueName, cueTextLocale, callback) {
    var
      AUDIO_CUE_DATA_PREFIX = 'locale-data/cue/',
      cueModuleName = AUDIO_CUE_DATA_PREFIX + cueTextLocale;

    dataMap.get(cueModuleName, function(data) {
      callback(data[cueName] || '');
    });
  }

  function toCueTextLocale(cueAudioLocale) {
    var locale = cueAudioLocale.toLowerCase(),
      lang = locale.split('-')[0];

    function useIfAvailable(tryLocale) {
      return constant.AVAILABLE_CUES[tryLocale] && tryLocale;
    }

    return useIfAvailable(locale) || useIfAvailable(lang);
  }

  // Puts in delimiters on both sides of the parameter -- ? before and & after
  // locale is a required parameter
  function getLocaleParameter(locale) {
    return '?l=' + locale + '&';
  }

  function getCueUrl(name, locale) {  // TODO why does an audio cue need the site id?
    var restOfUrl = 'cue/site/' + site.getSiteId() + '/' +
      name + '.' + getMediaTypeForNetworkAudio() + getLocaleParameter(locale);
    return urls.getApiUrl(restOfUrl);
  }

  /**
   * Get URL for speaking text
   * @param text  Text to be spoken
   * @param locale  required locale parameter
   * @returns {string} url
   */
  function getTTSUrl(text, locale) {
    var restOfUrl = 'tts/site/' + site.getSiteId() + '/tts.' + getMediaTypeForNetworkAudio() + getLocaleParameter(locale) + 't=' + encodeURIComponent(text);
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
   * Uses a provisional player to play back audio by cue name, used for audio cues.
   */
  function speakCueByName(name) {
    stopAudio();  // Stop any currently playing audio

    var cueAudioLocale = getAudioLocale(); // Use document language for cue voice, e.g. en-US or en
    addStopAudioHandlers();

    function speakLocally(onUnavailable) {
      var onUnavailableFn = onUnavailable || fireNotBusyEvent,
        cueTextLocale = toCueTextLocale(cueAudioLocale);  // Locale for text (likely just the 2-letter lang prefix)
      if (cueTextLocale && isLocalSpeechAllowed()) {
        lastPlayer = localPlayer;
        fireBusyEvent();
        getAudioCueTextAsync(name, cueTextLocale, function (cueText) {
          if (cueText) {
            localPlayer
              .speak({
                text: cueText,
                locale: cueAudioLocale
              })
              .then(fireNotBusyEvent)
              .catch(function() {
                onUnavailableFn();
              });
          }
        });
      }
      else {
        onUnavailableFn();
      }
    }

    function speakViaNetwork(onUnavailable) {
      var onUnavailableFn = onUnavailable || fireNotBusyEvent;
      if (isNetworkSpeechAllowed(cueAudioLocale)) {
        lastPlayer = networkPlayer;
        fireBusyEvent();
        var url = getCueUrl(name, cueAudioLocale);
        networkPlayer
          .play({
            isSpeech: true,
            url: url
          })
          .then(fireNotBusyEvent)
          .catch(function() {
            onUnavailableFn();
          });
      }
      else {
        onUnavailableFn();
      }
    }

    var speakViaNetworkFn = SC_LOCAL ? fireNotBusyEvent : speakViaNetwork;

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

      networkPlayer.play({
        url: url
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
      // if (SC_DEV) {
      //   console.log('Speech strategy: ' + getClientSpeechStrategy.cached);
      // }
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
    try {
      window.sessionStorage.setItem(getRerouteNetworkSpeechLangKey(lang), true);
    }
    catch(ex) {}
  }

  function init() {

    if (isInitialized) {
      return;
    }

    isInitialized = true;

    // Speak on text selection
    textSelect.init();

    /*
     * Speak whenever the lens is opened, if speech is on, etc.
     * Use a later speech fetch if local speech is preferred, because it makes the lens expansion animation janky.
     * TODO: It would be better to always listen for 'hlb/did-create' here so that
     *      speech synthesis happens during the opening animation.
     *      Unfortunately, this currently causes browsers to choke
     *      on the animation when using local speech. But that
     *      may improve in time.
     */
    var SPEECH_BEGIN_EVENT = isLocalSpeechPreferred() ? 'hlb/ready' : 'hlb/did-create';
    events.on(SPEECH_BEGIN_EVENT, onLensOpened);

    /*
     * A highlight box was closed.  Stop/abort/dispose of the player
     * attached to it.
     */
    events.on('hlb/closed', stopAudio);

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
    speakCueByName: speakCueByName,
    speakContent: speakContent,
    speakText: speakText,
    playEarcon: playEarcon,
    getTTSUrl: getTTSUrl,
    init: init
  };
});
