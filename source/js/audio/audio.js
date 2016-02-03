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
    'core/conf/user/manager',
    'core/conf/site',
    '$',
    'audio/speech-builder',
    'core/platform',
    'core/locale',
    'core/metric',
    'core/conf/urls',
    'audio/network-player',
    'audio/local-player',
    'audio/text-select',
    'audio/cue-text',
    'core/events'
  ],
  function(conf, site, $, builder, platform, locale, metric, urls, networkPlayer, localPlayer, textSelect, cueText, events) {

  var ttsOn = false,
    isAudioPlaying,
    mediaTypeForTTS,  // For TTS only, not used for pre-recorded sounds such as verbal cues
    mediaTypeForPrerecordedAudio,
    isInitialized,
    isRetrievingAudioPlayer,
    // TODO add more trigger types, e.g. shift+arrow, shift+space
    TRIGGER_TYPES = {
      LENS: 'space',
      HIGHLIGHT: 'shift'
    },
    useLocalSpeech;

  function onLensOpened(lensContent, fromHighlight) {
    if (!ttsOn) {
      return;
    }
    speakContentImpl(fromHighlight.picked, TRIGGER_TYPES.LENS);
  }

  function speakContent(content, doAvoidInterruptions) {
    if (doAvoidInterruptions && getSpeechPlayer().isBusy()) {
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

  // text and triggerType are optional
  function speakText(text, lang, triggerType) {
    stopAudio();  // Stop any currently playing audio and halt keydown listener until we're playing again
    if (!text.trim()) {
      return; // Nothing to speak
    }

    var startRequestTime = Date.now();

    function onSpeechPlaying() {
      var timeElapsed = Date.now() - startRequestTime;
      isAudioPlaying = true;
      addStopAudioHandlers();
      new metric.TtsRequest({
        requestTime : timeElapsed,
        audioFormat : useLocalSpeech ? mediaTypeForTTS : null,
        charCount   : text.length,
        trigger     : triggerType,
        isLocalTTS  : Boolean(useLocalSpeech)
      }).send();
    }

    if (useLocalSpeech) {
      return localPlayer.speak({
          text   : text,
          locale : lang,
          onStart : onSpeechPlaying
        });
    }

    // Network speech.
    setupNetworkPlayer(function() {
      var TTSUrl = getTTSUrl(text, lang);

      networkPlayer.playAudioSrc(TTSUrl, onSpeechPlaying);
    });
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
    if (isAudioPlaying) {
      getSpeechPlayer().stop();
      removeBlurHandler();
      isAudioPlaying = false;
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

  function getAudioKeyUrl(key) {  // TODO why does an audio cue need the site id?
    var restOfUrl = 'cue/site/' + site.getSiteId() + '/' +
      key + '.' + getMediaTypeForPrerecordedAudio() + getLanguageParameter();
    return urls.getApiUrl(restOfUrl);
  }

  /**
   * Get URL for speaking text
   * @param text  Text to be spoken
   * @param lang  Optional language parameter -- defaults to document language
   * @returns {string} url
   */
  function getTTSUrl(text, lang) {
    var restOfUrl = 'tts/site/' + site.getSiteId() + '/tts.' + mediaTypeForTTS + getLanguageParameter(lang) + 't=' + encodeURIComponent(text);
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
  function playAudioByKey(key) {
    stopAudio();  // Stop any currently playing audio

    function onSpeechStart() {
      isAudioPlaying = true;
      addStopAudioHandlers();
    }

    if (useLocalSpeech) {
      return localPlayer.speak({
          text   : cueText[key],
          locale : 'en-US',
          onStart : onSpeechStart
        });
    }

    var url = getAudioKeyUrl(key);
    setupNetworkPlayer(function() {
      networkPlayer.playAudioSrc(url, onSpeechStart);
    });
  }

  function playEarcon(earconName) {
    stopAudio();

    var url = urls.resolveResourceUrl('earcons/' + earconName + '.' + getMediaTypeForPrerecordedAudio());

    setupNetworkPlayer(function() {
      networkPlayer.playAudioSrc(url);
    });
  }

  function getSpeechPlayer() {
    return useLocalSpeech ? localPlayer : networkPlayer;
  }

  // What audio format will we use?
  // At the moment, mp3, ogg and aac are sufficient for the browser/OS combinations we support.
  // For Ivona, audio formats are mp3 or ogg
  // For Lumenvox, audio formats are aac or ogg
  function setupNetworkPlayer(callbackFn) {
    if (mediaTypeForTTS) {
      // Already retrieved
      callbackFn();
      return;
    }
    if (isRetrievingAudioPlayer) {
      // Currently retrieving
      return;
    }

    isRetrievingAudioPlayer = true;

    getMediaTypeForTTS(function() {
      isRetrievingAudioPlayer = false;
      callbackFn();
    });
  }

  function getBrowserSupportedTypeFromList(listOfAvailableExtensions) {
    var audioApi,
      index = 0,
      MEDIA_TYPES = {
        ogg : 'audio/ogg',
        mp3 : 'audio/mpeg',
        aac : 'audio/aac'
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

  // What audio format will we use for TTS?
  // Note: calling this depends on having site information, which is retrieved when TTS is turned on.
  function getMediaTypeForTTS(callbackFn) {
    if (mediaTypeForTTS) {
      callbackFn(mediaTypeForTTS);
    }
    function onAudioFormatsReceived(ttsAudioFormats) {
      mediaTypeForTTS = getBrowserSupportedTypeFromList(ttsAudioFormats);
      callbackFn(mediaTypeForTTS);
    }

    fetchAudioFormats(onAudioFormatsReceived);
  }

  // What audio format will we use for prerecorded audio?
  function getMediaTypeForPrerecordedAudio() {
    if (!mediaTypeForPrerecordedAudio) {
      mediaTypeForPrerecordedAudio = getBrowserSupportedTypeFromList(['mp3','ogg']);
    }
    return mediaTypeForPrerecordedAudio;
  }

  /**
   * Returns if TTS is enabled or not.  Always returns true or false.
   */
  function isSpeechEnabled() {
    // Flag indicating that this site is enabled for TTS.
    return ttsOn;
  }

  function fetchAudioFormats(callbackFn) {
    var AUDIO_FORMATS_KEY = 'ttsAudioFormats',
      audioFormats = site.get(AUDIO_FORMATS_KEY),
      FALLBACK_AUDIO_FORMATS = ['ogg']; // Supported by all TTS engines we use
    if (audioFormats) {
      callbackFn(audioFormats);
      return;
    }

    if (SC_LOCAL) {
      // Cannot save to server when we have no access to it
      // Putting this condition in allows us to paste sitecues into the console
      // and test it on sites that have a content security policy
      callbackFn(FALLBACK_AUDIO_FORMATS);
      return;
    }

    require(['core/util/xhr'], function(xhr) {
      xhr.getJSON({
        // The 'provided.siteId' parameter must exist, or else core would have aborted the loading of modules.
        url: urls.getApiUrl('2/site/' + site.getSiteId() + '/config'),
        success: function (data) {
          var settings = data.settings,
            i = 0;
          // Copy the fetched key/value pairs into the site configuration.
          for (; i < settings.length; i++) {
            if (settings[i].key === AUDIO_FORMATS_KEY) {
              callbackFn(settings[i].value);
              return;
            }
          }
        },
        error: function() {
          if (SC_DEV) { console.error('Error loading sitecues speech configuration.'); }
          callbackFn(FALLBACK_AUDIO_FORMATS);
        }
      });
    });
  }

  function init() {

    if (isInitialized) {
      return;
    }

    isInitialized = true;

    // Speak on text selection
    textSelect.init();

     //TODO: It would be better to listen for 'hlb/create' here so that
     //      speech synthesis happens during the opening animation.
     //      Unfortunately, this currently causes browsers to choke
     //      on the animation. But that will likely improve in time.
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
      sitecues.toggleLocalSpeech = function toggleLocalSpeech() {
        useLocalSpeech = !useLocalSpeech;
        return useLocalSpeech;
      };
    }

    ttsOn = conf.get('ttsOn');
    useLocalSpeech = SC_LOCAL || (site.get('speech') || {}).local;
  }

  return {
    stopAudio: stopAudio,
    setSpeechState: setSpeechState,
    toggleSpeech: toggleSpeech,
    isSpeechEnabled: isSpeechEnabled,
    playAudioByKey: playAudioByKey,
    speakContent: speakContent,
    speakText: speakText,
    playEarcon: playEarcon,
    getTTSUrl: getTTSUrl,
    init: init
  };
});
