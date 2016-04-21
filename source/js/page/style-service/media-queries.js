/**
 * This is the module for handling helping sitecues handle media queries.
 */
define([], function () {


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

  return {
    isActiveMediaQuery: isActiveMediaQuery
  };

});