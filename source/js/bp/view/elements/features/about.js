sitecues.def('bp/view/elements/about', function (about, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', 'bp/view/elements/general-features',
    function (BP_CONST, state, helper, animate, transform, generalFeatures) {

    var ABOUT_ENABLED                 = 1,
        ABOUT_DISABLED                = 0,

        firstEnableAnimationDuration  = 1500,
        secondEnableAnimationDuration = 600,
        disableAnimationDuration      = 500,

        cssValues                     = {},

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
        contentButton,
        feedbackContent,
        feedbackTextArea,
        aboutContent,
        aboutContentImage,
        settingsCards,
        tipsCards,
        arrowButtons,

        moreBtnTranslate,
        aboutBtnTransform;

    function initAbout () {

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
      contentButton               = byId(BP_CONST.FEEDBACK_CONTENT_BUTTON_ID);
      feedbackContent             = byId(BP_CONST.FEEDBACK_CONTENT_ID);
      feedbackTextArea            = byId(BP_CONST.FEEDBACK_TEXTAREA);
      aboutContent                = byId(BP_CONST.ABOUT_CONTENT_ID);
      settingsCards               = byId(BP_CONST.SETTINGS_CARDS_ID);
      tipsCards                   = byId(BP_CONST.TIPS_CARDS_ID);
      arrowButtons                = byId(BP_CONST.ARROWS_ID);
      aboutContentImage           = byId(BP_CONST.ABOUT_CONTENT_IMAGE_ID);

      moreBtnTranslate            = getTransform(moreButton.getAttribute('transform')).translate;
      aboutBtnTransform           = getTransform(aboutButton.getAttribute('transform'));

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
        'svgTranslateY'       : getTransform(mainSVG.getAttribute('transform')).translate.top,
        'bottomSVGTranslateY' : getTransform(bottomSVG.getAttribute('transform')).translate.top,
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

    function getTransform (string) {
      return transform.getTransform(string);
    }

    function getTransformString (x, y, scale, rotate, rotateX, rotateY) {
      return transform.getTransformString(x, y, scale, rotate, rotateX, rotateY);
    }

    function getNumberFromString (str) {
      return typeof str === 'number' ? str : +(str.match(/[0-9\.\-]+/));
    }

    function toggleAbout () {

      if (state.get('aboutMode') === ABOUT_ENABLED) {
        state.set('aboutMode', ABOUT_DISABLED);
      } else {
        state.set('aboutMode', ABOUT_ENABLED);
      }

      SC_DEV && console.log('Transitioning about mode: ' + state.get('aboutMode'));

      animateAbout();

    }

    function resetAbout () {
      if (state.get('aboutMode') !== ABOUT_DISABLED) {
        state.set('aboutMode', ABOUT_DISABLED);
        animateAbout(true);
      }
    }

    function getValueInTime (from, to, time) {
      return from + (to - from) * time;
    }

    function getCurrentOutlineHeight () {
      return getNumberFromString(outlineSVG.getAttribute('d').split(' ').pop());
    }

    // Fade out the other buttons ()
    function animateAbout (useInstantAnimation) {

      var aboutTransitionTo           = state.get('aboutMode'),
          currentOutlineHeight        = getCurrentOutlineHeight(),
          fromCSSValues               = aboutTransitionTo === ABOUT_DISABLED ? cssValues[ABOUT_ENABLED] : cssValues[ABOUT_DISABLED],
          targetCSSValues             = cssValues[aboutTransitionTo],
          currentSVGHeight            = parseFloat(mainSVG.style.height),
          currentSVGTranslateY        = getTransform(mainSVG.style[helper.transformProperty]).translate.top,
          currentBottomSVGTranslateY  = getTransform(bottomSVG.getAttribute('transform')).translate.top,
          currentMoreBtnTransform     = getTransform(moreButton.getAttribute('transform')),
          currentMoreBtnTranslate     = currentMoreBtnTransform.translate,
          currentMoreBtnTranslateX    = currentMoreBtnTranslate.left,
          currentMoreBtnTranslateY    = currentMoreBtnTranslate.top,
          currentMoreBtnScale         = currentMoreBtnTransform.scale,
          currentMoreBtnRotate        = currentMoreBtnTransform.rotate,
          currentAboutBtnTransform    = getTransform(aboutButton.getAttribute('transform')),
          currentAboutBtnTranslateX   = currentAboutBtnTransform.translate.left,
          currentAboutBtnTranslateY   = currentAboutBtnTransform.translate.top,
          currentAboutBtnScale        = currentAboutBtnTransform.scale,
          currentAboutBtnRotate       = currentAboutBtnTransform.rotate,
          currentAboutImageTranslateX = getTransform(aboutContentImage.getAttribute('transform')).translate.left,
          targetMoreBtnRotate         = state.isShrinking() ? 0 : currentMoreBtnRotate,
          targetSVGTranslateY         = aboutTransitionTo === ABOUT_ENABLED ? currentSVGTranslateY - (targetCSSValues.svgHeight - currentSVGHeight) / 2 : cssValues[ABOUT_DISABLED].svgTranslateY;

      aboutAnimation && aboutAnimation.cancel();

      function onDisabledTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;

        mainSVG.style.height    = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style[helper.transformProperty] = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';

        bottomSVG.setAttribute(  'transform', getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute( 'transform', getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t), getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, targetMoreBtnRotate));

        aboutContentImage.setAttribute('transform', getTransformString(getValueInTime(currentAboutImageTranslateX, targetCSSValues.aboutImageTranslateX, t), 0));

        aboutButton.setAttribute('transform', getTransformString(getValueInTime(currentAboutBtnTranslateX, targetCSSValues.aboutBtnTranslateX, t), getValueInTime(currentAboutBtnTranslateY, targetCSSValues.aboutBtnTranslateY, t), getValueInTime(currentAboutBtnScale, targetCSSValues.aboutBtnScale, t), getValueInTime(currentAboutBtnRotate, targetCSSValues.aboutBtnRotate, t), targetCSSValues.aboutBtnRotateX, targetCSSValues.aboutBtnRotateY));

        outlineSVG.setAttribute( 'd', 'M808 ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
        shadowSVG.setAttribute(  'd', 'm808,' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t)+'c0,6 -5,11 -11,11H11m797,-11v-'+(currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));

      }

      function onFirstEnableTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;



        aboutContentImage.setAttribute('transform', getTransformString(getValueInTime(currentAboutImageTranslateX, targetCSSValues.aboutImageTranslateX, t), 0));

        aboutButton.setAttribute('transform', getTransformString(getValueInTime(currentAboutBtnTranslateX, targetCSSValues.aboutBtnTranslateX, t), getValueInTime(currentAboutBtnTranslateY, targetCSSValues.aboutBtnTranslateY, t), getValueInTime(currentAboutBtnScale, targetCSSValues.aboutBtnScale, t), getValueInTime(currentAboutBtnRotate, targetCSSValues.aboutBtnRotate, t), targetCSSValues.aboutBtnRotateX, targetCSSValues.aboutBtnRotateY));
      }

      function onSecondEnableTick (animationState) {

        // Time: 0 - 1
        var t = animationState.current;

        mainSVG.style.height    = getValueInTime(currentSVGHeight, targetCSSValues.svgHeight, t) + 'px';
        mainSVG.style[helper.transformProperty] = 'translate(0,' + getValueInTime(currentSVGTranslateY, targetSVGTranslateY, t) + 'px)';

        bottomSVG.setAttribute(  'transform', getTransformString(0, getValueInTime(currentBottomSVGTranslateY, targetCSSValues.bottomSVGTranslateY, t)));
        moreButton.setAttribute( 'transform', getTransformString(getValueInTime(currentMoreBtnTranslateX, targetCSSValues.moreBtnTranslateX, t), getValueInTime(currentMoreBtnTranslateY, targetCSSValues.moreBtnTranslateY, t), currentMoreBtnScale, currentMoreBtnRotate));

        outlineSVG.setAttribute( 'd', 'M808 ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V ' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));
        shadowSVG.setAttribute(  'd', 'm808,' + (currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t)+'c0,6 -5,11 -11,11H11m797,-11v-'+(currentOutlineHeight + (targetCSSValues.outlineHeight - currentOutlineHeight) * t));

      }

      sitecues.emit('bp/do-disable-button', aboutButton);
      sitecues.emit('bp/do-disable-button', feedbackButton);
      sitecues.emit('bp/do-disable-button', settingsButton);
      sitecues.emit('bp/do-disable-button', tipsButton);

      if (aboutTransitionTo === ABOUT_DISABLED) {

        tipsButton.style.opacity                  = 1;
        settingsButton.style.opacity              = 1;
        feedbackButton.style.opacity              = 1;
        tipsButton.style.display                  = 'block';
        settingsButton.style.display              = 'block';
        feedbackButton.style.display              = 'block';
        contentButton.style.display               = 'none';
        settingsButton.setAttribute('transform', getTransformString(BP_CONST.TRANSFORMS[settingsButton.id].translateX, BP_CONST.TRANSFORMS[settingsButton.id].translateY));
        feedbackButton.setAttribute('transform', getTransformString(BP_CONST.TRANSFORMS[feedbackButton.id].translateX, BP_CONST.TRANSFORMS[feedbackButton.id].translateY));
        tipsButton.setAttribute('transform',     getTransformString(BP_CONST.TRANSFORMS[tipsButton.id].translateX, BP_CONST.TRANSFORMS[tipsButton.id].translateY));



        aboutAnimation = animate.create({
          'from': currentSVGHeight,
          'to'  : targetCSSValues.svgHeight
        }, {
          'duration': useInstantAnimation ? 1 : animate.getDuration(disableAnimationDuration, fromCSSValues.svgHeight, targetCSSValues.svgHeight, currentSVGHeight),
          'onTick'  : onDisabledTick,
          'onFinish': function () {
            aboutContent.style.display   = 'none';
            sitecues.emit('bp/do-enable-button', aboutButton);
            sitecues.emit('bp/do-enable-button', feedbackButton);
            sitecues.emit('bp/do-enable-button', settingsButton);
            sitecues.emit('bp/do-enable-button', tipsButton);
          }
        });

      } else {

        aboutButton.style.display     = 'block';
        arrowButtons.style.opacity    = 0;
        tipsButton.style.opacity      = 0;
        settingsButton.style.opacity  = 0;
        feedbackButton.style.opacity  = 0;
        aboutButton.style.opacity     = 1;
        aboutContent.style.opacity    = 1;
        feedbackContent.style.opacity = 0;
        tipsCards.style.opacity       = 0;
        settingsCards.style.opacity   = 0;
        feedbackTextArea.style.display = 'none';
        state.set('tipsMode', 0);
        state.set('settingsMode', 0);
        state.set('feedbackMode', 0);

        aboutAnimation = animate.create({
          'from': currentAboutImageTranslateX,
          'to'  : targetCSSValues.aboutImageTranslateX
        }, {
          'duration': useInstantAnimation ? 1 : animate.getDuration(firstEnableAnimationDuration, fromCSSValues.aboutImageTranslateX, targetCSSValues.aboutImageTranslateX, currentAboutImageTranslateX),
          'onTick'  : onFirstEnableTick,
          'onFinish': function () {
            aboutAnimation = animate.create({
              'from': currentSVGHeight,
              'to'  : targetCSSValues.svgHeight
            }, {
              'duration': useInstantAnimation ? 1 : animate.getDuration(secondEnableAnimationDuration, fromCSSValues.moreBtnTranslateY, targetCSSValues.moreBtnTranslateY, currentMoreBtnTranslateY),
              'onTick'  : onSecondEnableTick,
              'onFinish': function () {
                contentButton.style.display = 'block';
                arrowButtons.style.display = 'none';
                tipsButton.style.display       = 'none';
                settingsButton.style.display   = 'none';
                feedbackButton.style.display      = 'none';
                sitecues.emit('bp/do-enable-button', aboutButton);
                generalFeatures.setCurrentPanel(BP_CONST.ABOUT_CONTENT_ID);
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
