/**
 * The trait cache stores style and rect information for given nodes, relative to
 * a given zoom and window size. If these view metrics change, the cache must be invalidated.
 * Call checkViewHasChanged() before using the cache, if it is likely that the view has changed.
 * Note: the traitcache keeps a unique ID for each element, via $(data) with the key 'sc'
 * This unique ID can be used for other caches (for example the pickedItemsCache in pick.js uses it).
 */
define(
  [
    '$',
    'page/zoom/zoom'
  ],
  function (
    $,
    zoomMod
  ) {
  'use strict';

  var uniqueIdCounter = 0,
    styleCache = {},
    rectCache = {},

    cachedViewSize = {  // If any of these view size metrics change, we must invalidate the cache
      height: null,
      width: null,
      zoom: null
    },
    // Scrolling does not invalidate the cache
    cachedViewPosition = {
      x: 0,
      y: 0
    };

  // ------- PUBLIC ----------

  // Call this before using cache if view may have changed
  function resetCache() {
    updateCachedViewSize();
    updateCachedViewPosition();
    styleCache = {};
    rectCache = {};
  }

  function updateCachedViewPosition() {

    var pageXOffset = window.pageXOffset,
      pageYOffset = window.pageYOffset;
    if (cachedViewPosition.x !== pageXOffset ||
        cachedViewPosition.y !== pageYOffset) {
      cachedViewPosition.x = pageXOffset;
      cachedViewPosition.y = pageYOffset;
      return true;
    }
  }

  function getCachedViewPosition() {
    return cachedViewPosition;
  }

  function getCachedViewSize() {
    return cachedViewSize;
  }

  // Can be used in the context of the highlighter, as the picker caches these values (expensive to get from browser)
  function getStyle(element) {
    var id = getUniqueId(element),
      style = styleCache[id];
    if (!style) {
      style = window.getComputedStyle(element);
      styleCache[id] = style;
    }
    return style;
  }

  // Convenience method to get one cached style trait
  function getStyleProp(element, propName) {
    var styleObj = getStyle(element);
    return styleObj[propName];
  }

  // Get rectangle in SCREEN coordinates
  function getScreenRect(element) {
    var rect = $.extend({}, getRect(element)),
      top = cachedViewPosition.y,
      left = cachedViewPosition.x;
    rect.top -= top;
    rect.bottom -= top;
    rect.left -= left;
    rect.right -= left;
    return rect;
  }

  // Get rectangle in DOCUMENT coordinates
  function getRect(element) {
    var id = getUniqueId(element),
      rect = rectCache[id];
    if (!rect) {
      // Copy rect object into our own object so we can modify values
      if (SC_DEV && !element.getBoundingClientRect) {
        console.log('Error in traitcache#getRect');
        console.log(element);
        console.trace();
      }
      rect = $.extend({}, element.getBoundingClientRect());

      // Use the scroll height when the overflow is visible, as it shows the full height
      if (getStyleProp(element, 'overflowY') === 'visible' &&
        !parseFloat(getStyleProp(element, 'borderRightWidth'))) {
        var scrollHeight = element.scrollHeight;
        if (scrollHeight > 1 && scrollHeight > element.clientHeight) {
          rect.height = Math.max(rect.height, scrollHeight * cachedViewSize.zoom);
        }
      }

      // Use the scroll width when the overflow is visible, as it shows the full height
      if (getStyleProp(element, 'overflowX') === 'visible' &&
        !parseFloat(getStyleProp(element, 'borderBottomWidth'))) {
        rect.width = Math.max(rect.width, element.scrollWidth * cachedViewSize.zoom);
      }

      // Add scroll values so that rectangles are not invalid after user scrolls.
      // This effectively makes them absolutely positioned rects vs. fixed.
      // This means we're caching the rectangle relative to the top-left of the document.
      var scrollTop = cachedViewPosition.y,
        scrollLeft = cachedViewPosition.x;
      rect.top += scrollTop;
      rect.left += scrollLeft;
      rect.bottom = rect.top + rect.height;
      rect.right = rect.left + rect.width;

      // Store results in cache
      rectCache[id] = rect;
    }

    return rect;
  }

  // Hidden for any reason? Includes offscreen or dimensionless, or tiny (if doTreatTinyAsHidden == true)
  function isHidden(element, doTreatTinyAsHidden) {
    var rect = getRect(element),
      MIN_RECT_SIDE_TINY = 5,
      minRectSide = doTreatTinyAsHidden ? MIN_RECT_SIDE_TINY * getCachedViewSize().zoom : 1;
    return (rect.right < 0 || rect.top < 0 || rect.width < minRectSide || rect.height < minRectSide);
  }


  function getUniqueId(element) {
    var currId = getStoredUniqueId(element);
    if (currId) {
      return currId;
    }
    $(element).data('sc', ++uniqueIdCounter);   // Possibly a memory issue
    return uniqueIdCounter;
  }

  // ------- PRIVATE -----------

  function getStoredUniqueId(element) {
    return $(element).data('sc');
  }

  // Call before getting traits so that global/document values can be used
  function updateCachedViewSize() {
    cachedViewSize.height = window.innerHeight;
    cachedViewSize.width = window.innerWidth;
    cachedViewSize.zoom = zoomMod.getCompletedZoom();
  }

  return {
    resetCache: resetCache,
    updateCachedViewPosition: updateCachedViewPosition,
    getCachedViewPosition: getCachedViewPosition,
    getCachedViewSize: getCachedViewSize,
    getStyle: getStyle,
    getStyleProp: getStyleProp,
    getScreenRect: getScreenRect,
    getRect: getRect,
    isHidden: isHidden,
    getUniqueId: getUniqueId
  };

});
