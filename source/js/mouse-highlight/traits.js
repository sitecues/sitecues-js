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
      var traitStack = nodes.map(traits.getTraits);

      // Get cascaded spacing traits and add them to traitStack
      var spacingTraitStack = getCascadedSpacingTraitStack(traitStack);  // topSpacing, leftSpacing, etc.
      traitStack.forEach(function(traits, index) {
        $.extend(traits, spacingTraitStack[index]);
      });

      return traitStack;
    };

    // Properties that depend only on the node itself, and not other traits in the stack
    traits.getTraits = function(node) {
      var zoom = traitcache.viewSize.zoom;

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

      // Geometrical
      traits.visualWidth = traits.rect.width - traits.leftPadding - traits.rightPadding;
      traits.visualHeight = traits.rect.height - traits.topPadding - traits.bottomPadding;
      traits.percentOfViewportHeight = 100 * traits.visualHeight / traitcache.viewSize.height;
      traits.percentOfViewportWidth = 100 * traits.visualWidth / traitcache.viewSize.width;

      return traits;
    };

    // ---- PRIVATE ----

    // Which edges of node are adjacent to parent's edge? E.g. top, left, bottom, right
    function getAdjacentEdges(traitStack, index) {
      var traits = traitStack[index],
          parentTraits = traitStack[index + 1],
          rect = traits.unzoomedRect,
          parentRect = parentTraits.unzoomedRect,
          adjacentEdges = [];

      if (parentRect.top + parentTraits.topPadding + 1 >= rect.top + traits.topMargin) {
        adjacentEdges.push('top');
      }

      if (parentRect.left + parentTraits.leftPadding + 1 >= rect.left + traits.leftMargin) {
        adjacentEdges.push('left');
      }

      if (parentRect.bottom - parentTraits.bottomPadding - 1 <= rect.bottom + traits.bottomMargin) {
        adjacentEdges.push('bottom');
      }

      if (parentRect.right - parentTraits.rightPadding - 1 <= rect.right + traits.rightMargin) {
        adjacentEdges.push('right');
      }

      return adjacentEdges;
    }

    // For the top, left, bottom, rightmost objects in each container,
    // the parent container's border/margin/padding for that edge should be added to it
    function getCascadedSpacingTraitStack(traitStack) {
      var spacingTraitStack = [];
      var index;

      // Create the spacing properties
      traitStack.forEach(function(item, index) {
        spacingTraitStack[index] ={
          topSpacing: item.topMargin + item.topPadding,
          leftSpacing: item.leftMargin + item.leftPadding,
          bottomSpacing: item.bottomMargin + item.bottomPadding,
          rightSpacing: item.rightMargin + item.rightPadding
        };
      });

      function addToAdjacentEdges(edge) {
        // Edges are adjacent, so use same separation value for both
        var propName = edge + 'Spacing'; // E.g. topSpacing
        var sum = spacingTraitStack[index][propName] + spacingTraitStack[index + 1][propName];
        spacingTraitStack[index][propName] = spacingTraitStack[index + 1][propName] = sum;
      }

      // Cascade the spacing of each edge on the parent downward, as appropriate
      // For example, if the element is at the top of the parent, treat both object's top as
      // having the same aggregated values.
      for (index = spacingTraitStack.length - 2; index >= 0; index --) {
        getAdjacentEdges(traitStack, index)
          .forEach(addToAdjacentEdges);
      }

      return spacingTraitStack;
    }
  });

  callback();
});