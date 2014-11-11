/**
 * This is the "main" audio library.  It manages all of the events
 * and requests and should be the only speech component referenced
 * by other parts of the application.
 *
 * Specifically, it is responsible for:
 * - Playing speech when HLB opens, if speech is on. In this case it must request
 *   a media type supported both by the server (provided via site preferences)
 * - Stopping speech when a key is pressed or HLB closes
 * - Playing audio by key when requested by another module
 */

sitecues.def('audio', function (audio, callback) {
  
  'use strict';
  
  sitecues.use('conf', 'conf/site', 'jquery', 'audio/speech-builder', 'platform',
    function(conf, site, $, builder, platform) {

    var ttsOn = false,
      audioPlayer,
      mediaTypeForTTS,  // For TTS only, not used for pre-recorded sounds such as verbal cues
      mediaTypeForPrerecordedAudio;

    function playHlbContent(hlb) {
      if (!ttsOn) {
        return;
      }
      stopAudio();  // Stop any currently playing audio and halt keydown listener until we're playing again

      var text = builder.getText(hlb);
      if (text) {
        getAudioPlayer().playAudioSrc(getTTSUrl(text));
        enableKeyDownToStopAudio();
      }
    }

    function enableKeyDownToStopAudio() {
      // Stop speech on any key down.
      // Wait a moment, in case it was a keystroke that just got us here,
      // for example down arrow to read next HLB or a hotkey to toggle speech
      setTimeout(function() {
        $(window).one('keydown', stopAudio);
      }, 0);
    }

    /*
     * Stops the player that is attached to a highlight box.
     * This is safe to call if the player has not been initialized
     * or is not playing.
     */
    function stopAudio() {
      getAudioPlayer().stop();
      // Remove handler that stops speech on any key down.
      $(window).off('keydown', stopAudio);
    }

    function getApiBaseUrl() {
      return '//' + sitecues.getLibraryConfig().hosts.ws + '/sitecues/api/';
    }

    // Puts in delimiters on both sides of the parameter -- ? before and & after
    function getLanguageParameter() {
      var lang = document.documentElement.lang;
      return '?l=' + (lang || 'en') + '&';
    }

    function getAudioKeyUrl(key) {  // TODO why does an audio cue need the site id?
      return getApiBaseUrl() + 'cue/site/' + site.get('site_id') + '/' +
        key + '.' + getMediaTypeForPrerecordedAudio() + getLanguageParameter();
    }

    function getTTSUrl(text) {
      return getApiBaseUrl() + 'tts/site/' + site.get('site_id') + '/tts.' + getMediaTypeForTTS() +
        getLanguageParameter() + 't=' + encodeURIComponent(text);
    }

      /**
       * Turn speech on or off
       * @param isOn Whether to turn speech on or off
       */
    function setSpeechState(isOn) {
      if (ttsOn !== isOn) {
        ttsOn = isOn;
        conf.set('ttsOn', ttsOn);
        sitecues.emit('speech/did-change', ttsOn);
      }
    }

    /*
     * Uses a provisional player to play back audio by key, used for audio cues.
     */
    audio.playAudioByKey = function(key) {
      stopAudio();  // Stop any currently playing audio and halt keydown listener until we're playing again

      var url = getAudioKeyUrl(key);
      getAudioPlayer().playAudioSrc(url);

      // Stop speech on any key down.
      enableKeyDownToStopAudio();
    };

    // What audio format will we use?
    // At the moment, mp3, ogg and aac are sufficient for the browser/OS combinations we support.
    // For Ivona, audio formats are mp3 or ogg
    // For Lumenvox, audio formats are aac or ogg
    function getAudioPlayer() {
      if (!audioPlayer) {
        if (platform.browser.isSafari) {
          sitecues.use('audio/safari-player', function(player) {
            audioPlayer = player;
          });
        }
        else {
          sitecues.use('audio/html5-player', function(player) {
            audioPlayer = player;
          });
        }
        audioPlayer.init();
      }

      return audioPlayer;
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
    function getMediaTypeForTTS() {
      if (!mediaTypeForTTS) {
        var FALLBACK_FORMATS_IF_NO_SITE_PREFS = ['ogg'], // Supported by all TTS engines we use
          availableFormats = site.get('ttsAudioFormats') || FALLBACK_FORMATS_IF_NO_SITE_PREFS;
        mediaTypeForTTS = getBrowserSupportedTypeFromList(availableFormats);
      }
      return mediaTypeForTTS;
    }

    // What audio format will we use for prerecorded audio?
    function getMediaTypeForPrerecordedAudio() {
      if (!mediaTypeForPrerecordedAudio) {
        mediaTypeForPrerecordedAudio = getBrowserSupportedTypeFromList(['mp3','ogg']);
      }
      return mediaTypeForPrerecordedAudio;
    }

    function toggleSpeech() {
      setSpeechState(!ttsOn);
    }

    /**
     * Returns if TTS is enabled or not.  Always returns true or false.
     */
    audio.isSpeechEnabled = function() {
      // Flag indicating that this site is enabled for TTS.
      return ttsOn;
    };

    /*
     * A highlight box has been requested.  This will create the player
     * if necessary, but will not play anything.
     */
    sitecues.on('hlb/create', playHlbContent);

    /*
     * A highlight box was closed.  Stop/abort/dispose of the player
     * attached to it.
     */
    sitecues.on('hlb/closed', stopAudio);

    // User has requested a speech toggle
    sitecues.on('speech/do-toggle', toggleSpeech);

    if (conf.get('ttsOn')) {
      ttsOn = true;
      sitecues.emit('speech/init');
    }

    if (SC_UNIT) {
      exports.setSpeechState = setSpeechState;
      exports.isSpeechEnabled = audio.isSpeechEnabled
      exports.playAudioByKey = audio.playAudioByKey;
      exports.playHlbContent = playHlbContent;
      exports.getTTSUrl = getTTSUrl;
    }

    callback();
  });
});
