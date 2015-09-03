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

define(['bp/controller/bp-controller', 'bp/model/state','bp/view/modes/badge', 'bp/view/modes/panel', 'bp/helper', 'bp/view/svg', 'bp/constants',
  'bp/placement', 'bp/size-animation', 'util/platform', 'conf/site', 'conf/user/manager'],
  function (bpController, state, badge, panel, helper, bpSVG, BP_CONST, placement, sizeAnimation, platform, site, conf) {

  /*
   *** Public methods ***
   */

  // The htmlContainer has all of the SVG inside of it, and can take keyboard focus
  var bpContainer,
      isInitComplete,
      isInitBegun;

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
      helper.byId(BP_CONST.BADGE_ID).setAttribute('aria-expanded', state.isPanelRequested());

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

  // 1. Badge- or panel- specific view classes
  // Space delimited list of classes to set for view
  function getClasses(callbackFn) {

    var classBuilder = state.isPanelRequested() ? panel.getViewClasses() : badge.getViewClasses();
    classBuilder += ' scp-ie9-' + platform.isIE9;

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
      require(['util/color'], function(colorUtil) {
        var badgeElement = helper.byId(BP_CONST.BADGE_ID);
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

    isInitComplete = true;

    sitecues.on('bp/did-change', updateView);
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

  // Initialize the BP feature if any of the following are true:
  //    * document.readyState is 'complete'
  //    * document.readyState is 'interactive' AND the site does not have an <img> placeholder.
  function isDocumentReadyForBP (badgeElement) {
    return (document.readyState === 'interactive' && !isBadgeAnImage(badgeElement)) || document.readyState === 'complete';
  }

  /*
                         ********  INITIALIZATION **********

    How the BP feature is initialized:
      - Immediately initalize if the any of the following are true:
        - If the document is interactive and the customer does not use the <img>
        - If the document is complete
      - If we can't immediately initialize, add the appropriate event listener
        - If the customer uses the <img>, attach a load event listener to the <img>
        - If the customer does NOT use the <img>, attach a readystatechange event listener to the document.
  */

  function initBPIfDocumentComplete() {
    if (document.readyState === 'complete') {
      initBPFeature();
      return true;
    }
  }

  function initBPWhenDocumentComplete() {
    if (!initBPIfDocumentComplete()) {
      document.addEventListener('readystatechange', initBPIfDocumentComplete);
    }
  }

  function init() {

    if (isInitBegun) {
      return;
    }

    isInitBegun = true;

    if (site.get('uiMode') === 'toolbar') {
      setTimeout(initBPFeature, 0);
      return;
    }

    // Page may still be loading -- check if the badge is available
    var earlyBadgeElement = helper.byId(BP_CONST.BADGE_ID);

    if (earlyBadgeElement && isDocumentReadyForBP(earlyBadgeElement)) {

      SC_DEV && console.log('Document ready to initialize BP.');

      setTimeout(initBPFeature, 0);

    } else {

      if (isBadgeAnImage(earlyBadgeElement) && !earlyBadgeElement.complete) {

        SC_DEV && console.log('Initialize BP when <img> loads.');

        // Loading of badge image is enough -- once it's ready we can initialize
        // because we now have the desired dimensions of the badge
        earlyBadgeElement.addEventListener('load', initBPFeature);

        // Because IE does not reliably fire load events for badge, we
        // will also listen for document complete events and make  sure we are initialized then
      }

      SC_DEV && console.log('Initialize BP when document.readyState === complete.');

      initBPWhenDocumentComplete();
    }
  }

  return {
    init: init
  };
});
