// Structure of BP:
// bp.js -- initialization and common logic for badge and panel
// badge.js -- logic specific to badge
// panel.js -- logic specific to panel
// placement.js -- logic related to placing the BP in the right place in the DOM and on the screen
//
// sitecues events used by BP
//
// Information:
// bp/did-create   -- BP inserted in page
// bp/did-complete -- BP ready for input
// bp/will-expand  -- BP is about to expand
// bp/did-expand   -- BP has finished expanding
// bp/will-shrink  -- BP is about to shrink
// bp/did-shrink   -- BP has finished shrinking

define([
  'core/bp/controller/bp-controller',
  'core/bp/model/state',
  'core/bp/helper',
  'core/bp/constants',
  'core/platform',
  'core/conf/site',
  'core/bp/model/classic-mode',
  'core/bp/view/badge/page-badge'
], function(bpController,
           state,
           helper,
           BP_CONST,
           platform,
           site,
           classicMode,
           pageBadgeView) {

  /*
   *** Public methods ***
   */

  // The htmlContainer has all of the SVG inside of it, and can take keyboard focus
  var isBpInitializing,
      byId = helper.byId,
      pendingCompletionCallbackFn,
      badgeView;

  /**
   *** Start point ***
   */

  function getBadgeElement() {
    return byId(BP_CONST.BADGE_ID);
  }

  function isToolbarUIRequested() {
    return site.get('uiMode') === 'toolbar';
  }

  /**
   * initializeBPFeature is the main initialization function that is run when the
   * BP feature is ready to be enabled.  It creates the necessary elements,
   * renders them, and emits events for the rest of the application to
   */
  function initBPFeature() {
    if (isBpInitializing) {
      return;
    }

    isBpInitializing = true;

    if (!SC_EXTENSION && !isToolbarUIRequested()) {
      var badgePlaceholderElem = helper.byId(BP_CONST.BADGE_ID);

      // Get site's in-page placeholder badge or create our own
      if (badgePlaceholderElem) {
        badgeView = pageBadgeView;
        pageBadgeView.init(badgePlaceholderElem, onViewInitialized);
        return;
      }
    }

    // Toolbar mode requested or no badge (toolbar is default)
    require(['bp-toolbar-badge/bp-toolbar-badge'], function(toolbarView) {
      badgeView = toolbarView;
      toolbarView.init(onViewInitialized);
    });
  }

  function onViewInitialized() {
    bpController.init();
    fixDimensionsOfBody();
    pendingCompletionCallbackFn();
  }

  /*
                         ********  INITIALIZATION **********

      - Immediately initialize if the any of the following are true:
        - If the document is interactive and the customer does not use the <img>
        - If the document is complete
      - If we can't immediately initialize, add the appropriate event listener
        - If the customer uses the <img>, attach a load event listener to the <img>
        - If the customer does NOT use the <img>, attach a readystatechange event listener to the document.
  */

  // Init BP if the badge is ready and the document is 'interactive'|'complete'
  // Return true if BP initialized
  function initBPIfDocAndBadgeReady() {
    var readyState = document.readyState;
    if (readyState === 'complete' || (isBadgeReady() && readyState === 'interactive')) {
      initBPFeature();
      return true;
    }
  }

  function isBadgeReady() {
    var badgeElement = getBadgeElement();
    return badgeElement && (badgeElement.localName !== 'img' || badgeElement.complete);
  }

  // The toolbar gets to init earlier than a site-provided badge
  // It's safe to init as soon as the <body> is available
  function initWhenBodyAvailable() {
    if (document.body) {
      initBPFeature();
    }
    else {
      setTimeout(initWhenBodyAvailable, 250);
    }
  }

  // Classic mode is where the ? shows up instead of the down pointing arrow
  // TODO remove one day, we hope
  function initClassicMode() {
    state.set('isClassicMode', classicMode());
    sitecues.toggleClassicMode = function() {
      state.set('isClassicMode', !state.get('isClassicMode'));
    };
  }

  //It's possible that the transformations we apply to the body disrupt absolutely positioned elements
  //contained by the initial containing block. This is a hacky solution to the problem, but it is much cheaper
  //than analyzing the page and manually repositioning absolute elements.
  function fixDimensionsOfBody() {
    var body = document.body,
      bodyStyle   = getComputedStyle(body),
      docStyle    = getComputedStyle(document.documentElement),
      botMargin   = parseFloat(bodyStyle.marginBottom),
      topMargin   = bodyStyle.marginTop,
      leftMargin  = bodyStyle.marginLeft,
      rightMargin = bodyStyle.marginRight;

    if (parseFloat(bodyStyle.height) < parseFloat(docStyle.height)) {
      body.style.height = docStyle.height;
    }
    if (botMargin !== 0) {
      //marginBottom doesn't override bottom margins that are set with the shorthand 'margin' style,
      //so we get all the margins and set our own inline shorthand margin
      body.style.margin = topMargin + ' ' + rightMargin + ' 0px ' + leftMargin;
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
   *   1. site.get('uiMode') = 'toolbar' AND document.body is available
   *   2. Page readyState is 'interactive' AND badge element is found (also loaded if it was an <img>)
   *   3. Page readyState is 'complete' (will use a toolbar if no badge element is found at this point)
   *
   * BP config/setup cases:
   *   1. Toolbar config (e.g. sitecues everywhere) -- allowed to load early
   *   2. Empty badge placeholder <div id="sitecues-badge"> (normal in-page customer case)
   *   3. Badge image present <img id="sitecues-badge"> (old-school, these are deprecated)
   *     a) Already loaded
   *     b) Need to wait for <img>
   *   4. Missing badge and document not complete -- need to wait to see if badge shows up
   *   5. Missing badge and document complete (causes toolbar)
   *
   * @param bpCompleteCallbackFn called after BP is created and displayed
   */
  function init(bpCompleteCallbackFn) {

    pendingCompletionCallbackFn = bpCompleteCallbackFn;

    initClassicMode();

    // ---- Look for toolbar config ----
    if (isToolbarUIRequested()) {
      // Case 1: toolbar config -- no need to wait for badge placeholder
      if (SC_DEV) { console.log('Early initialization of toolbar.'); }
      initWhenBodyAvailable();
      return;
    }

    // ---- Look for badge, fall back to toolbar if necessary ----

    // Page may still be loading -- check if the badge is available
    if (!initBPIfDocAndBadgeReady()) {
      // Could not init sitecues yet
      var earlyBadgeElement = getBadgeElement();
      if (earlyBadgeElement && !isBadgeReady()) {
        // We have a badge <img> but it's not loaded yet
        // Check document and badge after badge loads
        earlyBadgeElement.addEventListener('load', initBPIfDocAndBadgeReady);
      }

      // Whenever document readyState changes, check to see if we can init sitecues
      document.addEventListener('readystatechange', initBPIfDocAndBadgeReady);
    }
  }

  return {
    init: init
  };
});
