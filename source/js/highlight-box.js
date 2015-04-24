/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 * Documentation: https://equinox.atlassian.net/wiki/display/EN/HLB3
 */
sitecues.def('highlight-box', function(highlightBox, callback) {

  'use strict';

  sitecues.use(
    'jquery',
    'conf',
    'hlb/event-handlers',
    'hlb/positioning',
    'hlb/styling',
    'platform',
    'util/common',
    'hlb/animation',
    'mouse-highlight',
    'util/geo',

    function(
      $,
      conf,
      eventHandlers,
      hlbPositioning,
      hlbStyling,
      platform,
      common,
      hlbAnimation,
      mh,
      geo) {

      /////////////////////////
      // PRIVATE VARIABLES
      ////////////////////////

      var SITECUES_HLB_WRAPPER_ID = 'sitecues-hlb-wrapper', // ID for element which wraps HLB and Dimmer elements
          SITECUES_HLB_ID         = 'sitecues-hlb',         // ID for $hlb
          // Magic. Fixes problems where mouse highlight was SO accurate, that a simple rounding of a pixel
          // would unnecessarily wrap text. Seemed to be more prevalent on IE, fixes stuff for EEOC.
          // Value of 2 instead of 1 fixes wrapping text on this page for all headers:
          // http://www.windoweyesforoffice.com/sitecues/index.php
          EXTRA_HIGHLIGHT_PADDING = 2, // TODO: Figure out why this is needed and compute it.
          MOUSE_SAFETY_ZONE       = 0, // Number of pixels the mouse is allowed to go outside the HLB, before it closes.

          $picked,         // The object chosen by the picker.
          $foundation,     // The sanitized input, used as the basis for creating an $hlb.
          $hlb,            // The cloned object, based on the $foundation.
          $hlbWrapper,     // Container for both the HLB and background dimmer.

          highlight,       // The object given to us by the mouse highlight module.
          initialHLBRect,  // The highlight rect, if it exists, otherwise use the $foundation bounding client rect.
          inheritedZoom,   // Amount of zoom inherited from page's scale transform.
          removeTemporaryFoundation    = false,  // Did we create our own foundation? (becomes true for lonely elements)
          preventDeflationFromMouseout = false,  // State tracking: should the HLB ignore mouse movement?
          isListeningToMouseEvents     = false,  // State tracking: are event listeners currently attached?
          isHLBClosing                 = false,  // State tracking: is the HLB currently deflating?
          isSticky                     = false,  // DEBUG: prevents the HLB from deflating on mouseout.
          foundations = {
            // Keys are tag names of "lonely" elements, which rely upon another element being present to work.
            // Values are functions that return a foundation (like the relied upon element).
            'li'       : getValidListElement,
            'fieldset' : getValidFieldsetElement,
            'input'    : getValidFormElement
          };

      if (SC_DEV) {
        // Boolean that determines if we log HLB information (only works in SC_DEV mode)
        var loggingEnabled = false;
      }

      //////////////////////////////
      // PRIVATE FUNCTIONS
      /////////////////////////////

      /**
       * [mapForm maps input values from one set of elements to another]
       * @param  {[jQuery element]} from [The HLB or The Foundation]
       * @param  {[jQuery element]} to   [The HLB or The Foundation]
       */
      function mapForm($from, $to) {

        // Get descendants of The HLB / The Foundation that may have a value.
        var $fromInputs = $from.find('input, textarea, select')
                .addBack('input, textarea, select'),
            $toInputs = $to.find('input, textarea, select')
                .addBack('input, textarea, select'),
            i, len = $fromInputs.length,
            $currentFromInput,
            $currentToInput,
            fromInputType;

        for (i = 0; i < len; i = i + 1) {
          $currentFromInput = $fromInputs.eq(i);
          $currentToInput = $toInputs.eq(i);
          fromInputType = $currentFromInput.prop('type');
          if (fromInputType === 'radio' || fromInputType === 'checkbox') {
            $currentToInput.prop('checked', $currentFromInput.prop('checked'));
          } else {
            if (platform.browser.isSafari) {
              // In Safari, text inputs opening up in HLB show their contents flush to the bottom
              // instead of vertically centered, unless we tweak the value of the input just after the styles are set
              $currentToInput.val($currentFromInput.val() + ' ');
            }
            $currentToInput.val($currentFromInput.val());
          }
        }
      }

      function copyFormDataToPage() {
        // Copy any form input the user may have entered in the HLB back into the page.
        mapForm($hlb, $foundation);
      }

      /**
       * [onTargetChange is enabled when the HLB is READY.
       * Deflates the HLB if allowed.]
       * @param  {[DOM mousemove event]} event [Mousemove event.]
       */
      function onTargetChange(event) {

        var newTarget   = event.target,
            mouseX      = event.clientX,
            mouseY      = event.clientY,
            isMouseDown,
            HLBBoundingBox;

        // This fixes SC-1834
        if (platform.browser.isIE || platform.browser.isFirefox) {
          isMouseDown = event.buttons === 1;
        } else {
          isMouseDown = event.which === 1;
        }

        // The mouse has never been within the HLB bounds or
        // debugging is enabled.
        if (preventDeflationFromMouseout || isSticky) {
          return;
        }

        // Mouse is currently hovering over the HLB
        if ($hlb[0] === newTarget) {
          return;
        }

        // Is the left mouse button pressed?
        // The user is click + dragging text to copy.
        if (isMouseDown) {
          return;
        }

        HLBBoundingBox = $hlb[0].getBoundingClientRect();

        // If the mouse coordinates are not within the bounds of
        // the HLB + MOUSE_SAFETY_ZONE, then deflate the HLB.
        if (mouseX < HLBBoundingBox.left   - MOUSE_SAFETY_ZONE ||
            mouseX > HLBBoundingBox.right  + MOUSE_SAFETY_ZONE ||
            mouseY < HLBBoundingBox.top    - MOUSE_SAFETY_ZONE ||
            mouseY > HLBBoundingBox.bottom + MOUSE_SAFETY_ZONE) {

          closeHLB(event);
        }
      }

      /**
       * [turnOnHLBEventListeners turns on HLB event handlers for deflation and scroll]
       */
      function turnOnHLBEventListeners() {
        if (isListeningToMouseEvents) {
          return; // Don't add twice in case of hlb retargeting
        }

        isListeningToMouseEvents = true;

        // Register mouse mousemove handler for deflating the HLB
        $(document).on('mousemove', onTargetChange);

        // Register mousemove handler on the HLB element to turn on the ability to exit the HLB by mouse
        // This event handler is unique in that it unregisters itself once executed.
        $hlb.on('mousemove', onHLBHover);

        // Register an event handler for closing the HLB by clicking outside of it.
        $('body').on('click', onClick);
      }

      /**
       * [onHLBReady executes once the HLB is ready (completed inflation animation).
       * Adds the appropriate event listeners and emits hlb/ready]
       */
      function onHLBReady() {

        // Focus input or textarea
        if (common.isEditable($hlb[0])) {
          $hlb.focus();
        }

        // Turn on event listeners for the HLB
        turnOnHLBEventListeners();

        // Let the rest of the application know that the hlb is ready
        // Listeners: hpan.js, invert.js, metrics/hlb-opened.js, mouse-highlight.js, speech.js
        sitecues.emit('hlb/ready', $hlb);
      }

      /**
       * [turnOffHLBEventListeners turns off HLB event handlers for deflation and scroll]
       */
      function turnOffHLBEventListeners() {

        // UNTrap the mousewheel events (we don't want the event to even think when the user scrolls without the HLB)
        eventHandlers.releaseWheelEvents();

        $hlb[0].removeEventListener(common.transitionEndEvent, onHLBReady);

        // Turn off the ability to deflate the HLB with mouse
        $(document).off('mousemove', onTargetChange);

        // Register mouse mousemove handler for deflating the HLB
        $('body').off('click', onClick);

        isListeningToMouseEvents = false;
      }

      /**
       * [closeHLB prepares and deflates the HLB.]
       */
      function closeHLB(event) {

        copyFormDataToPage();

        // Set this to true to prevent toggleHLB();
        isHLBClosing = true;

        turnOffHLBEventListeners();

        hlbAnimation.transitionOutHLB({
          '$hlb'               : $hlb,
          '$hlbWrapper'        : $hlbWrapper,
          'originCSS'          : hlbPositioning.getOriginCSS(),
          'translateCSS'       : hlbPositioning.getTranslateCSS(),
          'onHLBClosed'        : function () { onHLBClosed(event); },
          'transitionProperty' : hlbStyling.transitionProperty
        });
      }

      function targetHLB(isRetargeting) {

        // Set module scoped variable so the rest of the program has reference.
        highlight = mh.getHighlight();

        if (!highlight.fixedContentRect) {
          return;  // No highlight present -- nothing to open HLB on
        }

        // Highlight is present -- guaranteed to have
        // at least one picked element and fixedContentRect outlining the highlight
        $picked = highlight.picked;


        // Set module scoped variable so the rest of the program has reference.
        initialHLBRect = getInitialHLBRect(highlight);

        // Disable mouse highlighting so we don't copy over the highlighting styles from the picked element.
        // It MUST be called before getFoundation().
        sitecues.emit('mh/pause');

        // Sanitize the input, by accounting for "lonely" elements.
        $foundation = getFoundation($picked);

        createHLB(isRetargeting);
      }

      /**
       * [toggleHLB closes or creates a new HLB]
       */
      function toggleHLB() {
        if ($hlb && !isHLBClosing) {
          closeHLB();
        } else {
          targetHLB();
        }
      }

      /**
       * This is called when the user presses a key that moves the mouse highlight
       * has changed while the HLB opens
       */
      function retargetHLB() {
        copyFormDataToPage(); // Make sure we don't lose any of the form entry from the current HLB
        $hlb.remove();
        targetHLB(true);
      }

      /**
       * [getInitialHLBRect returns the initial width and height for our HLB when we first create it.
       * Preferably we utilize the highlight rectangle calculated by the picker.]
       * @param  {[object]} highlight [Information about the highlight --
       *          see https://equinox.atlassian.net/wiki/display/EN/Internal+sitecues+API#InternalsitecuesAPI-Highlight]
       * @return {[Object]}   [Dimensions and position]
       */
      function getInitialHLBRect(highlight) {

        return geo.expandOrContractRect(highlight.fixedContentRect, EXTRA_HIGHLIGHT_PADDING);
      }


      /**
       * [createHLB initializes, positions, and animates the HLB]
       * @param isRetargeting -- true if HLB is moving from one place to another, false if brand new HLB mode
       */
      function createHLB(isRetargeting) {

        // clone, style, filter, emit hlb/create,
        // prevent mousemove deflation, disable scroll wheel
        initializeHLB();

        hlbPositioning.sizeHLB($hlb, $foundation, initialHLBRect);

        hlbPositioning.positionHLB($hlb, initialHLBRect, inheritedZoom);

        // Now that we have extracted all the information from the foundation,
        // it is time to ask whether or not a temporary element has been used
        // and remove it if true.
        if (removeTemporaryFoundation) {
          $foundation.remove();
          removeTemporaryFoundation = false;
        }

        var viewData = {
          '$hlb'               : $hlb,
          '$hlbWrapper'        : $hlbWrapper,
          'originCSS'          : hlbPositioning.getOriginCSS(),
          'translateCSS'       : hlbPositioning.getTranslateCSS(),
          'onHLBReady'         : onHLBReady,
          'transitionProperty' : hlbStyling.transitionProperty
        };

        // setTimeout MIGHT be necessary for the browser to complete the rendering and positioning
        // of the HLB.  Before we scale, it absolutely must be positioned correctly.
        // Note: Interestingly enough, this timeout is unnecessary if we comment out the
        // background dimmer in transitionInHLB(), because the operation took long enough
        // for the browser to update/render the DOM.  This is here for safety (until proven otherwise).
        // If we use a setTimeout, we have to solve the problem of functions being added to the stack before
        // the timeout completes...its a pain.
        hlbAnimation.transitionInHLB(isRetargeting, viewData);
      }

      function getEditableItems() {
        function isEditable(index, element) {
          return common.isEditable(element);
        }
        return $foundation.find('input,textarea')
          .addBack()
          .filter(isEditable);
      }

      /**
       * [initializeHLB is the first step in the creation process for the HLB.
       * This function is responsible for cloning the original element, mapping form data,
       * cloning child styles, filtering attributes, styles, and elements, and setting the
       * HLB with default styles and computed styles.]
       */
      function initializeHLB() {

        // Create and append the HLB and DIMMER wrapper element to the DOM
        $hlbWrapper = getOrCreateHLBWrapper();

        if (platform.browser.isIE && getEditableItems().length) {

          if (SC_DEV && loggingEnabled) {
            console.log('SPECIAL CASE: HLB inside <body>');
          }

          $hlbWrapper.appendTo('body');
          inheritedZoom = conf.get('zoom');  // Zoom inherited from page

        } else {
          $hlbWrapper.insertAfter('body');
          inheritedZoom = 1; // No zoom inherited, because zoom is on <body> and HLB is outside of that
        }

        // Prevents mouse movement from deflating the HLB until mouse is inside HLB
        preventDeflationFromMouseout = true;

        // Clone, style, filter
        cloneHLB();

        eventHandlers.captureWheelEvents($hlb);

        // Listeners: metrics/hlb-opened.js, speech.js
        sitecues.emit('hlb/create', $hlb);
      }

      /**
       * [cloneHLB clones elements and styles from the foundation to the HLB.]
       */
      function cloneHLB() {

        var hlbStyles;

        // The cloned element (HLB)
        $hlb = $($foundation[0].cloneNode(true));

        // Copies form values from the foundation to the HLB
        // Need to do this on a timeout in order to enable Safari input fix hack
        // Commenting out setTimeout fixes problem on TexasAT
        // setTimeout(function() {
        mapForm($foundation, $hlb);
        // }, 0);

        // Clone styles of HLB and children of HLB, so layout is preserved
        hlbStyling.initializeStyles($foundation, $hlb, initialHLBRect);

        // Remove any elements and styles we dont want on the cloned element (such as <script>, id, margin)
        // Filtering must happen after initializeStyles() because we map all children of the original element
        // to the children of the HLB.  There is a possibility that filter will remove one of those children making
        // it much more difficult to map...
        hlbStyling.filter($hlb, $picked, highlight.hiddenElements);

        // This step must occur after filtering, because some of the HLB default styles (such as padding),
        // are filtered as well.  For example, if we want to HLB an element that has 20px of padding, we filter
        // the padding styles (blacklist) and apply default styles.
        hlbStyles = hlbStyling.getHLBStyles($picked, $foundation);

        // Set the styles for the HLB and append to the wrapping element
        $hlb
          .css(hlbStyles)
          .appendTo($hlbWrapper);

        // Fixes problem with TexasAT home page when opening the top nav (Home, Sitemap, Contact Us) in HLB
        hlbStyling.setHLBChildTextColor($hlb);

        // Set the ID of the hlb.
        $hlb[0].id = SITECUES_HLB_ID;
      }

      /**
       * [getValidListElement if the element chosen is an <li>, then we must wrap it with a <ul>
          We must also append this newly created <ul> to the DOM so the HLB
          module can utilize styles and positioning of the "original element"
          Basically, we create a new original element.]
       * @param  {[jQuery element]} originalElement [The element chosen by the picker]
       * @return {[jQuery element]}                 [The element the HLB will use to create itself]
       */
      function getValidListElement($picked) {

        var pickedElement              = $picked[0],
            pickedElementComputedStyle = window.getComputedStyle(pickedElement),
            pickedElementBoundingBox   = pickedElement.getBoundingClientRect(),
            // TODO: Seth: Why not use jQuery's .clone() ??
            pickedElementClone         = pickedElement.cloneNode(true),
            $pickedAndDescendants      = $picked.find('*').addBack(),
            $pickedCloneAndDescendants = $(pickedElementClone).find('*').addBack(),
            $foundation                = $('<ul>').append(pickedElementClone),
            i;

        // Setting this to true will remove the $foundation from the DOM before inflation.
        // This is a very special case where the foundation element is not the same as the picked element.
        // NOTE: This is setting a module scoped variable so the rest of the program as access.
        removeTemporaryFoundation = true;

        // It is important to clone the styles of the parent <ul> of the original element, because it may
        // have important styles such as background images, etc.
        $foundation[0].style.cssText = hlbStyling.getComputedStyleCssText($picked.parents('ul, ol')[0]);

        // Create, position, and style this element so that it overlaps the element chosen by the picker.
        $foundation.css({
          'position'       : 'absolute',
          'left'           : (pickedElementBoundingBox.left + window.pageXOffset) / inheritedZoom,
          'top'            : (pickedElementBoundingBox.top  + window.pageYOffset) / inheritedZoom,
          'opacity'        : 0,
          'padding'        : 0,
          'margin'         : 0,
          'width'          : pickedElementBoundingBox.width / inheritedZoom,
          'list-style-type': pickedElementComputedStyle.listStyleType || 'none'
        }).insertAfter('body');

        // Map all picked elements children CSS to cloned children CSS
        for (i = 0; i < $pickedAndDescendants.length; i += 1) {
          $pickedCloneAndDescendants[i].style.cssText = hlbStyling.getComputedStyleCssText($pickedAndDescendants[i]);
        }

        return $foundation;
      }

      // Implemented to fix issue on http://www.gwmicro.com/Support/Email_Lists/ when HLBing Subscription Management
      function getValidFieldsetElement($picked) {

        var pickedElement              = $picked[0],
            pickedElementsBoundingBox  = pickedElement.getBoundingClientRect(),
            // TODO: Seth: Why not use jQuery's .clone() ??
            pickedElementClone         = pickedElement.cloneNode(true),
            $pickedAndDescendants      = $picked.find('*').addBack(),
            $pickedCloneAndDescendants = $(pickedElementClone).find('*').addBack(),
            $foundation                = $('<div>').append(pickedElementClone),
            i;

        // Setting this to true will remove the $foundation from the DOM before inflation.
        // This is a very special case where the foundation is not the same as the picked element.
        // NOTE: This is setting a module scoped variable so the rest of the program as access.
        removeTemporaryFoundation = true;

        // Create, position, and style this element so that it overlaps the element chosen by the picker.
        $foundation.css({
          'position'       : 'absolute',
          'left'           : (pickedElementsBoundingBox.left + window.pageXOffset) / inheritedZoom,
          'top'            : (pickedElementsBoundingBox.top  + window.pageYOffset) / inheritedZoom,
          'opacity'        : 0,
          'padding'        : 0,
          'margin'         : 0,
          'width'          : pickedElementsBoundingBox.width / inheritedZoom
        }).insertAfter('body');

        // Map all picked elements children CSS to cloned children CSS
        for (i = 0; i < $pickedAndDescendants.length; i += 1) {
          $pickedCloneAndDescendants[i].style.cssText = hlbStyling.getComputedStyleCssText($pickedAndDescendants[i]);
        }

        return $foundation;
      }

      // Implemented to fix issue on http://www.gwmicro.com/Support/Email_Lists/ when HLBing Subscription Management
      function getValidFormElement($picked) {

        var pickedElement              = $picked[0],
            pickedElementsBoundingBox  = pickedElement.getBoundingClientRect(),
            // TODO: Seth: Why not use jQuery's .clone() ??
            pickedElementClone         = pickedElement.cloneNode(true),
            $pickedAndDescendants      = $picked.find('*').addBack(),
            $pickedCloneAndDescendants = $(pickedElementClone).find('*').addBack(),
            $submitButton              = $picked.closest('form').find(':submit'),
            submitButtonClone          = $submitButton.clone(true),
            $foundation                = $('<form>').append(pickedElementClone, submitButtonClone),
            i;

        // Setting this to true will remove the $foundation from the DOM before inflation.
        // This is a very special case where the foundation is not the same as the picked element.
        // NOTE: This is setting a module scoped variable so the rest of the program as access.
        removeTemporaryFoundation = true;

        // Create, position, and style this element so that it overlaps the element chosen by the picker.
        $foundation.css({
          'position'       : 'absolute',
          'left'           : (pickedElementsBoundingBox.left + window.pageXOffset) / inheritedZoom,
          'top'            : (pickedElementsBoundingBox.top  + window.pageYOffset) / inheritedZoom,
          'opacity'        : 0,
          'padding'        : 0,
          'margin'         : 0,
          'width'          : pickedElementsBoundingBox.width / inheritedZoom
        }).insertAfter('body');

        // Map all picked elements children CSS to cloned children CSS
        for (i = 0; i < $pickedAndDescendants.length; i += 1) {
          $pickedCloneAndDescendants[i].style.cssText = hlbStyling.getComputedStyleCssText($pickedAndDescendants[i]);
        }

        return $foundation;
      }

      /**
       * [getFoundation creates and returns a valid element for the HLB.
       *  SC-1629 - Lonely bullets
       *  It is possible that the picker chooses an element for the HLB that is invalid input, therefore,
       *  return the valid input for the HLB given the invalid input/valid input from the picker.]
       * @param  {[DOM element]} pickedElement   [The element chosen by the picker]
       * @return {[DOM element]}                 [The new element create from the element chosen by the picker]
       */
      function getFoundation($picked) {

        var tag;

        for (tag in foundations) {
          if (Object.prototype.hasOwnProperty.call(foundations, tag)) {
            if ($picked.is(tag)) {
              if (SC_DEV && loggingEnabled) {
                console.log('%cSPECIAL CASE: Lonely ' + tag + '.' ,  'background:orange;');
              }
              return foundations[tag]($picked);
            }
          }
        }

        if (SC_DEV && loggingEnabled) {
          console.log('%cTAG: ' + $picked[0].tagName,  'background:orange;');
        }

        return $picked;
      }

      /**
       * [onHLBHover is registered as a "mousemove" event handler when the HLB is ready, and unregisters
       * itself immediately after the mouse moves within the HLB element.  The purpose of this function
       * is to handle the case where the HLB is positioned outside of the mouse coordinates and allows the
       * deflation of the HLB by moving the mouse outside of the HLB area as well as enabling scrolling of the HLB.]
       */
      function onHLBHover() {

        // We only need to know if the mouse has been in the HLB, so remove it once we are certain.
        $hlb.off('mousemove');

        // Any mouse detection within the HLB turns on the ability to exit HLB by moving mouse
        preventDeflationFromMouseout = false;
      }

      function isElementInsideHlb(element) {
        return $hlb.is(element) || $.contains($hlb[0], element);
      }

      function onClick(event) {
        if ($hlb && !isElementInsideHlb(event.target)) {
          // If click is outside of HLB, close it
          // (Need to doublecheck this because HLB can sometimes be inside of <body>)
          sitecues.emit('hlb/toggle');
        }
      }

      /**
       * [onHLBClosed executes once the HLB is deflated (scale = 1).  This function is
       * responsible for setting the state of the application to what it was before
       * any HLB existed.]
       */
      function onHLBClosed(event) {

        // Finally, remove the wrapper element for the HLB and dimmer
        removeHLBWrapper();

        hlbPositioning.setTranslateCSS(undefined);
        hlbPositioning.setOriginCSS(undefined);

        // Clean up "module scoped" vars
        isHLBClosing = false;

        // Listeners: hpan.js, mouse-highlight.js, speech.js
        sitecues.emit('hlb/closed', event);

        $foundation = undefined;
        $hlb             = undefined;
        $picked   = undefined;
        highlight        = undefined;

        if (SC_DEV && loggingEnabled) {
          console.log(
            '%c--------------- HLB DESTROYED -----------------',
            'color:orange; background:purple; font-size: 9pt'
          );
        }
      }

      /**
       * [getHLBWrapper adds the sitecues HLB and DIMMER wrapper outside of the body.]
       */
      function getOrCreateHLBWrapper() {

        return $hlbWrapper ||
                $('<div>', {
                  'id': SITECUES_HLB_WRAPPER_ID
                })
                .css({
                  'padding' : 0,
                  'margin'  : 0,
                  'top'     : 0,
                  'left'    : 0,
                  'position': 'absolute',
                  'overflow': 'visible'
                });
      }

      /**
       * [removeHLBWrapper removes the sitecues HLB and DIMMER wrapper]
       */
      function removeHLBWrapper() {
        if ($hlbWrapper) {
          $hlbWrapper.remove();
          $hlbWrapper = null;
        }
      }

      // Picker module emits this event when the spacebar is pressed.
      sitecues.on('hlb/toggle', toggleHLB);

      // Arrowkeys module emits this event when the HLB needs to move (dimmer already shown)
      sitecues.on('hlb/retarget', retargetHLB);

      //////////////////////////////////
      // PUBLIC FUNCTIONS
      //////////////////////////////////

      // Return the current DOM element for the HLB or falsey value if there is no HLB
      highlightBox.getElement = function() {
        return $hlb && $hlb[0];
      };

      // Public methods.

      /**
       * [toggleStickyHLB enables/disables HLB deflation]
       * @return {[Boolean]} [True if deflation is disabled.  False if deflation is enabled.]
       */
      sitecues.toggleStickyHLB = function() {
        isSticky = !isSticky;
        return isSticky;
      };

      if (SC_DEV) {
        console.log(
          '%cToggle HLB logging by executing : sitecues.toggleHLBLogging();',
          'background:black;color:white;font-size: 11pt'
        );
        sitecues.toggleHLBLogging = function () {
          return loggingEnabled = !loggingEnabled;
        };
      }

      // Expose helper APIs during unit testing.
      if (SC_UNIT) {
        exports.mapForm                  = mapForm;
        exports.onHLBHover               = onHLBHover;
        exports.onTargetChange           = onTargetChange;
        exports.initializeHLB            = initializeHLB;
        exports.turnOnHLBEventListeners  = turnOnHLBEventListeners;
        exports.turnOffHLBEventListeners = turnOffHLBEventListeners;
        exports.cloneHLB                 = cloneHLB;
        exports.createHLB                = createHLB;
        exports.closeHLB                 = closeHLB;
        exports.onHLBClosed              = onHLBClosed;
        exports.onHLBReady               = onHLBReady;
        exports.getOrCreateHLBWrapper    = getOrCreateHLBWrapper;
        exports.removeHLBWrapper         = removeHLBWrapper;
        exports.toggleHLB                = toggleHLB;
        exports.getValidFoundation       = getFoundation;

        exports.setHLB = function($input) {
          $hlb = $input;
        };

        exports.getHLB = function() {
          return $hlb;
        };

        exports.setFoundation = function($input) {
          $foundation = $input;
        };

        exports.getPreventDeflationFromMouseout = function() {
          return preventDeflationFromMouseout;
        };

        exports.setPreventDeflationFromMouseout = function(input) {
          preventDeflationFromMouseout = input;
        };

        exports.setHLBWrapper = function($input) {
          $hlbWrapper = $input;
        };

        exports.getHLBWrapper = function() {
          return $hlbWrapper;
        };

        exports.$getPicked = function() {
          return $picked;
        };

        exports.$getFoundation = function () {
          return $foundation;
        };

        exports.getDefaultHLBId = function() {
          return SITECUES_HLB_ID;
        };

        exports.setIsHLBClosing = function(input) {
          isHLBClosing = input;
        };

        exports.getIsHLBClosing = function() {
          return isHLBClosing;
        };

        exports.getRemoveTemporaryFoundation = function () {
          return removeTemporaryFoundation;
        };

        exports.setRemoveTemporaryFoundation = function (input) {
          removeTemporaryFoundation = input;
        };

        exports.setHighlight = function (input) {
          highlight = input;
        };
      }

      callback();

  });

});
