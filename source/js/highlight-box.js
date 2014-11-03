/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 * Documentation: https://equinox.atlassian.net/wiki/display/EN/HLB3
 */
sitecues.def('highlight-box', function(highlightBox, callback) {

  'use strict';

  sitecues.use('jquery', 'conf', 'hlb/navkeys', 'hlb/dimmer', 'hlb/positioning',
    'hlb/styling', 'platform', 'hlb/safe-area', 'util/common', 'hlb/animation', 'mouse-highlight', 'util/geo',

    function($, conf, navkeys, dimmer, hlbPositioning, hlbStyling, platform, hlbSafeArea,
             common, hlbAnimation, mh, geo) {

      /////////////////////////
      // PRIVATE VARIABLES
      ////////////////////////

      var SITECUES_HLB_WRAPPER_ID = 'sitecues-hlb-wrapper', // ID for element which wraps HLB and Dimmer elements
          SITECUES_HLB_ID = 'sitecues-hlb', // ID for $hlbElement

          CHAR_WIDTH_LIMIT = 50, // Amount of characters that fits horizontally in HLB

          MOUSE_SAFETY_ZONE = 0, // Amount of pixels surrounding HLB that is safe for mouse to enter without closing HLB

          // Fixes problems where mouse highlight was SO accurate, that a simple rounding of a pixel
          // would unnecessarily wrap text.  Seemed to be more prevalent on IE, fixes stuff for EEOC.
          EXTRA_HIGHLIGHT_PADDING = 1,

          $hlbWrappingElement, // Element outside the body that contains the HLB and background dimmer
          $hlbElement, // Element that is cloned from the originalElement (HLB)
          $originalElement, // The element which serves as a model or basis for imitations or copies
          $pickedElement, // The element chosen by the picker.

          originCSS, // The HLB element's midpoint for animation
          translateCSS, // The HLB element's translation for final position

          initialHLBRect, // The highlight rect, if it exists, otherwise use the $originalElement bounding client rect.

          removeTemporaryOriginalElement = false, // In some scenarios, we must create our own original element and must remove it from the DOM
          preventDeflationFromMouseout   = false, // Boolean that deter mines if HLB can be deflated.
          isHLBClosing                   = false, // Boolean that determines if the HLB is currently deflating.
          isSticky                       = false, // DEBUG: HLB deflation toggler
          inheritedZoom,                          // Amount of zoom inherited from page's scale transform

          // Decide which event to use depending on which browser is being used
          wheelEventName                 = platform.browser.isSafari ? 'mousewheel' : 'wheel';



      if (SC_DEV) {

        // Boolean that determines if we log HLB information (only works in SC_DEV mode)
        var loggingEnabled = false;

      }

      //////////////////////////////
      // PRIVATE FUNCTIONS
      /////////////////////////////


      /**
       * [wheelHandler listens to all scroll events in the window and prevents scroll outside of HLB]
       * @param  {[DOM scroll event]} e [Object representing scrolling data]
       */

      function wheelHandler (event) {


        // Get the deltaY value when the user scrolls (how fast the user is scrolling)
        var deltaY = event.deltaY || -event.wheelDeltaY;

        // Sometimes there is no deltaY number, or a deltaY of "0"
        // (when the user is scrolling horizontally along X)
        if (isNaN(deltaY) || deltaY >-1 && deltaY <1) {

          // We prevent the scroll event for horizontal scrolls
          return preventScroll(event);
        }

        /*

          Dimension Calculations:

                     /////////
                   ↑ /       / ↕ Scroll Top
            Scroll | XXXXXXXXX
            Height | X       X ↑
                   | X  HLB  X | Client Height
                   | X       X ↓
                   | XXXXXXXXX
                   ↓ /       / ↕ Scroll Bottom
                     /////////

        */

        // Get the dimensions
        var elem             = $hlbElement[0]       // The HLB Element
          , scrollHeight     = elem.scrollHeight    // The total height of the scrollable area
          , scrollTop        = elem.scrollTop       // Pixel height of invisible area above element (what has been scrolled)
          , clientHeight     = elem.clientHeight    // The height of the element in the window
          , scrollBottom     = scrollHeight-scrollTop-clientHeight // The pixels height invisible area below element (what is left to scroll)
          , scrollingDown    = deltaY > 0           // If the user is scrolling downwards
          , scrollingUp      = deltaY < 0           // If the user is scrolling upwards
          , scrolledToBottom = scrollBottom <= 1    // There are now more invisible pixels below the element
          , scrolledToTop    = elem.scrollTop <= 1  // There are now more invisible pixels above the element
          ;


        // Prevent any scrolling if the user is:
        //   a) Not scrolling on the HLB element directly.
        //   b) Not scrolling on a decendant of the HLB element.
        if (!$hlbElement.is(event.target) && !$.contains(elem, event.target))  {
          preventScroll(event);
        }

        // If the user is scrolling down, (but has not reached the bottom), and
        // is trying to scroll down more pixels that there are left to scroll...
        if (scrollingDown && deltaY >= scrollBottom) {
          // ...set the scroll to the bottom...
          elem.scrollTop = elem.scrollHeight;
          // ...and stop scrolling.
          preventScroll(event);
        }

        // If the user tries to scroll down past the bottom...
        if (scrolledToBottom && scrollingDown) {
          preventScroll(event); // ...stop scrolling.
        }

        // If the user is scrolling up, (but has not reached the top), and is
        // trying to scroll up more pixels that there are left to scroll...
        if (scrollingUp && scrollTop-(-deltaY) <= 0) {
          // ...set the scroll to the top...
          elem.scrollTop = 0;
          // ...and stop scrolling.
          preventScroll(event);
        }

        // If the user tries to scroll down past the bottom...
        if (scrolledToTop && scrollingUp) {
          preventScroll(event); // ...stop scrolling.
        }

        // Prevent the original scroll event
        function preventScroll() {
          event.preventDefault();
          event.returnValue = false;
          return false;
        }

      }

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

          // Set module scoped variable so the rest of the program has reference.
          var highlight = mh.getHighlight();
          if (!highlight.isVisible) {
            return;  // No highlight present -- nothing to open HLB on
          }

          // Highlight is present -- guaranteed to have
          // at least one picked element and fixedContentRect outlining the highlight
          $pickedElement = highlight.picked;

          if (SC_DEV && loggingEnabled) {

            console.log('%c--------------- CREATE HLB -----------------', 'color:orange; background:purple; font-size: 9pt;');

            if (!$pickedElement[0].id) {
              $pickedElement[0].id = (Math.random() + '').slice(2);
            }

            console.log('Picked element %o ID: ' + $pickedElement[0].id, $pickedElement[0]);

          }

          // Set module scoped variable so the rest of the program has reference.
          initialHLBRect = getInitialHLBRect(highlight);

          // Disable mouse highlighting so we don't copy over the highlighting styles from the picked element.
          // It MUST be called before getValidOriginalElement().
          sitecues.emit('hlb/init');

          // Set module scoped variable so the rest of the program has reference.
          $originalElement = getValidOriginalElement($pickedElement);


          if (SC_DEV && loggingEnabled) {
            console.log('Initial rect width: ' + initialHLBRect.width / conf.get('zoom') + ' Initial rect height: ' + initialHLBRect.height / conf.get('zoom'));
            // $('<div>').css({
            //   'position': 'absolute',
            //   'width': initialHLBRect.width / conf.get('zoom'),
            //   'height': initialHLBRect.height / conf.get('zoom'),
            //   'left': initialHLBRect.left / conf.get('zoom') + window.pageXOffset,
            //   'top': initialHLBRect.top / conf.get('zoom') + window.pageYOffset,
            //   'background': 'green',
            //   'opacity': .6,
            //   'z-index': 99999
            // }).insertAfter('body').on('click', function () {
            //   $(this).remove();
            // });
          }

          createHLB();

        }

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

      /*
       * [getPickedElement checks and retrieves the original element that the HLB uses
       * from an event object.  Also handles the specific cases where we may want to toggle
       * the HLB through a public interface during debugging and testing.]
       * @param  {[DOM event]}   e [A modified native DOM event, jQuery element, DOM element]
       * @return {[DOM element]}   [The DOM element we will clone for the HLB instance]
       */
      function getPickedElement(e) {

        var originalElement;

        // Check if the element is passed within an event object.
        // This is how the sitecues application sends the element we
        // need for the HLB.
        if (e &&
            e.dom &&
            e.dom.mouse_highlight &&
            e.dom.mouse_highlight.picked &&
            e.dom.mouse_highlight.picked[0] !== null) {

          originalElement = e.dom.mouse_highlight.picked[0];

          // Check if we were passed a jQuery element.  This is useful for
          // testing purposes because we can take advantage of the public
          // event system to sitecues.emit('hlb/toggle', sitecues.$('#myElement'))
        } else if (e instanceof $) {

          originalElement = e[0];

          // Check if we were passed a DOM element. This is useful for
          // testing purposes because we can take advantage of the public
          // event system to sitecues.emit('hlb/toggle', document.getElementById('myElement'))
        } else if (e instanceof window.Node || e instanceof window.HTMLElement) {

          originalElement = e;

        }

        return originalElement;

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
      function getValidListElement($pickedListItemElement) {

        var pickedListItemElement          = $pickedListItemElement[0],
            pickedElementsComputedStyles   = window.getComputedStyle(pickedListItemElement),
            pickedElementsBoundingBox      = pickedListItemElement.getBoundingClientRect(),
            pickedElementsClone            = pickedListItemElement.cloneNode(true),
            pickedElementAndChildren       = $pickedListItemElement.find('*').addBack(),
            pickedElementsCloneAndChildren = $(pickedElementsClone).find('*').addBack(),
            $originalElement               = $('<ul>').append(pickedElementsClone);

        // Setting this to true will remove the $originalElement from the DOM before inflation.
        // This is a very special case where the original element is not the same as the picked element.
        // NOTE: This is setting a module scoped variable so the rest of the program as access.
        removeTemporaryOriginalElement = true;

        // It is important to clone the styles of the parent <ul> of the original element, because it may
        // have important styles such as background images, etc.
        if ($pickedListItemElement.parent('ul,ol').length) {
          $originalElement[0].style.cssText = hlbStyling.getComputedStyleCssText($pickedListItemElement.parent('ul,ol')[0]);
        }

        // Create, position, and style this element so that it overlaps the element chosen by the picker.
        $originalElement.css({
          'position'       : 'absolute',
          'left'           : (pickedElementsBoundingBox.left  + window.pageXOffset) / inheritedZoom,
          'top'            : (pickedElementsBoundingBox.top   + window.pageYOffset) / inheritedZoom,
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

      /**
       * [createHLB initializes, positions, and animates the HLB]
       */
      function createHLB() {

        // clone, style, filter, emit hlb/create,
        // prevent mousemove deflation, disable scroll wheel
        initializeHLB();

        sizeHLB();

        positionHLB();

        // Now that we have extracted all the information from the original element,
        // it is time to ask whether or not a temporary original element has been used
        // and remove it if true.
        if (removeTemporaryOriginalElement) {
          $originalElement.remove();
          removeTemporaryOriginalElement = false;
        }

        // setTimeout MIGHT be necessary for the browser to complete the rendering and positioning
        // of the HLB.  Before we scale, it absolutely must be positioned correctly.
        // Note: Interestingly enough, this timeout is unnecessary if we comment out the
        // background dimmer in transitionInHLB(), because the operation took long enough
        // for the browser to update/render the DOM.  This is here for safety (until proven otherwise).
        // If we use a setTimeout, we have to solve the problem of functions being added to the stack before
        // the timeout completes...its a pain.
        hlbAnimation.transitionInHLB({
          '$hlbElement'        : $hlbElement,
          '$hlbWrappingElement': $hlbWrappingElement,
          'originCSS'          : originCSS,
          'translateCSS'       : translateCSS,
          'onHLBReady'         : onHLBReady,
          'transitionProperty' : hlbStyling.transitionProperty
        });

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

        // Create and append to the DOM the wrapping element for HLB and DIMMER elements
        $hlbWrappingElement = getHLBWrapper();

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

        // Trap the mousewheel events (wheel for all browsers except Safar, which uses mousehweel)
        window.addEventListener(wheelEventName, wheelHandler);

        // Clone, style, filter
        cloneHLB();

        // Prevents mouse movement from deflating the HLB until mouse is inside HLB
        preventDeflationFromMouseout = true;

        // Listeners: metrics/hlb-opened.js, speech.js
        sitecues.emit('hlb/create', $hlbElement);

      }

      /**
       * [sizeHLB computes and sets the height and width of the HLB]
       */
      function sizeHLB() {

        var fixit,
            allHLBChildren;

        // Initialize height/width of the HLB
        hlbPositioning.initializeSize($hlbElement, initialHLBRect);

        // Constrain the height and width of the HLB to the height and width of the safe area.
        hlbPositioning.constrainHeightToSafeArea($hlbElement);
        hlbPositioning.constrainWidthToSafeArea($hlbElement);

        // Limit the width of the HLB to a maximum of CHAR_WIDTH_LIMIT characters.
        hlbPositioning.limitWidth($originalElement, $hlbElement, CHAR_WIDTH_LIMIT);

        hlbPositioning.fixOverflowWidth($hlbElement);

        if ($hlbElement[0].clientWidth < $hlbElement[0].scrollWidth) {

          if (SC_DEV && loggingEnabled) {
            console.log('%cSPECIAL CASE: HLB child width limiting algorithm.', 'background:orange;');
          }

          allHLBChildren = $hlbElement.find('*');

          fixit = true;

          allHLBChildren.each(function () {

            $(this).css('max-width', getChildWidth(this));
            $(this).css('height', 'auto');

          });

        }

        // The following attempts to mitigate the vertical scroll bar by
        // setting the height of the element to the scroll height of the element.
        hlbPositioning.mitigateVerticalScroll($hlbElement);

        // Vertical scroll should only appear when HLB is as tall as the
        // safe area height and its scrollHeight is greater than its clientHeight
        hlbPositioning.addVerticalScroll($hlbElement);

        if (fixit) {
          if ($hlbElement[0].clientWidth < $hlbElement[0].scrollWidth) {
            allHLBChildren.each(function () {
              $(this).css('height', 'auto');
              $(this).css('max-width', parseFloat($(this).css('max-width')) -
                                       ($hlbElement[0].scrollWidth - $hlbElement[0].clientWidth) -
                                       parseFloat($hlbElement.css('paddingRight')));
            });
          }
        }


        if (fixit) {

          // TOOD : The code duplication below is unfortunately necessary to correctly size the HLB.
          //        The problem was found on 8/24, and a release candidate is super important, so there
          //        is little time to really identify a better solution (if one exists).
          // Link : http://www.texasat.net/default.aspx?name=resources.webinars

          // The following attempts to mitigate the vertical scroll bar by
          // setting the height of the element to the scroll height of the element.
          hlbPositioning.mitigateVerticalScroll($hlbElement);

          // Vertical scroll should only appear when HLB is as tall as the
          // safe area height and its scrollHeight is greater than its clientHeight
          hlbPositioning.addVerticalScroll($hlbElement);

          if ($hlbElement[0].clientWidth < $hlbElement[0].scrollWidth) {
            allHLBChildren.each(function () {
              $(this).css('height', 'auto');
              $(this).css('max-width', parseFloat($(this).css('max-width')) -
                                       ($hlbElement[0].scrollWidth - $hlbElement[0].clientWidth) -
                                       parseFloat($hlbElement.css('paddingRight')));
            });
          }
        }

      }

      function getChildWidth (child) {

        var sum = 0;

        $(child).parentsUntil($hlbElement.parent()).addBack().each(function () {
          sum += parseFloat($(this).css('marginLeft'));
          sum += parseFloat($(this).css('marginRight'));
          sum += parseFloat($(this).css('paddingRight'));
          sum += parseFloat($(this).css('paddingLeft'));
          sum += parseFloat($(this).css('borderRightWidth'));
          sum += parseFloat($(this).css('borderLeftWidth'));
        });

        return ($hlbElement[0].getBoundingClientRect().width / hlbPositioning.getInheritedZoom($hlbElement)) - sum;

      }

      /**
       * [positionHLB positions the HLB.]
       */
      function positionHLB() {

        // The minimum distance we must move the HLB for it to fall within the safe zone
        var constrainedOffset,

            HLBBoundingBoxAfterZoom = hlbPositioning.scaleRectFromCenter($hlbElement),
            HLBBoundingBox = $hlbElement[0].getBoundingClientRect(),

            // These are used in the positioning calculation.
            // They are the differences in height and width before and after the HLB is scaled.
            expandedWidthOffset  = (HLBBoundingBoxAfterZoom.width  - HLBBoundingBox.width)  / 2,
            expandedHeightOffset = (HLBBoundingBoxAfterZoom.height - HLBBoundingBox.height) / 2,

            // The difference between the mid points of the hlb element and the original
            offset = hlbPositioning.midPointDiff($hlbElement, initialHLBRect);

        // Update the dimensions for the HLB which is used for constraint calculations.
        // The offset of the original element and cloned element midpoints are used for positioning.
        HLBBoundingBoxAfterZoom.left   = HLBBoundingBox.left - offset.x - expandedWidthOffset;
        HLBBoundingBoxAfterZoom.top    = HLBBoundingBox.top  - offset.y - expandedHeightOffset;
        HLBBoundingBoxAfterZoom.right  = HLBBoundingBoxAfterZoom.left + HLBBoundingBoxAfterZoom.width;
        HLBBoundingBoxAfterZoom.bottom = HLBBoundingBoxAfterZoom.top  + HLBBoundingBoxAfterZoom.height;

        // Constrain the scaled HLB to the bounds of the "safe area".
        // This returns how much to shift the box so that it falls within the bounds.
        // Note: We have already assured that the scaled cloned element WILL fit into the "safe area",
        // but not that it is currently within the bounds.
        constrainedOffset = hlbPositioning.constrainPosition(HLBBoundingBoxAfterZoom);

        // Add the difference between the HLB p osition and the minimum amount of distance
        // it must travel to be completely within the bounds of the safe area to the difference
        // between the mid points of the hlb element and the original
        offset.x += constrainedOffset.x;
        offset.y += constrainedOffset.y;

        // translateCSS and originCSS are used during deflation
        translateCSS = 'translate(' + (-offset.x / inheritedZoom) + 'px, ' + (-offset.y / inheritedZoom) + 'px)';

        // This is important for animating from the center point of the HLB
        originCSS = ((-offset.x / inheritedZoom) + HLBBoundingBox.width  / 2 / inheritedZoom) + 'px ' +
                    ((-offset.y / inheritedZoom) + HLBBoundingBox.height / 2 / inheritedZoom) + 'px';

        // Position the HLB without it being scaled (so we can animate the scale).
        var startAnimationZoom = conf.get('zoom') / inheritedZoom;
        $hlbElement.css({
          'transform': 'scale(' + startAnimationZoom + ') ' + translateCSS
        });

      }

      /**
       * [turnOnHLBEventListeners turns on HLB event handlers for deflation and scroll]
       */
      function turnOnHLBEventListeners() {

        // Register key press handlers (pagedown, pageup, home, end, up, down)
        $(window).on('keydown', {
          'hlb': $hlbElement
        }, navkeys.keyDownHandler);

        // Register mouse mousemove handler for deflating the HLB
        $(document).on('mousemove', onTargetChange);

        // Register mousemove handler on the HLB element to turn on the ability to exit the HLB by mouse
        // This event handler is unique in that it unregisters itself once executed.
        $hlbElement.on('mousemove', onHLBHover);

      }

      /**
       * [turnOffHLBEventListeners turns off HLB event handlers for deflation and scroll]
       */
      function turnOffHLBEventListeners() {

        // UNTrap the mousewheel events (we don't want the event to even think when the user scrolls without the HLB)
        window.removeEventListener(wheelEventName, wheelHandler);

        $hlbElement[0].removeEventListener(common.transitionEndEvent, onHLBReady);

        // Turn off the suppression of scrolling, keypresses
        $(window).off('keydown', navkeys.keyDownHandler);

        // Turn off the ability to deflate the HLB with mouse
        $(document).off('mousemove', onTargetChange);
      }

      /**
       * [cloneHLB clones elements and styles from the original element to the HLB element.]
       * @param  {[DOM element]} originalElement [original element]
       */
      function cloneHLB() {

        var hlbStyles;

        // The cloned element (HLB)
        $hlbElement = $($originalElement[0].cloneNode(true));

        // Copies form values from original element to HLB
        // Need to do this on a timeout in order to enable Safari input fix hack
        setTimeout(function() {
          mapForm($originalElement, $hlbElement);
        }, 0);

        // Clone styles of HLB and children of HLB, so layout is preserved
        hlbStyling.initializeStyles($originalElement, $hlbElement);

        // Remove any elements and styles we dont want on the cloned element (such as <script>, id, margin)
        hlbStyling.filter($hlbElement);

        // Set this variable now that we have filtered, cloned child styles
        hlbStyles = hlbStyling.getHLBStyles($pickedElement, $originalElement);

        // Set the styles for the HLB and append to the wrapping element
        $hlbElement.css(hlbStyles).appendTo($hlbWrappingElement);

        // Fixes problem with TexasAT home page when opening the top nav (Home, Sitemap, Contact Us) in HLB
        hlbStyling.setHLBChildTextColor($hlbElement);

        // Set the ID of the hlbElement.
        $hlbElement[0].id = SITECUES_HLB_ID;

      }

      /**
       * [closeHLB prepares and deflates the HLB.]
       */
      function closeHLB(e) {

        // Set this to true to prevent toggleHLB();
        isHLBClosing = true;

        turnOffHLBEventListeners();

        // Make sure inputs from HLB are copied over to the original element
        mapForm($hlbElement, $originalElement);

        hlbAnimation.transitionOutHLB({
          '$hlbElement'        : $hlbElement,
          '$hlbWrappingElement': $hlbWrappingElement,
          'originCSS'          : originCSS,
          'translateCSS'       : translateCSS,
          'onHLBClosed'        : function() { onHLBClosed(e); },
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

            $currentFromInput,
            $currentToInput;

        for (var i = 0; i < fromInputs.length; i += 1) {

          $currentFromInput = $(fromInputs[i]);
          $currentToInput = $(toInputs[i]);

          if ($currentFromInput.prop('type') === 'radio' || $currentFromInput.prop('type') === 'checkbox') {
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
      function onHLBClosed(e) {

        // Finally, remove the wrapper element for the HLB and dimmer
        removeHLBWrapper();

        // Clean up "module scoped" vars
        translateCSS = undefined;
        originCSS    = undefined;
        isHLBClosing = false;

        // Listeners: hpan.js, mouse-highlight.js, speech.js
        sitecues.emit('hlb/closed', e);

        $originalElement = undefined;
        $hlbElement      = undefined;
        $pickedElement   = undefined;

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
      function getHLBWrapper() {

        return $('<div>', {
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
        $hlbWrappingElement.remove();
      }

      // Picker module emits this event when the spacebar is pressed.
      sitecues.on('hlb/toggle', toggleHLB);

      //////////////////////////////////
      // PUBLIC FUNCTIONS
      //////////////////////////////////

      highlightBox.getElement = function() {
        return $hlbElement;
      };

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
        }
      }


      if (SC_UNIT) {

        exports.mapForm                  = mapForm;
        exports.getPickedElement         = getPickedElement;
        exports.onHLBHover               = onHLBHover;
        exports.onTargetChange           = onTargetChange;
        exports.initializeHLB            = initializeHLB;
        exports.sizeHLB                  = sizeHLB;
        exports.positionHLB              = positionHLB;
        exports.turnOnHLBEventListeners  = turnOnHLBEventListeners;
        exports.turnOffHLBEventListeners = turnOffHLBEventListeners;
        exports.cloneHLB                 = cloneHLB;
        exports.createHLB                = createHLB;
        exports.closeHLB                 = closeHLB;
        exports.onHLBClosed              = onHLBClosed;
        exports.onHLBReady               = onHLBReady;
        exports.getHLBWrapper            = getHLBWrapper;
        exports.removeHLBWrapper         = removeHLBWrapper;
        exports.toggleHLB                = toggleHLB;
        exports.navkeys                  = navkeys;
        exports.dimmer                   = dimmer;
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

        exports.getTranslateCSS = function() {
          return translateCSS;
        };

        exports.setTranslateCSS = function(value) {
          translateCSS = value;
        };

        exports.getOriginCSS = function() {
          return originCSS;
        };

        exports.setOriginCSS = function(value) {
          originCSS = value;
        };

        exports.getRemoveTemporaryOriginalElement = function () {
          return removeTemporaryOriginalElement;
        };

        exports.setRemoveTemporaryOriginalElement = function (value) {
          removeTemporaryOriginalElement = value;
        };
      }

      callback();

  });

});