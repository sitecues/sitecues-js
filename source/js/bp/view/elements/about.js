sitecues.def('bp/view/elements/about', function (about, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', function (BP_CONST, state, helper, animate, transform) {

    var ABOUT_ENABLED                 = 1,
        ABOUT_DISABLED                = 0,
        aboutTransitionTo             = ABOUT_DISABLED,
        cssValues                     = {},
        firstEnableAnimationDuration  = 1500,
        secondEnableAnimationDuration = 600,
        disableAnimationDuration      = 500,
        aboutAnimation,
        tipsButton,
        settingsButton,
        feedbackButton,
        aboutButton,
        mainSVG,
        outlineSVG,
        shadowSVG,
        bottomSVG,
        moreButton,
        aboutContent,
        aboutContentButtonContainer,
        aboutContentImage,
        moreBtnTranslate,
        aboutBtnTransform,
        isInitialized = false;

    function initAbout (currentMode) {

      if (isInitialized || currentMode === 0) {
        return;
      }

      isInitialized     = true;
      sitecues.off('bp/did-toggle-secondary-panel', initAbout);

      tipsButton                  = byId(BP_CONST.TIPS_BUTTON_ID);
      settingsButton              = byId(BP_CONST.SETTINGS_BUTTON_ID);
      feedbackButton              = byId(BP_CONST.FEEDBACK_BUTTON_ID);
      aboutButton                 = byId(BP_CONST.ABOUT_BUTTON_ID);
      mainSVG                     = byId(BP_CONST.SVG_ID);
      outlineSVG                  = byId(BP_CONST.MAIN_OUTLINE_BORDER_ID);
      shadowSVG                   = byId(BP_CONST.SHADOW_ID);
      bottomSVG                   = byId(BP_CONST.BOTTOM_MORE_ID);
      moreButton                  = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);
      aboutContent                = byId(BP_CONST.ABOUT_CONTENT_ID);
      aboutContentButtonContainer = byId(BP_CONST.ABOUT_CONTENT_BUTTON_CONTAINER_ID);
      aboutContentImage           = byId(BP_CONST.ABOUT_CONTENT_IMAGE_ID);
      moreBtnTranslate            = transform.getTransform(moreButton.getAttribute('transform')).translate;
      aboutBtnTransform           = transform.getTransform(aboutButton.getAttribute('transform'));

      cssValues[ABOUT_ENABLED] = {
        'outlineHeight'       : 337, // The outline
        'svgHeight'           : 520, // The main SVG, allows more space
        'bottomSVGTranslateY' : 149, // The labels and grey background
        'moreBtnTranslateX'   : 400, // The more button
        'moreBtnTranslateY'   : 346, // The more button
        'aboutBtnTranslateX'  : 175, // The about icon, which rolls to the left
        'aboutBtnTranslateY'  : BP_CONST.TRANSFORMS[BP_CONST.ABOUT_BUTTON_ID].translateY, // The about icon
        'aboutBtnScale'       : 1,    // About icon scales to 1
        'aboutBtnRotate'      : -360, // Roll the about icon
        'aboutBtnRotateX'     : 54,   // A way to rotate around an origin
        'aboutBtnRotateY'     : 54,   // A way to rotate around an origin
        'aboutImageTranslateX': -500
      };

      cssValues[ABOUT_DISABLED] = {
        'outlineHeight'       : getCurrentOutlineHeight(),
        'svgHeight'           : parseFloat(mainSVG.style.height),
        'svgTranslateY'       : transform.getTransform(mainSVG.getAttribute('transform')).translate.top,
        'bottomSVGTranslateY' : transform.getTransform(bottomSVG.getAttribute('transform')).translate.top,
        'moreBtnTranslateX'   : moreBtnTranslate.left,
        'moreBtnTranslateY'   : moreBtnTranslate.top,
        'aboutBtnTranslateX'  : aboutBtnTransform.translate.left,
        'aboutBtnTranslateY'  : aboutBtnTransform.translate.top,
        'aboutBtnScale'       : aboutBtnTransform.scale,
        'aboutBtnRotate'      : 0,  // Roll the about icon
        'aboutBtnRotateX'     : 54, // A way to rotate around an origin
        'aboutBtnRotateY'     : 54, // A way to rotate around an origin
        'aboutImageTranslateX': 0
      };
    }

    function byId (id) {
      return helper.byId(id);
    }

    function getNumberFromString (str) {
      return typeof str === 'number' ? str : +(str.match(/[0-9\.\-]+/));
    }

    function toggleAbout () {

      if (aboutTransitionTo === ABOUT_ENABLED) {
        aboutTransitionTo = ABOUT_DISABLED;
      } else {
        aboutTransitionTo = ABOUT_ENABLED;
      }

      SC_DEV && console.log('Transitioning about mode: ' + aboutTransitionTo);

      animateAbout();

    }

    function resetAbout () {
      if (aboutTransitionTo !== ABOUT_DISABLED) {
        aboutTransitionTo = ABOUT_DISABLED;
        animateAbout(true);
      }
    }

    function getValueInTime (from, to, time) {
      return from + (to - from) * time;
    }

    function getCurrentOutlineHeight () {
      return getNumberFromString(outlineSVG.getAttribute('d').split('0V').pop());
    }

    // Fade out the other buttons ()
    function animateAbout (useInstantAnimation) {

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
          currentAboutBtnTransform    = transform.getTransform(aboutButton.getAttribute('transform')),
          currentAboutBtnTranslateX   = currentAboutBtnTransform.translate.left,
          currentAboutBtnTranslateY   = currentAboutBtnTransform.translate.top,
          currentAboutBtnScale        = currentAboutBtnTransform.scale,
          currentAboutBtnRotate       = currentAboutBtnTransform.rotate,
          currentAboutImageTranslateX = transform.getTransform(aboutContentImage.getAttribute('transform')).translate.left,
          targetCSSValues             = cssValues[aboutTransitionTo],
          targetSVGTranslateY         = aboutTransitionTo === ABOUT_ENABLED ? -(targetCSSValues.svgHeight - currentSVGHeight) / 2 : cssValues[ABOUT_DISABLED].svgTranslateY;

      function onDisabledTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;

        mainSVG.style.height    = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style.transform = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';

        bottomSVG.setAttribute(  'transform', transform.getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute( 'transform', transform.getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t), getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, currentMoreBtnRotate));

        aboutContentImage.setAttribute('transform', transform.getTransformString(getValueInTime(currentAboutImageTranslateX, targetCSSValues.aboutImageTranslateX, t), 0));

        aboutButton.setAttribute('transform', transform.getTransformString(getValueInTime(currentAboutBtnTranslateX, targetCSSValues.aboutBtnTranslateX, t), getValueInTime(currentAboutBtnTranslateY, targetCSSValues.aboutBtnTranslateY, t), getValueInTime(currentAboutBtnScale, targetCSSValues.aboutBtnScale, t), getValueInTime(currentAboutBtnRotate, targetCSSValues.aboutBtnRotate, t), targetCSSValues.aboutBtnRotateX, targetCSSValues.aboutBtnRotateY));

        outlineSVG.setAttribute( 'd', 'M808 ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
        shadowSVG.setAttribute(  'd', 'm808,' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t)+'c0,6 -5,11 -11,11H11m797,-11v-'+(currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));

      }

      function onFirstEnableTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;



        aboutContentImage.setAttribute('transform', transform.getTransformString(getValueInTime(currentAboutImageTranslateX, targetCSSValues.aboutImageTranslateX, t), 0));

        aboutButton.setAttribute('transform', transform.getTransformString(getValueInTime(currentAboutBtnTranslateX, targetCSSValues.aboutBtnTranslateX, t), getValueInTime(currentAboutBtnTranslateY, targetCSSValues.aboutBtnTranslateY, t), getValueInTime(currentAboutBtnScale, targetCSSValues.aboutBtnScale, t), getValueInTime(currentAboutBtnRotate, targetCSSValues.aboutBtnRotate, t), targetCSSValues.aboutBtnRotateX, targetCSSValues.aboutBtnRotateY));
      }

      function onSecondEnableTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;

        mainSVG.style.height    = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style.transform = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';

        bottomSVG.setAttribute(  'transform', transform.getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute( 'transform', transform.getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t), getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, currentMoreBtnRotate));

        outlineSVG.setAttribute( 'd', 'M808 ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
        shadowSVG.setAttribute(  'd', 'm808,' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t)+'c0,6 -5,11 -11,11H11m797,-11v-'+(currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));

      }

      if (aboutTransitionTo === ABOUT_DISABLED) {

        aboutContentButtonContainer.style.opacity = 0;
        tipsButton.style.opacity                  = 1;
        settingsButton.style.opacity              = 1;
        feedbackButton.style.opacity              = 1;

        aboutAnimation = animate.create({
          'from': currentSVGHeight,
          'to'  : targetCSSValues.svgHeight
        }, {
          'duration': useInstantAnimation ? 1 : disableAnimationDuration,
          'onTick'  : onDisabledTick,
          'onFinish': function () {

            if (aboutTransitionTo === ABOUT_ENABLED) {
              aboutContentButtonContainer.style.opacity = 1;
            } else {
              aboutContent.style.display   = 'none';
            }
          }
        });

      } else {

        tipsButton.style.opacity     = 0;
        settingsButton.style.opacity = 0;
        feedbackButton.style.opacity = 0;

        aboutAnimation = animate.create({
          'from': currentAboutImageTranslateX,
          'to'  : targetCSSValues.aboutImageTranslateX
        }, {
          'duration': firstEnableAnimationDuration,
          'onTick'  : onFirstEnableTick,
          'onFinish': function () {
            aboutAnimation = animate.create({
              'from': currentSVGHeight,
              'to'  : targetCSSValues.svgHeight
            }, {
              'duration': secondEnableAnimationDuration,
              'onTick'  : onSecondEnableTick,
              'onFinish': function () {

                if (aboutTransitionTo === ABOUT_ENABLED) {
                  aboutContentButtonContainer.style.opacity = 1;
                } else {
                  aboutContent.style.display   = 'none';
                }
              }
            });
          }
        });

      }

      aboutContent.style.display   = 'block';

    }

    sitecues.on('bp/toggle-about', toggleAbout);

    sitecues.on('bp/did-toggle-secondary-panel', initAbout);

    sitecues.on('bp/will-shrink bp/toggle-secondary-panel', resetAbout);

    callback();

  });
});
