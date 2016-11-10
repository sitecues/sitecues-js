/*
* Selector Map
*
*  This module is responsible for caching the last query of a selector.
*
*  We only cache references to original elements, not clone elements
* */
define(
  [
    'page/positioner/util/element-info',
    'run/util/array-utility'
  ],
  function (
    elementInfo,
    arrayUtil
) {

  'use strict';

  // Caches references to elements that were selected the last time we queried the selector
  // Note: elements selected by fixed selectors are probably fixed, but haven't had their styles computed
  var selectorToElementsMap = {};

  // Private utility method
  function querySelector(selector) {
    var results;
    // Safari is incapable of processing certain selectors
    // example from chicagolighthouse.org :
    // input[type=\"number\"]::-webkit-inner-spin-button, input[type=\"number\"]::-webkit-outer-spin-button"
    try {
      results = arrayUtil.from(document.querySelectorAll(selector))
        .filter(elementInfo.isOriginal); // Only original elements are considered for processing
      return results;
    }
    catch (e) {
      return [];
    }
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
    cacheInitialQueries : cacheInitialQueries,
    makeNewQuery        : makeNewQuery,
    getCachedQuery      : getCachedQuery
  };
});
