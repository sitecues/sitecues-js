      /**
 *  This file contains logic for the "?" button placement and functionality that opens up the
 *  help / info page to provide sitecues users with a document to learn how to use the tool, including
 *  keyboard commands.
 */

sitecues.def('bp/view/elements/more-button', function (moreButton, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'zoom', 'audio', 'animate', 'util/transform', function (BP_CONST, state, helper, zoomMod, audioMod, animate, transform) {

    var mouseEnterAnimation,
        mouseLeaveAnimation,
        mouseClickAnimation,
        BUTTON_ENTER_ANIMATION_DURATION = 800, // Milliseconds
        BUTTON_LEAVE_ANIMATION_DURATION = 400,
        NO_INPUT_TIMEOUT                = 7000,
        userInputTimeoutId,
        alwaysShowButton                = false,
        userInputOccured                = false;

    function setTransform (element, left, top, transformScale, rotate) {

      var scaleCSS       = transformScale ? ' scale(' + transformScale + ') ' : '',
          rotateCSS      = rotate         ? ' rotate(' + rotate + ') '        : '';

      element.setAttribute('transform', 'translate(' + left + ' , ' + top + ') ' + scaleCSS + rotateCSS);

    }

    function onMouseEnter (e) {

      var id               = e.target.id,
          btn              = helper.byId(id),
          currentTranslate = transform.getTransform(btn.getAttribute('transform')).translate,
          enabled          = BP_CONST.SECONDARY_PANEL_ENABLED,
          disabled         = BP_CONST.SECONDARY_PANEL_DISABLED,
          transitionTo     = state.get('secondaryPanelTransitionTo') === disabled ? disabled : enabled,
          targetRotation   = transitionTo === disabled ? 0 : -180;

      if (mouseLeaveAnimation) {
        mouseLeaveAnimation.cancel();
      }

      if (mouseClickAnimation) {
        mouseClickAnimation.cancel();
      }

      mouseEnterAnimation = animate.create(btn, {
        'transform': 'translate(' + currentTranslate.left + ', ' + currentTranslate.top + ') ' + ' scale(' + BP_CONST.TRANSFORMS[id].scale + ') rotate('+targetRotation+')'
      }, {
        'duration': BUTTON_ENTER_ANIMATION_DURATION,
        'useAttribute': true
      });

    }

    function onMouseLeave (e) {

      var enabled          = BP_CONST.SECONDARY_PANEL_ENABLED,
          disabled         = BP_CONST.SECONDARY_PANEL_DISABLED,
          transitionTo     = state.get('secondaryPanelTransitionTo') === disabled ? disabled : enabled,
          id               = e.target.id,
          btn              = helper.byId(id),
          transformObj     = transform.getTransform(btn.getAttribute('transform')),
          currentTranslate = transformObj.translate,
          currentRotation  = transformObj.rotate,
          targetRotation   = transitionTo === disabled ? 0 : -180;

      if (mouseEnterAnimation) {
        mouseEnterAnimation.cancel();
      }

      if (mouseClickAnimation) {
        mouseClickAnimation.cancel();
      }

      mouseLeaveAnimation = animate.create(btn, {
        'transform': 'translate(' + currentTranslate.left + ', ' + currentTranslate.top + ') ' + ' scale(1)' + ' rotate('+targetRotation+')'
      }, {
        'duration': BUTTON_LEAVE_ANIMATION_DURATION,
        'useAttribute': true,
        'animationFn': 'linear'

      });

    }

    function onMouseClick () {

      sitecues.emit('bp/toggle-secondary-panel');

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

      if (mouseLeaveAnimation) {
        mouseLeaveAnimation.cancel();
      }

      if (mouseClickAnimation) {
        mouseClickAnimation.cancel();
      }

      mouseClickAnimation = animate.create({
        'from': morePanelCurrentPos,
        'to'  : targetPanelPos
      }, {
        'duration': 800,
        'onTick': function (animationState) {
          setTransform(moreButton, moreButtonTranslate.left, moreButtonTranslate.top, currentScale, currentRotation + rotDiff * animationState.current);
        }
      });

    }

    function initMorePanel () {

      addMouseListeners();

    }

    function addMouseListeners () {

      var moreButton = helper.byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);

      moreButton.addEventListener('mouseenter', onMouseEnter);
      moreButton.addEventListener('mouseleave', onMouseLeave);
      moreButton.addEventListener('click', onMouseClick);

    }

    function showHelpButton (useInstantTransition) {

      var btnContainer           = helper.byId(BP_CONST.MORE_BUTTON_CONTAINER_ID),
          currentTranslate       = transform.getTransform(btnContainer.getAttribute('transform')).translate,
          opacityTransitionClass;

      if (useInstantTransition === true) {
        opacityTransitionClass = 'scp-transition-opacity-instant';
      } else {
        opacityTransitionClass = alwaysShowButton ? 'scp-transition-opacity' : 'scp-transition-opacity-fast';
      }

      // The first time the "?" is presented to the user, scale the "?" to 0.5 and then animate it to a scale of 1
      if (!alwaysShowButton && !useInstantTransition) {

        btnContainer.setAttribute('transform', 'translate(' + currentTranslate.left + ', ' + currentTranslate.top + ') ' + ' scale(' + 0.5 + ')');

        animate.create(btnContainer, {
          'transform': 'translate(' + currentTranslate.left + ', ' + currentTranslate.top + ') ' + ' scale(1)'
        }, {
          'duration': BUTTON_ENTER_ANIMATION_DURATION,
          'useAttribute': true
        });

      }

      btnContainer.setAttribute('class', opacityTransitionClass);

      btnContainer.style.opacity = 1;
      helper.byId(BP_CONST.BOTTOM_MOUSETARGET_ID).removeEventListener('mousemove', showHelpButton);
      alwaysShowButton = true;
    }

    function hideHelpButton () {

      var moreButton       = helper.byId(BP_CONST.MORE_BUTTON_CONTAINER_ID),
          currentTranslate = transform.getTransform(moreButton.getAttribute('transform')).translate;

      moreButton.setAttribute('class', '');
      moreButton.style.opacity = 0;

      helper.byId(BP_CONST.BOTTOM_MOUSETARGET_ID).removeEventListener('mousemove', showHelpButton);

      if (mouseEnterAnimation) {
        mouseEnterAnimation.cancel();
      }

      if (mouseLeaveAnimation) {
        mouseLeaveAnimation.cancel();
      }

      mouseLeaveAnimation = animate.create(moreButton, {
        'transform': 'translate(' + currentTranslate.left + ', ' + currentTranslate.top + ') ' + ' scale(1)'
      }, {
        'duration': 1,
        'useAttribute': true,
        'animationFn': 'linear'
      });

      clearTimeout(userInputTimeoutId);
    }

    function captureUserInput () {
      userInputOccured = true;
      helper.byId(BP_CONST.SVG_ID).removeEventListener('mousedown', captureUserInput);
    }

    // Add mouse listeners once BP is ready
    sitecues.on('bp/did-complete', initMorePanel);

    sitecues.on('bp/did-expand', function () {
      if (alwaysShowButton) {
        showHelpButton();
        return;
      }
      helper.byId(BP_CONST.BOTTOM_MOUSETARGET_ID).addEventListener('mousemove', showHelpButton);
      helper.byId(BP_CONST.SVG_ID).addEventListener('mousedown', captureUserInput);
      userInputTimeoutId = setTimeout(function () {
        if (!userInputOccured) {
          showHelpButton();
        }
      }, NO_INPUT_TIMEOUT);
    });

    sitecues.on('bp/do-show-help-button', showHelpButton);


    sitecues.on('bp/will-shrink', hideHelpButton);

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});