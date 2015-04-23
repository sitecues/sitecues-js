sitecues.def('bp/view/elements/feedback', function (feedback, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', function (BP_CONST, state, helper, animate, transform) {

    var FEEDBACK_ENABLED     = 1,
        FEEDBACK_DISABLED    = 0,
        feedbackTransitionTo = FEEDBACK_DISABLED,
        feedbackAnimation;

    function byId (id) {
      return helper.byId(id);
    }

    function toggleFeedback () {

      if (feedbackTransitionTo === FEEDBACK_ENABLED) {
        feedbackTransitionTo = FEEDBACK_DISABLED;
      } else {
        feedbackTransitionTo = FEEDBACK_ENABLED;
      }

      SC_DEV && console.log('Transitioning feedback mode: ' + feedbackTransitionTo);

      animateFeedback();

    }

    function animateFeedback () {

      var tipsButton                 = byId(BP_CONST.TIPS_BUTTON_ID),
          settingsButton             = byId(BP_CONST.SETTINGS_BUTTON_ID),
          aboutButton                = byId(BP_CONST.ABOUT_BUTTON_ID),
          mainSVG                    = byId(BP_CONST.SVG_ID),
          outlineSVG                 = byId(BP_CONST.MAIN_OUTLINE_BORDER_ID),
          shadowSVG                  = byId(BP_CONST.SHADOW_ID),
          bottomSVG                  = byId(BP_CONST.BOTTOM_MORE_ID),
          moreButton                 = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID),
          currentOutlineHeight       = 187,
          currentSVGHeight           = parseFloat(mainSVG.style.height),
          currentSVGTranslateY       = transform.getTransform(mainSVG.getAttribute('transform')).translate.top,
          currentBottomSVGTranslateY = transform.getTransform(bottomSVG.getAttribute('transform')).translate.top,
          currentMoreBtnTranslate    = transform.getTransform(moreButton.getAttribute('transform')).translate,
          currentMoreBtnTranslateX   = currentMoreBtnTranslate.left,
          currentMoreBtnTranslateY   = currentMoreBtnTranslate.top,
          targetOutlineHeight        = 337,
          targetSVGHeight            = 420,
          targetSVGTranslateY        = -116,
          targetBottomSVGTranslateY  = 149,
          targetMoreBtnTranslateX    = 400,
          targetMoreBtnTranslateY    = 346;



      function animateAboutElements (animationState) {
        mainSVG.style.height = currentSVGHeight + (targetSVGHeight - currentSVGHeight) * animationState.current + 'px';
        mainSVG.style.transform = 'translate(0, ' + (currentSVGTranslateY + (targetSVGTranslateY - currentSVGTranslateY) * animationState.current) + 'px)';
        bottomSVG.setAttribute('transform', 'translate(0, ' + currentBottomSVGTranslateY + (targetBottomSVGTranslateY - currentBottomSVGTranslateY) * animationState.current + ')');
        moreButton.setAttribute('transform', 'translate(' + currentMoreBtnTranslateX + (targetMoreBtnTranslateX - currentMoreBtnTranslateX) * animationState.current + ', ' + currentMoreBtnTranslateY + (targetMoreBtnTranslateY - currentMoreBtnTranslateY) * animationState.current + ')');

        outlineSVG.setAttribute('d', 'M808 ' + (currentOutlineHeight + (targetOutlineHeight - currentOutlineHeight) * animationState.current) + 'c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V' + (currentOutlineHeight + (targetOutlineHeight - currentOutlineHeight) * animationState.current));
        shadowSVG.setAttribute('d', 'm808,'+(currentOutlineHeight + (targetOutlineHeight - currentOutlineHeight) * animationState.current)+'c0,6 -5,11 -11,11H11m797,-11v-'+(currentOutlineHeight + (targetOutlineHeight - currentOutlineHeight) * animationState.current));
      }

      feedbackAnimation = animate.create({
        'from': currentSVGHeight,
        'to'  : targetSVGHeight
      }, {
        'duration': 2000,
        'onTick'  : animateAboutElements
      });

      tipsButton.style.opacity     = 0;
      settingsButton.style.opacity = 0;
      aboutButton.style.opacity    = 0;

    }

    sitecues.on('bp/toggle-feedback', toggleFeedback);

    callback();
  });
});
