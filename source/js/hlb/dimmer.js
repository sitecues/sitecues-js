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

    function createDimmerElement() {
      var documentElement = document.documentElement,
        width = Math.max(documentElement.scrollWidth, window.innerWidth),
        height = Math.max(documentElement.scrollHeight, window.innerHeight),
        // Draw a rectangle that does not capture any mouse events
        useCss = {
          display: 'block',
          position: 'absolute',
          zIndex: constants.MAX_ZINDEX,
          top: 0,
          left: 0,
          width: width + 'px',
          height: height + 'px',
          backgroundColor: '#000',
          pointerEvents: 'none',
          willChange: 'opacity'
        },
        newDimmer = $('<sc>')
          .css(useCss)
          .attr('id', DIMMER_ID)[0];

      animateOpacity(newDimmer, DIMMER_MIN_OPACITY, DIMMER_MAX_OPACITY, inflationSpeed);

      return newDimmer;
    }

    var dimmerElement = getDimmerElement() || createDimmerElement();

    // If created before, will ensure it's moved before the current hlb wrapper
    $(dimmerElement)
      .insertBefore('#' + constants.HLB_WRAPPER_ID);
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

  return {
    dimBackgroundContent: dimBackgroundContent,
    undimBackgroundContent: undimBackgroundContent
  };

});
