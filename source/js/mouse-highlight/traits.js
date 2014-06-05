/**
 *  Retrieve basic information about a node, such as:
 *  style
 *  bounding rectangle
 *  margin, padding, overall spacing
 */
sitecues.def('mouse-highlight/traits', function(traits, callback) {
  'use strict';
  sitecues.use('jquery', 'mouse-highlight/traitcache', 'util/common', function($, traitcache, common) {

    // ---- PUBLIC ----

    traits.getTraitStack = function(nodes) {
      var traitStack = nodes.map(getTraits);

      // Get cascaded spacing traits and add them to traitStack
      var spacingTraitStack = getSpacingTraitsStack(traitStack);  // topSpacing, leftSpacing, etc.
      traitStack.forEach(function(traits, index) {
        $.extend(traits, spacingTraitStack[index]);
      });

      return traitStack;
    };

    // ---- PRIVATE ----

    // Properties that depend only on the node itself, and not other traits in the stack
    function getTraits(node) {
      var viewSize = traitcache.getCachedViewSize(),
        zoom = viewSize.zoom;

      // Basic properties
      var traits = {
        style: traitcache.getStyle(node),
        rect: traitcache.getRect(node),
        tag: node.localName,
        role: node.getAttribute('role'),
        childCount: node.childElementCount,
        isVisualMedia: common.isVisualMedia(node)
      };

      traits.unzoomedRect = {
        width: traits.rect.width / zoom,
        height: traits.rect.height / zoom,
        top: traits.rect.top / zoom,
        bottom: traits.rect.bottom / zoom,
        left: traits.rect.left / zoom,
        right: traits.rect.right / zoom
      };

      // Style-based
      $.extend(traits, {
        topPadding: parseFloat(traits.style.paddingTop),
        bottomPadding: parseFloat(traits.style.paddingBottom),
        leftPadding: parseFloat(traits.style.paddingLeft),
        rightPadding: parseFloat(traits.style.paddingRight),
        topBorder: parseFloat(traits.style.borderTopWidth),
        bottomBorder: parseFloat(traits.style.borderBottomWidth),
        leftBorder: parseFloat(traits.style.borderLeftWidth),
        rightBorder: parseFloat(traits.style.borderRightWidth),
        topMargin: Math.max(0, parseFloat(traits.style.marginTop)),
        bottomMargin: Math.max(0, parseFloat(traits.style.marginBottom)),
        leftMargin: Math.max(0, parseFloat(traits.style.marginLeft)),
        rightMargin: Math.max(0, parseFloat(traits.style.marginRight))
      });

      // Visible size
      $.extend(traits, {
        visualWidth: traits.rect.width - traits.leftPadding - traits.rightPadding,
        visualHeight: traits.rect.height - traits.topPadding - traits.bottomPadding
      });

      // Percentage of viewport
      $.extend(traits, {
        percentOfViewportHeight: 100 * traits.visualHeight / viewSize.height,
        percentOfViewportWidth: 100 * traits.visualWidth / viewSize.width
      });

      return traits;
    }

    // Which edges of node are adjacent to parent's edge? E.g. top, left, bottom, right
    // Returns an array of edges, e.g. ["top", "left"]
    function getAdjacentEdges(traitStack, index) {
      var traits = traitStack[index],
          parentTraits = traitStack[index + 1],
          rect = traits.unzoomedRect,
          parentRect = parentTraits.unzoomedRect,
          adjacentEdges = [],
          FUZZ_FACTOR = 1;  // If we're close by this many pixels, consider them adjacent

      if (parentRect.top + parentTraits.topPadding + FUZZ_FACTOR >= rect.top - traits.topMargin) {
        adjacentEdges.push('top');
      }

      if (parentRect.left + parentTraits.leftPadding + FUZZ_FACTOR >= rect.left - traits.leftMargin) {
        adjacentEdges.push('left');
      }

      if (parentRect.bottom - parentTraits.bottomPadding - FUZZ_FACTOR <= rect.bottom + traits.bottomMargin) {
        adjacentEdges.push('bottom');
      }

      if (parentRect.right - parentTraits.rightPadding - FUZZ_FACTOR <= rect.right + traits.rightMargin) {
        adjacentEdges.push('right');
      }

      return adjacentEdges;
    }

    // Get the true amount of spacing around each object.
    // For the top, left, bottom and rightmost objects in each container,
    // the parent container's margin/padding for that edge should be added to it
    // because we want the complete amount of visual spacing on that edge.
    function getSpacingTraitsStack(traitStack) {

      // Create the spacing properties
      function getSpacingTraits(item) {
        return {
          topSpacing: item.topMargin + item.topPadding,
          leftSpacing: item.leftMargin + item.leftPadding,
          bottomSpacing: item.bottomMargin + item.bottomPadding,
          rightSpacing: item.rightMargin + item.rightPadding
        };
      }

      var spacingTraitStack = traitStack.map(getSpacingTraits),
        index;

      function combineSpacingForAdjacentEdges(edge) {
        // Edges are adjacent, so use combined separation value for both, on that edge
        var propName = edge + 'Spacing', // E.g. topSpacing
          sum = spacingTraitStack[index][propName] + spacingTraitStack[index + 1][propName];
        spacingTraitStack[index][propName] = sum;
        spacingTraitStack[index + 1][propName] = sum;
      }

      // Cascade the spacing of each edge on the parent to its child, as appropriate.
      // For example, if the element is at the top of the parent, treat both object's top as
      // having the same aggregated values.
      // Because we compare each element to its parent, we start with child of the top ancestor.
      for (index = spacingTraitStack.length - 2; index >= 0; index --) {
        var adjacentEdges = getAdjacentEdges(traitStack, index);
        adjacentEdges.forEach(combineSpacingForAdjacentEdges);
      }

      return spacingTraitStack;
    }
  });

  callback();
});