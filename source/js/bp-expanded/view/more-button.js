/**
 *  This file contains logic for the "?" button placement and functionality that opens up the
 *  help / info page to provide sitecues users with a document to learn how to use the tool, including
 *  keyboard commands.
 */

define(
  [
    'run/bp/constants',
    'run/bp/helper',
    'bp-expanded/view/transform-util',
    'bp-expanded/view/transform-animate',
    'bp-expanded/view/transform-hovers',
    'run/bp/model/state',
    'run/events',
    'run/inline-style/inline-style',
    'run/ab-test/ab-test',
    'mini-core/native-global'
  ],
  function (
    BP_CONST,
    helper,
    transformUtil,
    animate,
    hovers,
    state,
    events,
    inlineStyle,
    abTest,
    nativeGlobal
  ) {
  'use strict';

  var BUTTON_ENTER_ANIMATION_DURATION = 500, // Milliseconds
      BUTTON_ENTER_ANIMATION_DURATION_INSTANT = 0,
      NO_INPUT_TIMEOUT_DEFAULT        = 3000,
      userInputTimeoutId,
      doAlwaysShowButton,
      isAfterUserInput,
      // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
      byId = helper.byId,
      moreButtonContainer,
      moreOpacityElem,
      isInitialized;

  function getHelpOrSecondaryPanel(doToggle) {
    if (state.get('isClassicMode')) {
      require(['info/info'], function(info) {
        if (doToggle) {
          info.showHelp();
        }
      });
      return;
    }

    // Open secondary panel (not in classic mode)
    require(['bp-secondary/bp-secondary'], function(secondary) {
      // Show or hide the secondary panel.
      secondary.init();
      if (doToggle) {
        secondary.toggleSecondaryPanel();
      }
    });
  }

  function onMouseClick () {
    getHelpOrSecondaryPanel(true);
  }

  function addMouseListeners () {
    moreButtonContainer.addEventListener('click', onMouseClick);
  }

  function setSize(size) {
    transformUtil.setElemTransform(moreButtonContainer, { scale: size }); // Starting point
  }

  function showMoreButton (useInstantTransition) {

    byId(BP_CONST.BOTTOM_MOUSETARGET_ID).removeEventListener('mousemove', showMoreButtonSlowly);
    clearTimeout(userInputTimeoutId);

    moreOpacityElem.setAttribute('class', useInstantTransition ? '' : 'scp-transition-opacity-fast');
    inlineStyle(moreOpacityElem).opacity = 1;

    // Scale the button to 0.5 and then animate it to a scale of 1
    if (!useInstantTransition) {
      setSize(0.5);
      // Delay to fix Chrome animation bug
      // TODO WTF? We need to wait 30 ms? Tried requestAnimationFrame() and only 50% success rate
      nativeGlobal.setTimeout(function () {
        getComputedStyle(moreButtonContainer); // Force layout update
        animate.animateTransformLinear(moreButtonContainer, {scale: 1},
          useInstantTransition ? BUTTON_ENTER_ANIMATION_DURATION_INSTANT : BUTTON_ENTER_ANIMATION_DURATION);
      }, 30);
    }

    // Once we show the button, always show it.
    doAlwaysShowButton = true;

    getHelpOrSecondaryPanel(); // Preload

    // Add mouse listeners once BP is ready
    addMouseListeners();
  }

  function showMoreButtonSlowly() {
    showMoreButton(false);
  }

  function showMoreButtonInstantly() {
    showMoreButton(true);
  }

  function hideHelpButton () {

    moreOpacityElem.setAttribute('class', '');
    moreOpacityElem.style.opacity = 0;

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
  function initButtonBehavior () {

    // If the user has already been presented with the button (during this page load),
    // there is no reason to not show it immediately whenever the panel is expanded.
    if (doAlwaysShowButton) {
      showMoreButtonSlowly();  // Or use showMoreButton() to go back to showing the button instantly in this case
      return;
    }

    // Add event listener for mousing over the bottom of the panel
    byId(BP_CONST.BOTTOM_MOUSETARGET_ID).addEventListener('mousemove', showMoreButtonSlowly);

    // Add event listener for mouse down anywhere on the panel
    byId(BP_CONST.SVG_ID).addEventListener('mousedown', captureUserInput);

    // After NO_INPUT_TIMEOUT, we will be able to determine if the user has
    // pressed their mouse button.  If they have not, show the additional button.
    var noInputTimeoutMs = abTest.get('moreButtonTimerV2', NO_INPUT_TIMEOUT_DEFAULT);
    userInputTimeoutId = nativeGlobal.setTimeout(showButtonIfNoUserInput, noInputTimeoutMs);
  }

  function init() {
    if (isInitialized) {
      return;
    }

    isInitialized = true;

    // Get elements
    moreButtonContainer = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);
    moreOpacityElem = byId('scp-more-button-opacity');

    // Show immediately?
    doAlwaysShowButton = !state.get('isFirstBadgeUse');

    // After a complete expansion of the badge, determine if and when we will show
    // the "more" button.
    events.on('bp/did-expand', initButtonBehavior); // Future expansions
    initButtonBehavior(); // First expansion is now

    // Allows other modules to show the more button.  For example, pressing the
    // tab key to navigate and operate the panel.
    events.on('bp/did-focus-more-button', showMoreButtonInstantly);

    // Always hide the more button when the panel is about to collapse.
    events.on('bp/will-shrink', hideHelpButton);

    //TODO: Once Edge gets itself together (see SC-3434) we should attach the button mouse listener here instead of after revealing it

    hovers.init();
  }

  return {
    init: init
  };
});
