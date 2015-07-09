// TODO wave animation broken except in default badge
sitecues.def('bp/view/elements/tts-button', function (ttsButton, callback) {
  'use strict';

  sitecues.use('bp/constants', 'bp/helper', 'audio', 'bp/model/state', 'locale',
    function (BP_CONST, helper, audio, state, locale) {

    var waveAnimationTimer,
        waveAnimationStepNum;

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

      var mouseTarget1 = getTTSButtonElement(),
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

    callback();
  });
});

