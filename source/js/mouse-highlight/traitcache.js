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
    traitcache.viewSize = {
      height: null,
      width: null,
      zoom: null
    };

    // Scrolling does not invalidate the cache
    traitcache.viewPos = {
      x: 0,
      y: 0
    };

    // Call this before using cache if view may have changed
    // Return true if view was out-of-date
    traitcache.checkViewHasChanged = function () {
      var hasChanged = updateViewSize();
      updateViewPosition();
      if (hasChanged) {
        resetCache();
        return true;
      }
      return false;
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
        rect = $.extend({}, element.getBoundingClientRect());
        rect.top += traitcache.viewPos.y;
        rect.bottom += traitcache.viewPos.y;
        rect.left += traitcache.viewPos.x;
        rect.right += traitcache.viewPos.x;
        rectCache[id] = rect;
      }

      return rect;
    };

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
      $(element).data('sc', ++uniqueIdCounter);
      return uniqueIdCounter;
    }

    // Call before getting traits so that global/document values can be used
    // Returns true if the view context has changed
    function updateViewSize() {
      var old = $.extend({}, traitcache.viewSize);
      traitcache.viewSize.height = window.innerHeight;
      traitcache.viewSize.width = window.innerWidth;
      traitcache.viewSize.zoom = conf.get('zoom');
      // Keys guaranteed to ge in same order since we always create object here,
      // therefore JSON.stringify() works for equality check
      return (JSON.stringify(old) !== JSON.stringify(traitcache.viewSize));
    }

    function updateViewPosition() {
      traitcache.viewPos.x = window.pageXOffset;
      traitcache.viewPos.y = window.pageYOffset;
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