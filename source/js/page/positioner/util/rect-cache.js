define(
  [
    '$',
    'core/bp/helper',
    'page/positioner/style-lock/style-lock',
    'page/positioner/style-lock/style-listener/style-listener',
    'core/events',
    'core/dom-events'
  ],
  function (
    $,
    helper,
    styleLock,
    styleListener,
    events,
    domEvents
  ) {

  'use strict';

  var
    // For convenience this map keeps track of which elements we're currently observing
    observedElementMap = new WeakMap(),
    // This map caches the bounding rectangle for each element
    elementToRectMap   = new WeakMap();

  function clearCache() {
    /*jshint validthis: true */
    if (this && this.nodeType === Node.ELEMENT_NODE) {
      elementToRectMap.set(this, null);
    }
    else {
      elementToRectMap = new WeakMap();
    }
    /*jshint validthis: true */
  }

  function getUnscaledRect(element, scale) {
    var rect = $.extend({}, getRect(element));
    rect.height /= scale;
    rect.width  /= scale;
    rect.right  = null;
    rect.bottom = null;
    return rect;
  }

  function getRect(element) {
    var
      rect              = elementToRectMap.get(element),
      isElementObserved = observedElementMap.get(element);

    if (rect) {
      return rect;
    }

    rect = helper.getRect(element);

    if (isElementObserved) {
      elementToRectMap.set(element, rect);
    }

    return rect;
  }

  function updateRect(element, rect) {
    var currentRect = elementToRectMap.get(element);
    // The rect may have been invalidated already, in which case we should recalculate the bounding rectangle
    if (currentRect) {
      elementToRectMap.set(element, rect);
    }
  }

  // listen for style mutations that will impact the element's bounding rectangle
  function listenForMutatedRect(element, handler) {
    styleLock.init(function () {
      // We only allow a single handler to be attached
      if (observedElementMap.get(element)) {
        return;
      }

      styleLock(element, 'display', {
        before: clearCache,
        after: handler
      });

      // This listener is a hacky way to detect if jQuery.fadeIn / fadeOut has been called on an element
      // We need to unlock display in this case, otherwise we see a flicker when opacity is removed but before
      // the display style lock is removed. This is an issue on TICC.com
      styleListener.registerPropertyMutationHandler(element, 'opacity', function () {
        /*jshint validthis: true */
        styleLock.unlockStyle(this, 'display');
        /*jshint validthis: false */
      });

      styleLock(element, 'position', {
        before: clearCache
      });

      observedElementMap.set(element, true);
    });
  }

  function init() {
    events.on('zoom', clearCache);
    domEvents.on(window, 'resize', clearCache);
  }

  return {
    listenForMutatedRect: listenForMutatedRect,
    getUnscaledRect: getUnscaledRect,
    getRect: getRect,
    update: updateRect,
    init: init
  };
});