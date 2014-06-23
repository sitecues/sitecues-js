/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 * Documentation: https://equinox.atlassian.net/wiki/display/EN/HLB3
 */
sitecues.def('highlight-box', function (highlightBox, callback) {

  'use strict';

  sitecues.use('jquery', 'conf', 'hlb/event-handlers', 'hlb/dimmer', 'hlb/positioning', 'hlb/styling', 'platform', 'hlb/safe-area',
  function ($, conf, eventHandlers, dimmer, hlbPositioning, hlbStyling, platform, hlbSafeArea) {

    /////////////////////////
    // PRIVATE VARIABLES
    ////////////////////////    

    var SITECUES_HLB_WRAPPER_ID = 'sitecues-hlb-wrapper', // ID for element which wraps HLB and Dimmer elements
        SITECUES_HLB_ID         = 'sitecues-hlb', // ID for $hlbElement
        
        INFLATION_SPEED   = 400, // Default inflation duration
        DEFLATION_SPEED   = 150, // Default deflation duration 
        
        CHAR_WIDTH_LIMIT  = 50,  // Amount of characters that fits horizontally in HLB
        
        MOUSE_SAFETY_ZONE = 0, // Amount of pixels surrounding HLB that is safe for mouse to enter without closing HLB

        $originalElement,  // Element selected by the picker for the creation of the HLB
        $hlbElement,       // Element that is cloned from the originalElement (HLB)

        $hlbWrappingElement, // Element outside the body that contains the HLB and background dimmer
        
        preventDeflationFromMouseout = false, // Boolean that determines if HLB can be deflated.

        isHLBClosing = false, // Boolean that determines if the HLB is currently deflating. 
        
        originCSS,    // The HLB element's midpoint for animation
        translateCSS, // The HLB element's translation for final position
        
        transitionEndEvent = (function () {
          if (platform.browser.isChrome || platform.browser.isSafari) {
            return 'webkitTransitionEnd';
          }
          return 'transitionend';
        }()),

        isSticky = false; // DEBUG: HLB deflation toggler

    //////////////////////////////
    // PRIVATE FUNCTIONS
    /////////////////////////////
    
    /**
     * [mapForm updates input values from on set of elements to another]
     * @param  {[DOM element]} from [HLB or original element]
     * @param  {[DOM element]} to   [HLB or original element]
     */
    function mapForm ($from, $to) {

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
        $currentToInput   = $(toInputs[i]); 
        
        if ($currentFromInput.prop('type') === 'radio' || $currentFromInput.prop('type') === 'checkbox') {
          $currentToInput.prop('checked', $currentFromInput.prop('checked'));
        } else {
          $currentToInput.val($currentFromInput.val());
        }      
      }
    }

    /**
     * [isHLBScaleGreaterThanOne determines if the $hlbElement is scaled greater than one.  
     * This is useful for the transitionOutHLB function.]
     * @return {Boolean} [if true, $hlbElement is scaled > 1]
     * @example "matrix(1.5, 0, 0, 1.5, 1888.0610961914063, 2053.21875)"
     * @example "matrix(1, 0, 0, 1, 1888.0610961914063, 2053.21875)" 
     */
    function isHLBScaleGreaterThanOne () {
      return !$hlbElement.css('transform').match('matrix\\(1,');
    }
    
    /**
     * [getOriginalElement checks and retrieves the orignal element that the HLB uses 
     * from an event object.  Also handles the specific cases where we may want to toggle
     * the HLB through a public interface during debugging and testing.]
     * @param  {[DOM event]} e [A modified native DOM event, jQuery element, DOM element]
     * @return {[DOM element]}   [The DOM element we will clone for the HLB instance]
     */
    function getOriginalElement (e) {
      
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
      // event system to sitecues.emit('hlb/toggle', $('#myElement'))
      } else if (e instanceof $) {
      
        originalElement = e[0];
      
      // Check if we were passed a DOM element. This is useful for
      // testing purposes because we can take advantage of the public
      // event system to sitecues.emit('hlb/toggle', document.getElementById('myElement'))
      } else if (e instanceof Node || e instanceof HTMLElement) {
      
        originalElement = e;
      
      }

      return originalElement;

    }

    /**
     * [onHLBHover is registered as a "mousemove" event handler when the HLB is ready, and unregisters 
     * itself immediately after the mouse moves within the HLB element.  The purpose of this function 
     * is to handle the case where the HLB is positioned outside of the mouse coordinates and allows the 
     * deflation of the HLB by moving the mouse outside of the HLB area as well as enabling scrolling of the HLB.]
     */
    function onHLBHover () {
 
      // We only need to know if the mouse has been in the HLB, so remove it once we are certain.
      $hlbElement.off('mousemove');

      // Any mouse detection within the HLB turns on the ability to exit HLB by moving mouse
      preventDeflationFromMouseout = false;
      
      // Any mouse detection within the HLB turns on the ability to scroll
      eventHandlers.enableWheelScroll();

    }
    
    /**
     * [onTargetChange is enabled when the HLB is READY.  Deflates the HLB if allowed.]
     * @param  {[DOM mousemove event]} e [Mousemove event.]
     */
    function onTargetChange (e) {

      var newTarget      = e.target,
          mouseX         = e.clientX,
          mouseY         = e.clientY,
          isMouseDown    = e.which === 1,
          HLBBoundingBox;



      // The mouse has never been within the HLB bounds or debugging is enabled.
      if (preventDeflationFromMouseout || isSticky) {
        return;
      }

      // Mouse is currently hovering over the HLB
      if ($hlbElement[0] === newTarget) {
        return;
      }

      // Is the left mouse button pressed?  The user is click + dragging text to copy.
      if (isMouseDown) {
        return;
      }

      HLBBoundingBox = $hlbElement[0].getBoundingClientRect();

      // If the mouse coordinates are not within the bounds of the HLB + MOUSE_SAFETY_ZONE, then deflate the HLB.
      if (mouseX < HLBBoundingBox.left   - MOUSE_SAFETY_ZONE || 
          mouseX > HLBBoundingBox.right  + MOUSE_SAFETY_ZONE ||
          mouseY < HLBBoundingBox.top    - MOUSE_SAFETY_ZONE || 
          mouseY > HLBBoundingBox.bottom + MOUSE_SAFETY_ZONE) {
        
        closeHLB();
      
      }

    }

    /**
     * [initializeHLB is the first step in the creation process for the HLB.
     * This function is responsible for cloning the original element, mapping form data, 
     * cloning child styles, filtering attributes, styles, and elements, and setting the
     * HLB with default styles and computed styles.]
     * @param  {[DOM element]} originalElement [DOM element that is the original element chosen by the picker.]
     */
    function initializeHLB (originalElement) {

      // Emitting this event disables mouse highlighting, which must be done before we clone the HLB
      // so we don't copy over the highlighting styles from the original element.
      sitecues.emit('mh/disable');

      // Create and append to the DOM the wrapping element for HLB and DIMMER elements
      addHLBWrapper();
      
      // Disable document scroll until the HLB deflates
      eventHandlers.disableWheelScroll();
      
      // Clone, style, filter
      cloneHLB(originalElement);

      // Prevents mouse movement from deflating the HLB until mouse is inside HLB
      preventDeflationFromMouseout = true;
      
      // Listeners: keys.js, metrics/hlb-opened.js, mouse-highlight.js, speech.js
      sitecues.emit('hlb/create', $hlbElement);

    }

    /**
     * [sizeHLB computes and sets the height and width of the HLB]
     */
    function sizeHLB () {
      
      // Initialize height/width of the HLB
      hlbPositioning.initializeSize($hlbElement, $originalElement);

      // Constrain the height and width of the HLB to the height and width of the safe area.
      hlbPositioning.constrainHeightToSafeArea($hlbElement);
      hlbPositioning.constrainWidthToSafeArea($hlbElement);                                       

      // Limit the width of the HLB to a maximum of CHAR_WIDTH_LIMIT characters.
      hlbPositioning.limitWidth($originalElement, $hlbElement, CHAR_WIDTH_LIMIT);
      
      // The following attempts to mitigate the vertical scroll bar by 
      // setting the height of the element to the scroll height of the element.
      hlbPositioning.mitigateVerticalScroll($hlbElement);
      
      // Vertical scroll should only appear when HLB is as tall as the 
      // safe area height and its scrollHeight is greater than its clientHeight
      hlbPositioning.addVerticalScroll($hlbElement);
    }

    /**
    * [positionHLB positions the HLB.]
    */
    function positionHLB () {

      var constrainedOffset,  // The minimum distance we must move the HLB for it to fall within the safe zone
          
          HLBBoundingBoxAfterZoom = hlbPositioning.scaleRectFromCenter($hlbElement),
          HLBBoundingBox          = $hlbElement[0].getBoundingClientRect(),
          
          // These are used in the positioning calculation.  
          // They are the differences in height and width before and after the HLB is scaled.
          expandedWidthOffset     = (HLBBoundingBoxAfterZoom.width  - HLBBoundingBox.width)  / 2,
          expandedHeightOffset    = (HLBBoundingBoxAfterZoom.height - HLBBoundingBox.height) / 2,
          
          // The difference between the mid points of the hlb element and the original 
          offset = hlbPositioning.midPointDiff($hlbElement, $originalElement),

          zoom   = conf.get('zoom');

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
      
      // Add the difference between the HLB position and the minimum amount of distance 
      // it must travel to be completely within the bounds of the safe area to the difference 
      // between the mid points of the hlb element and the original
      offset.x += constrainedOffset.x;
      offset.y += constrainedOffset.y;      
      
      // translateCSS and originCSS are used during deflation
      translateCSS = 'translate(' + ( -offset.x / zoom ) + 'px, ' + ( -offset.y / zoom ) + 'px)';
      
      // This is important for animating from the center point of the HLB
      originCSS    = (( -offset.x / zoom )  + HLBBoundingBox.width  / 2 / zoom) + 'px ' + 
                     (( -offset.y / zoom )  + HLBBoundingBox.height / 2 / zoom) + 'px';

      // Position the HLB without it being scaled (so we can animate the scale).
      $hlbElement.css({ 'transform': 'scale(1) ' + translateCSS });   

    }
   
    /**
     * [transitionInHLB animates the inflation of the HLB and background dimmer]
     */
    function transitionInHLB () {

      // Dim the background!
      dimmer.dimBackgroundContent($hlbWrappingElement, INFLATION_SPEED);
      
      // After the HLB animates, execute the callback that signifies the end of one-touch-read visuals
      $hlbElement[0].addEventListener(transitionEndEvent, onHLBReady);

      // Scale the element up to 1.5 (hlbPositioning.HLBZoom)
      $hlbElement.css({
        'transition-timing-function' : 'linear',
        'transition'                 : hlbStyling.transitionProperty + INFLATION_SPEED + 'ms',
        'transform'                  : 'scale(' + hlbSafeArea.HLBZoom + ') ' + translateCSS,
        'transform-origin'           : originCSS
      });

    }
    
    /**
     * [transitionOutHLB animates and removes the HLB and background dimmer]
     */
    function transitionOutHLB () {
      
      // Listeners: mouse-highlight.js, invert.js
      sitecues.emit('hlb/deflating', $hlbElement);
      
      // Un-dim the background!
      dimmer.removeDimmer(DEFLATION_SPEED);
      
      // Do we bother animating the deflation?

      // Sometimes, if the user presses the spacebar extremely fast, the HLB is toggled 
      // to close during the HLB inflation animation (transitionInHLB). Because this is
      // possible, it is also possible that the value of transform:scale is 1 by the time 
      // we want to deflate, and thus the transition end event cannot be used as a callback
      // mechanism (because there is nothing to animate if scale is already 1).  Therefore,
      // we check to see if the HLB scale is greater than one, and if so, we animate the
      // deflation, otherwise, we just skip the deflation step
      if (isHLBScaleGreaterThanOne()) {
        
        // After the deflation animation completes, clean up the HLB states and DOM
        $hlbElement[0].addEventListener(transitionEndEvent, onHLBClosed);

        // Animate the deflation by setting the transform scale to 1.
        $hlbElement.css({
          'transition-timing-function' : 'linear',
          'transition'                 : hlbStyling.transitionProperty + DEFLATION_SPEED + 'ms',
          'transform'                  : 'scale(1) ' + translateCSS,
          'transform-origin'           : originCSS
        });

      } else {
        onHLBClosed();
      }      
      
    }

    /**
     * [turnOnHLBEventListeners turns on HLB event handlers for deflation and scroll]
     */
    function turnOnHLBEventListeners () {
      
      // Register escape keypress, it will deflate the HLB
      sitecues.on('key/esc', closeHLB);
      
      // Register mousewheel handler to allow scrolling of HLB content
      $hlbElement.on('mousewheel DOMMouseScroll', {'hlb': $hlbElement}, eventHandlers.wheelHandler);
      
      // Register key press handlers (pagedown, pageup, home, end, up, down)
      $(window).on('keydown', {'hlb': $hlbElement}, eventHandlers.keyDownHandler);
      
      // Register mouse mousemove handler for deflating the HLB
      $(document).on('mousemove', onTargetChange);
      
      // Register mousemove handler on the HLB element to turn on the ability to exit the HLB by mouse
      // This event handler is unique in that it unregisters itself once executed.
      $hlbElement.on('mousemove', onHLBHover);

    }

    /**
     * [turnOffHLBEventListeners turns off HLB event handlers for deflation and scroll]
     */
    function turnOffHLBEventListeners () {
      
      $hlbElement[0].removeEventListener(transitionEndEvent, onHLBReady);

      // During deflation, turn off the ability to deflate or create a new HLB
      sitecues.off('key/esc', closeHLB);
      
      // Turn off the suppression of scrolling, keypresses
      $hlbElement.off('mousewheel DOMMouseScroll', eventHandlers.wheelHandler);
      $(window).off('keydown', eventHandlers.keyDownHandler);

      // Turn off the ability to deflate the HLB with mouse
      $(document).off('mousemove', onTargetChange);
    }

    /**
    * [cloneHLB clones elements and styles from the original element to the HLB element.]
    * @param  {[DOM element]} originalElement [original element]
    */
    function cloneHLB (originalElement) {

      var hlbStyles;

      // The original element
      $originalElement = $(originalElement);

      // The cloned element (HLB)
      $hlbElement = $(originalElement.cloneNode(true));

      // Copies form values from original element to HLB
      mapForm($originalElement, $hlbElement);

      // Clone styles of children of HLB, so layout is preserved
      hlbStyling.cloneStyles($originalElement, $hlbElement);
      
      // Remove any elements and styles we dont want on the cloned element (such as <script>, id, margin)
      hlbStyling.filter($hlbElement);
      
      // Set this variable now that we have filtered, cloned child styles
      hlbStyles = hlbStyling.getHLBStyles($originalElement);

      // Set the styles for the HLB and append to the wrapping element
      $hlbElement.css(hlbStyles).appendTo($hlbWrappingElement);
      
      // Set the ID of the hlbElement.
      $hlbElement[0].id = SITECUES_HLB_ID;

    }

    /**
     * [createHLB initializes, positions, and animates the HLB]
     * @param  {[DOM element]} target [the original element]
     */
    function createHLB (originalElement) {

      // clone, style, filter, emit hlb/create, 
      // prevent mousemove deflation, disable scroll wheel
      initializeHLB(originalElement);

      // Compute and set HLB dimensions
      sizeHLB();

      // Compute and set HLB position
      positionHLB();
      
      // setTimeout MIGHT be necessary for the browser to complete the rendering and positioning
      // of the HLB.  Before we scale, it absolutely must be positioned correctly.  
      // Note: Interestingly enough, this timeout is unnecessary if we comment out the
      // background dimmer in transitionInHLB(), because the operation took long enough
      // for the browser to update/render the DOM.  This is here for safety (until proven otherwise).
      // If we use a setTimeout, we have to solve the problem of functions being added to the stack before
      // the timeout completes...its a pain.,
      transitionInHLB();

    }
    
    /**
     * [closeHLB prepares and deflates the HLB.]
    */
    function closeHLB () {

      // Set this to true to prevent toggleHLB();
      isHLBClosing = true;

      turnOffHLBEventListeners();

      // Make sure inputs from HLB are copied over to the original element
      mapForm($hlbElement, $originalElement);

      transitionOutHLB();

    }

    /**
     * [onHLBClosed executes once the HLB is deflated (scale = 1).  This function is 
     * responsible for setting the state of the application to what it was before
     * any HLB existed.]
    */
    function onHLBClosed () {

      // Listeners: hpan.js, keys.js, mouse-highlight.js, speech.js
      sitecues.emit('hlb/closed', $hlbElement);
      
      // Turn back on the ability to scroll the document
      eventHandlers.enableWheelScroll();
      
      // Finally, remove the wrapper element for the HLB and dimmer
      removeHLBWrapper();

      // Clean up "module scoped" vars
      $hlbElement      = undefined;
      $originalElement = undefined;
      translateCSS     = undefined;
      originCSS        = undefined;
      isHLBClosing     = false;
      
    }

    /**
     * [onHLBReady executes once the HLB is ready (completed inflation animation).  
     * Adds the appropriate event listeners and emits hlb/ready]
     */
    function onHLBReady () {

      // Focus input or textarea
      if ($hlbElement.is('input, textarea')) {
        $hlbElement.focus(); 
      }      

      // Turn on event listeners for the HLB
      turnOnHLBEventListeners();

      // Let the rest of the application know that the hlb is ready
      // Listeners: hpan.js, invert.js, keys.js, metrics/hlb-opened.js, mouse-highlight.js, speech.js
      sitecues.emit('hlb/ready', $hlbElement);
    
    }

    /**
     * [addHLBWrapper adds the sitecues HLB and DIMMER wrapper outside of the body.]
     */
    function addHLBWrapper () {

      $hlbWrappingElement = $('<div>', 
        {
          'id' : SITECUES_HLB_WRAPPER_ID
        })
        .css({
          'padding'  : 0,  
          'margin'   : 0,
          'top'      : 0,
          'left'     : 0,
          'position' : 'absolute',
          'overflow' : 'visible'
        })
        .insertAfter(document.body);
    }

    /**
     * [removeHLBWrapper removes the sitecues HLB and DIMMER wrapper]
    */
    function removeHLBWrapper () {
      $hlbWrappingElement.remove();
    }

    /**
     * [toggleHLB creates or closes the HLB]
     */
    function toggleHLB (e) {

      var originalElement = getOriginalElement(e);

      // If the HLB is currently deflating, no need to toggle
      if (isHLBClosing) {
        return;
      }
      // If an HLB exists
      if ($hlbElement) {
        closeHLB();
      // If a valid element exists and the HLB does not exist
      } else if (originalElement) {
        createHLB(originalElement);
      }

    }


    // Picker module emits this event when the spacebar is pressed.
    sitecues.on('hlb/toggle', toggleHLB);

    //////////////////////////////////
    // PUBLIC FUNCTIONS
    //////////////////////////////////
    
    /**
     * [toggleStickyHLB enables/disables HLB deflation]
     * @return {[Boolean]} [True if deflation is disabled.  False if deflation is enabled.]
     */
    sitecues.toggleStickyHLB = function () {
      isSticky = !isSticky;
      return isSticky;
    };

    callback();
  
  });

});