/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 * Documentation: https://equinox.atlassian.net/wiki/display/EN/HLB3
 */
define([
    '$',
    'core/conf/user/manager',
    'hlb/event-handlers',
    'hlb/positioning',
    'hlb/styling',
    'core/platform',
    'page/util/element-classifier',
    'hlb/animation',
    'page/util/geo',
    'core/metric',
    'hlb/constants',
    'core/events'],
  function(
    $,
    conf,
    eventHandlers,
    hlbPositioning,
    hlbStyling,
    platform,
    elemClassifier,
    hlbAnimation,
    geo,
    metric,
    constants,
    events) {

  /////////////////////////
  // PRIVATE VARIABLES
  ////////////////////////

      // Magic. Fixes problems where mouse highlight was SO accurate, that a simple rounding of a pixel
      // would unnecessarily wrap text. Seemed to be more prevalent on IE, fixes stuff for EEOC.
      // Value of 2 instead of 1 fixes wrapping text on this page for all headers:
      // http://www.windoweyesforoffice.com/sitecues/index.php
  var EXTRA_HIGHLIGHT_PADDING = 2, // TODO: Figure out why this is needed and compute it.
      MOUSE_SAFETY_ZONE       = 50, // Number of pixels the mouse is allowed to go outside the HLB, before it closes.
      FORMS_SELECTOR          = 'input, textarea, select',

      $picked,         // The object chosen by the picker.
      $foundation,     // The sanitized input, used as the basis for creating an $hlb.
      $hlb,            // The cloned object, based on the $foundation.
      $hlbWrapper,     // Container for both the HLB and background dimmer.

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
      },
      state = {};

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
  function mapForm($from, $to, isHLBClosing) {

    // Get descendants of The HLB / The Foundation that may have a value.
    var $fromInputs = $from.find(FORMS_SELECTOR)
            .addBack(FORMS_SELECTOR),
        $toInputs = $to.find(FORMS_SELECTOR)
            .addBack(FORMS_SELECTOR),
        i, len = $fromInputs.length,
        $currentFromInput,
        $currentToInput,
        cloneIndex,
        fromInputType;

    for (i = 0; i < len; i = i + 1) {
      $currentFromInput = $fromInputs.eq(i);
      $currentToInput = $toInputs.eq(i);
      fromInputType = $currentFromInput.prop('type');
      cloneIndex = $currentToInput[0].getAttribute('data-sc-cloned');

      //If we're closing the HLB, and the current form element is part of a cloned foundation
      if (isHLBClosing && cloneIndex) {
        //Remove the index property from the HLB element
        $currentFromInput[0].removeAttribute('data-sc-cloned');
        //Query the DOM for the original form element, so we can copy the HLB form value back into the appropriate field
        $currentToInput = $('[data-sc-cloned="' + cloneIndex + '"]');
        //Remove the index from the original form element
        $currentToInput[0].removeAttribute('data-sc-cloned');
      }

      if (fromInputType === 'radio' || fromInputType === 'checkbox') {
        $currentToInput.prop('checked', $currentFromInput.prop('checked'));
      }
      else {
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
    mapForm($hlb, $foundation, true);
  }

  // Return truthy value if a button is pressed on a mouse event.
  // There are three properties for mouse buttons, and they all work differently -- both
  // in terms of browsers and on mousemove events in particular.
  // DANGER! Does not work in IE9 -- always returns falsey value.
  // If we need it in IE9 we'll need to globally track mousedown and mouseup events.
  function isButtonDown(mouseEvent) {
    return typeof mouseEvent.buttons === 'undefined' ? mouseEvent.which : mouseEvent.buttons;
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
        isMouseDown = isButtonDown(event),
        HLBBoundingBox;

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

    // Make sure mousewheel scrolls HLB but not page
    eventHandlers.captureWheelEvents($hlb);
  }

  /**
   * [onHLBReady executes once the HLB is ready (completed inflation animation).
   * Adds the appropriate event listeners and emits hlb/ready]
   */
  function onHLBReady() {

    // Focus input or textarea
    if (elemClassifier.isEditable($hlb[0])) {
      $hlb.focus();
    }

    // Let the rest of the application know that the hlb is ready
    // Listeners: hpan.js, invert.js, highlight.js, speech.js
    events.emit(constants.HLB_READY, $hlb, state.highlight);
  }

  /**
   * [turnOffHLBEventListeners turns off HLB event handlers for deflation and scroll]
   */
  function turnOffHLBEventListeners() {
    if (!isListeningToMouseEvents) {
      return;
    }

    // UNTrap the mousewheel events (we don't want the event to even think when the user scrolls without the HLB)
    eventHandlers.releaseWheelEvents();

    $hlb[0].removeEventListener(platform.transitionEndEvent, onHLBReady);

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

  function targetHLB(highlight, isRetargeting) {

    state.highlight = highlight;

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
    events.emit('mh/pause');

    // Sanitize the input, by accounting for "lonely" elements.
    $foundation = getFoundation($picked);

    // Turn off listeners for the old HLB. createHLB() will add new ones.
    turnOffHLBEventListeners();

    createHLB(highlight, isRetargeting);
  }

  /**
   * [toggleHLB closes or creates a new HLB]
   */
  function toggleHLB(highlight) {
    // Sadly, the HLB animation system does not currently
    // know how to reverse an animation, so we cannot
    // toggle if currently deflating. :(
    if (isHLBClosing) {
      return;
    }

    if ($hlb) {
      closeHLB();
    } else {
      targetHLB(highlight);
    }
  }

  /**
   * This is called when the user presses a key that moves the mouse highlight
   * has changed while the HLB opens
   */
  function retargetHLB(highlight) {
    copyFormDataToPage(); // Make sure we don't lose any of the form entry from the current HLB
    $hlb.remove();
    targetHLB(highlight, true);
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
  function createHLB(highlight, isRetargeting) {

    // clone, style, filter, emit hlb/did-create,
    // prevent mousemove deflation, disable scroll wheel
    initializeHLB(highlight);

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
      return elemClassifier.isEditable(element);
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
  function initializeHLB(highlight) {

    // Create and append the HLB and DIMMER wrapper element to the DOM
    $hlbWrapper = getOrCreateHLBWrapper();

    if ((platform.browser.isIE && getEditableItems().length) || platform.browser.isSafari) {
      // TODO try to remove these hacks
      // Hack#1: IE + text fields -- avoid bug where textfield was locked
      // Hack#2: Safari -- avoid bug where HLB is blurry, at least on tired.com (SC-3185)

      if (SC_DEV && loggingEnabled) {
        console.log('SPECIAL CASE: HLB inside <body>');
      }

      $hlbWrapper.appendTo('body');
      inheritedZoom = conf.get('zoom') || 1;  // Zoom inherited from page

    } else {
      $hlbWrapper.insertAfter('body');
      inheritedZoom = 1; // No zoom inherited, because zoom is on <body> and HLB is outside of that
    }

    // Prevents mouse movement from deflating the HLB until mouse is inside HLB
    preventDeflationFromMouseout = true;

    // Clone, style, filter
    cloneHLB(highlight);

    turnOnHLBEventListeners();

    // Listeners: speech.js
    events.emit('hlb/did-create', $hlb, highlight);
    new metric.LensOpen().send();
  }

  /**
   * [cloneHLB clones elements and styles from the foundation to the HLB.]
   */
  function cloneHLB(highlight) {

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
    hlbStyles = hlbStyling.getHLBStyles($picked, $foundation, highlight);

    // Set the styles for the HLB and append to the wrapping element
    $hlb
      .css(hlbStyles)
      .appendTo($hlbWrapper);

    // Fixes problem with TexasAT home page when opening the top nav (Home, Sitemap, Contact Us) in HLB
    hlbStyling.setHLBChildTextColor($hlb);

    // Set the ID of the hlb.
    $hlb[0].id = constants.HLB_ID;
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

    // ARCHITECTURE PROBLEM: This function does not take into account any elements in the DOM tree
    // between the "lonely" picked element and its "guardian" ul or ol ancestor.
    // Google search results currently have this structure.
    // https://www.google.com/#q=cats

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
        $foundation                = $('<sc>').append(pickedElementClone),
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

  function setCloneIndexOnFormDescendants($picked) {
    var i,
      $formDescendants = $picked.find(FORMS_SELECTOR)
        .addBack(FORMS_SELECTOR);

    for (i = 0; i < $formDescendants.length; i++) {
      $formDescendants[i].setAttribute('data-sc-cloned', i + 1);
    }
  }

  // Implemented to fix issue on http://www.gwmicro.com/Support/Email_Lists/ when HLBing Subscription Management
  function getValidFormElement($picked) {

    var i,
      pickedElement              = $picked[0],
      pickedElementsBoundingBox  = pickedElement.getBoundingClientRect();

    //Set data attributes on each of the form input elements
    //This allows us to query the DOM for the original elements
    //when we want to give them the values entered into the HLB
    setCloneIndexOnFormDescendants($picked);

    var pickedElementClone       = pickedElement.cloneNode(true),
      $pickedAndDescendants      = $picked.find('*').addBack(),
      $pickedCloneAndDescendants = $(pickedElementClone).find('*').addBack(),
      $submitButton              = $(),// TODO why? This was duplicating the button: $picked.closest('form').find('input[type="submit"],button[type="submit"]'),
      submitButtonClone          = $submitButton.clone(true),
      $foundation                = $('<form>').append(pickedElementClone, submitButtonClone);

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
    return $hlb[0] === element || $.contains($hlb[0], element);
  }

  function onClick(event) {
    if ($hlb && !isElementInsideHlb(event.target)) {
      // If click is outside of HLB, close it
      // (Need to doublecheck this because HLB can sometimes be inside of <body>)
      toggleHLB();
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

    // Listeners: hpan.js, highlight.js, speech.js
    events.emit('hlb/closed', event);

    $foundation = undefined;
    $hlb        = undefined;
    $picked     = undefined;

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
            $('<sc>', {
              'id': constants.HLB_WRAPPER_ID
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

  //////////////////////////////////
  // PUBLIC FUNCTIONS
  //////////////////////////////////

  // Return the current DOM element for the HLB or falsey value if there is no HLB
  function getElement() {
    return $hlb && $hlb[0];
  }

  // Public methods.

  if (SC_DEV) {
    console.log(
      '%cToggle HLB logging by executing : sitecues.toggleHLBLogging();',
      'background:black;color:white;font-size: 11pt'
    );

    /**
     * [toggleStickyHLB enables/disables HLB deflation]
     * @return {[Boolean]} [True if deflation is disabled.  False if deflation is enabled.]
     */
    sitecues.toggleStickyHLB = function() {
      isSticky = !isSticky;
      return isSticky;
    };

    sitecues.toggleHLBLogging = function () {
      loggingEnabled = !loggingEnabled;
      return loggingEnabled;
    };
  }

//  TODO should we remove permanently or do we want to keep this?
//  // Legal sizes == '-' (smaller), null (default), '+' (larger)
//  conf.def('lensSize', function(size) {
//    return size === '-' || size === '+' ? size : null;
//  });
//
  return {
    getElement: getElement,
    toggleHLB: toggleHLB,
    retargetHLB: retargetHLB
  };

});
