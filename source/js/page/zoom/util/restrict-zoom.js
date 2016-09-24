define(
  [
    'page/zoom/constants',
    'page/zoom/config/config'
  ],
  function (
    constants,
    config
  ) {
  'use strict';

  var
    MAX_FIXED_ZOOM = 1.8,
    MAX            = constants.MAX_ZOOM,
    MIN            = constants.MIN_ZOOM,
    ZOOM_PRECISION = constants.ZOOM_PRECISION;

  // Make sure the zoom value is within the min and max, and does not use more decimal places than we allow
  function toValidRange(value) {
    value = parseFloat(value);

    // value is too small
    if (!value || value < MIN) {
      return MIN;
    }

    // value is too big
    if (value > MAX) {
      return MAX;
    }

    // value have float value
    return parseFloat(value.toFixed(ZOOM_PRECISION));
  }

  // This is the zoom that we will still restrict the width
  function forFluidWidth(currZoom) {
    // Adjust max zoom for width restrictions for current window width
    // The max zoom for width restriction is set for a specific size of window
    // We use a maximized window on a MacBook pro retina screen (1440px wide)
    // The default is to restrict width up to a max of 1.35x zoom
    // If the user's window is 75% of the 1440px, we multiply the max zoom by .75
    var maxZoomToRestrictWidth = Math.max(1, config.maxZoomToRestrictWidthIfFluid * (window.innerWidth / 1440));

    return Math.min(currZoom, maxZoomToRestrictWidth); // Can't be larger than current zoom
  }

  function forFixedZoomTarget(completedZoom) {
    return Math.min(MAX_FIXED_ZOOM, completedZoom);
  }

  return {
    toValidRange: toValidRange,
    forFluidWidth: forFluidWidth,
    forFixedZoomTarget: forFixedZoomTarget
  };
});