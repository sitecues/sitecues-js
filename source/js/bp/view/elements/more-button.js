/**
 *  This file contains logic for the "?" button placement and functionality that opens up the
 *  help / info page to provide sitecues users with a document to learn how to use the tool, including
 *  keyboard commands.
 */

sitecues.def('bp/view/elements/more-button', function (moreButton, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'zoom/zoom', 'audio/audio', 'animate', 'util/transform',
    function (BP_CONST, state, helper, zoomMod, audioMod, animate, transform) {

    var BUTTON_ENTER_ANIMATION_DURATION = 800, // Milliseconds
        NO_INPUT_TIMEOUT                = 7000,
        MORE_BTN_TRANSLATEX,
        MORE_BTN_TRANSLATEY,
        userInputTimeoutId,
        doAlwaysShowButton,
        isAfterUserInput,
        // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
        byId = helper.byId,
        getElemTransform = transform.getElemTransform,
        getTransformString = transform.getTransformString;

    function onMouseClick () {

      // Show or hide the secondary panel.
      sitecues.emit('bp/do-toggle-secondary-panel');

    }

    function addMouseListeners () {
      var moreButton = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);
      moreButton.addEventListener('click', onMouseClick);
    }

    function setOpacityTransition(btnContainer, useInstantTransition) {
      // Only use instant transition if true, not truthy, because mouse event is
      // passed in when we use event listeners
      var opacityType;

      if (useInstantTransition) {
        opacityType = '-instant';
      } else {
        opacityType = doAlwaysShowButton ? '' : '-fast';
      }

      btnContainer.setAttribute('class', 'scp-transition-opacity' + opacityType);

      // The class we set above takes care of the opacity animation...
      btnContainer.style.opacity = 1;
    }

    function showMoreButton (useInstantTransition) {

      var btnContainer           = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID),
          currentTranslate       = getElemTransform(btnContainer).translate;

      byId(BP_CONST.BOTTOM_MOUSETARGET_ID).removeEventListener('mousemove', showMoreButtonSlowly);

      setOpacityTransition(btnContainer, useInstantTransition);

      // The first time the button is presented to the user, scale the button to 0.5 and then animate it to a scale of 1
      if (!doAlwaysShowButton && !useInstantTransition) {

        btnContainer.setAttribute('transform', getTransformString(currentTranslate.left, currentTranslate.top, 0.5));

        animate.animateCssProperties(btnContainer, {
          'transform'   : getTransformString(currentTranslate.left, currentTranslate.top, 1)
        }, {
          'duration'    : BUTTON_ENTER_ANIMATION_DURATION,
          'useAttribute': true
        });

      }

      // Once we show the button, always show it.
      doAlwaysShowButton = true;
    }

    function showMoreButtonSlowly() {
      showMoreButton(false);
    }

    function showMoreButtonInstantly() {
      showMoreButton(true);
    }

    function hideHelpButton () {

      var moreButton       = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);

      moreButton.setAttribute('class', '');
      moreButton.style.opacity = 0;

      byId(BP_CONST.BOTTOM_MOUSETARGET_ID).removeEventListener('mousemove', showMoreButtonSlowly);

      clearTimeout(userInputTimeoutId);
    }

    function captureUserInput () {
      isAfterUserInput = true;
      byId(BP_CONST.SVG_ID).removeEventListener('mousedown', captureUserInput);
    }

    function showButtonIfNoUserInput () {
      if (!isAfterUserInput) {
        showMoreButton();
      }
    }

    // Three things may happen when the panel is expanded:
    // 1) Show the button immediately.
    // 2) Wait for the user to mouse over the bottom of the panel. If so, show the button.
    // 3) Wait and see if the user makes any actions in the panel. If not, show the button.
    function initButtonBehaviorOnExpansion () {

      // If the user has already been presented with the button (during this page load),
      // there is no reason to not show it immediately whenever the panel is expanded.
      if (doAlwaysShowButton) {
        showMoreButton();
        return;
      }

      // Add event listener for mousing over the bottom of the panel
      byId(BP_CONST.BOTTOM_MOUSETARGET_ID).addEventListener('mousemove', showMoreButtonSlowly);

      // Add event listener for mouse down anywhere on the panel
      byId(BP_CONST.SVG_ID).addEventListener('mousedown', captureUserInput);

      // After NO_INPUT_TIMEOUT, we will be able to determine if the user has
      // pressed their mouse button.  If they have not, show the additional button.
      userInputTimeoutId = setTimeout(showButtonIfNoUserInput, NO_INPUT_TIMEOUT);

      var currentBtnTranslate = getElemTransform(byId(BP_CONST.MORE_BUTTON_CONTAINER_ID)).translate;

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
    sitecues.on('bp/did-focus-more-button', showMoreButtonInstantly);

    // Always hide the more button when the panel is about to collapse.
    sitecues.on('bp/will-shrink', hideHelpButton);

    callback();
  });

  });