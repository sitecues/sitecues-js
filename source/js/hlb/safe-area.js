define([], function() {

  /////////////////////////
  // PRIVATE VARIABLES
  ////////////////////////

  /////////////////////////
  // PUBLIC PROPERTIES
  ////////////////////////

  // Default fraction of viewport hypotenuse that will define the safe area
  var HLB_SAFE_AREA = 0.05;

  /////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////

  /**
   * [getUnsafePixels returns the amount of pixels from the
   * edge of the viewport that defines the safe zone]
   * @return {number} [pixels]
   */
  function getUnsafePixels() {
    var hypotenuse = Math.sqrt(
      Math.pow(window.innerHeight, 2) +
      Math.pow(window.innerWidth, 2)
    );

    return hypotenuse * HLB_SAFE_AREA;
  }

  /////////////////////////
  // PUBLIC METHODS
  ////////////////////////

  // Returns a rectangle the represents the area in which the HLB is allowed to occupy
  function getSafeZoneBoundingBox() {
    var unsafePixels = getUnsafePixels();

    return {
      'left'   : unsafePixels,
      'top'    : unsafePixels,
      'width'  : window.innerWidth - unsafePixels * 2,
      'height' : window.innerHeight - unsafePixels * 2,
      'right'  : window.innerWidth - unsafePixels,
      'bottom' : window.innerHeight - unsafePixels
    };
  }

  return {
    getSafeZoneBoundingBox: getSafeZoneBoundingBox
  };
});
