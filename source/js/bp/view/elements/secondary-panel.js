sitecues.def('bp/view/elements/secondary-panel', function (secondaryPanel, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', function (BP_CONST, state, helper, animate, transform) {

    var animationIds = {},
        BUTTON_ENTER_ANIMATION_DURATION = 800, // Milliseconds
        BUTTON_LEAVE_ANIMATION_DURATION = 400,
        BUTTON_CLICK_ANIMATION_DURATION = 800,
        ENABLED_PANEL_TRANSLATE_Y       = 0,
        DISABLED_PANEL_TRANSLATE_Y      = -198;

    function byId (id) {
      return helper.byId(id);
    }

    function cancelAnimation (id) {
      animationIds[id] && animationIds[id].cancel();
    }

    function cancelAllAnimations () {
      for (var animationId in animationIds) {
        if (animationIds.hasOwnProperty(animationId)) {
          animationIds[animationId].cancel();
        }
      }
    }

    function getTargetMorePanelTranslateY () {
      return state.isSecondaryPanelRequested() ? ENABLED_PANEL_TRANSLATE_Y : DISABLED_PANEL_TRANSLATE_Y;
    }

    function onMouseEnter (e) {

      var id                  = e.target.id,
          button              = byId(id),
          buttonBoundingRect  = button.getBoundingClientRect(),
          targetScale         = BP_CONST.TRANSFORMS[id].scale,
          currentTransform    = transform.getTransform(button.getAttribute('transform')),
          currentScale        = currentTransform.scale,
          translate           = currentTransform.translate,
          x                   = translate.left,
          y                   = translate.top,
          rotate              = currentTransform.rotate,
          rotateX             = currentTransform.rotateX,
          rotateY             = currentTransform.rotateY,
          width               = buttonBoundingRect.width,
          height              = buttonBoundingRect.height,
          // http://stackoverflow.com/questions/6711610/how-to-set-transform-origin-in-svg
          translateX          = (x + (width  - width  * targetScale / currentScale) / 2),
          translateY          = (y + (height - height * targetScale / currentScale) / 2);

      cancelAnimation(id);

      animationIds[id] = animate.create(button, {
        'transform'   : transform.getTransformString(translateX, translateY, targetScale, rotate, rotateX, rotateY)
      }, {
        'duration'    : BUTTON_ENTER_ANIMATION_DURATION,
        'useAttribute': true
      });
    }

    function onMouseLeave (e) {

      var id                  = e.target.id,
          button              = byId(id),
          buttonBoundingRect  = button.getBoundingClientRect(),
          targetScale         = 1,
          currentTransform    = transform.getTransform(button.getAttribute('transform')),
          currentScale        = currentTransform.scale,
          translate           = currentTransform.translate,
          x                   = translate.left,
          y                   = translate.top,
          rotate              = currentTransform.rotate,
          rotateX             = currentTransform.rotateX,
          rotateY             = currentTransform.rotateY,
          width               = buttonBoundingRect.width,
          height              = buttonBoundingRect.height,
          // http://stackoverflow.com/questions/6711610/how-to-set-transform-origin-in-svg
          translateX          = (x + (width  - width  * (targetScale / currentScale)) / 2),
          translateY          = (y + (height - height * (targetScale / currentScale)) / 2);

      cancelAnimation(id);

      animationIds[id] = animate.create(button, {
        'transform'   : transform.getTransformString(translateX, translateY, targetScale, rotate, rotateX, rotateY)
      }, {
        'duration'    : BUTTON_LEAVE_ANIMATION_DURATION,
        'useAttribute': true
      });

    }

    function onMouseClick (e) {

      var element = e.target,
          dataFeature;

      while(element.parentElement) {
        dataFeature = element.getAttribute('data-feature');
        if (dataFeature) {
          break;
        }
        element = element.parentElement;
      }

      sitecues.emit('bp/toggle-' + dataFeature);

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

      var moreId              = BP_CONST.MORE_ID,
          morePanel           = byId(moreId),
          morePanelCurrentPos = transform.getTransform(morePanel.getAttribute('transform')).translate.top,
          targetPanelPos      = getTargetMorePanelTranslateY(),
          posDiff             = targetPanelPos - morePanelCurrentPos;

      cancelAnimation(moreId);

      function onSecondaryAnimationTick (animationState) {
        state.set('currentSecondaryPanelMode', animationState.current);
        transform.setTransform(morePanel, 0, morePanelCurrentPos + posDiff * animationState.current);
      }

      animationIds[moreId] = animate.create({
        'from'    : morePanelCurrentPos,
        'to'      : targetPanelPos
      }, {
        'duration': BUTTON_CLICK_ANIMATION_DURATION,
        'onTick'  : onSecondaryAnimationTick,
        'onFinish': function () {
          sitecues.emit('bp/did-toggle-secondary-panel', state.get('currentSecondaryPanelMode'));
        }
      });

    }

    function initStyles () {

      var moreId     = BP_CONST.MORE_ID,
          tipsId     = BP_CONST.TIPS_BUTTON_ID,
          settingsId = BP_CONST.SETTINGS_BUTTON_ID,
          feedbackId = BP_CONST.FEEDBACK_BUTTON_ID,
          aboutId    = BP_CONST.ABOUT_BUTTON_ID;

      byId(moreId).setAttribute(    'transform', 'translate(0, ' + BP_CONST.TRANSFORMS[moreId].translateY + ')');
      byId(tipsId).setAttribute(    'transform', 'translate('    + BP_CONST.TRANSFORMS[tipsId].translateX      + ', ' + BP_CONST.TRANSFORMS[tipsId].translateY     + ')');
      byId(settingsId).setAttribute('transform', 'translate('    + BP_CONST.TRANSFORMS[settingsId].translateX  + ', ' + BP_CONST.TRANSFORMS[settingsId].translateY + ')');
      byId(feedbackId).setAttribute('transform', 'translate('    + BP_CONST.TRANSFORMS[feedbackId].translateX  + ', ' + BP_CONST.TRANSFORMS[feedbackId].translateY + ')');
      byId(aboutId).setAttribute(   'transform', 'translate('    + BP_CONST.TRANSFORMS[aboutId].translateX     + ', ' + BP_CONST.TRANSFORMS[aboutId].translateY    + ')');

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

      var tipsButton     = byId(BP_CONST.TIPS_BUTTON_ID),
          settingsButton = byId(BP_CONST.SETTINGS_BUTTON_ID),
          feedbackButton = byId(BP_CONST.FEEDBACK_BUTTON_ID),
          aboutButton    = byId(BP_CONST.ABOUT_BUTTON_ID),
          tipsLabel      = byId(BP_CONST.TIPS_LABEL_ID),
          settingsLabel  = byId(BP_CONST.SETTINGS_LABEL_ID),
          feedbackLabel  = byId(BP_CONST.FEEDBACK_LABEL_ID),
          aboutLabel     = byId(BP_CONST.ABOUT_LABEL_ID);

      tipsButton.addEventListener('mouseenter', onMouseEnter);
      tipsButton.addEventListener('mouseleave', onMouseLeave);
      tipsButton.addEventListener('click',      onMouseClick);
      tipsLabel.addEventListener( 'click',      onMouseClick);

      settingsButton.addEventListener('mouseenter', onMouseEnter);
      settingsButton.addEventListener('mouseleave', onMouseLeave);
      settingsButton.addEventListener('click',      onMouseClick);
      settingsLabel.addEventListener( 'click',      onMouseClick);

      feedbackButton.addEventListener('mouseenter', onMouseEnter);
      feedbackButton.addEventListener('mouseleave', onMouseLeave);
      feedbackButton.addEventListener('click',      onMouseClick);
      feedbackLabel.addEventListener( 'click',      onMouseClick);

      aboutButton.addEventListener('mouseenter', onMouseEnter);
      aboutButton.addEventListener('mouseleave', onMouseLeave);
      aboutButton.addEventListener('click',      onMouseClick);
      aboutLabel.addEventListener( 'click',      onMouseClick);

    }

    // Add mouse listeners once BP is ready
    sitecues.on('bp/did-complete', initMorePanel);

    sitecues.on('bp/toggle-secondary-panel', toggleSecondaryPanel);

    sitecues.on('bp/will-shrink', resetMorePanel);

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});