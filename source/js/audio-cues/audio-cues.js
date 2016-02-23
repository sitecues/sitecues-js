/**
 * This is the audio cue library.  It listens to sitecues events and plays appropriate verbal cues.
 * Not to be confused with earcons, which are just sounds.
 */

define(['core/conf/user/manager', 'audio/audio'], function(conf, audio) {

  // The high zoom threshold for the zoom-based verbal cue
  var HIGH_ZOOM_THRESHOLD = 1.6,
    // Tracks the last time the user has heard the "descriptive high zoom" cue.
    DESCRIPTIVE_HIGH_ZOOM_PARAM = 'firstHighZoom',

    // Time in millis after which cues should replay.
    CUE_RESET_MS = 7 * 86400000, // 7 days

    // Tracks the last time the user has heard the longer, more descriptive "speech on" cue.
    DESCRIPTIVE_SPEECH_ON_PARAM ='firstSpeechOn',

    VERBAL_CUE_SPEECH_ON = 'verbalCueSpeechOn',
    VERBAL_CUE_SPEECH_ON_DESCRIPTIVE = 'verbalCueSpeechOnFirst',
    VERBAL_CUE_SPEECH_OFF = 'verbalCueSpeechOff';

  /**
   * Returns true if the "descriptive speech on" cue should be played.
   * @return {boolean}
   */
  function shouldPlayDescriptiveSpeechOnCue() {
    var firstSpeechOn = conf.get(DESCRIPTIVE_SPEECH_ON_PARAM);
    return !firstSpeechOn || firstSpeechOn + CUE_RESET_MS < Date.now();
  }

  /**
   * Returns true if the description of one-touch-read should be played after a zoom change
   */
  function shouldPlayDescriptiveHighZoomCue(zoom) {
    // If zoom isn't high enough, or hasn't increased beyond initial setting, don't play cue
    if (zoom >= HIGH_ZOOM_THRESHOLD) {
      var lastDescriptiveZoomCueTime = parseInt(conf.get(DESCRIPTIVE_HIGH_ZOOM_PARAM));
      return !lastDescriptiveZoomCueTime || Date.now() - lastDescriptiveZoomCueTime > CUE_RESET_MS;
    }
  }

  /*
   * Play speech on cue if necessary
   */
  function playSpeechCue(isEnabled) {

    if (!isEnabled) {
      // *** Speech off cue ***
      audio.speakByKey(VERBAL_CUE_SPEECH_OFF);
      return;
    }

    // EQ-996 - As a user, I want multiple chances to learn about the
    // spacebar command so that I can benefit from One Touch Read
    //---------------------------------------------------------------------------------------------------//
    // 1) For the TTS-spacebar hint (currently given when TTS is turned on the first time):
    // Give the hint max three times, or until the user successfully uses the spacebar once with TTS on.
    if(!shouldPlayDescriptiveSpeechOnCue()) {
      audio.speakByKey(VERBAL_CUE_SPEECH_ON);
    } else {
      audio.speakByKey(VERBAL_CUE_SPEECH_ON_DESCRIPTIVE);
      // Signals that the "descriptive speech on" cue has played
      conf.set(DESCRIPTIVE_SPEECH_ON_PARAM, Date.now());
    }
  }

  function playZoomCue(zoom) {
    // If highlighting is enabled, zoom is large enough, zoom is larger
    // than we started, and we haven't already cued, then play an audio
    // cue to explain highlighting
    if (shouldPlayDescriptiveHighZoomCue(zoom)) {
      audio.speakByKey('verbalCueHighZoom');
      // Signals that the "descriptive high zoom" cue has played.
      conf.set(DESCRIPTIVE_HIGH_ZOOM_PARAM, Date.now());
    }
  }

  return {
    playSpeechCue: playSpeechCue,
    playZoomCue: playZoomCue
  };
});
