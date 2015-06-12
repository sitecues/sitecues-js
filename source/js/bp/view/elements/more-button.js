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
        BUTTON_CLICK_ANIMATION_DURATION = 800,
        NO_INPUT_TIMEOUT                = 7000,
        ENABLED_BUTTON_ROTATION         = -180,
        DISABLED_BUTTON_ROTATION        = 0,
        ENABLED_PANEL_TRANSLATE_Y       = 0,
        DISABLED_PANEL_TRANSLATE_Y      = -198,
        MORE_BTN_TRANSLATEX,
        MORE_BTN_TRANSLATEY,
        userInputTimeoutId,
        alwaysShowButton                = false,
        userInputOccured                = false;

    function byId (id) {
      return helper.byId(id);
    }

    function getTransform (string) {
      return transform.getTransform(string);
    }

    function getTransformString (x, y, scale, rotate) {
      return transform.getTransformString(x, y, scale, rotate);
    }

    function getTargetRotation () {
      return state.isSecondaryPanelRequested() ? ENABLED_BUTTON_ROTATION : DISABLED_BUTTON_ROTATION;
    }

    function getTargetMorePanelTranslateY () {
      return state.isSecondaryPanelRequested() ? ENABLED_PANEL_TRANSLATE_Y : DISABLED_PANEL_TRANSLATE_Y;
    }

    function cancelAnimations () {

      if (mouseEnterAnimation) {
        mouseEnterAnimation.cancel();
      }

      if (mouseLeaveAnimation) {
        mouseLeaveAnimation.cancel();
      }

      if (mouseClickAnimation) {
        mouseClickAnimation.cancel();
      }

    }

    function onMouseEnter (e) {

      var id               = e.target.id,
          btn              = byId(id),
          currentTranslate = getTransform(btn.getAttribute('transform')).translate,
          targetRotation   = getTargetRotation(),
          transformString  = getTransformString(currentTranslate.left, currentTranslate.top, BP_CONST.TRANSFORMS[id].scale, targetRotation);

      cancelAnimations();

      mouseEnterAnimation = animate.create(btn, {
        'transform'   : transformString
      }, {
        'duration'    : BUTTON_ENTER_ANIMATION_DURATION,
        'useAttribute': true
      });

    }

    function onMouseLeave (e) {

      var id               = e.target.id,
          btn              = byId(id),
          currentTranslate = getTransform(btn.getAttribute('transform')).translate,
          targetRotation   = getTargetRotation(),
          transformString  = getTransformString(currentTranslate.left, currentTranslate.top, 1, targetRotation);

      cancelAnimations();

      mouseLeaveAnimation = animate.create(btn, {
        'transform'   : transformString
      }, {
        'duration'    : BUTTON_LEAVE_ANIMATION_DURATION,
        'useAttribute': true,
        'animationFn' : 'linear'

      });

    }

    function onMouseClick () {

      // Show or hide the secondary panel.
      sitecues.emit('bp/do-toggle-secondary-panel');

      var id                         = BP_CONST.MORE_BUTTON_CONTAINER_ID,
          moreButton                 = byId(id),
          morePanel                  = byId(BP_CONST.MORE_ID),
          transformObj               = getTransform(moreButton.getAttribute('transform')),
          currentScale               = transformObj.scale,
          currentRotation            = transformObj.rotate,
          targetScale                = BP_CONST.TRANSFORMS[id].scale,
          targetRotation             = getTargetRotation(),
          scaleDiff                  = targetScale - currentScale,
          rotDiff                    = targetRotation - currentRotation,
          currentMorePanelTranslateY = transform.getTransform(morePanel.getAttribute('transform')).translate.top,
          targetMorePanelTranslateY  = getTargetMorePanelTranslateY();

      cancelAnimations();

      function clickAnimationTick (animationState) {
        transform.setTransform(moreButton, MORE_BTN_TRANSLATEX, MORE_BTN_TRANSLATEY, currentScale + scaleDiff * animationState.current, currentRotation + rotDiff * animationState.current);
      }

      mouseClickAnimation = animate.create({
        'from': currentMorePanelTranslateY,
        'to'  : targetMorePanelTranslateY
      }, {
        'duration': BUTTON_CLICK_ANIMATION_DURATION,
        'onTick'  : clickAnimationTick
      });

      morePanel.setAttribute('opacity', 1);


    }

    function addMouseListeners () {

      var moreButton = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);

      moreButton.addEventListener('mouseenter', onMouseEnter);
      moreButton.addEventListener('mouseleave', onMouseLeave);
      moreButton.addEventListener('click', onMouseClick);

    }

    function showHelpButton (useInstantTransition) {

      var btnContainer           = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID),
          currentTranslate       = getTransform(btnContainer.getAttribute('transform')).translate,
          opacityTransitionClass;

      byId(BP_CONST.BOTTOM_MOUSETARGET_ID).removeEventListener('mousemove', showHelpButton);

      // Only use instant transition if true, not truthy, because mouse event is
      // passed in when we use event listeners
      if (useInstantTransition === true) {
        opacityTransitionClass = 'scp-transition-opacity-instant';
      } else {
        opacityTransitionClass = alwaysShowButton ? 'scp-transition-opacity' : 'scp-transition-opacity-fast';
      }

      // The first time the "?" is presented to the user, scale the "?" to 0.5 and then animate it to a scale of 1
      if (!alwaysShowButton && !useInstantTransition) {

        btnContainer.setAttribute('transform', getTransformString(currentTranslate.left, currentTranslate.top, 0.5));

        animate.create(btnContainer, {
          'transform'   : getTransformString(currentTranslate.left, currentTranslate.top, 1)
        }, {
          'duration'    : BUTTON_ENTER_ANIMATION_DURATION,
          'useAttribute': true
        });

      }

      btnContainer.setAttribute('class', opacityTransitionClass);

      // The class we set above takes care of the opacity animation...
      btnContainer.style.opacity = 1;

      // Once we show the button, always show it.
      alwaysShowButton = true;

    }

    function hideHelpButton () {

      var moreButton       = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID),
          currentTranslate = getTransform(moreButton.getAttribute('transform')).translate;

      moreButton.setAttribute('class', '');
      moreButton.style.opacity = 0;

      byId(BP_CONST.BOTTOM_MOUSETARGET_ID).removeEventListener('mousemove', showHelpButton);

      cancelAnimations();

      mouseLeaveAnimation = animate.create(moreButton, {
        'transform'   : getTransformString(currentTranslate.left, currentTranslate.top, 1, DISABLED_BUTTON_ROTATION)
      }, {
        'duration'    : 1,
        'useAttribute': true,
        'animationFn' : 'linear'
      });

      clearTimeout(userInputTimeoutId);
    }

    function captureUserInput () {
      userInputOccured = true;
      byId(BP_CONST.SVG_ID).removeEventListener('mousedown', captureUserInput);
    }

    function showButtonIfNoUserInput () {
      if (!userInputOccured) {
        showHelpButton();
      }
    }

    // Three things may happen when the panel is expanded:
    // 1) Show the button immediately.
    // 2) Wait for the user to mouse over the bottom of the panel. If so, show the button.
    // 3) Wait and see if the user makes any actions in the panel. If not, show the button.
    function initButtonBehaviorOnExpansion () {

      // If the user has already been presented with the button (during this page load),
      // there is no reason to not show it immediately whenever the panel is expanded.
      if (alwaysShowButton) {
        showHelpButton();
        return;
      }

      // Add event listener for mousing over the bottom of the panel
      byId(BP_CONST.BOTTOM_MOUSETARGET_ID).addEventListener('mousemove', showHelpButton);

      // Add event listener for mouse down anywhere on the panel
      byId(BP_CONST.SVG_ID).addEventListener('mousedown', captureUserInput);

      // After NO_INPUT_TIMEOUT, we will be able to determine if the user has
      // pressed their mouse button.  If they have not, show the additional button.
      userInputTimeoutId = setTimeout(showButtonIfNoUserInput, NO_INPUT_TIMEOUT);

      var currentBtnTranslate = getTransform(byId(BP_CONST.MORE_BUTTON_CONTAINER_ID).getAttribute('transform')).translate;

      MORE_BTN_TRANSLATEY = currentBtnTranslate.top;
      MORE_BTN_TRANSLATEX = currentBtnTranslate.left;
    }

    // Add mouse listeners once BP is ready
    sitecues.on('bp/did-complete', addMouseListeners);

    // After a complete expansion of the badge, determine if and when we will show
    // the "more" button.
    sitecues.on('bp/did-expand', initButtonBehaviorOnExpansion);

    // Allows other modules to show the more button.  For example, pressing the
    // tab key to navigate and operate the panel.
    sitecues.on('bp/do-show-help-button', showHelpButton);

    // Always hide the more button when the panel is about to collapse.
    sitecues.on('bp/will-shrink', hideHelpButton);

    sitecues.on('bp/toggle-more-button', onMouseClick);

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});