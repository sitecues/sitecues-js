sitecues.def('hlb/safe-area', function(safeArea, callback) {

    'use strict';

    /////////////////////////
    // PRIVATE VARIABLES
    ////////////////////////

    var documentElement = window.document.documentElement;



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
            Math.pow(window.innerHeight, 2) +
            Math.pow(window.innerWidth, 2)
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
            'left': unsafePixels,
            'top': unsafePixels,
            'width': window.innerWidth - unsafePixels * 2,
            'height': window.innerHeight - unsafePixels * 2,
            'right': window.innerWidth - unsafePixels,
            'bottom': window.innerHeight - unsafePixels
        };

    };

    if (SC_UNIT) {
        exports.getSafeZoneBoundingBox = safeArea.getSafeZoneBoundingBox;
        exports.documentElement = documentElement;
    }

    callback();

});