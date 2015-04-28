// Structure of BP:
// bp.js -- initialization and common logic for badge and panel
// badge.js -- logic specific to badge
// panel.js -- logic specific to panel
// placement.js -- logic related to placing the BP in the right place in the DOM and on the screen
//
// sitecues events used by BP
//
// Commands:
// bp/do-update    -- call to update the view to match the current state
// bp/do-expand    -- call to expand the BP or listen to know when the BP will expand
//
// Information:
// bp/did-create   -- BP inserted in page
// bp/did-complete -- BP ready for input
// bp/will-expand  -- BP is about to expand
// bp/will-shrink  -- BP is about to shrink
// bp/did-shrink   -- BP has finished shrinking

sitecues.def('bp', function (bp, callback) {
  'use strict';
  // So many dependencies...
  sitecues.use('bp/model/state','bp/view/modes/badge', 'bp/view/modes/panel', 'bp/helper', 'bp/view/svg', 'bp/constants',
    'zoom', 'bp/controller/bp-controller', 'bp/controller/base-controller', 'bp/placement', 'bp/view/elements/slider',
    'bp/animate', 'platform', 'conf/site',
    function (state, badge, panel, helper, bpSVG, BP_CONST, zoomMod, bpController,
              baseController, placement, slider, animate, platform, site) {

    /*
     *** Public methods ***
     */

    // The htmlContainer has all of the SVG inside of it, and can take keyboard focus
    var bpContainer,
        isInitialized,
        MIN_YIQ_LIGHT_TEXT = 160;

    /**
     *** Start point ***
     */

    // Allow animations just before panel expands
    function enableAnimations() {
      // todo: take out the class to const
      getSVGElement().setAttribute('class', 'scp-animate');
    }

    function updateView(isFirstTime) {

      // If we are expanding or contracting, aria-expanded is true (enables CSS)
      helper.byId(BP_CONST.BADGE_ID).setAttribute('aria-expanded', state.isPanelRequested() || !state.isBadge());

      // 2. Suppress animations if necessary
      // This is done for the first view change
      // TODO: Replace with JS animations, this is just setting a class for
      //       opacity and fill transitions...
      if (!isFirstTime) {
        enableAnimations();
      }

      updateClasses();

      animate.initAnimation(isFirstTime);

      // Required to fade in text, because text is display:none and it is impossible
      // to transition any property AND set display:block with a single operation... so
      // setTimeout saves the day.
      if (state.isPanel()) {
        setTimeout(function () {
          bpContainer.setAttribute('class', bpContainer.getAttribute('class') + ' fade-in-text');
        }, 10);  // 10ms because IE did not do anything when <10ms....
      }

    }

    // 1. Badge- or panel- specific view classes
    // Space delimited list of classes to set for view
    function updateClasses() {

      var classBuilder = state.isPanelRequested() ? panel.getViewClasses() : badge.getViewClasses();
      classBuilder += 'scp-palette' + getPalette();
      classBuilder += ' scp-ie9-' + !!platform.browser.isIE9;
      bpContainer.setAttribute('class', classBuilder);
    }

    // TODO : This code is copied from the mouse-highlight module, put then in a
    //        common module that does not use jQuery.
    /**
     * Returns an object {r: #, g: #, b: #, a: #}
     * @param colorString  A color string provided by getComputedStyle() in the form of rgb(#, #, #) or rgba(#, #, #, #)
     * @returns {rgba object}
     */
    function getRgba(colorString) {
      // In some browsers, sometimes the computed style for a color is 'transparent' instead of rgb/rgba
      if (colorString === 'transparent') {
        return {
          r: 0,
          g: 0,
          b: 0,
          a: 0
        };
      }
      var MATCH_COLORS = /rgba?\((\d+), (\d+), (\d+),?( [\d?.]+)?\)/,
        match = MATCH_COLORS.exec(colorString) || {};

      return {
        r: parseInt(match[1] || 0),
        g: parseInt(match[2] || 0),
        b: parseInt(match[3] || 0),
        a: parseFloat(match[4] || 1)
      };
    }

    function isLightTone(colorValue) {

      var RGBAColor = getRgba(colorValue),
        // http://en.wikipedia.org/wiki/YIQ
        yiq = ((RGBAColor.r*299)+(RGBAColor.g*587)+(RGBAColor.b*114)) * RGBAColor.a / 1000;

      return yiq > MIN_YIQ_LIGHT_TEXT;
    }

    function getAlpha(color) {
      return getRgba(color).a;
    }

    // Starting at the sitecues-badge element, keep moving up ancestors until we find a non-transparent
    // background.  Analyze the color, and determine the best suited color palette for the badge.
    function getAdaptivePalette() {

      var badgeElement = helper.byId(BP_CONST.BADGE_ID),
          currentParent,
          currentBackgroundColor;

      while (true) {

        currentParent          = currentParent ? currentParent.parentElement : badgeElement.parentElement;
        currentBackgroundColor = window.getComputedStyle(currentParent).backgroundColor;

        // Just return the normal palette if we have reached the <html>
        if (currentParent === document.documentElement) {
          return BP_CONST.PALETTE_NAME_MAP.normal;
        }

        // Only care about non-transparent backgrounds
        if (getAlpha(currentBackgroundColor) > 0.5) {

          if (isLightTone(currentBackgroundColor)) {
            return BP_CONST.PALETTE_NAME_MAP.normal;
          } else {
            return BP_CONST.PALETTE_NAME_MAP['reverse-blue'];
          }

        }
      }

    }

      // Set the colors
    function getPalette() {
      if (state.get('isToolbarBadge')) {
        return BP_CONST.PALETTE_NAME_MAP.normal;
      }
      if (state.get('isAdaptivePalette')) {
        return getAdaptivePalette();
      }
      return state.get('paletteName');
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
    function initializeBPFeature() {

      if (isInitialized) {
        return;
      }

      // Initializes the 3 elements fundamental to the BP feature.
      initBPElements();

      // Use fake settings if undefined -- user never used sitecues before.
      // This will be turned off once user interacts with sitecues.
      state.set('isRealSettings', site.get('alwaysRealSettings') ||
        zoomMod.hasZoomEverBeenSet()); // TODO what about audio?

      // Set badge classes. Render the badge. Render slider.
      updateView(true);

      slider.renderView();

      // Notify other modules we're completely ready
      // slider.js     -> Bind mousedown handlers for A's, thumb, slider. updateZoomValueView.
      // panel.js      -> Bind mousedown handler to SVG_ID
      // zoom.js       -> performInitialLoadZoom
      // tts-button.js -> init (TODO: Be certain that bp/did-create was not necessary)
      sitecues.emit('bp/did-complete');

      isInitialized = true;
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
      bpContainer = document.createElement('div');

      // Set attributes
      helper.setAttributes(bpContainer, BP_CONST.PANEL_CONTAINER_ATTRS);

      bpContainer.innerHTML = bpSVG.getSvg();

      // TODO: Should we remove the commented out code below?
      // Create focus outline element
      // var focusOutline = document.createElement('div');
      // document.querySelector('#scp-bp-container').appendChild(focusOutline);
      // focusOutline.setAttribute('id', 'scbp-target-outline')

      // Parent the badge appropriately
      var svgElement = getSVGElement();

      // Append the bpContainer to the badgeElement.  Also calls repositionBPOverBadge.
      placement.init(badgeElement, bpContainer, svgElement);

      bindPermanentListeners(badgeElement);
    }

    function bindPermanentListeners(badgeElement) {
      badgeElement.addEventListener('keydown', bpController.processBadgeActivationKeys);
      badgeElement.addEventListener('mousedown', bpController.suppressBadgeFocusOnClick);
      badgeElement.addEventListener('click', bpController.clickToOpenPanel);
      bpContainer.addEventListener('blur', baseController.clearPanelFocus);
      badgeElement.addEventListener('mouseover', bpController.onMouseEnter);
      badgeElement.addEventListener('mouseout', bpController.onMouseLeave);
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

    sitecues.on('bp/do-update', updateView);

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
        initializeBPFeature();
        return true;
      }
    }

    function initBPWhenDocumentComplete() {
      if (!initBPIfDocumentComplete()) {
        document.addEventListener('readystatechange', initBPIfDocumentComplete);
      }
    }

    function initIfBadgeReady() {

      if (site.get('uiMode') === 'toolbar') {
        setTimeout(initializeBPFeature, 0);
        return;
      }

      // Page may still be loading -- check if the badge is available
      var earlyBadgeElement = helper.byId(BP_CONST.BADGE_ID);

      if (earlyBadgeElement && isDocumentReadyForBP(earlyBadgeElement)) {

        SC_DEV && console.log('Document ready to initialize BP.');

        initializeBPFeature();

      } else {

        if (isBadgeAnImage(earlyBadgeElement) && !earlyBadgeElement.complete) {

          SC_DEV && console.log('Initialize BP when <img> loads.');

          // Loading of badge image is enough -- once it's ready we can initialize
          // because we now have the desired dimensions of the badge
          earlyBadgeElement.addEventListener('load', initializeBPFeature);

          // Because IE does not reliably fire load events for badge, we
          // will also listen for document complete events and make  sure we are initialized then
        }

        SC_DEV && console.log('Initialize BP when document.readyState === complete.');

        initBPWhenDocumentComplete();
      }
    }

    initIfBadgeReady();

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });
});
