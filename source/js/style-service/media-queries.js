/**
 * This is the module for handling helping sitecues handle media queries.
 */
define([], function () {

  'use strict';
  
  function isActiveMediaQuery(mediaQuery) {

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

  var publics = {
    isActiveMediaQuery: isActiveMediaQuery
  };
  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});