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
          SITECUES_HLB_ID         = 'sitecues-hlb',         // ID for $hlbElement

          MOUSE_SAFETY_ZONE = 0, // Amount of pixels surrounding HLB that is safe for mouse to enter without closing HLB

          highlight,

          $pickedElement,      // The element chosen by the picker.
          $originalElement,    // The element which serves as a model or basis for imitations or copies
          $hlbElement,         // Element that is cloned from the originalElement (HLB)
          $hlbWrappingElement, // Element outside the body that contains the HLB and background dimmer

          // Fixes problems where mouse highlight was SO accurate, that a simple rounding of a pixel
          // would unnecessarily wrap text.  Seemed to be more prevalent on IE, fixes stuff for EEOC.
          // Value of 2 instead of 1 fixes wrapping text on this page http://www.windoweyesforoffice.com/sitecues/index.php
          // for all headers...
          EXTRA_HIGHLIGHT_PADDING = 2, //TODO: compute this, figure out why its needed...

          initialHLBRect,      // The highlight rect, if it exists, otherwise use the $originalElement bounding client rect.

          removeTemporaryOriginalElement = false, // In some scenarios, we must create our own original element and must remove it from the DOM
          preventDeflationFromMouseout   = false, // Boolean that deter mines if HLB can be deflated.
          isListeningToMouseEvents       = false, // Are event listeners currently attached
          isHLBClosing                   = false, // Boolean that determines if the HLB is currently deflating.
          isSticky                       = false, // DEBUG: HLB deflation toggler
          inheritedZoom;                          // Amount of zoom inherited from page's scale transform

      if (SC_DEV) {

        // Boolean that determines if we log HLB information (only works in SC_DEV mode)
        var loggingEnabled = false;

      }

      //////////////////////////////
      // PRIVATE FUNCTIONS
      /////////////////////////////

      /**
       * [toggleHLB closes or creates a new HLB]
       */
      function toggleHLB() {

        // If the HLB is currently deflating, no need to toggle
        if (isHLBClosing) {
          return;
        }

        // If an HLB exists
        if ($hlbElement) {
          closeHLB();
        // If the HLB does not exist
        } else {
          targetHLB();
        }
      }

      function targetHLB(isRetargeting) {

        // Set module scoped variable so the rest of the program has reference.
        highlight = mh.getHighlight();

        if (!highlight.fixedContentRect) {
          return;  // No highlight present -- nothing to open HLB on
        }

        // Highlight is present -- guaranteed to have
        // at least one picked element and fixedContentRect outlining the highlight
        $pickedElement = highlight.picked;


        // Set module scoped variable so the rest of the program has reference.
        initialHLBRect = getInitialHLBRect(highlight);

        // Disable mouse highlighting so we don't copy over the highlighting styles from the picked element.
        // It MUST be called before getValidOriginalElement().
        sitecues.emit('mh/pause');

        // Set module scoped variable so the rest of the program has reference.
        $originalElement = getValidOriginalElement($pickedElement);

        createHLB(isRetargeting);
      }

      /**
       * This is called when the user presses a key that moves the mouse highlight
       * has changed while the HLB opens
       */
      function retargetHLB() {
        copyFormDataToPage(); // Make sure we don't lose any of the form entry from the current HLB

        $hlbElement.remove();

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

        hlbPositioning.sizeHLB($hlbElement, $originalElement, initialHLBRect);

        hlbPositioning.positionHLB($hlbElement, initialHLBRect, inheritedZoom);

        // Now that we have extracted all the information from the original element,
        // it is time to ask whether or not a temporary original element has been used
        // and remove it if true.
        if (removeTemporaryOriginalElement) {
          $originalElement.remove();
          removeTemporaryOriginalElement = false;
        }

        var viewData = {
          '$hlbElement'        : $hlbElement,
          '$hlbWrappingElement': $hlbWrappingElement,
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
        return $originalElement.find('input,textarea')
          .addBack()
          .filter(isEditable);
      }

      /**
       * [initializeHLB is the first step in the creation process for the HLB.
       * This function is responsible for cloning the original element, mapping form data,
       * cloning child styles, filtering attributes, styles, and elements, and setting the
       * HLB with default styles and computed styles.]
       * @param  {[DOM element]} originalElement [DOM element that is the original element chosen by the picker.]
       */
      function initializeHLB() {

        // Create and append the HLB and DIMMER wrapper element to the DOM
        $hlbWrappingElement = getOrCreateHLBWrapper();

        if (platform.browser.isIE && getEditableItems().length) {

          if (SC_DEV && loggingEnabled) {
            console.log('SPECIAL CASE: HLB inside <body>');
          }

          $hlbWrappingElement.appendTo('body');
          inheritedZoom = conf.get('zoom');  // Zoom inherited from page

        } else {
          $hlbWrappingElement.insertAfter('body');
          inheritedZoom = 1; // No zoom inherited, because zoom is on <body> and HLB is outside of that
        }

        // Prevents mouse movement from deflating the HLB until mouse is inside HLB
        preventDeflationFromMouseout = true;

        // Clone, style, filter
        cloneHLB();

        eventHandlers.captureWheelEvents($hlbElement);

        // Listeners: metrics/hlb-opened.js, speech.js
        sitecues.emit('hlb/create', $hlbElement);

      }

      /**
       * [cloneHLB clones elements and styles from the original element to the HLB element.]
       */
      function cloneHLB() {

        var hlbStyles;

        // The cloned element (HLB)
        $hlbElement = $($originalElement[0].cloneNode(true));

        // Copies form values from original element to HLB
        // Need to do this on a timeout in order to enable Safari input fix hack
        // Commenting out setTimeout fixes problem on TexasAT
        // setTimeout(function() {
        mapForm($originalElement, $hlbElement);
        // }, 0);

        // Clone styles of HLB and children of HLB, so layout is preserved
        hlbStyling.initializeStyles($originalElement, $hlbElement, initialHLBRect);

        // Remove any elements and styles we dont want on the cloned element (such as <script>, id, margin)
        // Filtering must happen after initializeStyles() because we map all children of the original element
        // to the children of the HLB.  There is a possibility that filter will remove one of those children making
        // it much more difficult to map...
        hlbStyling.filter($hlbElement, $pickedElement, highlight.hiddenElements);

        // This step must occur after filtering, because some of the HLB default styles (such as padding),
        // are filtered as well.  For example, if we want to HLB an element that has 20px of padding, we filter
        // the padding styles (blacklist) and apply default styles.
        hlbStyles = hlbStyling.getHLBStyles($pickedElement, $originalElement);

        // Set the styles for the HLB and append to the wrapping element
        $hlbElement
          .css(hlbStyles)
          .appendTo($hlbWrappingElement);

        // Fixes problem with TexasAT home page when opening the top nav (Home, Sitemap, Contact Us) in HLB
        hlbStyling.setHLBChildTextColor($hlbElement);

        // Set the ID of the hlbElement.
        $hlbElement[0].id = SITECUES_HLB_ID;

      }

      /**
       * [getValidOriginalElement creates and returns a valid element for the HLB.
       *  SC-1629 - Lonely bullets
       *  It is possible that the picker chooses an element for the HLB that is invalid input, therefore,
       *  return the valid input for the HLB given the invalid input/valid input from the picker.]
       * @param  {[DOM element]} pickedElement   [The element chosen by the picker]
       * @return {[DOM element]}                 [The new element create from the element chosen by the picker]
       */
      function getValidOriginalElement($pickedElement) {

        if ($pickedElement.is('li')) {

          if (SC_DEV && loggingEnabled) {
            console.log('%cSPECIAL CASE: Lonely list item.',  'background:orange;');
          }

          return getValidListElement($pickedElement);

        }

        if ($pickedElement.is('fieldset')) {

          if (SC_DEV && loggingEnabled) {
            console.log('%cSPECIAL CASE: Lonely fieldset.',  'background:orange;');
          }

          return getValidFieldsetElement($pickedElement);

        }

        return $pickedElement;

      }

      /**
       * [getValidListElement if the element chosen is an <li>, then we must wrap it with a <ul>
          We must also append this newly created <ul> to the DOM so the HLB
          module can utilize styles and positioning of the "original element"
          Basically, we create a new original element.]
       * @param  {[DOM element]} originalElement [The element chosen by the picker]
       * @return {[DOM element]}                 [The element the HLB will use to create itself]
       */
      function getValidListElement($pickedElement) {

        var pickedElement                  = $pickedElement[0],
            pickedElementsComputedStyles   = window.getComputedStyle(pickedElement),
            pickedElementsBoundingBox      = pickedElement.getBoundingClientRect(),
            pickedElementsClone            = pickedElement.cloneNode(true),
            pickedElementAndChildren       = $pickedElement.find('*').addBack(),
            pickedElementsCloneAndChildren = $(pickedElementsClone).find('*').addBack(),
            $originalElement               = $('<ul>').append(pickedElementsClone);

        // Setting this to true will remove the $originalElement from the DOM before inflation.
        // This is a very special case where the original element is not the same as the picked element.
        // NOTE: This is setting a module scoped variable so the rest of the program as access.
        removeTemporaryOriginalElement = true;

        // It is important to clone the styles of the parent <ul> of the original element, because it may
        // have important styles such as background images, etc.
        $originalElement[0].style.cssText = hlbStyling.getComputedStyleCssText($pickedElement.parent('ul, ol')[0]);

        // Create, position, and style this element so that it overlaps the element chosen by the picker.
        $originalElement.css({
          'position'       : 'absolute',
          'left'           : (pickedElementsBoundingBox.left + window.pageXOffset) / inheritedZoom,
          'top'            : (pickedElementsBoundingBox.top  + window.pageYOffset) / inheritedZoom,
          'opacity'        : 0,
          'padding'        : 0,
          'margin'         : 0,
          'width'          : pickedElementsBoundingBox.width / inheritedZoom,
          'list-style-type': pickedElementsComputedStyles.listStyleType ? pickedElementsComputedStyles.listStyleType : 'none'
        }).insertAfter('body');

        // Map all picked elements children CSS to cloned children CSS
        for (var i = 0; i < pickedElementAndChildren.length; i += 1) {
          pickedElementsCloneAndChildren[i].style.cssText = hlbStyling.getComputedStyleCssText(pickedElementAndChildren[i]);
        }

        return $originalElement;

      }

      // Implemented to fix issue on http://www.gwmicro.com/Support/Email_Lists/ when HLBing Subscription Management
      function getValidFieldsetElement($pickedElement) {

        var pickedElement                  = $pickedElement[0],
            pickedElementsBoundingBox      = pickedElement.getBoundingClientRect(),
            pickedElementsClone            = pickedElement.cloneNode(true),
            pickedElementAndChildren       = $pickedElement.find('*').addBack(),
            pickedElementsCloneAndChildren = $(pickedElementsClone).find('*').addBack(),
            $originalElement               = $('<div>').append(pickedElementsClone);

        // Setting this to true will remove the $originalElement from the DOM before inflation.
        // This is a very special case where the original element is not the same as the picked element.
        // NOTE: This is setting a module scoped variable so the rest of the program as access.
        removeTemporaryOriginalElement = true;

        // Create, position, and style this element so that it overlaps the element chosen by the picker.
        $originalElement.css({
          'position'       : 'absolute',
          'left'           : (pickedElementsBoundingBox.left + window.pageXOffset) / inheritedZoom,
          'top'            : (pickedElementsBoundingBox.top  + window.pageYOffset) / inheritedZoom,
          'opacity'        : 0,
          'padding'        : 0,
          'margin'         : 0,
          'width'          : pickedElementsBoundingBox.width / inheritedZoom
        }).insertAfter('body');

        // Map all picked elements children CSS to cloned children CSS
        for (var i = 0; i < pickedElementAndChildren.length; i += 1) {
          pickedElementsCloneAndChildren[i].style.cssText = hlbStyling.getComputedStyleCssText(pickedElementAndChildren[i]);
        }

        return $originalElement;
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
        $hlbElement.on('mousemove', onHLBHover);

        // Register an event handler for closing the HLB by clicking outside of it.
        $('body').on('click', onClick);
      }

      /**
       * [turnOffHLBEventListeners turns off HLB event handlers for deflation and scroll]
       */
      function turnOffHLBEventListeners() {

        // UNTrap the mousewheel events (we don't want the event to even think when the user scrolls without the HLB)
        eventHandlers.releaseWheelEvents();

        $hlbElement[0].removeEventListener(common.transitionEndEvent, onHLBReady);

        // Turn off the ability to deflate the HLB with mouse
        $(document).off('mousemove', onTargetChange);

        // Register mouse mousemove handler for deflating the HLB
        $('body').off('click', onClick);

        isListeningToMouseEvents = false;
      }


      function copyFormDataToPage() {
        // Copy any form input the user may have entered in the HLB back into the page.
        mapForm($hlbElement, $originalElement);
      }

      /**
       * [closeHLB prepares and deflates the HLB.]
       */
      function closeHLB(e) {

        copyFormDataToPage();

        // Set this to true to prevent toggleHLB();
        isHLBClosing = true;

        turnOffHLBEventListeners();

        hlbAnimation.transitionOutHLB({
          '$hlbElement'        : $hlbElement,
          '$hlbWrappingElement': $hlbWrappingElement,
          'originCSS'          : hlbPositioning.getOriginCSS(),
          'translateCSS'       : hlbPositioning.getTranslateCSS(),
          'onHLBClosed'        : function () { onHLBClosed(e); },
          'transitionProperty' : hlbStyling.transitionProperty
        });

      }

      /**
       * [mapForm maps input values from one set of elements to another]
       * @param  {[jQuery element]} from [HLB or original element]
       * @param  {[jQuery element]} to   [HLB or original element]
       */
      function mapForm($from, $to) {

        // Build an array of input elements from the HLB element / original element and its decendants.
        var fromInputs = $from.find('input, textarea, select')
                              .addBack('input, textarea, select')
                              .toArray(),

            toInputs = $to.find('input, textarea, select')
                          .addBack('input, textarea, select')
                          .toArray(),

            i, len = fromInputs.length,
            $currentFromInput,
            $currentToInput,
            fromInputType;

        for (i = 0; i < len; i = i + 1) {
          $currentFromInput = $(fromInputs[i]);
          $currentToInput = $(toInputs[i]);
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

      /**
       * [onHLBHover is registered as a "mousemove" event handler when the HLB is ready, and unregisters
       * itself immediately after the mouse moves within the HLB element.  The purpose of this function
       * is to handle the case where the HLB is positioned outside of the mouse coordinates and allows the
       * deflation of the HLB by moving the mouse outside of the HLB area as well as enabling scrolling of the HLB.]
       */
      function onHLBHover() {

        // We only need to know if the mouse has been in the HLB, so remove it once we are certain.
        $hlbElement.off('mousemove');

        // Any mouse detection within the HLB turns on the ability to exit HLB by moving mouse
        preventDeflationFromMouseout = false;
      }

      function isElementInsideHlb(element) {
        return $hlbElement.is(element) || $.contains($hlbElement[0], element);
      }

      function onClick(event) {
        if ($hlbElement && !isElementInsideHlb(event.target)) {
          // If click is outside of HLB, close it
          // (Need to doublecheck this because HLB can sometimes be inside of <body>)
          sitecues.emit('hlb/toggle');
        }
      }

      /**
       * [onTargetChange is enabled when the HLB is READY.
       * Deflates the HLB if allowed.]
       * @param  {[DOM mousemove event]} e [Mousemove event.]
       */
      function onTargetChange(e) {

        var newTarget   = e.target,
            mouseX      = e.clientX,
            mouseY      = e.clientY,
            isMouseDown,
            HLBBoundingBox;

        // This fixes SC-1834
        if (platform.browser.isIE || platform.browser.isFirefox) {
          isMouseDown = e.buttons === 1;
        } else {
          isMouseDown = e.which === 1;
        }

        // The mouse has never been within the HLB bounds or
        // debugging is enabled.
        if (preventDeflationFromMouseout || isSticky) {
          return;
        }

        // Mouse is currently hovering over the HLB
        if ($hlbElement[0] === newTarget) {
          return;
        }

        // Is the left mouse button pressed?
        // The user is click + dragging text to copy.
        if (isMouseDown) {
          return;
        }

        HLBBoundingBox = $hlbElement[0].getBoundingClientRect();

        // If the mouse coordinates are not within the bounds of
        // the HLB + MOUSE_SAFETY_ZONE, then deflate the HLB.
        if (mouseX < HLBBoundingBox.left   - MOUSE_SAFETY_ZONE ||
            mouseX > HLBBoundingBox.right  + MOUSE_SAFETY_ZONE ||
            mouseY < HLBBoundingBox.top    - MOUSE_SAFETY_ZONE ||
            mouseY > HLBBoundingBox.bottom + MOUSE_SAFETY_ZONE) {

          closeHLB(e);

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

        $originalElement = undefined;
        $hlbElement      = undefined;
        $pickedElement   = undefined;
        highlight        = undefined;

        if (SC_DEV && loggingEnabled) {
          console.log('%c--------------- HLB DESTROYED -----------------', 'color:orange; background:purple; font-size: 9pt');
        }
      }

      /**
       * [onHLBReady executes once the HLB is ready (completed inflation animation).
       * Adds the appropriate event listeners and emits hlb/ready]
       */
      function onHLBReady() {

        // Focus input or textarea
        if (common.isEditable($hlbElement[0])) {
          $hlbElement.focus();
        }

        // Turn on event listeners for the HLB
        turnOnHLBEventListeners();

        // Let the rest of the application know that the hlb is ready
        // Listeners: hpan.js, invert.js, metrics/hlb-opened.js, mouse-highlight.js, speech.js
        sitecues.emit('hlb/ready', $hlbElement);
      }

      /**
       * [getHLBWrapper adds the sitecues HLB and DIMMER wrapper outside of the body.]
       */
      function getOrCreateHLBWrapper() {

        return $hlbWrappingElement ||
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
        if ($hlbWrappingElement) {
          $hlbWrappingElement.remove();
          $hlbWrappingElement = null;
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
        return $hlbElement && $hlbElement[0];
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
        console.log('%cToggle HLB logging by executing : sitecues.toggleHLBLogging();', 'background:black;color:white;font-size: 11pt');
        sitecues.toggleHLBLogging = function () {
          loggingEnabled = !loggingEnabled;
          return loggingEnabled;
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
        exports.getValidOriginalElement  = getValidOriginalElement;

        exports.setHLB = function($hlb) {
          $hlbElement = $hlb;
        };

        exports.getHLB = function() {
          return $hlbElement;
        };

        exports.setOriginalElement = function($element) {
          $originalElement = $element;
        };

        exports.getPreventDeflationFromMouseout = function() {
          return preventDeflationFromMouseout;
        };

        exports.setPreventDeflationFromMouseout = function(value) {
          preventDeflationFromMouseout = value;
        };

        exports.setHLBWrappingElement = function($wrapper) {
          $hlbWrappingElement = $wrapper;
        };

        exports.getHLBWrappingElement = function() {
          return $hlbWrappingElement;
        };

        exports.$getPickedElement = function() {
          return $pickedElement;
        };

        exports.$getOriginalElement = function () {
          return $originalElement;
        };

        exports.getDefaultHLBId = function() {
          return SITECUES_HLB_ID;
        };

        exports.setIsHLBClosing = function(value) {
          isHLBClosing = value;
        };

        exports.getIsHLBClosing = function() {
          return isHLBClosing;
        };

        exports.getRemoveTemporaryOriginalElement = function () {
          return removeTemporaryOriginalElement;
        };

        exports.setRemoveTemporaryOriginalElement = function (value) {
          removeTemporaryOriginalElement = value;
        };

        exports.setHighlight = function (value) {
          highlight = value;
        };
      }

      callback();

  });

});
