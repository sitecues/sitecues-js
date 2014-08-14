sitecues.def('hlb/safe-area', function(safeArea, callback) {

    'use strict';

    /////////////////////////
    // PRIVATE VARIABLES
    ////////////////////////

    var documentElement = window.document.documentElement,
      HLBZoom = 1.5;  // Amount HLB will scale up from current size



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

        var hypotenuse = Math.sqrt(
            Math.pow(documentElement.clientWidth, 2) +
            Math.pow(documentElement.clientHeight, 2)
        );

        return hypotenuse * safeArea.HLB_SAFE_AREA;

    }

    /////////////////////////
    // PUBLIC METHODS
    ////////////////////////

    sitecues.use('conf', function(conf) {
      // HLB transform scale necessary to provide the HLBExtraZoom size increase.
      // If zoom is on the body, then scaling needs to account for that since the HLB is outside of the body.
      safeArea.getHLBTransformScale = function () {
        return HLBZoom * conf.get('zoom');
      };
    });

    // Returns a rectangle the represents the area in which the HLB is allowed to occupy
    safeArea.getSafeZoneBoundingBox = function() {

        var unsafePixels = getUnsafePixels();

        return {
            'left': unsafePixels,
            'top': unsafePixels,
            'width': documentElement.clientWidth - unsafePixels * 2,
            'height': documentElement.clientHeight - unsafePixels * 2,
            'right': documentElement.clientWidth - unsafePixels,
            'bottom': documentElement.clientHeight - unsafePixels
        };

    };

    if (SC_UNIT) {
        exports.getSafeZoneBoundingBox = safeArea.getSafeZoneBoundingBox;
        exports.documentElement = documentElement;
    }

    callback();

});