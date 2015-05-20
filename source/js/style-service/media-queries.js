// TODO on zoom change, refreshStyleSheet

/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - takes over cursor style(retrives and sets image) when necessary; 
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
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