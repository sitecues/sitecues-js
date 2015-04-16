sitecues.def('bp/view/elements/secondary-panel', function (secondaryPanel, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', function (BP_CONST, state, helper, animate, transform) {

    var animationIds = {},
        BUTTON_ENTER_ANIMATION_DURATION = 800, // Milliseconds
        BUTTON_LEAVE_ANIMATION_DURATION = 400,
        BUTTON_CLICK_ANIMATION_DURATION = 800;

    function setTransform (element, left, top, transformScale, rotate) {

      var scaleCSS       = transformScale ? ' scale(' + transformScale + ') ' : '',
          rotateCSS      = rotate         ? ' rotate(' + rotate + ') '        : '';

      element.setAttribute('transform', 'translate(' + left + ' , ' + top + ') ' + scaleCSS + rotateCSS);

    }

    function onMouseEnter (e) {

      var id                  = e.target.id,
          button              = helper.byId(id),
          buttonBoundingRect  = button.getBoundingClientRect(),
          transformObj        = transform.getTransform(button.getAttribute('transform')),
          currentScale        = transformObj.scale,
          targetScale         = BP_CONST.TRANSFORMS[id].scale,
          currentTransformPos = transformObj.translate,
          x                   = currentTransformPos.left,
          y                   = currentTransformPos.top,
          width               = buttonBoundingRect.width,
          height              = buttonBoundingRect.height,
          currentRotation     = transformObj.rotate,
          centerX             = currentTransformPos.left + buttonBoundingRect.width / 2,
          centerY             = currentTransformPos.top  + buttonBoundingRect.height / 2;

      animationIds[id] && animationIds[id].cancel();

      animationIds[id] = animate.create(button, {
                                                  'transform': 'translate(' + (x + (width - width * targetScale) / 2) + ', ' + (y + (height - height * targetScale) / 2) + ') scale(' + targetScale + ')'
                                                }, {
                                                  'duration': BUTTON_ENTER_ANIMATION_DURATION,
                                                  'useAttribute': true
                                                });
    }

    function onMouseLeave (e) {

      var id                  = e.target.id,
          button              = helper.byId(id),
          buttonBoundingRect  = button.getBoundingClientRect(),
          transformObj        = transform.getTransform(button.getAttribute('transform')),
          currentScale        = transformObj.scale,
          targetScale         = 1,
          currentTransformPos = transformObj.translate,
          x                   = currentTransformPos.left,
          y                   = currentTransformPos.top,
          width               = buttonBoundingRect.width,
          height              = buttonBoundingRect.height,
          currentRotation     = transformObj.rotate,
          centerX             = currentTransformPos.left + buttonBoundingRect.width / 2,
          centerY             = currentTransformPos.top  + buttonBoundingRect.height / 2;

      animationIds[id] && animationIds[id].cancel();

      animationIds[id] = animate.create(button, {
                                                  'transform': 'translate(' + BP_CONST.TRANSFORMS[id].translateX + ', ' + BP_CONST.TRANSFORMS[id].translateY + ') scale(' + targetScale + ')'
                                                }, {
                                                  'duration': BUTTON_LEAVE_ANIMATION_DURATION,
                                                  'useAttribute': true
                                                });

    }

    function toggleSecondaryPanel () {

      var enabled  = BP_CONST.SECONDARY_PANEL_ENABLED,
          disabled = BP_CONST.SECONDARY_PANEL_DISABLED;

      if (state.get('secondaryPanelTransitionTo') === enabled) {
        state.set('secondaryPanelTransitionTo', disabled);
      } else {
        state.set('secondaryPanelTransitionTo', enabled);
      }

      SC_DEV && console.log('Transitioning secondary panel to mode: ' + state.get('secondaryPanelTransitionTo'));

      animateSecondaryPanel();

    }

    function animateSecondaryPanel () {

      var enabled             = BP_CONST.SECONDARY_PANEL_ENABLED,
          disabled            = BP_CONST.SECONDARY_PANEL_DISABLED,
          transitionTo        = state.get('secondaryPanelTransitionTo') === disabled ? disabled : enabled,
          id                  = BP_CONST.MORE_BUTTON_CONTAINER_ID,
          moreButton          = helper.byId(id),
          morePanel           = helper.byId(BP_CONST.MORE_ID),
          transformObj        = transform.getTransform(moreButton.getAttribute('transform')),
          moreButtonTranslate = transformObj.translate,

          morePanelCurrentPos = transform.getTransform(morePanel.getAttribute('transform')).translate.top,
          targetPanelPos      = transitionTo === disabled ? -198 : 0,
          currentScale        = transformObj.scale,
          currentRotation     = transformObj.rotate,
          targetRotation      = transitionTo === disabled ? 0 : -180,
          posDiff             = targetPanelPos - morePanelCurrentPos,
          rotDiff             = targetRotation - currentRotation;

      animationIds[BP_CONST.MORE_ID] && animationIds[BP_CONST.MORE_ID].cancel();

      animationIds[BP_CONST.MORE_ID] = animate.create({
        'from': morePanelCurrentPos,
        'to'  : targetPanelPos
      }, {
        'duration': BUTTON_CLICK_ANIMATION_DURATION,
        'onTick': function (animationState) {
          state.set('currentSecondaryPanelMode', animationState.current);
          setTransform(morePanel, 0, morePanelCurrentPos + posDiff * animationState.current);
        }
      });

    }

    function initStyles () {

      var moreId     = BP_CONST.MORE_ID,
          tipsId     = BP_CONST.TIPS_BUTTON_ID,
          settingsId = BP_CONST.SETTINGS_BUTTON_ID,
          feedbackId = BP_CONST.FEEDBACK_BUTTON_ID,
          aboutId    = BP_CONST.ABOUT_BUTTON_ID;

      helper.byId(moreId).setAttribute(    'transform', 'translate(0, ' + BP_CONST.TRANSFORMS[moreId].translateY + ')');
      helper.byId(tipsId).setAttribute(    'transform', 'translate('    + BP_CONST.TRANSFORMS[tipsId].translateX      + ', ' + BP_CONST.TRANSFORMS[tipsId].translateY     + ')');
      helper.byId(settingsId).setAttribute('transform', 'translate('    + BP_CONST.TRANSFORMS[settingsId].translateX  + ', ' + BP_CONST.TRANSFORMS[settingsId].translateY + ')');
      helper.byId(feedbackId).setAttribute('transform', 'translate('    + BP_CONST.TRANSFORMS[feedbackId].translateX  + ', ' + BP_CONST.TRANSFORMS[feedbackId].translateY + ')');
      helper.byId(aboutId).setAttribute(   'transform', 'translate('    + BP_CONST.TRANSFORMS[aboutId].translateX     + ', ' + BP_CONST.TRANSFORMS[aboutId].translateY    + ')');

    }

    function initMorePanel () {
      addMouseListeners();
      initStyles();
    }

    function resetMorePanel () {

      var disabled = BP_CONST.SECONDARY_PANEL_DISABLED;

      cancelAllAnimations();

      initStyles();

      state.set('currentSecondaryPanelMode',  disabled);
      state.set('secondaryPanelTransitionTo', disabled);

    }

    function addMouseListeners () {

      var tipsButton     = helper.byId(BP_CONST.TIPS_BUTTON_ID),
          settingsButton = helper.byId(BP_CONST.SETTINGS_BUTTON_ID),
          feedbackButton = helper.byId(BP_CONST.FEEDBACK_BUTTON_ID),
          aboutButton    = helper.byId(BP_CONST.ABOUT_BUTTON_ID);

      tipsButton.addEventListener('mouseenter', onMouseEnter);
      tipsButton.addEventListener('mouseleave', onMouseLeave);

      settingsButton.addEventListener('mouseenter', onMouseEnter);
      settingsButton.addEventListener('mouseleave', onMouseLeave);

      feedbackButton.addEventListener('mouseenter', onMouseEnter);
      feedbackButton.addEventListener('mouseleave', onMouseLeave);

      aboutButton.addEventListener('mouseenter', onMouseEnter);
      aboutButton.addEventListener('mouseleave', onMouseLeave);

    }

    function cancelAllAnimations () {
      for (var animationId in animationIds) {
        if (animationIds.hasOwnProperty(animationId)) {
          animationIds[animationId].cancel();
        }
      }
    }

    // Add mouse listeners once BP is ready
    sitecues.on('bp/did-complete', initMorePanel);

    sitecues.on('bp/toggle-secondary-panel', toggleSecondaryPanel);

    sitecues.on('bp/will-shrink', function () {
      resetMorePanel();
    });

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});