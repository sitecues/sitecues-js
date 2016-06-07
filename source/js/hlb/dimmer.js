/**
 * BackgroundDimmer can dim all content in the page behind a given z-index.
 */
define([ '$', 'hlb/constants' ], function($, constants) {

  //////////////////////////////
  // PRIVATE VARIABLES
  /////////////////////////////

  var DIMMER_ID = 'sitecues-background-dimmer',

      DIMMER_MIN_OPACITY = 0,
      DIMMER_MAX_OPACITY = 0.65,

      requestFrameFn = window.requestAnimationFrame;

  //////////////////////////////
  // PUBLIC FUNCTIONS
  /////////////////////////////

  /**
   * dimBackgroundContent creates the background dimmer element, positions it, and transitions opacity
   * @param  {number}        inflationSpeed      The duration of the opacity transition
   * @param  {Object} (optional) $parentOfDimmer  A selector describing the node that should parent the dimmer
   */
  function dimBackgroundContent(inflationSpeed) {

    if (getDimmerElement()) {
      return; // Background already dimmed
    }

    var documentElement = document.documentElement,
      width = Math.max(documentElement.scrollWidth, window.innerWidth),
      height = Math.max(documentElement.scrollHeight, window.innerHeight),
      rect = {
        left: 0,
        top: 0,
        width: width,
        height: height
      },
      $dimmerElement = drawRect(rect, '#000');

    $dimmerElement
      .attr('id', DIMMER_ID)
      .css({
        zIndex: constants.MAX_ZINDEX,
        willChange: 'opacity'
      });

    animateOpacity($dimmerElement[0], DIMMER_MIN_OPACITY, DIMMER_MAX_OPACITY, inflationSpeed);
  }

  function animateOpacity(dimmerElement, startOpacity, endOpacity, speed, onCompleteFn) {

    var startTime = Date.now();

    function nextFrame() {
      var timeElapsed = Date.now() - startTime,
        percentComplete = timeElapsed > speed ? 1 : timeElapsed / speed,
        currentOpacity = startOpacity + (endOpacity - startOpacity) * percentComplete;

      dimmerElement.style.opacity = currentOpacity;
      if (percentComplete < 1) {
        requestFrameFn(nextFrame);
      }
      else if (onCompleteFn) {
        onCompleteFn();
      }
    }
    nextFrame();
  }

  /**
   * [undimBackgroundContent transitions the opacity of the dimmer to DIMMER_MIN_OPACITY]
   * @param  {[integer]} deflationSpeed [The duration of the opacity transition]
   */
  function undimBackgroundContent(deflationSpeed) {

    animateOpacity(getDimmerElement(), DIMMER_MAX_OPACITY, DIMMER_MIN_OPACITY, deflationSpeed, onDimmerClosed);

  }

  /**
   * [onDimmerClosed removes the dimmer element from the DOM]
   */
  function onDimmerClosed() {
    $(getDimmerElement()).remove();
  }

  function getDimmerElement() {
    return document.getElementById(DIMMER_ID);
  }

  // Draw a rectangle that does not capture any mouse events
  // Implemented via zero-area element and CSS outline
  // Used to be necessary because IE9/10 does not have pointer-events: none
  // We could replace this with a div at this point, but it works fine.
  // For example, if drawing a horizontal box we draw a line that is 0px high:
  //
  //       ---------------
  //
  // Then we fill in the outline around it using CSS:
  //
  //      OOOOOOOOOOOOOOOOO
  //      O---------------O
  //      OOOOOOOOOOOOOOOOO
  //
  function drawRect(absRect, color) {
    var useCss = {
        position: 'absolute',
        outlineOffset: '-1px',  // Fill in extra space in middle of outline
        outlineColor: color,
        outlineStyle: 'solid'
      },
      useOutlineWidth;

    if (absRect.width > absRect.height) {   // Wider than tall: draw horizontal line
      useOutlineWidth = absRect.height / 2;
      useCss.width = absRect.width - 2 * useOutlineWidth + 'px';
      useCss.height = '1px';
    }
    else {   // Taller than wide: draw vertical line
      useOutlineWidth = absRect.width / 2;
      useCss.height = absRect.height - 2 * useOutlineWidth + 'px';
      useCss.width = '1px';
    }

    useCss.left = Math.round(absRect.left + useOutlineWidth) + 'px';
    useCss.top = Math.round(absRect.top + useOutlineWidth) + 'px';
    useCss.outlineWidth = Math.round(useOutlineWidth + 1) + 'px'; // Must round otherwise we get an outline in the middle
    useCss.display = 'block';

    return $('<sc>')
      .css(useCss)
      .insertBefore('#' + constants.HLB_WRAPPER_ID);
  }

  return {
    dimBackgroundContent: dimBackgroundContent,
    undimBackgroundContent: undimBackgroundContent
  };

});
