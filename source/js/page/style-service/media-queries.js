/**
 * This is the module for handling helping sitecues handle media queries.
 */
define([], function () {


  function isActiveMediaQuery(mediaQuery) {
    // No media query or a matching one
    return !mediaQuery || window.matchMedia(mediaQuery).matches;
  }

  return {
    isActiveMediaQuery: isActiveMediaQuery
  };

});