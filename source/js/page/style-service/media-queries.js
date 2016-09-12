/**
 * This is the module for handling helping sitecues handle media queries.
 */
define([], function () {

  function isActiveMediaQuery(mediaQuery) {
    // No media query or a matching one
    var trimmedQuery = typeof mediaQuery === 'string' ? mediaQuery.trim() : '';
    return !trimmedQuery || window.matchMedia(trimmedQuery).matches;
  }

  return {
    isActiveMediaQuery: isActiveMediaQuery
  };
});

