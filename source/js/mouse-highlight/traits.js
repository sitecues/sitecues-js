/**
 *  Retrieve basic information about a node, such as:
 *  style
 *  bounding rectangle
 *  margin, padding, overall spacing
 */
sitecues.def('mouse-highlight/traits', function(traits, callback) {
  'use strict';
  sitecues.use('jquery', 'mouse-highlight/traitcache', 'mouse-highlight/highlight-position', 'util/common',
    function($, traitcache, mhpos, common) {

    // ---- PUBLIC ----

    traits.getTraitStack = function(nodes) {
      var oldViewSize = viewSize,
        traitStack,
        spacingTraitStack;

      viewSize = traitcache.getCachedViewSize();
      if (!common.equals(viewSize, oldViewSize)) {
        bodySize = getBodySize();
      }

      traitStack = nodes.map(getTraits);

      // Get cascaded spacing traits and add them to traitStack
      spacingTraitStack = getSpacingTraitsStack(traitStack);  // topSpacing, leftSpacing, etc.
      traitStack.forEach(function(traits, index) {
        $.extend(traits, spacingTraitStack[index]);
      });

      return traitStack;
    };

    // ---- PRIVATE ----

    var bodySize, viewSize;

    // Properties that depend only on the node itself, and not other traits in the stack
    function getTraits(node) {
      // Basic properties
      var zoom = viewSize.zoom,
        traits = {
          style: traitcache.getStyle(node),
          rect: traitcache.getRect(node),
          tag: node.localName,
          role: node.getAttribute('role'),
          childCount: node.childElementCount,
          isVisualMedia: common.isVisualMedia(node)
        };

      traits.normDisplay = getNormalizedDisplay(traits.style, node);

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

      var bodyWidth = bodySize.width;
      traits.percentOfBodyWidth = 100 * traits.rect.width / bodyWidth;

      return traits;
    }

    // Normalize treatment of CSS display for form controls across browsers.
    // Firefox says that form controls have an inline style, but really treats them as inline-block.
    // For example the label of an <input type="button"> will not wrap to the next line like a normal inline does.
    // Since they act like inline-block let's treat it as one while normalize the display trait across browsers --
    // this allows the form controls to be picked.
    function getNormalizedDisplay(style, node) {
      return (style.display === 'inline' && common.isFormControl(node)) ? 'inline-block' : style.display;
    }

    function getBodySize() {
      var MERGE_ALL_BOXES_VALUE = 99999;
      return mhpos.getAllBoundingBoxes(document.body, MERGE_ALL_BOXES_VALUE, false)[0];
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

    if (SC_UNIT) {
      $.extend(exports, traits);
    }
    
  });

  callback();
});