sitecues.def('bp/view/elements/secondary-panel', function (secondaryPanel, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', function (BP_CONST, state, helper, animate, transform) {

    var requestFrameFn = window.requestAnimationFrame   ||
                         window.msRequestAnimationFrame ||
                         function (fn) {
                           return setTimeout(fn, 16);
                         },
        cancelFrameFn  = window.cancelAnimationFrame   ||
                         window.msCancelAnimationFrame ||
                         function (fn) {
                           clearTimeout(fn);
                         },
        expandEasingFn   = function (t) { return (--t)*t*t+1;}, // https://gist.github.com/gre/1650294
        collapseEasingFn = function (t) { return t; },          // Linear looks better for collapse animation
        animationIds = {},
        BUTTON_ENTER_ANIMATION_DURATION = 800, // Milliseconds
        BUTTON_LEAVE_ANIMATION_DURATION = 400,
        BUTTON_CLICK_ANIMATION_DURATION = 800;

    function setTransform (element, left, top, transformScale, rotate) {

      var scaleCSS       = transformScale ? ' scale(' + transformScale + ') ' : '',
          rotateCSS      = rotate         ? ' rotate(' + rotate + ') '        : '';

      element.setAttribute('transform', 'translate(' + left + ' , ' + top + ') ' + scaleCSS + rotateCSS);

    }

    function getCurrentTransformPosition (element) {

      var transform = element.style[helper.transformProperty],
          position  = {},
          transformValues,
          translateLeft,
          translateTop;

      if (transform === 'none' || transform === '') {

        position.left = 0;
        position.top  = 0;

      } else {

        transformValues = transform.split(',');
        translateLeft   = transformValues[0];
        translateTop    = transformValues[1].split('scale')[0];

        position.left   = helper.getNumberFromString(translateLeft);
        position.top    = helper.getNumberFromString(translateTop);

      }

      return position;

    }

    function getCurrentScale (element) {

      var transformStyle = element.style[helper.transformProperty],
          transformValues,
          stringWithScale;

      if (transformStyle.indexOf('scale') !== -1) {

        transformValues = transformStyle.split('scale');

        if (transformValues[1].indexOf('rotate') !== -1) {
          stringWithScale = transformValues[1].split('rotate')[0];
        } else {
          stringWithScale = transformValues[1];
        }

        return helper.getNumberFromString(stringWithScale);

      }

      return 1;
    }

    function getCurrentRotation (element) {

      var transformStyle = element.style[helper.transformProperty],
          transformValues;

      if (transformStyle.indexOf('rotate') !== -1) {

        transformValues = transformStyle.split('rotate');

        return helper.getNumberFromString(transformValues[1]);

      }

      return 0;
    }

    function onMouseEnter (e) {

      var id                  = e.target.id,
          button              = helper.byId(id),
          buttonBoundingRect  = button.getBoundingClientRect(),
          currentScale        = transform.getScale(button.getAttribute('transform')),
          targetScale         = BP_CONST.TRANSFORMS[id].scale,
          currentTransformPos = transform.getTranslate(button.getAttribute('transform')),
          currentRotation     = transform.getRotation(button.getAttribute('transform'));

      animate.create(button, {
        'transform': 'translate(' + currentTransformPos.left + ', ' + currentTransformPos.top + ') scale(' + targetScale + ')'
      }, {
        'duration': BUTTON_ENTER_ANIMATION_DURATION,
        'useAttribute': true
      });


    }

    function onMouseLeave (e) {

      function animationTick () {

        var timeSinceFirstAnimationTick = Date.now() - animationStartTime,
            normalizedAnimationTime     = Math.min(1, collapseEasingFn(timeSinceFirstAnimationTick / BUTTON_LEAVE_ANIMATION_DURATION));

        setTransform(button, currentTransformPos.left, currentTransformPos.top, currentScale + (targetScale - currentScale) * normalizedAnimationTime, currentRotation + rotDiff * normalizedAnimationTime);

        if (normalizedAnimationTime < 1) {
          animationIds[id] = requestFrameFn(animationTick);
        }

      }

      var id                  = e.target.id,
          button              = helper.byId(id),
          currentScale        = getCurrentScale(button),
          targetScale         = 1,
          currentTransformPos = getCurrentTransformPosition(button),
          currentRotation     = getCurrentRotation(button),
          targetRotation      = currentRotation,
          rotDiff             = targetRotation - currentRotation,
          animationStartTime  = Date.now();

      if (id === BP_CONST.MORE_BUTTON_CONTAINER_ID) {
        targetRotation = state.get('secondaryPanelTransitionTo') === BP_CONST.SECONDARY_PANEL_DISABLED ? 0 : -180;
        rotDiff        = targetRotation - currentRotation;
      }

      if (id !== BP_CONST.MORE_BUTTON_CONTAINER_ID && id !== BP_CONST.MORE_ID) {
        cancelFrameFn(animationIds[id]);
      }

      if (currentScale !== targetScale) {
        animationIds[id] = requestFrameFn(animationTick);
      }

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
          moreButtonTranslate = transform.getTranslate(moreButton.getAttribute('transform')),

          morePanelCurrentPos = transform.getTranslate(morePanel.getAttribute('transform')).top,
          targetPanelPos      = transitionTo === disabled ? -198 : 0,
          currentScale        = transform.getScale(moreButton.getAttribute('transform')),
          currentRotation     = transform.getRotation(moreButton.getAttribute('transform')),
          targetRotation      = transitionTo === disabled ? 0 : -180,
          posDiff             = targetPanelPos - morePanelCurrentPos,
          rotDiff             = targetRotation - currentRotation;
          console.log('%o',{
        'from': morePanelCurrentPos,
        'to'  : targetPanelPos
      })
      animate.create({
        'from': morePanelCurrentPos,
        'to'  : targetPanelPos
      }, {
        'duration': BUTTON_CLICK_ANIMATION_DURATION,
        'onTick': function (animationState) {
          setTransform(moreButton, moreButtonTranslate.left, moreButtonTranslate.top, currentScale, currentRotation + rotDiff * animationState.current);
          setTransform(morePanel, 0, morePanelCurrentPos + posDiff * animationState.current);
        }
      });

    }

    function onMouseClick () {

      function animationTick () {

        var timeSinceFirstAnimationTick = Date.now() - animationStartTime,
            normalizedAnimationTime     = Math.min(1, expandEasingFn(timeSinceFirstAnimationTick / BUTTON_CLICK_ANIMATION_DURATION)),
            currentSecondaryPanelMode   = transitionTo === enabled ? normalizedAnimationTime : 1 - normalizedAnimationTime;

        state.set('currentSecondaryPanelMode', currentSecondaryPanelMode);

        setTransform(moreButton, 0, 0, currentScale, currentRotation + rotDiff * normalizedAnimationTime);
        setTransform(morePanel, 0, morePanelCurrentPos + posDiff * normalizedAnimationTime);

        if (normalizedAnimationTime < 1) {
          animationIds[id] = requestFrameFn(animationTick);
        }

      }

      var enabled             = BP_CONST.SECONDARY_PANEL_ENABLED,
          disabled            = BP_CONST.SECONDARY_PANEL_DISABLED,
          transitionTo        = state.get('secondaryPanelTransitionTo') === disabled ? enabled : disabled,
          id                  = BP_CONST.MORE_BUTTON_CONTAINER_ID,
          moreButton          = helper.byId(id),
          morePanel           = helper.byId(BP_CONST.MORE_ID),
          morePanelCurrentPos = getCurrentTransformPosition(morePanel).top,
          targetPanelPos      = transitionTo === disabled ? -198 : 0,
          currentScale        = getCurrentScale(moreButton),
          currentRotation     = getCurrentRotation(moreButton),
          targetRotation      = transitionTo === disabled ? 0 : -180,
          posDiff             = targetPanelPos - morePanelCurrentPos,
          rotDiff             = targetRotation - currentRotation,
          animationStartTime  = Date.now();

      state.set('secondaryPanelTransitionTo', transitionTo);

      cancelFrameFn(animationIds[id]);

      if (currentRotation !== targetRotation) {
        animationIds[id] = requestFrameFn(animationTick);
      }

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

    function cancelAnimation () {
      for (var animationId in animationIds) {
        if (animationIds.hasOwnProperty(animationId)) {
          cancelFrameFn(animationIds[animationId]);
        }
      }
    }

    // Add mouse listeners once BP is ready
    sitecues.on('bp/did-complete', initMorePanel);

    sitecues.on('bp/toggle-secondary-panel', toggleSecondaryPanel);

    sitecues.on('bp/will-shrink', function () {
      cancelAnimation();
      setTimeout(initStyles, 15);
    });

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});