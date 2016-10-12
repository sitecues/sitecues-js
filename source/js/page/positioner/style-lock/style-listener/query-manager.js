/*
* Query Manager
*
* This module takes the selectors for rule sets containing declarations of styles we're listening for, queries the selectors, and caches
* the results in the selector map. The symmetric difference between the last (or initial) query and the current query of a selector, that is
* the elements newly selected and unselected, are passed to the registered results handler.
* */
define(
  [
    'page/positioner/style-lock/style-listener/selector-map',
    'core/util/array-utility',
    'nativeFn'
  ],
  function (
    selectorMap,
    arrayUtil,
    nativeFn
  ) {
  'use strict';

  var
    resultsHandler,
    refreshTimer,
    // This is an arbitrary timeout, it saves us from requerying the same selectors needlessly in a short interval
    TIMER_DELAY = 50,
    selectorsToRefresh;

  function queue(selectors) {
    if (!Array.isArray(selectors)) {
      selectors = [selectors];
    }
    selectors.forEach(function (selector) {
      selectorsToRefresh.add(selector);
    });
    triggerQuery();
  }

  function triggerQuery() {
    if (!refreshTimer) {
      refreshTimer = nativeFn.setTimeout(function () {
        selectorsToRefresh.forEach(function (selector) {
          if (selector) {
            processQuery(selector);
          }
        });
        selectorsToRefresh.clear();
        refreshTimer = null;
      }, TIMER_DELAY);
    }
  }

  // Compare elements from the new selector query and the cached selector query
  // We don't know how the resolved value of an element will be impacted by
  // being newly selected or unselected by the given selector, it's possible
  // that a removed rule set was masking or applying the resolved style value we're
  // interested in, so return the difference between the two queries
  function processQuery(selector) {
    var
      cachedElements     = selectorMap.getCachedQuery(selector),
      currentElements    = selectorMap.makeNewQuery(selector),
      elementsToEvaluate = arrayUtil.symmetricDifference(cachedElements, currentElements);

    function handleResults(element) {
      resultsHandler(element, {
        selector: selector
      });
    }

    for (var i = 0, elementCount = elementsToEvaluate.length; i < elementCount; i++) {
      nativeFn.setTimeout(handleResults, 0, elementsToEvaluate[i]);
    }
  }

  function init(handler) {
    selectorsToRefresh = new Set();
    resultsHandler = handler;
  }

  return {
    queue: queue,
    init: init
  };
});
