/**
 *  This file contains logic for the "?" button placement and functionality that opens up the
 *  help / info page to provide sitecues users with a document to learn how to use the tool, including
 *  keyboard commands.
 */

define(['bp/constants', 'bp/helper', 'bp-expanded/view/svg-animate', 'bp-expanded/view/svg-transform-effects', 'core/platform'],
  function (BP_CONST, helper, animate, transformEffects, platform) {

  var BUTTON_ENTER_ANIMATION_DURATION = 800, // Milliseconds
      NO_INPUT_TIMEOUT                = 7000,
      userInputTimeoutId,
      doAlwaysShowButton,
      isAfterUserInput,
      // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
      byId = helper.byId,
      moreButtonContainer = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID),
      currentTranslate = moreButtonContainer.getAttribute('transform'),
      isInitialized;

  function getHelpOrSecondaryPanel(doToggle) {
    if (platform.isIE9) {
      require(['info/info'], function(info) {
        if (doToggle) {
          info.showHelp();
        }
      });
      return;
    }

    // Not IE9: go ahead with secondary panel
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

  function getTransformString(scale) {
    return currentTranslate + ' scale(' + scale + ')';
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

    byId(BP_CONST.BOTTOM_MOUSETARGET_ID).removeEventListener('mousemove', showMoreButtonSlowly);

    setOpacityTransition(moreButtonContainer, useInstantTransition);

    // The first time the button is presented to the user, scale the button to 0.5 and then animate it to a scale of 1
    if (!doAlwaysShowButton && !useInstantTransition) {

      moreButtonContainer.setAttribute('transform', getTransformString(0.5));

      animate.animateCssProperties(moreButtonContainer, {
        'transform'   : getTransformString(1)
      }, {
        'duration'    : BUTTON_ENTER_ANIMATION_DURATION,
        'useAttribute': true
      });

    }

    // Once we show the button, always show it.
    doAlwaysShowButton = true;

    getHelpOrSecondaryPanel(); // Preload
  }

  function showMoreButtonSlowly() {
    showMoreButton(false);
  }

  function showMoreButtonInstantly() {
    showMoreButton(true);
  }

  function hideHelpButton () {

    moreButtonContainer.setAttribute('class', '');
    moreButtonContainer.style.opacity = 0;

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
  }

  function init() {
    if (isInitialized) {
      return;
    }

    isInitialized = true;

    // Add mouse listeners once BP is ready
    addMouseListeners();

    // After a complete expansion of the badge, determine if and when we will show
    // the "more" button.
    sitecues.on('bp/did-expand', initButtonBehavior); // Future expansions
    initButtonBehavior(); // First expansion is now

    // Allows other modules to show the more button.  For example, pressing the
    // tab key to navigate and operate the panel.
    sitecues.on('bp/did-focus-more-button', showMoreButtonInstantly);

    // Always hide the more button when the panel is about to collapse.
    sitecues.on('bp/will-shrink', hideHelpButton);

    transformEffects.init();
  }

  return {
    init: init
  };
});
