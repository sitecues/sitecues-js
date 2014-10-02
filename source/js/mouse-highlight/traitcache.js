/**
 * The trait cache stores style and rect information for given nodes, relative to
 * a given zoom and window size. If these view metrics change, the cache must be invalidated.
 * Call checkViewHasChanged() before using the cache, if it is likely that the view has changed.
 * Note: the traitcache keeps a unique ID for each element, via $(data) with the key 'sc'
 * This unique ID can be used for other caches (for example the pickedItemsCache in pick.js uses it).
 */
sitecues.def('mouse-highlight/traitcache', function(traitcache, callback) {
  'use strict';
  sitecues.use('jquery', 'zoom', function($, zoomMod) {
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
    traitcache.resetCache = function () {
      updateCachedViewSize();
      traitcache.updateCachedViewPosition();
      styleCache = {};
      rectCache = {};
    };

    traitcache.updateCachedViewPosition = function() {
      cachedViewPosition.x = window.pageXOffset;
      cachedViewPosition.y = window.pageYOffset;
    };

    traitcache.getCachedViewSize = function() {
      return cachedViewSize;
    };

    // Can be used in the context of the highlighter, as the picker caches these values (expensive to get from browser)
    traitcache.getStyle = function (element) {
      var id = traitcache.getUniqueId(element),
        style = styleCache[id];
      if (!style) {
        style = window.getComputedStyle(element);
        styleCache[id] = style;
      }
      return style;
    };

    // Convenience method to get one cached style trait
    traitcache.getStyleProp = function (element, propName) {
      var styleObj = traitcache.getStyle(element);
      return styleObj[propName];
    };

    // Get rectangle in SCREEN coordinates
    traitcache.getScreenRect = function (element) {
      var rect = $.extend({}, traitcache.getRect(element)),
        top = cachedViewPosition.y,
        left = cachedViewPosition.x;
      rect.top -= top;
      rect.bottom -= top;
      rect.left -= left;
      rect.right -= left;
      return rect;
    };

    // Get rectangle in DOCUMENT coordinates
    traitcache.getRect = function (element) {
      var id = traitcache.getUniqueId(element),
        rect = rectCache[id];
      if (!rect) {
        // Copy rect object into our own object so we can modify values
        rect = $.extend({}, element.getBoundingClientRect());

        // Use the scroll height when the overflow is visible, as it shows the full height
        if (traitcache.getStyleProp(element, 'overflowY') === 'visible' &&
          !traitcache.getStyleProp(element, 'borderRightWidth')) {
          var scrollHeight = element.scrollHeight;
          if (scrollHeight > 1) {
            rect.height = Math.max(rect.height, scrollHeight * cachedViewSize.zoom);
          }
        }

        // Use the scroll width when the overflow is visible, as it shows the full height
        if (traitcache.getStyleProp(element, 'overflowX') === 'visible' &&
          !traitcache.getStyleProp(element, 'borderBottomWidth')) {
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
    };

    traitcache.getUniqueId = function(element) {
      var currId = getStoredUniqueId(element);
      if (currId) {
        return currId;
      }
      $(element).data('sc', ++uniqueIdCounter);   // Possibly a memory issue
      return uniqueIdCounter;
    };

    // ------- PRIVATE -----------

    function getStoredUniqueId(element) {
      return $(element).data('sc');
    }

    // Call before getting traits so that global/document values can be used
    function updateCachedViewSize() {
      cachedViewSize.height = window.innerHeight;
      cachedViewSize.width = window.innerWidth;
      cachedViewSize.zoom = zoomMod.getCompletedZoom()
    }

    if (SC_UNIT) {
      $.extend(exports, traitcache);
    }
  });

  callback();
});