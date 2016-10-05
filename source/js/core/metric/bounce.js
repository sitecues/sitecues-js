/**
 * Listen for events that will help with accurate bounce statistics
 */
define(
  [
    'core/dom-events',
    'core/metric/metric'
  ],
  function (
    domEvents,
    metric
  ) {
    'use strict';

    function getDetails() {
      return {
        time: Math.floor(performance.now())
      };
    }

    function onClick() {
      domEvents.off(window, 'mousedown', onClick); // Only need to record first click

      new metric.PageClickFirst(getDetails()).send();
    }

    function onScroll() {
      domEvents.off(window, 'scroll', onScroll); // Only need to record first scroll

      new metric.PageScrollFirst(getDetails()).send();
    }

    function onUnload() {
      new metric.PageUnload(getDetails()).send();
    }

    function init() {
      domEvents.on(window, 'mousedown', onClick);
      domEvents.on(window, 'scroll', onScroll);
      domEvents.on(window, 'beforeunload', onUnload);
    }

    return {
      init: init
    };
  });

