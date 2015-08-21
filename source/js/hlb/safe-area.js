sitecues.def('hlb/safe-area', function(safeArea, callback) {

  'use strict';

  /////////////////////////
  // PRIVATE VARIABLES
  ////////////////////////

  var documentElement = document.documentElement;



  /////////////////////////
  // PUBLIC PROPERTIES
  ////////////////////////

  // Default fraction of viewport hypotenuse that will define the safe area
  safeArea.HLB_SAFE_AREA = 0.05;

  /////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////

  /**
   * [getUnsafePixels returns the amount of pixels from the
   * edge of the viewport that defines the safe zone]
   * @return {number} [pixels]
   */
  function getUnsafePixels() {

    var hypotenuse = Math.hypot ?
      Math.hypot(  // modern browsers (not IE)
        innerHeight,
        innerWidth
      )
      : Math.sqrt(  // fallback for IE
        Math.pow(innerHeight, 2) +
        Math.pow(innerWidth, 2)
    );

    return hypotenuse * safeArea.HLB_SAFE_AREA;

  }

  /////////////////////////
  // PUBLIC METHODS
  ////////////////////////

  // Returns a rectangle the represents the area in which the HLB is allowed to occupy
  safeArea.getSafeZoneBoundingBox = function() {

    var unsafePixels = getUnsafePixels();

    return {
      'left'   : unsafePixels,
      'top'    : unsafePixels,
      'width'  : innerWidth - unsafePixels * 2,
      'height' : innerHeight - unsafePixels * 2,
      'right'  : innerWidth - unsafePixels,
      'bottom' : innerHeight - unsafePixels
    };

  };

  // no publics
});
