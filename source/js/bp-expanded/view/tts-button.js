// TODO wave animation broken except in default badge
define(['core/bp/constants', 'core/bp/helper', 'core/bp/model/state', 'core/locale', 'core/conf/user/manager', 'core/events'],
  function (BP_CONST, helper, state, locale, conf, events) {
  var
    waveAnimationTimer,
    waveAnimationStepNum,
    isInitialized,
    isSpeechEnabled = conf.get('ttsOn'),
    isListeningToEvents;

  function toggleSpeech() {
    require(['audio/audio'], function(audio) {
      audio.toggleSpeech();
    });
  }

  function getTTSButtonElement() {
    return helper.byId(BP_CONST.SPEECH_ID);
  }

  function getTTSStateLabelNode() {
    return helper.byId(BP_CONST.SPEECH_STATE_ID).firstChild;
  }

  function getTTSLabelElement() {
    return helper.byId(BP_CONST.SPEECH_LABEL_ID);
  }

  function ensureLabelFitsInPanel() {
    function setAlignment(alignment) {
      // alignment is 'start' for left justification, and 'end' for right justification
      ttsLabelElement.setAttribute('text-anchor', alignment);
      ttsLabelElement.setAttribute('x', ttsLabelElement.getAttribute('data-x-' + alignment));
    }

    function getMaxLabelWidth() {
      // The right side of the speech target, which is almost at the panel's edge
      // minus the visible left side of the speech button
      return helper.byId(BP_CONST.SPEECH_TARGET_ID).getBoundingClientRect().right -
        helper.byId(BP_CONST.HEAD_ID).getBoundingClientRect().left;
    }

    // Use right justification if label is too large to fit
    var ttsLabelElement = getTTSLabelElement();
    var speechLabelWidth = ttsLabelElement.getBoundingClientRect().width;
    setAlignment(speechLabelWidth > getMaxLabelWidth() ? 'end' : 'start');
  }

  function setTTSLabel(text) {

    var speechStateLabel = getTTSStateLabelNode(),
        localizedText = locale.translate(text);

    speechStateLabel.data = localizedText;

    ensureLabelFitsInPanel();
  }

  /*
   Show TTS is enabled or disabled.
    */
  function updateTTSStateView(isEnabled) {

    isSpeechEnabled = isEnabled;

    var ttsButton = getTTSButtonElement();

    endWaveAnimation(); // Don't keep animating the wave hover effect after a click

    enableDimmingHover(false);  // Don't use hover effects after a click

    // Set aria-checked so that screen readers speak the new state
    ttsButton.setAttribute('aria-checked', !!isEnabled);

    // Update the label for the TTS button
    setTTSLabel(isEnabled ? BP_CONST.SPEECH_STATE_LABELS.ON : BP_CONST.SPEECH_STATE_LABELS.OFF);
  }

  function getWaves() {
    return [
      helper.byId(BP_CONST.WAVE_1_ID),
      helper.byId(BP_CONST.WAVE_2_ID),
      helper.byId(BP_CONST.WAVE_3_ID)
    ];
  }

  function nextWaveAnimationStep() {

    var waves       = getWaves(),
        opacityData = BP_CONST.ANIMATE_WAVES_OPACITY;

    for (var waveNum = 0; waveNum < waves.length; waveNum ++) {
      waves[waveNum].style.opacity = opacityData[waveNum][waveAnimationStepNum];
    }

    if (++ waveAnimationStepNum < opacityData[0].length) {
      // Not finished with animation, do it again
      waveAnimationTimer = setTimeout(nextWaveAnimationStep, BP_CONST.ANIMATE_WAVES_STEP_DURATION);
    }
    else {
      endWaveAnimation();
    }
  }

  function endWaveAnimation() {

    var waves = getWaves();

    clearTimeout(waveAnimationTimer);

    waveAnimationStepNum = 0;

    for (var waveNum = 0; waveNum < waves.length; waveNum ++) {
      waves[waveNum].style.opacity = '';
    }

  }

  // Animate waves if user hovers over TTS button, speech is off and animation is not already playing
  function beginHoverEffects() {

    if (!state.isPanel()) {
      return;
    }

    enableDimmingHover(true);

    if (!isSpeechEnabled && !waveAnimationStepNum) {
      nextWaveAnimationStep();
    }
  }



  function endHoverEffects() {
    endWaveAnimation();
    enableDimmingHover(false);
  }

  function enableDimmingHover(doEnable) {
    getTTSButtonElement().setAttribute('class', doEnable ? 'scp-dim-waves' : '');
  }

  function toggleListeners(isOn) {
    if (isOn === isListeningToEvents) {
      return;
    }
    isListeningToEvents = isOn;

    var fn = isOn ? 'addEventListener' : 'removeEventListener',
      mouseTarget1 = getTTSButtonElement(),
      mouseTarget2 = helper.byId(BP_CONST.SPEECH_LABEL_ID);

    // Do not use click listeners when the panel is shrunk because it confused the Window-Eyes browse mode
    // (when Enter key was pressed on badge, it toggled speech)
    mouseTarget1[fn]('click', toggleSpeech);
    mouseTarget2[fn]('click', toggleSpeech);

    mouseTarget1[fn]('mouseover', beginHoverEffects);
    mouseTarget1[fn]('mouseout', endHoverEffects);
    mouseTarget1[fn]('mouseover', beginHoverEffects);
    mouseTarget1[fn]('mouseout', endHoverEffects);
  }

  /*
   Set up speech toggle.
    */
  function init() {

    if (isInitialized) {
      return;
    }

    isInitialized = true;

    toggleListeners(true);

    events.on('bp/did-expand', function() { toggleListeners(true); });
    events.on('bp/will-shrink', function() { toggleListeners(false); });

    updateTTSStateView(isSpeechEnabled);

    waveAnimationStepNum = 0;
  }

  return {
    init: init,
    updateTTSStateView: updateTTSStateView
  };
});
