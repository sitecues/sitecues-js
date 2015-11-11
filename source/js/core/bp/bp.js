// Structure of BP:
// bp.js -- initialization and common logic for badge and panel
// badge.js -- logic specific to badge
// panel.js -- logic specific to panel
// placement.js -- logic related to placing the BP in the right place in the DOM and on the screen
//
// sitecues events used by BP
//
// Commands:
// bp/did-change -- call to update the view to match the current state
//
// Information:
// bp/did-create   -- BP inserted in page
// bp/did-complete -- BP ready for input
// bp/will-expand  -- BP is about to expand
// bp/did-expand   -- BP has finished expanding
// bp/will-shrink  -- BP is about to shrink
// bp/did-shrink   -- BP has finished shrinking

define(['core/bp/controller/bp-controller', 'core/bp/model/state','core/bp/view/badge', 'core/bp/view/panel', 'core/bp/helper', 'core/bp/view/svg', 'core/bp/constants',
  'core/bp/view/placement', 'core/bp/view/size-animation', 'core/platform', 'core/conf/site', 'core/conf/user/manager'],
  function (bpController, state, badge, panel, helper, bpSVG, BP_CONST, placement, sizeAnimation, platform, site, conf) {

  /*
   *** Public methods ***
   */

  // The htmlContainer has all of the SVG inside of it, and can take keyboard focus
  var bpContainer,
      isInitComplete,
      byId = helper.byId,
      pendingCompletionCallbackFn;

  /**
   *** Start point ***
   */

  // Allow animations just before panel expands
  function enableAnimations() {
    // todo: take out the class to const
    getSVGElement().setAttribute('class', 'scp-animate');
  }

  function updateView(isFirstTime) {

    getClasses(function(classes) {

      // If we are expanding or contracting, aria-expanded is true (enables CSS)
      updateAria(state.isPanelRequested());

      // 2. Suppress animations if necessary
      // This is done for the first view change
      // TODO: Replace with JS animations, this is just setting a class for
      //       opacity and fill transitions...
      if (!isFirstTime) {
        enableAnimations();
      }

      bpContainer.setAttribute('class', classes);

      sizeAnimation.init(isFirstTime);
    });
  }

  // Update accessibility attributes
  function updateAria(isPanel) {
    // Let the user know that the button is expandable
    getBadgeElement().setAttribute('aria-expanded',isPanel);

    // Hide the inner contents of the button when it's just a button
    getBpContainerElement().setAttribute('aria-hidden', !isPanel);
  }

  // 1. Badge- or panel- specific view classes
  // Space delimited list of classes to set for view
  function getClasses(callbackFn) {

    var classBuilder = state.isPanelRequested() ? panel.getViewClasses() : badge.getViewClasses();
    classBuilder += ' scp-ie9-' + platform.browser.isIE9;

    getPalette(function(palette) {
      classBuilder += ' scp-palette' + palette;
      callbackFn(classBuilder);
    });
  }

  // Set the colors
  function getPalette(callbackFn) {
    if (state.get('isToolbarBadge')) {
      callbackFn(BP_CONST.PALETTE_NAME_MAP.normal);
    }
    else if (state.get('isAdaptivePalette')) {
      require(['page/util/color'], function(colorUtil) {
        var badgeElement = getBadgeElement();
        callbackFn(BP_CONST.PALETTE_NAME_MAP[colorUtil.isOnDarkBackground(badgeElement) ? 'reverse-blue' : 'normal']);
      });
    }
    else {
      callbackFn(state.get('paletteName'));
    }
  }

  // Can get SVG element whether currently attached to document or not
  function getSVGElement() {
    // Don't use helper.byId() because the element isn't inserted in DOM yet.
    return bpContainer.querySelector('#' + BP_CONST.SVG_ID);
  }

  function getBadgeElement() {
    return byId(BP_CONST.BADGE_ID);
  }

  function getBpContainerElement() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }

  /**
   * initializeBPFeature is the main initialization function that is run when the
   * BP feature is ready to be enabled.  It creates the necessary elements,
   * renders them, and emits events for the rest of the application to
   */
  function initBPFeature() {

    if (isInitComplete) {
      return;
    }

    // Initializes the 3 elements fundamental to the BP feature.
    initBPElements();

    // Use fake settings if undefined -- user never used sitecues before.
    // This will be turned off once user interacts with sitecues.
    state.set('isRealSettings', site.get('alwaysRealSettings') || hasSitecuesEverBeenOn());

    // Set badge classes. Render the badge. Render slider.
    updateView(true);

    bpController.init();

    // Turn on TTS button if the setting is on
    if (conf.get('ttsOn')) {
      require(['bp-expanded/view/tts-button'], function (ttsButton) {
        ttsButton.init();
      });
    }

    isInitComplete = true;

    sitecues.on('bp/did-change', updateView);

    pendingCompletionCallbackFn();
  }

  function hasSitecuesEverBeenOn() {
    return typeof conf.get('zoom') !== 'undefined' ||
      typeof conf.get('ttsOn') !== 'undefined';
  }

  // This function augments the customers placeholder if found, otherwise creates the floating badge.
  // The "augmented placeholder", known as the badgeElement, contains the <div> container that contains
  // the <svg> markup. It inserts the <svg> into the <div> and puts that <div> inside the badge element
  // (determined by badge.init()).
  //
  // It binds the permanent event handlers. It positions the elements so they appear directly over
  // the websites placeholder.  It sets the SVG height and width so that it visually covers the
  // placeholder/badgeElement.  It binds event handlers to append the BPContainer to <html> or
  // the badgeElement (switching parent).
  function initBPElements() {

    // This element contains bpContainer
    var badgeElement = badge.init();

    // Create the svg container
    bpContainer = document.createElement('sc');

    // Set attributes
    helper.setAttributes(bpContainer, BP_CONST.PANEL_CONTAINER_ATTRS);

    bpContainer.innerHTML = bpSVG();

    // Parent the badge appropriately
    var svgElement = getSVGElement();

    // Append the bpContainer to the badgeElement.  Also calls repositionBPOverBadge.
    placement.init(badgeElement, bpContainer, svgElement);
  }

  function isBadgeAnImage (badgeElement) {

    return badgeElement && badgeElement.localName === 'img';

  }

  /*
                         ********  INITIALIZATION **********

    How the BP feature is initialized:
      - Immediately initialize if the any of the following are true:
        - If the document is interactive and the customer does not use the <img>
        - If the document is complete
      - If we can't immediately initialize, add the appropriate event listener
        - If the customer uses the <img>, attach a load event listener to the <img>
        - If the customer does NOT use the <img>, attach a readystatechange event listener to the document.
  */

  function initBPWhenDocumentReady(acceptedStates) {
    function initIfReady() {
      if (acceptedStates.indexOf(document.readyState) >= 0) {
        initBPFeature();
        return true;
      }
    }

    if (!initIfReady()) {
      document.addEventListener('readystatechange', initIfReady);
    }
  }

  // The toolbar gets to init earlier than a site-provided badge
  // It's safe to init as soon as the <body> is available
  function initToolbarWhenBodyAvailable() {
    if (document.body) {
      initBPFeature();
    }
    else {
      setTimeout(initToolbarWhenBodyAvailable, 50);
    }
  }

  /**
   * init(bpCompleteCallbackFn)
   *
   * Looks for the badge element, or wait for it to load, and insert and display the BP based on it's position.
   *    When this is called:
   * There are many cases for badge markup or config, and we also can't be sure exactly when this function is called
   * in the lifetime of the document.
   *
   * Conditions required before we create and display BP -- any of the following:
   *   1. conf.uiMode = 'toolbar' AND document.body is available
   *   2. Page readyState is 'interactive' AND badge element is found (also loaded if it was an <img>)
   *   3. Page readyState is 'complete' (will use a toolbar if no badge element is found at this point)
   *
   * BP config/setup cases:
   *   1. Toolbar config (e.g. sitecues everywhere) -- allowed to load early
   *   2. Badge image present <img id="sitecues-badge"> (old-school, these are deprecated)
   *     a) Already loaded
   *     b) Need to wait for <img>
   *   3. Empty badge placeholder <div id="sitecues-badge"> (normal in-page customer case)
   *   4. Missing badge and document not complete -- need to wait to see if badge shows up
   *   5. Missing badge and document complete (causes toolbar)
   *
   * @param bpCompleteCallbackFn called after BP is created and displayed
   */
  function init(bpCompleteCallbackFn) {

    pendingCompletionCallbackFn = bpCompleteCallbackFn;

    // ---- Look for toolbar config ----
    if (site.get('uiMode') === 'toolbar') {
      // Case 1: toolbar config
      if (SC_DEV) { console.log('Early initialization of toolbar.'); }
      initToolbarWhenBodyAvailable();
      return;
    }

    // ---- Look for badge, fall back to toolbar if necessary ----

    // Page may still be loading -- check if the badge is available
    var earlyBadgeElement = getBadgeElement();

    if (earlyBadgeElement) {
      if (!isBadgeAnImage(earlyBadgeElement) || earlyBadgeElement.complete) {
        // Cases 2a, 3 -- some kind if badge element is present AND ready to use
        if (SC_DEV) { console.log('Badge is ready: initialize BP.'); }
        setTimeout(initBPFeature, 0);
        return;
      }

      // Case 2b: need to wait for img
      if (SC_DEV) { console.log('Initialize BP when <img> loads.'); }

      // Loading of badge image is enough -- once it's ready we can initialize
      // because we now have the desired dimensions of the badge
      earlyBadgeElement.addEventListener('load', initBPFeature);

      // Because IE does not reliably fire load events for badge, we
      // will also fall through and listen for document complete events and make doubly
      // sure we are initialized then (at that point, we know for sure the badge img has loaded).
      if (platform.browser.isIE) {
        initBPWhenDocumentReady(['complete']);
      }
      return;
    }

    // Cases 4, 5 -- missing badge. Wait for document to complete.
    // If badge element never shows up at that point, a toolbar will be used
    if (SC_DEV) { console.log('Initialize BP when document.readyState === interactive|complete.'); }

    initBPWhenDocumentReady(['interactive', 'complete']);
  }

  return {
    init: init
  };
});
