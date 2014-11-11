/**
 * BackgroundDimmer can dim all content in the page behind a given z-index.
 */
sitecues.def('hlb/dimmer', function(dimmer, callback) {

  'use strict';

  sitecues.use('jquery', 'conf', 'util/common', function($, conf, common) {

    //////////////////////////////
    // PRIVATE VARIABLES
    /////////////////////////////

    var DIMMER_ID = 'sitecues-background-dimmer',

        DIMMER_Z_INDEX = 2147483643,

        DIMMER_MIN_OPACITY = 0,
        DIMMER_MAX_OPACITY = 0.65,

        documentElement = document.documentElement;

    //////////////////////////////
    // PUBLIC FUNCTIONS
    /////////////////////////////

    /**
     * [dimBackgroundContent creates the background dimmer element, positions it, and transitions opacity]
     * @param  {[jQuery element]} $hlbWrappingElement [The element that wraps the HLB element and dimmer element]
     * @param  {[integer]}        inflationSpeed      [The duration of the opacity transition]
     */
    dimmer.dimBackgroundContent = function($hlbWrappingElement, inflationSpeed) {

      if (dimmer.getDimmerElement()) {
        return; // Background already dimmed
      }

      var rect = {
          left: 0,
          top: 0,
          width: documentElement.scrollWidth,
          height: documentElement.scrollHeight
        },
        $dimmerElement = common.drawRect(rect, '#000');

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
    }

    if (SC_UNIT) {
      exports.onDimmerClosed = onDimmerClosed;
      exports.undimBackgroundContent = dimmer.undimBackgroundContent;
      exports.dimBackgroundContent = dimmer.dimBackgroundContent;
      exports.getDimmerElement = dimmer.getDimmerElement;
    }

    callback();

  });

});
