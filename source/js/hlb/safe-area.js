sitecues.def('hlb/safe-area', function (safeArea, callback) {

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

  // HLB transform scale 
  safeArea.HLBZoom       = 1.5;

  /////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////

  /**
   * [getUnsafePixels returns the amount of pixels from the 
   * edge of the viewport that defines the safe zone]
   * @return {[float]} [pixels]
   */
  function getUnsafePixels () {
    
    var hypontenuse = Math.sqrt(
                        Math.pow(documentElement.clientWidth,  2) + 
                        Math.pow(documentElement.clientHeight, 2)
                      );

    return hypontenuse * safeArea.HLB_SAFE_AREA;

  }

  /////////////////////////
  // PUBLIC METHODS
  ////////////////////////  

  // Returns a rectangle the represents the area in which the HLB is allowed to occupy
  safeArea.getSafeZoneBoundingBox = function () {
    
    var unsafePixels = getUnsafePixels();
    
    return {
      'left'  : unsafePixels,
      'top'   : unsafePixels,
      'width' : documentElement.clientWidth  - unsafePixels * 2,
      'height': documentElement.clientHeight - unsafePixels * 2,
      'right' : documentElement.clientWidth  - unsafePixels,
      'bottom': documentElement.clientHeight - unsafePixels
    };
  
  };

  if (sitecues.tdd) {
    exports.getSafeZoneBoundingBox = safeArea.getSafeZoneBoundingBox;
  }

  callback();

});