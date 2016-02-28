/**
 * BackgroundDimmer can dim all content in the page behind a given z-index.
 */
define(['$', 'core/conf/user/manager', 'page/util/common', 'core/platform'], function($, conf, common, platform) {

  //////////////////////////////
  // PRIVATE VARIABLES
  /////////////////////////////

  var DIMMER_ID = 'sitecues-background-dimmer',

      DIMMER_Z_INDEX = 2147483643,

      DIMMER_MIN_OPACITY = 0,
      DIMMER_MAX_OPACITY = 0.65,

      isOldIE = platform.browser.isIE && platform.browser.version < 11,

      requestFrameFn = window.requestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (fn) {
          return setTimeout(fn, 16);
        };

  //////////////////////////////
  // PUBLIC FUNCTIONS
  /////////////////////////////

  /**
   * dimBackgroundContent creates the background dimmer element, positions it, and transitions opacity
   * @param  {number}        inflationSpeed      The duration of the opacity transition
   * @param  {Object} (optional) $parentOfDimmer  A selector describing the node that should parent the dimmer
   */
  function dimBackgroundContent(inflationSpeed, $parentOfDimmer) {

    if (getDimmerElement()) {
      return; // Background already dimmed
    }

    var multiplySize = isOldIE ? 2 : 1, // Fixes bug with white line in the middle of the outline
      documentElement = document.documentElement,
      width = Math.max(documentElement.scrollWidth, window.innerWidth),
      height = Math.max(documentElement.scrollHeight, window.innerHeight),
      rect = {
        left: 0,
        top: 0,
        width: width * multiplySize ,
        height: height * multiplySize
      },
      $dimmerElement = drawRect(rect, '#000', $parentOfDimmer);

    $dimmerElement
      .attr('id', DIMMER_ID)
      .css({
        zIndex: DIMMER_Z_INDEX,
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
  // Useful because IE9/10 does not have pointer-events: none
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
  function drawRect(absRect, color, optionalParent) {
    var useCss = {
        position: 'absolute',
        outlineOffset: '-1px',  // Fill in extra space in middle of outline
        outlineColor: color,
        outlineStyle: 'solid'
      },
      elemThickness = (platform.browser.isIE ? 0 : 1) + 'px',
      useOutlineWidth;

    if (absRect.width > absRect.height) {   // Wider than tall: draw horizontal line
      useOutlineWidth = absRect.height / 2;
      useCss.width = absRect.width - 2 * useOutlineWidth + 'px';
      useCss.height = elemThickness;
    }
    else {   // Taller than wide: draw vertical line
      useOutlineWidth = absRect.width / 2;
      useCss.height = absRect.height - 2 * useOutlineWidth + 'px';
      useCss.width = elemThickness;
    }

    useCss.left = Math.round(absRect.left + useOutlineWidth) + 'px';
    useCss.top = Math.round(absRect.top + useOutlineWidth) + 'px';
    useCss.outlineWidth = Math.round(useOutlineWidth + 1) + 'px'; // Must round otherwise we get an outline in the middle
    useCss.display = 'block';

    return $('<sc>')
      .css(useCss)
      .appendTo(optionalParent || 'html');
  }

  return {
    dimBackgroundContent: dimBackgroundContent,
    undimBackgroundContent: undimBackgroundContent
  };

});
