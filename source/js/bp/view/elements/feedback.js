sitecues.def('bp/view/elements/feedback', function (feedback, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', function (BP_CONST, state, helper, animate, transform) {

    var FEEDBACK_ENABLED         = 1,
        FEEDBACK_DISABLED        = 0,
        feedbackTransitionTo        = FEEDBACK_DISABLED,
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
        feedbackContent,
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
      feedbackContent             = byId(BP_CONST.FEEDBACK_CONTENT_ID);
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

      if (feedbackTransitionTo === FEEDBACK_ENABLED) {
        feedbackTransitionTo = FEEDBACK_DISABLED;
      } else {
        feedbackTransitionTo = FEEDBACK_ENABLED;
      }

      SC_DEV && console.log('Transitioning about mode: ' + feedbackTransitionTo);

      animateFeedback();

    }

    function resetFeedback () {
      if (feedbackTransitionTo !== FEEDBACK_DISABLED) {
        feedbackTransitionTo = FEEDBACK_DISABLED;
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

      var currentOutlineHeight        = getCurrentOutlineHeight(),
          currentSVGHeight            = parseFloat(mainSVG.style.height),
          currentSVGTranslateY        = transform.getTransform(mainSVG.style.transform).translate.top,
          currentBottomSVGTranslateY  = transform.getTransform(bottomSVG.getAttribute('transform')).translate.top,
          currentMoreBtnTransform     = transform.getTransform(moreButton.getAttribute('transform')),
          currentMoreBtnTranslate     = currentMoreBtnTransform.translate,
          currentMoreBtnTranslateX    = currentMoreBtnTranslate.left,
          currentMoreBtnTranslateY    = currentMoreBtnTranslate.top,
          currentMoreBtnScale         = currentMoreBtnTransform.scale,
          currentMoreBtnRotate        = currentMoreBtnTransform.rotate,
          currentfeedbackBtnTransform    = transform.getTransform(feedbackButton.getAttribute('transform')),
          currentFeedbackBtnTranslateX   = currentfeedbackBtnTransform.translate.left,
          currentFeedbackBtnTranslateY   = currentfeedbackBtnTransform.translate.top,
          currentFeedbackBtnScale        = currentfeedbackBtnTransform.scale,

          targetCSSValues             = cssValues[feedbackTransitionTo],
          targetSVGTranslateY         = feedbackTransitionTo === FEEDBACK_ENABLED ? -(targetCSSValues.svgHeight - currentSVGHeight) / 2 : cssValues[FEEDBACK_DISABLED].svgTranslateY;

      function onDisabledTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;

        mainSVG.style.height    = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style.transform = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';

        bottomSVG.setAttribute(  'transform', transform.getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute( 'transform', transform.getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t), getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, currentMoreBtnRotate));

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

      if (feedbackTransitionTo === FEEDBACK_DISABLED) {

        tipsButton.style.opacity                  = 1;
        settingsButton.style.opacity              = 1;
        aboutButton.style.opacity                 = 1;
        feedbackTextarea.style.display            = 'none';

        feedbackAnimation = animate.create({
          'from': currentSVGHeight,
          'to'  : targetCSSValues.svgHeight
        }, {
          'duration': useInstantAnimation ? 1 : disableAnimationDuration,
          'onTick'  : onDisabledTick,
          'onFinish': function () {
            if (feedbackTransitionTo === FEEDBACK_ENABLED) {
              feedbackTextarea.style.display = 'block';

            } else {
              feedbackContent.style.display   = 'none';
            }
          }
        });

      } else {

        tipsButton.style.opacity     = 0;
        aboutButton.style.opacity    = 0;
        settingsButton.style.opacity = 0;
        feedbackButton.style.opacity = 1;

        feedbackAnimation = animate.create({
          'from': currentSVGHeight,
          'to'  : targetCSSValues.svgHeight
        }, {
          'duration': enableAnimationDuration,
          'onTick'  : onEnableTick,
          'onFinish': function () {
            feedbackTextarea.style.display = 'block';
          }
        });

      }

      feedbackContent.style.display   = 'block';

    }

    sitecues.on('bp/toggle-feedback', toggleFeedback);

    sitecues.on('bp/did-toggle-secondary-panel', initFeedback);

    sitecues.on('bp/will-shrink bp/toggle-secondary-panel', resetFeedback);

    callback();

  });
});
