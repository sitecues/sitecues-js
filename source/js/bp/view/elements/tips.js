sitecues.def('bp/view/elements/tips', function (tips, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', function (BP_CONST, state, helper, animate, transform) {

    var TIPS_ENABLED             = 1,
        TIPS_DISABLED            = 0,

        enableAnimationDuration  = 1500,
        disableAnimationDuration = 500,

        cssValues                = {},

        tipsAnimation,

        tipsButton,
        settingsButton,
        feedbackButton,
        aboutButton,
        mainSVG,
        outlineSVG,
        shadowSVG,
        bottomSVG,
        moreButton,
        arrowButtons,
        contentButton,
        feedbackContent,
        feedbackTextArea,
        aboutContent,
        settingsCards,
        tipsCards,

        moreBtnTranslate,
        tipsBtnTransform;

    function initTips () {

      sitecues.off('bp/did-toggle-secondary-panel', initTips);

      tipsButton       = byId(BP_CONST.TIPS_BUTTON_ID);
      settingsButton   = byId(BP_CONST.SETTINGS_BUTTON_ID);
      feedbackButton   = byId(BP_CONST.FEEDBACK_BUTTON_ID);
      aboutButton      = byId(BP_CONST.ABOUT_BUTTON_ID);
      mainSVG          = byId(BP_CONST.SVG_ID);
      outlineSVG       = byId(BP_CONST.MAIN_OUTLINE_BORDER_ID);
      shadowSVG        = byId(BP_CONST.SHADOW_ID);
      bottomSVG        = byId(BP_CONST.BOTTOM_MORE_ID);
      moreButton       = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);
      contentButton    = byId(BP_CONST.FEEDBACK_CONTENT_BUTTON_ID);
      feedbackContent  = byId(BP_CONST.FEEDBACK_CONTENT_ID);
      feedbackTextArea = byId(BP_CONST.FEEDBACK_TEXTAREA);
      aboutContent     = byId(BP_CONST.ABOUT_CONTENT_ID);
      settingsCards    = byId(BP_CONST.SETTINGS_CARDS_ID);
      tipsCards        = byId(BP_CONST.TIPS_CARDS_ID);
      arrowButtons     = byId(BP_CONST.ARROWS_ID);

      moreBtnTranslate = getTransform(moreButton.getAttribute('transform')).translate;
      tipsBtnTransform = getTransform(tipsButton.getAttribute('transform'));

      cssValues[TIPS_ENABLED] = {
        'outlineHeight'        : 377, // The outline
        'svgHeight'            : 520, // The main SVG, allows more space
        'bottomSVGTranslateY'  : 189, // The labels and grey background
        'moreBtnTranslateX'    : 400, // The more button
        'moreBtnTranslateY'    : 386, // The more button
        'settingsBtnTranslateX': 26, // The about icon, which rolls to the left
        'settingsBtnTranslateY': BP_CONST.TRANSFORMS[BP_CONST.FEEDBACK_BUTTON_ID].translateY, // The about icon
        'settingsBtnScale'     : 1,    // About icon scales to 1
        'settingsBtnRotate'    : 0,   // Roll the about icon
        'settingsBtnRotateX'   : 0,   // A way to rotate around an origin
        'settingsBtnRotateY'   : 0    // A way to rotate around an origin
      };

      cssValues[TIPS_DISABLED] = {
        'outlineHeight'        : getCurrentOutlineHeight(),
        'svgHeight'            : parseFloat(mainSVG.style.height),
        'svgTranslateY'        : getTransform(mainSVG.getAttribute('transform')).translate.top,
        'bottomSVGTranslateY'  : getTransform(bottomSVG.getAttribute('transform')).translate.top,
        'moreBtnTranslateX'    : moreBtnTranslate.left,
        'moreBtnTranslateY'    : moreBtnTranslate.top,
        'settingsBtnTranslateX': tipsBtnTransform.translate.left,
        'settingsBtnTranslateY': tipsBtnTransform.translate.top,
        'settingsBtnScale'     : tipsBtnTransform.scale,
        'settingsBtnRotate'    : 0,  // Roll the about icon
        'settingsBtnRotateX'   : 54, // A way to rotate around an origin
        'settingsBtnRotateY'   : 54  // A way to rotate around an origin
      };
    }

    function byId (id) {
      return helper.byId(id);
    }

    function getTransform (string) {
      return transform.getTransform(string);
    }

    function getTransformString (x, y, scale, rotate) {
      return transform.getTransformString(x, y, scale, rotate);
    }

    function getNumberFromString (str) {
      return typeof str === 'number' ? str : +(str.match(/[0-9\.\-]+/));
    }

    function toggleTips () {

      if (state.get('tipsMode') === TIPS_ENABLED) {
        state.set('tipsMode', TIPS_DISABLED);
      } else {
        state.set('tipsMode', TIPS_ENABLED);
      }

      SC_DEV && console.log('Transitioning tips mode: ' + state.get('tipsMode'));

      animateTips();

    }

    function resetTips () {
      if (state.get('tipsMode') !== TIPS_DISABLED) {
        state.set('tipsMode', TIPS_DISABLED);
        animateTips(true);
      }
    }

    function getValueInTime (from, to, time) {
      return from + (to - from) * time;
    }

    function getCurrentOutlineHeight () {
      return getNumberFromString(outlineSVG.getAttribute('d').split(' ').pop());
    }

    // Fade out the other buttons ()
    function animateTips (useInstantAnimation) {

      var tipsTransitionTo             = state.get('tipsMode'),

          targetCSSValues              = cssValues[tipsTransitionTo],
          fromCSSValues                = tipsTransitionTo === TIPS_DISABLED ? cssValues[TIPS_ENABLED] : cssValues[TIPS_DISABLED],

          currentOutlineHeight         = getCurrentOutlineHeight(),

          currentSVGHeight             = parseFloat(mainSVG.style.height),
          currentSVGTranslateY         = getTransform(mainSVG.style[helper.transformProperty]).translate.top,

          currentBottomSVGTranslateY   = getTransform(bottomSVG.getAttribute('transform')).translate.top,

          currentMoreBtnTransform      = getTransform(moreButton.getAttribute('transform')),
          currentMoreBtnTranslate      = currentMoreBtnTransform.translate,
          currentMoreBtnTranslateX     = currentMoreBtnTranslate.left,
          currentMoreBtnTranslateY     = currentMoreBtnTranslate.top,
          currentMoreBtnScale          = currentMoreBtnTransform.scale,
          currentMoreBtnRotate         = currentMoreBtnTransform.rotate,

          currentTipsBtnTransform      = getTransform(tipsButton.getAttribute('transform')),
          currentTipsBtnTranslateX     = currentTipsBtnTransform.translate.left,
          currentTipsBtnTranslateY     = currentTipsBtnTransform.translate.top,
          currentTipsBtnScale          = currentTipsBtnTransform.scale,

          targetMoreBtnRotate          = state.isShrinking() ? 0 : currentMoreBtnRotate,

          targetSVGTranslateY          = tipsTransitionTo === TIPS_ENABLED ? currentSVGTranslateY - (targetCSSValues.svgHeight - currentSVGHeight) / 2 : cssValues[TIPS_DISABLED].svgTranslateY;

      // Cancel the currently running animation if it exists.
      tipsAnimation && tipsAnimation.cancel();

      function onDisabledTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;

        mainSVG.style.height    = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style[helper.transformProperty] = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';
        bottomSVG.setAttribute(  'transform', getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute( 'transform', getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t), getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, targetMoreBtnRotate));
        tipsButton.setAttribute( 'transform', getTransformString(getValueInTime(currentTipsBtnTranslateX, targetCSSValues.settingsBtnTranslateX, t), getValueInTime(currentTipsBtnTranslateY, targetCSSValues.settingsBtnTranslateY, t), getValueInTime(currentTipsBtnScale, targetCSSValues.settingsBtnScale, t)));
        outlineSVG.setAttribute( 'd', 'M808 ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
        shadowSVG.setAttribute(  'd', 'm808,' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t)+'c0,6 -5,11 -11,11H11m797,-11v-'+(currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));

      }

      function onEnableTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;

        mainSVG.style.height    = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style[helper.transformProperty] = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';

        bottomSVG.setAttribute(  'transform', getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute( 'transform', getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t), getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, currentMoreBtnRotate));

        outlineSVG.setAttribute( 'd', 'M808 ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
        shadowSVG.setAttribute(  'd', 'm808,' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t)+'c0,6 -5,11 -11,11H11m797,-11v-'+(currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));

        tipsButton.setAttribute('transform', getTransformString(getValueInTime(currentTipsBtnTranslateX, targetCSSValues.settingsBtnTranslateX, t), getValueInTime(currentTipsBtnTranslateY, targetCSSValues.settingsBtnTranslateY, t), getValueInTime(currentTipsBtnScale, targetCSSValues.settingsBtnScale, t)));

      }

      sitecues.emit('bp/do-disable-button', aboutButton);
      sitecues.emit('bp/do-disable-button', feedbackButton);
      sitecues.emit('bp/do-disable-button', settingsButton);
      sitecues.emit('bp/do-disable-button', tipsButton);

      if (tipsTransitionTo === TIPS_DISABLED) {

        tipsButton.style.opacity       = 1;
        settingsButton.style.opacity   = 1;
        feedbackButton.style.opacity   = 1;
        aboutButton.style.opacity      = 1;
        tipsButton.style.display       = 'block';
        settingsButton.style.display   = 'block';
        feedbackButton.style.display   = 'block';
        aboutButton.style.display      = 'block';
        arrowButtons.style.opacity     = 0;
        tipsCards.style.opacity        = 0;

        settingsButton.setAttribute('transform', getTransformString(BP_CONST.TRANSFORMS[settingsButton.id].translateX, BP_CONST.TRANSFORMS[settingsButton.id].translateY));
        feedbackButton.setAttribute('transform', getTransformString(BP_CONST.TRANSFORMS[feedbackButton.id].translateX, BP_CONST.TRANSFORMS[feedbackButton.id].translateY));

        aboutButton.setAttribute('transform', getTransformString(BP_CONST.TRANSFORMS[aboutButton.id].translateX, BP_CONST.TRANSFORMS[aboutButton.id].translateY));


        tipsAnimation = animate.create({
          'from': currentSVGHeight,
          'to'  : targetCSSValues.svgHeight
        }, {
          'duration': useInstantAnimation ? 1 : animate.getDuration(disableAnimationDuration, fromCSSValues.moreBtnTranslateY, targetCSSValues.moreBtnTranslateY, currentMoreBtnTranslateY),
          'onTick'  : onDisabledTick,
          'onFinish': function () {
            arrowButtons.style.display = 'none';
            sitecues.emit('bp/do-enable-button', aboutButton);
            sitecues.emit('bp/do-enable-button', feedbackButton);
            sitecues.emit('bp/do-enable-button', settingsButton);
            sitecues.emit('bp/do-enable-button', tipsButton);
          }
        });

      } else {

        tipsButton.style.display      = 'block';
        tipsButton.style.opacity      = 1;
        aboutButton.style.opacity     = 0;
        feedbackButton.style.opacity  = 0;
        settingsButton.style.opacity  = 0;
        contentButton.style.display   = 'none';
        tipsCards.style.display       = 'block';
        arrowButtons.style.display    = 'block';

        feedbackContent.style.opacity = 0;
        aboutContent.style.opacity    = 0;
        settingsCards.style.opacity   = 0;
        settingsCards.style.display   = 'none';
        feedbackTextArea.style.display = 'none';
        state.set('settingsMode', 0);
        state.set('feedbackMode', 0);
        state.set('aboutMode', 0);

        tipsAnimation = animate.create({
          'from': currentSVGHeight,
          'to'  : targetCSSValues.svgHeight
        }, {
          'duration': useInstantAnimation ? 1 : animate.getDuration(enableAnimationDuration, fromCSSValues.moreBtnTranslateY, targetCSSValues.moreBtnTranslateY, currentMoreBtnTranslateY),
          'onTick'  : onEnableTick,
          'onFinish': function () {

            tipsCards.style.opacity      = 1;
            arrowButtons.style.opacity   = 1;
            feedbackButton.style.display = 'none';
            settingsButton.style.display = 'none';
            aboutButton.style.display    = 'none';

            sitecues.emit('bp/do-enable-button', tipsButton);
          }
        });

      }

    }

    sitecues.on('bp/toggle-tips', toggleTips);

    sitecues.on('bp/did-toggle-secondary-panel', initTips);

    sitecues.on('bp/will-shrink bp/toggle-secondary-panel', resetTips);

    callback();

  });
});
