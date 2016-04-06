/**
 * This is the audio cue library.  It listens to sitecues events and plays appropriate verbal cues.
 * Not to be confused with earcons, which are just sounds.
 */

define(['core/conf/user/manager', 'audio/audio'], function(conf, audio) {

  // The high zoom threshold for the zoom-based verbal cue
  var HIGH_ZOOM_THRESHOLD = 1.6,
    // Time in millis after which cues should replay.
    CUE_RESET_MS = 7 * 86400000, // 7 days

    VERBAL_CUE_HIGH_ZOOM = 'verbalCueHighZoom',

    VERBAL_CUE_SPEECH_ON = 'verbalCueSpeechOn',
    VERBAL_CUE_SPEECH_ON_DESCRIPTIVE_1 = 'verbalCueSpeechOnFirst',
    VERBAL_CUE_SPEECH_ON_DESCRIPTIVE_2 = 'verbalCueSpeechOnSecond',
    VERBAL_CUE_SPEECH_OFF = 'verbalCueSpeechOff';

  // Should descriptive cue be used?
  // Use descriptive cue first time, or whenever CUE_RESET_MS amount of time has passed since it was last played
  function willPlayDescriptiveCue(cueName) {
    var lastCueUsage = conf.get(cueName);
    if (!lastCueUsage || lastCueUsage + CUE_RESET_MS < Date.now()) {
      conf.set(cueName, Date.now());
      return true;
    }
  }

  /**
   * Returns true if the "descriptive speech on" cue should be played.
   */
  function getSpeechOnCue() {
    if (willPlayDescriptiveCue(VERBAL_CUE_SPEECH_ON_DESCRIPTIVE_1)) {
      return VERBAL_CUE_SPEECH_ON_DESCRIPTIVE_1;
    }
    if (willPlayDescriptiveCue(VERBAL_CUE_SPEECH_ON_DESCRIPTIVE_2)) {
      return VERBAL_CUE_SPEECH_ON_DESCRIPTIVE_2;
    }
    return VERBAL_CUE_SPEECH_ON;
  }

  /*
   * Play speech cue
   */
  function playSpeechCue(isEnabled) {
    audio.speakByKey(isEnabled ? getSpeechOnCue() : VERBAL_CUE_SPEECH_OFF);
  }

  // Play descriptive zoom cue if necessary
  function playZoomCue(zoom) {
    // If highlighting is enabled, zoom is large enough, zoom is larger
    // than we started, and we haven't already cued, then play an audio
    // cue to explain highlighting
    if (zoom >= HIGH_ZOOM_THRESHOLD && willPlayDescriptiveCue(VERBAL_CUE_HIGH_ZOOM)) {
      audio.speakByKey(VERBAL_CUE_HIGH_ZOOM);
    }
  }

  return {
    playSpeechCue: playSpeechCue,
    playZoomCue: playZoomCue
  };
});
