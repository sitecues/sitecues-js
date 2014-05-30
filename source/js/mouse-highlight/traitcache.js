/**
 * The trait cache stores style and rect information for given nodes, relative to
 * a given zoom and window size. If these view metrics change, the cache must be invalidated.
 * Call checkViewHasChanged() before using the cache, if it is likely that the view has changed.
 * Note: the traitcache keeps a unique ID for each element, via $(data) with the key 'sc'
 * This unique ID can be used for other caches (for example the pickedItemsCache in pick.js uses it).
 */
sitecues.def('mouse-highlight/traitcache', function(traitcache, callback) {
  'use strict';
  sitecues.use('jquery', 'conf', function($, conf) {
    var uniqueIdCounter = 0;
    var styleCache = {};
    var rectCache = {};

    // ------- PUBLIC ----------
    // If any of these view size metrics change, we must invalidate the cache
    var cachedViewSize = {
      height: null,
      width: null,
      zoom: null
    };

    // Scrolling does not invalidate the cache
    var cachedViewPosition = {
      x: 0,
      y: 0
    };

    // Call this before using cache if view may have changed
    // Return true if view was out-of-date
    traitcache.checkViewHasChanged = function () {
      var old = $.extend({}, traitcache.cachedViewSize);
      updateCachedViewSize();
      updateCachedViewPosition();

      // Keys guaranteed to be in same order since we always create object here,
      // therefore JSON.stringify() works for equality check
      if (JSON.stringify(old) !== JSON.stringify(cachedViewSize)) {
        resetCache();
        return true;
      }
      return false;
    };

    traitcache.getCachedViewSize = function() {
      return cachedViewSize;
    };

    // Can be used in the context of the highlighter, as the picker caches these values (expensive to get from browser)
    traitcache.getStyle = function (element) {
      var id = getOrCreateUniqueId(element),
        style = styleCache[id];
      if (!style) {
        style = getComputedStyle(element);
        styleCache[id] = style;
      }
      return style;
    };

    traitcache.getRect = function (element) {
      var id = getOrCreateUniqueId(element),
          rect = rectCache[id];
      if (!rect) {
        // Copy rect object into our own object so we can modify values
        rect = $.extend({}, element.getBoundingClientRect());

        // Add scroll values so that rectangles are not invalid after user scrolls.
        // This effectively makes them absolutely positioned rects vs. fixed.
        // This means we're caching the rectangle relative to the top-left of the document.
        rect.top += cachedViewPosition.y;
        rect.bottom += cachedViewPosition.y;
        rect.left += cachedViewPosition.x;
        rect.right += cachedViewPosition.x;

        // Store results in cache
        rectCache[id] = rect;
      }

      return rect;
    };

    // Convenience method to get one cached style trait
    traitcache.getStyleProp = function (element, propName) {
      var styleObj = traitcache.getStyle(element);
      return styleObj[propName];
    };

    traitcache.getUniqueId = function(element) {
      return $(element).data('sc');
    };

    // ------- PRIVATE -----------

    function getOrCreateUniqueId(element) {
      var currId = traitcache.getUniqueId(element);
      if (currId) {
        return currId;
      }
      $(element).data('sc', ++uniqueIdCounter);   // Possibly a memory issue
      return uniqueIdCounter;
    }

    // Call before getting traits so that global/document values can be used
    function updateCachedViewSize() {
      cachedViewSize.height = window.innerHeight;
      cachedViewSize.width = window.innerWidth;
      cachedViewSize.zoom = conf.get('zoom');
    }

    function updateCachedViewPosition() {
      cachedViewPosition.x = window.pageXOffset;
      cachedViewPosition.y = window.pageYOffset;
    }

    function resetCache() {
      styleCache = {};
      rectCache = {};
    }

    if (sitecues.tdd) {
      exports.getOrCreateUniqueId = getOrCreateUniqueId;
      exports.getUniqueId = traitcache.getUniqueId;
    }
  });

  callback();
});