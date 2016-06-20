/*
* Selector Map
*
*  This module is responsible for caching the last query of a selector.
*
*  We only cache references to original elements, not clone elements
* */
define(
  [
    'page/positioner/util/element-info'
  ],
  function (
    elementInfo
  ) {
    // Caches references to elements that were selected the last time we queried the selector
    // Note: elements selected by fixed selectors are probably fixed, but haven't had their styles computed
    var selectorToElementsMap = {};

    // Private utility method
    function querySelector(selector) {
      return Array.prototype.slice.call(document.querySelectorAll(selector), 0)
        .filter(elementInfo.isOriginal);  // Only original elements be considered for processing
    }

    function getCachedQuery(selector) {
      return selectorToElementsMap[selector] || [];
    }

    // if @selector is undefined, query all fixed selectors
    function makeNewQuery(selector) {
      selectorToElementsMap[selector] = querySelector(selector);
      return selectorToElementsMap[selector];
    }

    function cacheInitialQueries(selectors) {
      selectors.forEach(function (selector) {
        makeNewQuery(selector);
      });
    }

    return {
      cacheInitialQueries: cacheInitialQueries,
      makeNewQuery: makeNewQuery,
      getCachedQuery: getCachedQuery
    };
});