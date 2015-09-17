/**
 * This is the main audio library.  It manages all of the events
 * and requests and should be the only speech component referenced
 * by other parts of the application.
 *
 * Specifically, it is responsible for:
 * - Playing speech when HLB opens, if speech is on. In this case it must request
 *   a media type supported both by the server (provided via site preferences)
 * - Stopping speech when a key is pressed or HLB closes
 * - Playing audio by key when requested by another module
 */

define(['core/conf/user/manager', 'core/conf/site', '$', 'audio/speech-builder', 'core/platform', 'core/locale', 'core/metric', 'core/conf/urls'],
  function(conf, site, $, builder, platform, locale, metric, urls) {

  var ttsOn = false,
    isAudioPlaying,
    audioPlayer,
    mediaTypeForTTS,  // For TTS only, not used for pre-recorded sounds such as verbal cues
    mediaTypeForPrerecordedAudio,
    isInitialized,
    isRetrievingAudioPlayer,
    // TODO add more trigger types, e.g. shift+arrow, shift+space
    TRIGGER_TYPES = {
      LENS: 'space',
      HIGHLIGHT: 'shift'
    };

  function onHlbOpened(hlbContent) {
    if (!ttsOn) {
      return;
    }
    speakContentImpl(hlbContent, TRIGGER_TYPES.LENS);
  }

  function speakContent(content, doAvoidInterruptions, doSuppressEarcon) {
    if (doAvoidInterruptions && audioPlayer && audioPlayer.isBusy()) {
      return; // Already reading the highlight
    }
    if (!content) {
      return; // Nothing to read
    }
    stopAudio();
    // Play audio highlight earcon if highlight moved with shift key and speech being fetched
    if (!doSuppressEarcon) {
      playEarcon('audio-highlight');
    }
    speakContentImpl(content, TRIGGER_TYPES.HIGHLIGHT);
  }

  function speakContentImpl($content, triggerType) {
    var text = builder.getText($content);
    if (text) {
      speakText(text, getElementLang($content[0]), triggerType);
    }
  }

  // text and triggerType are optional
  function speakText(text, lang, triggerType) {
    stopAudio();  // Stop any currently playing audio and halt keydown listener until we're playing again
    getAudioPlayer(function(player) {
      var TTSUrl = getTTSUrl(text, lang),
        startRequestTime = new Date();

      function onSpeechComplete() {
        var timeElapsed = new Date() - startRequestTime;
        metric('tts-requested', {
          requestTime: timeElapsed,
          audioFormat: mediaTypeForTTS,
          charCount: text.length,
          trigger: triggerType
        });
      }

      player.playAudioSrc(TTSUrl, onSpeechComplete);

      isAudioPlaying = true;
      sitecues.emit('audio/speech-play', TTSUrl);
      addStopAudioHandlers();
    });
  }

  function addStopAudioHandlers() {
    // Stop speech on any key down.
    // Wait a moment, in case it was a keystroke that just got us here,
    // for example down arrow to read next HLB or a hotkey to toggle speech
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
      audioPlayer.stop();
      removeBlurHandler();
      isAudioPlaying = false;
    }
  }

  // Get language that applies to element (optional param)
  // Fallback on document and then browser default language
  function getElementLang(element) {
    while (element) {
      var lang = element.getAttribute('lang') || element.getAttribute('xml:lang');
      if (lang) {
        return lang;
      }
      element = element.parentElement;
    }

    return locale.getFullWebsiteLang();
  }

  function getDocumentLang() {
    return getElementLang(document.body);
  }

  // Puts in delimiters on both sides of the parameter -- ? before and & after
  // lang is an optional parameter. If it doesn't exist, the document language will be used.
  function getLanguageParameter(lang) {
    return '?l=' + (lang || getDocumentLang()) + '&';
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
      if (!doSuppressAudioCue) {
        require(['audio/audio-cues'], function(audioCues) {
          audioCues.playSpeechCue(ttsOn);
          sitecues.emit('speech/did-change', ttsOn);
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

    var url = getAudioKeyUrl(key);
    getAudioPlayer(function(player) {
      isAudioPlaying = true;
      player.playAudioSrc(url);
      // Stop speech on any key down.
      addStopAudioHandlers();
    });
  }

  function playEarcon(earconName) {
    stopAudio();

    var url = urls.resolveSitecuesUrl('../earcons/' + earconName + '.' + getMediaTypeForPrerecordedAudio());

    getAudioPlayer(function(player) {
      player.playAudioSrc(url);
    });
  }

  // What audio format will we use?
  // At the moment, mp3, ogg and aac are sufficient for the browser/OS combinations we support.
  // For Ivona, audio formats are mp3 or ogg
  // For Lumenvox, audio formats are aac or ogg
  function getAudioPlayer(callbackFn) {
    function onDependencyLoaded() {
      audioPlayer && mediaTypeForTTS && callbackFn && callbackFn(audioPlayer);
    }
    function onAudioPlayerLoaded(player) {
      player.init();
      audioPlayer = player;
      onDependencyLoaded();
    }

    if (audioPlayer && mediaTypeForTTS) {
      // Already retrieved
      onDependencyLoaded();
      return;
    }
    if (isRetrievingAudioPlayer) {
      // Currently retrieving
      return;
    }

    isRetrievingAudioPlayer = true;
    if (platform.browser.isSafari) {
      require(['audio/safari-player'], onAudioPlayerLoaded);
    }
    else {
      require(['audio/html5-player'], onAudioPlayerLoaded);
    }
    getMediaTypeForTTS(onDependencyLoaded);
  }

  function getBrowserSupportedTypeFromList(listOfAvailableExtensions) {
    var audioApi,
      index = 0,
      MEDIA_TYPES = {
        ogg: 'audio/ogg',
        mp3: 'audio/mpeg',
        aac: 'audio/aac'
      };

    try {
      audioApi = new Audio();
    } catch (e) {}

    if (audioApi) {
      for (; index < listOfAvailableExtensions.length; index ++) {
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
          if (SC_DEV) { console.log('Error loading sitecues speech configuration.'); }
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

    /*
     * A highlight box has been requested.  This will create the player
     * if necessary, but will not play anything.
     */
    sitecues.on('hlb/create', onHlbOpened);

    /*
     * A highlight box was closed.  Stop/abort/dispose of the player
     * attached to it.
     */
    sitecues.on('hlb/closed keys/non-shift-key-pressed', stopAudio);

    ttsOn = conf.get('ttsOn');
  }

  var publics = {
    stopAudio: stopAudio,
    setSpeechState: setSpeechState,
    toggleSpeech: toggleSpeech,
    isSpeechEnabled: isSpeechEnabled,
    playAudioByKey: playAudioByKey,
    speakContent: speakContent,
    speakText: speakText,
    playEarcon: playEarcon,
    playHlbContent: onHlbOpened,
    getTTSUrl: getTTSUrl,
    init: init
  };
  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
