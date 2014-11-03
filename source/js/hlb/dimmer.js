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

        // Initializing the dimmer with 0 opacity and then transitioning the
        // opacity to .65 requires a delay in between for the animation to occur.
        // 1ms was too little, worked sometimes and not others.  50ms has always
        // worked, and I have not noticed any delay.
        DIMMER_TRANSITION_DELAY = 50,

        documentElement = document.documentElement,

        $dimmerElement;

    //////////////////////////////
    // PRIVATE FUNCTIONS
    /////////////////////////////

    /**
     * [onDimmerClick toggles the HLB.  This function is bound
     * as a callback for clicking on the background dimmer]
     */
    function onDimmerClick() {
      sitecues.emit('hlb/toggle');
    }

    /**
     * [onDimmerReady sets the dimmer opacity to DIMMER_MAX_OPACITY]
     */
    function onDimmerReady() {
      $dimmerElement.css({
        'opacity': DIMMER_MAX_OPACITY
      });
    }

    /**
     * [onDimmerClosed removes the dimmer element from the DOM]
     */
    function onDimmerClosed() {
      $dimmerElement.remove();
    }

    //////////////////////////////
    // PUBLIC FUNCTIONS
    /////////////////////////////

    /**
     * [dimBackgroundContent creates the background dimmer element, positions it, and transitions opacity]
     * @param  {[jQuery element]} $hlbWrappingElement [The element that wraps the HLB element and dimmer element]
     * @param  {[integer]}        inflationSpeed      [The duration of the opacity transition]
     */
    dimmer.dimBackgroundContent = function($hlbWrappingElement, inflationSpeed) {

      var useScrollOffset = !$hlbWrappingElement.closest(document.body).length;

      $dimmerElement = $('<div>', {
        'id': DIMMER_ID
      });

      if (common.useJqueryAnimate) {

        $dimmerElement.css({
          'background': '#000000',
          'opacity'   : DIMMER_MIN_OPACITY,
          'left'      : useScrollOffset ? window.pageXOffset : 0,
          'top'       : useScrollOffset ? window.pageYOffset : 0,
          'position'  : 'absolute',
          'width'     : window.innerWidth  + 'px',
          'height'    : window.innerHeight + 'px',
          'z-index'   : DIMMER_Z_INDEX
        }).on('click', onDimmerClick);

        $hlbWrappingElement.append($dimmerElement);

        $dimmerElement.animate(
          {
            'opacity': DIMMER_MAX_OPACITY
          },
          inflationSpeed
        );

      } else {

        $dimmerElement.css({
          'transition'                : inflationSpeed + 'ms opacity',
          'transition-timing-function': 'ease',
          'background'                : '#000000',
          'opacity'                   : DIMMER_MIN_OPACITY,
          'left'                      : useScrollOffset ? window.pageXOffset : 0,
          'top'                       : useScrollOffset ? window.pageYOffset : 0,
          'position'                  : 'absolute',
          'width'                     : window.innerWidth + 'px',
          'height'                    : window.innerHeight + 'px',
          'z-index'                   : DIMMER_Z_INDEX
        }).on('click', onDimmerClick);

        $hlbWrappingElement.append($dimmerElement);

        // Required for transition to take place.
        // Without it, the dimmer has MAX_OPACITY
        // as it is appended to the DOM.
        setTimeout(onDimmerReady, DIMMER_TRANSITION_DELAY);

      }

    };

    /**
     * [removeDimmer transitions the opacity of the dimmer to DIMMER_MIN_OPACITY]
     * @param  {[integer]} deflationSpeed [The duration of the opacity transition]
     */
    dimmer.removeDimmer = function(deflationSpeed) {

      if (common.useJqueryAnimate) {

        $dimmerElement.animate(
          {
            'opacity': DIMMER_MIN_OPACITY
          },
          deflationSpeed,
          onDimmerClosed
        );

      } else {

        $dimmerElement[0].addEventListener(common.transitionEndEvent, onDimmerClosed);

        $dimmerElement.css({
          'transition': deflationSpeed + 'ms opacity',
          'opacity': DIMMER_MIN_OPACITY
        });

      }

    };

    if (SC_UNIT) {
      exports.onDimmerClick = onDimmerClick;
      exports.onDimmerReady = onDimmerReady;
      exports.onDimmerClosed = onDimmerClosed;
      exports.removeDimmer = dimmer.removeDimmer;
      exports.dimBackgroundContent = dimmer.dimBackgroundContent;
      exports.setDimmerElement = function(value) {
        $dimmerElement = value;
      };
      exports.getDimmerElement = function() {
        return $dimmerElement;
      };
    }

    callback();

  });

});
