// TODO wave animation broken except in default badge
sitecues.def('bp/view/elements/tts-button', function (ttsButton, callback) {
  'use strict';

  sitecues.use('bp/constants', 'bp/helper', 'audio', 'bp/model/state', 'util/localization',
    function (BP_CONST, helper, audio, state, locale) {

    var waveAnimationTimer,
        waveAnimationStepNum;

    function getTTSButtonElement() {
      return helper.byId(BP_CONST.SPEECH_ID);
    }

    function getMouseTargetForTTS() {
      return helper.byId(BP_CONST.SPEECH_TARGET_ID);
    }

    function getTTSLabelElement() {
      return helper.byId(BP_CONST.SPEECH_STATE_ID).firstChild;
    }

    function setTTSLabel(text) {

      var label         = getTTSLabelElement(),
          localizedText = locale.translate(text);

      label.data = localizedText;

    }

    /*
     Show TTS is enabled or disabled.
      */
    function updateTTSStateView(isEnabled) {

      var ttsButton = getTTSButtonElement();

      endWaveAnimation(); // Don't keep animating the wave hover effect after a click

      enableDimmingHover(false);  // Don't use hover effects after a click

      // Set aria-checked so that screen readers speak the new state
      ttsButton.setAttribute('aria-checked', isEnabled);

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

      if (!audio.isSpeechEnabled() && !waveAnimationStepNum) {
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

    /*
     Set up speech toggle.
      */
    function init() {

      var mouseTarget1 = getMouseTargetForTTS(),
        mouseTarget2 = helper.byId(BP_CONST.SPEECH_LABEL_ID);

      // todo: move this to ttsController
      sitecues.on('bp/will-expand', function() {
        // Do not use this listener when the panel is shrunk because it confused the Window-Eyes browse mode
        // (when Enter key was pressed on badge, it toggled speech)
        mouseTarget1.addEventListener('click', audio.toggleSpeech);
        mouseTarget2.addEventListener('click', audio.toggleSpeech);
      });

      sitecues.on('bp/will-shrink', function() {
        mouseTarget1.removeEventListener('click', audio.toggleSpeech);
        mouseTarget2.removeEventListener('click', audio.toggleSpeech);
      });

      mouseTarget1.addEventListener('mouseover', beginHoverEffects);
      mouseTarget1.addEventListener('mouseout', endHoverEffects);

      updateTTSStateView(audio.isSpeechEnabled());

      waveAnimationStepNum = 0;
    }

    // Update the TTS button view on any speech state change
    sitecues.on('speech/did-change', updateTTSStateView);

    // Once BP is ready init the badge
    sitecues.on('bp/did-complete', init);

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });
});

