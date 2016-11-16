define(
  [
    '$',
    'run/bp/helper',
    'page/positioner/style-lock/style-lock',
    'page/positioner/style-lock/style-listener/style-listener',
    'run/events',
    'run/dom-events',
    'page/viewport/viewport'
  ],
  function (
    $,
    helper,
    styleLock,
    styleListener,
    events,
    domEvents,
    viewport
  ) {

  'use strict';

  var isTransformXOriginCentered,
    noop                 = function () {},
    // For convenience this map keeps track of which elements we're currently observing
    observedElementMap   = new WeakMap(),
    // This map caches the bounding rectangle for observed elements
    elementToRectDataMap = new WeakMap();

  function clearCache() {
    /*jshint validthis: true */
    if (this && this.nodeType === Node.ELEMENT_NODE) {
      elementToRectDataMap.set(this, null);
    }
    else {
      elementToRectDataMap = new WeakMap();
    }
    /*jshint validthis: true */
  }

  function getUnscaledRect(element, position, scale) {
    var rect = getRect(element, position);

    function getRectLeft() {
      // If the element has been transformed from 50 0 origin, the left boundary of its bounding box has been shifted by half of the scaled width
      // When we unscale the rect, take the difference between the scaled width and the unscaled width
      // then divide this number by 2 (because 50% of that width is shifting the right boundary) and add it to the left boundary to get its
      // unscaled position
      return isTransformXOriginCentered ? rect.left + rect.width * (1 - 1 / scale) / 2 : rect.left;
    }

    rect.left = getRectLeft();

    rect.height /= scale;
    rect.width  /= scale;
    rect.right  = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;

    return rect;
  }

  function getRect(element, position) {
    var offsetDeltas,
      rectData          = elementToRectDataMap.get(element) || {},
      rect              = rectData.rect ? $.extend({}, rectData.rect) : null,
      isFixed           = rectData.isFixed,
      isElementObserved = observedElementMap.get(element);

    function getOffsetDeltas(currentOffsets, cachedOffsets) {
      return {
        x: cachedOffsets.x - currentOffsets.x,
        y: cachedOffsets.y - currentOffsets.y
      };
    }

    if (rect) {
      if (isFixed) {
        // If the rectangle is fixed, we don't need to update its location coordinates on scroll
        // because fixed elements don't move on scroll
        return rect;
      }

      offsetDeltas = getOffsetDeltas(viewport.getPageOffsets(), rectData.offsets);
      rect.top    += offsetDeltas.y;
      rect.bottom += offsetDeltas.y;
      rect.left   += offsetDeltas.x;
      rect.right  += offsetDeltas.x;
      return rect;
    }

    rect = helper.getRect(element);

    if (isElementObserved) {
      isFixed = position === 'fixed';
      elementToRectDataMap.set(element, {
        rect: rect,
        offsets: viewport.getPageOffsets(),
        isFixed: isFixed
      });
    }

    return rect;
  }

  function updateRect(element, rect) {
    var currentRectData = elementToRectDataMap.get(element);
    // The rect may have been invalidated already, in which case we should recalculate the rectangle on the next request
    if (currentRectData) {
      currentRectData.rect    = rect;
      currentRectData.offsets = viewport.getPageOffsets();
      elementToRectDataMap.set(element, currentRectData);
    }
  }

  function deleteRect(element) {
    elementToRectDataMap.delete(element);
  }

  // listen for style mutations that will impact the element's bounding rectangle
  function listenForMutatedRect(element, handler) {
    handler = handler || noop;

    // We only allow a single handler to be attached
    if (observedElementMap.get(element)) {
      return;
    }

    styleLock.init(function () {
      styleListener.bindPropertyListener(element, 'top', function () {
        /*jshint validthis: true */
        clearCache.call(this);
        handler.call(this);
        /*jshint validthis: false */
      });

      // We don't want to lock width or height because they are styles that a commonly animated, so a lock is impractical
      styleListener.bindPropertyListener(element, 'width', function () {
        /*jshint validthis: true */
        clearCache.call(this);
        handler.call(this);
        /*jshint validthis: false */
      });

      styleListener.bindPropertyListener(element, 'height', function () {
        /*jshint validthis: true */
        clearCache.call(this);
        handler.call(this);
        /*jshint validthis: false */
      });

      styleLock.lock(element, {
        property : 'display',
        handlers : {
          before : clearCache,
          after  : handler
        }
      });

      styleLock.lock(element, {
        property : 'position',
        handlers : {
          before: clearCache
          // We don't need to bind another handler for resolving to a new position value, because the positioner
          // takes care of element transformation
        }
      });

      // This listener is a hacky way to detect if jQuery.fadeIn / fadeOut has been called on an element
      // We need to unlock display in this case, otherwise we see a flicker when opacity is removed but before
      // the display style lock is removed. This is an issue on TICC.com
      styleListener.bindPropertyListener(element, 'opacity', function () {
        /*jshint validthis: true */
        styleLock.unlockStyle(this, 'display');
        /*jshint validthis: false */
      });

      observedElementMap.set(element, true);
    });
  }

  function init(isOriginCentered) {
    isTransformXOriginCentered = isOriginCentered;
    events.on('zoom', clearCache);
    domEvents.on(window, 'resize', clearCache);
  }

  return {
    listenForMutatedRect: listenForMutatedRect,
    getUnscaledRect: getUnscaledRect,
    getRect: getRect,
    update: updateRect,
    delete: deleteRect,
    init: init
  };
});
