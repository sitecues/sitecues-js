/**
 * BackgroundDimmer can dim all content in the page behind a given z-index.
 */
sitecues.def('hlb/dimmer', function(dimmer, callback) {

  'use strict';

  sitecues.use('jquery', 'util/conf', 'util/common', 'util/platform', function($, conf, common, platform) {

    //////////////////////////////
    // PRIVATE VARIABLES
    /////////////////////////////

    var DIMMER_ID = 'sitecues-background-dimmer',

        DIMMER_Z_INDEX = 2147483643,

        DIMMER_MIN_OPACITY = 0,
        DIMMER_MAX_OPACITY = 0.65,

        isOldIE = platform.browser.isIE && platform.browser.version < 11,

        documentElement = document.documentElement;

    //////////////////////////////
    // PUBLIC FUNCTIONS
    /////////////////////////////

    /**
     * dimBackgroundContent creates the background dimmer element, positions it, and transitions opacity
     * @param  {number}        inflationSpeed      The duration of the opacity transition
     * @param  {Object} (optional) $parentOfDimmer  A selector describing the node that should parent the dimmer
     */
    dimmer.dimBackgroundContent = function(inflationSpeed, $parentOfDimmer) {

      if (dimmer.getDimmerElement()) {
        return; // Background already dimmed
      }

      var multiplySize = isOldIE ? 2 : 1, // Fixes bug with white line in the middle of the outline
        width = Math.max(documentElement.scrollWidth, window.innerWidth),
        height = Math.max(documentElement.scrollHeight, window.innerHeight),
        rect = {
          left: 0,
          top: 0,
          width: width * multiplySize ,
          height: height * multiplySize
        },
        $dimmerElement = common.drawRect(rect, '#000', $parentOfDimmer);

      $dimmerElement
        .attr('id', DIMMER_ID)
        .css({
          zIndex: DIMMER_Z_INDEX,
          opacity: DIMMER_MIN_OPACITY
        })
        .animate({ opacity : DIMMER_MAX_OPACITY }, inflationSpeed);
    };

    /**
     * [undimBackgroundContent transitions the opacity of the dimmer to DIMMER_MIN_OPACITY]
     * @param  {[integer]} deflationSpeed [The duration of the opacity transition]
     */
    dimmer.undimBackgroundContent = function(deflationSpeed) {

      $(dimmer.getDimmerElement())
        .animate({ opacity : DIMMER_MIN_OPACITY}, deflationSpeed, onDimmerClosed);
    };

    /**
     * [onDimmerClosed removes the dimmer element from the DOM]
     */
    function onDimmerClosed() {
      $(dimmer.getDimmerElement()).remove();
    }

    dimmer.getDimmerElement = function() {
      return document.getElementById(DIMMER_ID);
    };

    if (SC_UNIT) {
      exports.onDimmerClosed = onDimmerClosed;
      exports.undimBackgroundContent = dimmer.undimBackgroundContent;
      exports.dimBackgroundContent = dimmer.dimBackgroundContent;
      exports.getDimmerElement = dimmer.getDimmerElement;
    }

    callback();

  });

});
