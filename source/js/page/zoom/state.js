define([], function () {

  'use strict';

  var state = {
    completedZoom: 1,         // Current zoom as of the last finished operation
    currentTargetZoom: 1,     // Zoom we are aiming for in the current operation
    startZoomTime: 0,         // If no current zoom operation, this is cleared (0 or undefined)
    isInitialLoadZoom: false, // Is this the initial zoom for page load? (The one based on previous user settings)
    hasFormsToFix: null,
    zoomInput: {}             // Metrics info
  };

  Object.defineProperties(state, {
    // How many milliseconds have elapsed since the start of the zoom operation?
    elapsedZoomTime: {
      enumerable: true,
      get: function () {
        if (state.startZoomTime) {
          return Date.now() - state.startZoomTime;
        }
        return 0;
      }
    }
  });

  return state;

});