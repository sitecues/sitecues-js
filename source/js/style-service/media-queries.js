/**
 * This is the module for handling helping sitecues handle media queries.
 */
sitecues.def('media-queries', function (mediaQueries, callback) {

  'use strict';
  
  mediaQueries.isActiveMediaQuery = function(mediaQuery) {

    if (!mediaQuery) {
      return true; // No media query, so everything matches
    }

    if (window.matchMedia) {
      var result = window.matchMedia(mediaQuery);
      return result.matches;
    }

    /**
     * IE9: does not support window.matchMedia
     */
    return mediaQuery !== 'print';  // The most realistic value that we need to ignore
  }

  callback();
});