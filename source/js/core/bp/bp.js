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

define([
  'core/bp/controller/bp-controller',
  'core/bp/model/state',
  'core/bp/view/view',
  'core/bp/view/badge/base-badge',
  'core/bp/view/panel',
  'core/bp/helper',
  'core/bp/constants',
  'core/bp/view/size-animation',
  'core/platform',
  'core/conf/site',
  'core/conf/user/manager',
  'core/bp/model/classic-site'],
  function(bpController,
           state,
           view,
           baseBadge,
           panel,
           helper,
           BP_CONST,
           sizeAnimation,
           platform,
           site,
           conf,
           classicSite) {

  /*
   *** Public methods ***
   */

  // The htmlContainer has all of the SVG inside of it, and can take keyboard focus
  var bpContainer,
      isBpInitializing,
      byId = helper.byId,
      pendingCompletionCallbackFn,
      badgeView;

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

    var classBuilder = state.isPanelRequested() ? panel.getViewClasses() : baseBadge.getViewClasses();
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

  function getBadgeElement() {
    return byId(BP_CONST.BADGE_ID);
  }

  function getBpContainerElement() {
    return byId(BP_CONST.BP_CONTAINER_ID);
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

    var badgePlaceholderElem = !isToolbarUIRequested() && helper.byId(BP_CONST.BADGE_ID);

    // Get site's in-page placeholder badge or create our own
    if (badgePlaceholderElem) {
      require(['core/bp/view/badge/page-badge'], function(pageBadgeView) {
        badgeView = pageBadgeView;
        pageBadgeView.init(badgePlaceholderElem, onViewInitialized);
      });
    }
    else {
      // Toolbar mode requested or no badge (toolbar is default)
      require(['bp-toolbar-badge/bp-toolbar-badge'], function(toolbarView) {
        badgeView = toolbarView;
        toolbarView.init(onViewInitialized);
      });
    }
  }

  function onViewInitialized() {
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

    sitecues.on('bp/did-change', updateView);

    pendingCompletionCallbackFn();
  }

  function hasSitecuesEverBeenOn() {
    return typeof conf.get('zoom') !== 'undefined' ||
      typeof conf.get('ttsOn') !== 'undefined';
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
  function initClassicMode() {
    state.set('isClassicMode', !!(classicSite() || platform.browser.isIE9));
    sitecues.toggleClassicMode = function() {
      state.set('isClassicMode', !state.get('isClassicMode'));
    };
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

    viewInit.init();

    // ---- Look for toolbar config ----
    if (site.get('uiMode') === 'toolbar') {
      // Case 1: toolbar config
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
