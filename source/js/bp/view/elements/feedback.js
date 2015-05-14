sitecues.def('bp/view/elements/feedback', function (feedback, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', function (BP_CONST, state, helper, animate, transform) {

    var FEEDBACK_ENABLED         = 1,
        FEEDBACK_DISABLED        = 0,
        cssValues                = {},
        enableAnimationDuration  = 1500,
        disableAnimationDuration = 500,
        feedbackAnimation,
        tipsButton,
        settingsButton,
        feedbackButton,
        aboutButton,
        mainSVG,
        outlineSVG,
        shadowSVG,
        bottomSVG,
        moreButton,
        tipsContent,
        arrowButtons,
        settingsContent,
        feedbackContent,
        aboutContent,
        settingsCards,
        tipsCards,
        feedbackTextarea,
        moreBtnTranslate,
        feedbackBtnTransform,
        isInitialized = false;

    function initFeedback (currentMode) {

      if (isInitialized || currentMode === 0) {
        return;
      }

      isInitialized     = true;
      sitecues.off('bp/did-toggle-secondary-panel', initFeedback);

      tipsButton                  = byId(BP_CONST.TIPS_BUTTON_ID);
      settingsButton              = byId(BP_CONST.SETTINGS_BUTTON_ID);
      feedbackButton              = byId(BP_CONST.FEEDBACK_BUTTON_ID);
      aboutButton                 = byId(BP_CONST.ABOUT_BUTTON_ID);
      mainSVG                     = byId(BP_CONST.SVG_ID);
      outlineSVG                  = byId(BP_CONST.MAIN_OUTLINE_BORDER_ID);
      shadowSVG                   = byId(BP_CONST.SHADOW_ID);
      bottomSVG                   = byId(BP_CONST.BOTTOM_MORE_ID);
      moreButton                  = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);
      tipsContent                 = byId(BP_CONST.TIPS_CONTENT_ID);
      settingsContent             = byId(BP_CONST.SETTINGS_CONTENT_ID);
      feedbackContent             = byId(BP_CONST.FEEDBACK_CONTENT_ID);
      aboutContent                = byId(BP_CONST.ABOUT_CONTENT_ID);
      settingsCards               = byId(BP_CONST.SETTINGS_CARDS_ID);
      tipsCards                   = byId(BP_CONST.TIPS_CARDS_ID);
      arrowButtons                = byId(BP_CONST.ARROWS_ID);
      feedbackTextarea            = byId(BP_CONST.FEEDBACK_TEXTAREA);
      moreBtnTranslate            = transform.getTransform(moreButton.getAttribute('transform')).translate;
      feedbackBtnTransform        = transform.getTransform(feedbackButton.getAttribute('transform'));

      cssValues[FEEDBACK_ENABLED] = {
        'outlineHeight'        : 377, // The outline
        'svgHeight'            : 520, // The main SVG, allows more space
        'bottomSVGTranslateY'  : 189, // The labels and grey background
        'moreBtnTranslateX'    : 400, // The more button
        'moreBtnTranslateY'    : 386, // The more button
        'feedbackBtnTranslateX': 666, // The about icon, which rolls to the left
        'feedbackBtnTranslateY': BP_CONST.TRANSFORMS[BP_CONST.FEEDBACK_BUTTON_ID].translateY, // The about icon
        'feedbackBtnScale'     : 1,    // About icon scales to 1
        'feedbackBtnRotate'    : 0,   // Roll the about icon
        'feedbackBtnRotateX'   : 0,   // A way to rotate around an origin
        'feedbackBtnRotateY'   : 0    // A way to rotate around an origin
      };

      cssValues[FEEDBACK_DISABLED] = {
        'outlineHeight'        : getCurrentOutlineHeight(),
        'svgHeight'            : parseFloat(mainSVG.style.height),
        'svgTranslateY'        : transform.getTransform(mainSVG.getAttribute('transform')).translate.top,
        'bottomSVGTranslateY'  : transform.getTransform(bottomSVG.getAttribute('transform')).translate.top,
        'moreBtnTranslateX'    : moreBtnTranslate.left,
        'moreBtnTranslateY'    : moreBtnTranslate.top,
        'feedbackBtnTranslateX': feedbackBtnTransform.translate.left,
        'feedbackBtnTranslateY': feedbackBtnTransform.translate.top,
        'feedbackBtnScale'     : feedbackBtnTransform.scale,
        'feedbackBtnRotate'    : 0,  // Roll the about icon
        'feedbackBtnRotateX'   : 54, // A way to rotate around an origin
        'feedbackBtnRotateY'   : 54  // A way to rotate around an origin
      };
    }

    function byId (id) {
      return helper.byId(id);
    }

    function getNumberFromString (str) {
      return typeof str === 'number' ? str : +(str.match(/[0-9\.\-]+/));
    }

    function toggleFeedback () {

      if (state.get('feedbackMode') === FEEDBACK_ENABLED) {
        state.set('feedbackMode', FEEDBACK_DISABLED);
      } else {
        state.set('feedbackMode', FEEDBACK_ENABLED);
      }

      SC_DEV && console.log('Transitioning feedback mode: ' + state.get('feedbackMode'));

      animateFeedback();

    }

    function resetFeedback () {
      if (state.get('feedbackMode') !== FEEDBACK_DISABLED) {
        state.set('feedbackMode', FEEDBACK_DISABLED);
        animateFeedback(true);
      }
    }

    function getValueInTime (from, to, time) {
      return from + (to - from) * time;
    }

    function getCurrentOutlineHeight () {
      return getNumberFromString(outlineSVG.getAttribute('d').split('0V').pop());
    }

    // Fade out the other buttons ()
    function animateFeedback (useInstantAnimation) {

      var feedbackTransitionTo         = state.get('feedbackMode'),
          targetCSSValues              = cssValues[feedbackTransitionTo],
          fromCSSValues                = feedbackTransitionTo === FEEDBACK_DISABLED ? cssValues[FEEDBACK_ENABLED] : cssValues[FEEDBACK_DISABLED],
          currentOutlineHeight         = getCurrentOutlineHeight(),
          currentSVGHeight             = parseFloat(mainSVG.style.height),
          currentSVGTranslateY         = transform.getTransform(mainSVG.style.transform).translate.top,
          currentBottomSVGTranslateY   = transform.getTransform(bottomSVG.getAttribute('transform')).translate.top,
          currentMoreBtnTransform      = transform.getTransform(moreButton.getAttribute('transform')),
          currentMoreBtnTranslate      = currentMoreBtnTransform.translate,
          currentMoreBtnTranslateX     = currentMoreBtnTranslate.left,
          currentMoreBtnTranslateY     = currentMoreBtnTranslate.top,
          currentMoreBtnScale          = currentMoreBtnTransform.scale,
          currentMoreBtnRotate         = currentMoreBtnTransform.rotate,
          currentfeedbackBtnTransform  = transform.getTransform(feedbackButton.getAttribute('transform')),
          currentFeedbackBtnTranslateX = currentfeedbackBtnTransform.translate.left,
          currentFeedbackBtnTranslateY = currentfeedbackBtnTransform.translate.top,
          currentFeedbackBtnScale      = currentfeedbackBtnTransform.scale,
          targetMoreBtnRotate          = state.isShrinking() ? 0 : currentMoreBtnRotate,
          targetSVGTranslateY          = feedbackTransitionTo === FEEDBACK_ENABLED ? currentSVGTranslateY - (targetCSSValues.svgHeight - currentSVGHeight) / 2 : cssValues[FEEDBACK_DISABLED].svgTranslateY;

      feedbackAnimation && feedbackAnimation.cancel();

      function onDisabledTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;

        mainSVG.style.height    = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style.transform = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';
        bottomSVG.setAttribute(  'transform', transform.getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute( 'transform', transform.getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t), getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, targetMoreBtnRotate));
        feedbackButton.setAttribute('transform', transform.getTransformString(getValueInTime(currentFeedbackBtnTranslateX, targetCSSValues.feedbackBtnTranslateX, t), getValueInTime(currentFeedbackBtnTranslateY, targetCSSValues.feedbackBtnTranslateY, t), getValueInTime(currentFeedbackBtnScale, targetCSSValues.feedbackBtnScale, t)));
        outlineSVG.setAttribute( 'd', 'M808 ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
        shadowSVG.setAttribute(  'd', 'm808,' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t)+'c0,6 -5,11 -11,11H11m797,-11v-'+(currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));

      }

      function onEnableTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;

        mainSVG.style.height    = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style.transform = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';

        bottomSVG.setAttribute(  'transform', transform.getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute( 'transform', transform.getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t), getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, currentMoreBtnRotate));

        outlineSVG.setAttribute( 'd', 'M808 ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
        shadowSVG.setAttribute(  'd', 'm808,' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t)+'c0,6 -5,11 -11,11H11m797,-11v-'+(currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));

        feedbackButton.setAttribute('transform', transform.getTransformString(getValueInTime(currentFeedbackBtnTranslateX, targetCSSValues.feedbackBtnTranslateX, t), getValueInTime(currentFeedbackBtnTranslateY, targetCSSValues.feedbackBtnTranslateY, t), getValueInTime(currentFeedbackBtnScale, targetCSSValues.feedbackBtnScale, t)));

      }

      sitecues.emit('bp/do-disable-button', aboutButton);
      sitecues.emit('bp/do-disable-button', feedbackButton);
      sitecues.emit('bp/do-disable-button', settingsButton);
      sitecues.emit('bp/do-disable-button', tipsButton);

      if (feedbackTransitionTo === FEEDBACK_DISABLED) {

        tipsButton.style.display       = 'block';
        settingsButton.style.display   = 'block';
        aboutButton.style.display      = 'block';
        tipsButton.style.opacity       = 1;
        settingsButton.style.opacity   = 1;
        aboutButton.style.opacity      = 1;
        feedbackTextarea.style.display = 'none';
        feedbackContent.style.opacity  = 0;

        settingsButton.setAttribute('transform', transform.getTransformString(BP_CONST.TRANSFORMS[settingsButton.id].translateX, BP_CONST.TRANSFORMS[settingsButton.id].translateY));

        tipsButton.setAttribute('transform', transform.getTransformString(BP_CONST.TRANSFORMS[tipsButton.id].translateX, BP_CONST.TRANSFORMS[tipsButton.id].translateY));
        aboutButton.setAttribute('transform', transform.getTransformString(BP_CONST.TRANSFORMS[aboutButton.id].translateX, BP_CONST.TRANSFORMS[aboutButton.id].translateY));


        feedbackAnimation = animate.create({
          'from': currentSVGHeight,
          'to'  : targetCSSValues.svgHeight
        }, {
          'duration': useInstantAnimation ? 1 : animate.getDuration(disableAnimationDuration, fromCSSValues.moreBtnTranslateY, targetCSSValues.moreBtnTranslateY, currentMoreBtnTranslateY),
          'onTick'  : onDisabledTick,
          'onFinish': function () {
            feedbackContent.style.display = 'none';
            sitecues.emit('bp/do-enable-button', aboutButton);
            sitecues.emit('bp/do-enable-button', feedbackButton);
            sitecues.emit('bp/do-enable-button', settingsButton);
            sitecues.emit('bp/do-enable-button', tipsButton);
          }
        });

      } else {

        arrowButtons.style.opacity    = 0;
        tipsButton.style.opacity      = 0;
        aboutButton.style.opacity     = 0;
        settingsButton.style.opacity  = 0;
        feedbackButton.style.opacity  = 1;
        feedbackContent.style.display = 'block';
        feedbackButton.style.display  = 'block';
        feedbackContent.style.opacity = 1;
        tipsContent.style.opacity     = 0;
        settingsContent.style.opacity = 0;
        aboutContent.style.opacity    = 0;
        tipsCards.style.opacity       = 0;
        settingsCards.style.opacity   = 0;
        state.set('tipsMode', 0);
        state.set('settingsMode', 0);
        state.set('aboutMode', 0);

        feedbackAnimation = animate.create({
          'from': currentSVGHeight,
          'to'  : targetCSSValues.svgHeight
        }, {
          'duration': useInstantAnimation ? 1 : animate.getDuration(enableAnimationDuration, fromCSSValues.moreBtnTranslateY, targetCSSValues.moreBtnTranslateY, currentMoreBtnTranslateY),
          'onTick'  : onEnableTick,
          'onFinish': function () {
            feedbackTextarea.style.display = 'block';
            arrowButtons.style.display     = 'none';
            tipsButton.style.display       = 'none';
            settingsButton.style.display   = 'none';
            aboutButton.style.display      = 'none';
            sitecues.emit('bp/do-enable-button', feedbackButton);
          }
        });

      }

    }

    sitecues.on('bp/toggle-feedback', toggleFeedback);

    sitecues.on('bp/did-toggle-secondary-panel', initFeedback);

    sitecues.on('bp/will-shrink bp/toggle-secondary-panel', resetFeedback);

    callback();

  });
});
