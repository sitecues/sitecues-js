/**
 *  Retrieve basic information about a node, such as:
 *  style
 *  bounding rectangle
 *  margin, padding, overall spacing
 */
sitecues.def('mouse-highlight/traits', function(traits, callback) {
  'use strict';
  sitecues.use('jquery', 'mouse-highlight/traitcache', 'mouse-highlight/highlight-position', 'zoom', 'util/common',
    function($, traitcache, mhpos, zoom, common) {

    // ---- PUBLIC ----

    traits.getTraitStack = function(nodes) {
      var traitStack;

      viewSize = traitcache.getCachedViewSize();
      bodyWidth = zoom.getBodyWidth();
      traitStack = nodes.map(getTraits);

      return traitStack;
    };

    // ---- PRIVATE ----

    var bodyWidth, viewSize;

    // Properties that depend only on the node itself, and not other traits in the stack
    function getTraits(node) {
      // Basic properties
      var zoom = viewSize.zoom,
        traits = {
          style: traitcache.getStyle(node),
          tag: node.localName,
          role: node.getAttribute('role'),
          childCount: node.childElementCount,
          isVisualMedia: common.isVisualMedia(node)
        };

      traits.normDisplay = getNormalizedDisplay(traits.style, node);

      traits.rect = getRect(node, traits);

      traits.fullWidth = traitcache.getRect(node).width; // Full element width, even if visible text content is much less

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

      // Visible size at 1x (what it would be if not zoomed)
      $.extend(traits, {
        visualWidthAt1x: traits.unzoomedRect.width - traits.leftPadding - traits.rightPadding,
        visualHeightAt1x: traits.unzoomedRect.height - traits.topPadding - traits.bottomPadding
      });

      // Percentage of viewport
      $.extend(traits, {
        percentOfViewportHeight: 100 * traits.rect.height / viewSize.height,
        percentOfViewportWidth: 100 * traits.rect.width / viewSize.width
      });

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

    // Get an element's rectangle
    // In most cases, we use the fastest approach (cached getBoundingClientRect results)
    // However, a block parent of an inline or visible text needs the more exact approach, so that the element
    // does not appear to be much wider than it really is
    function getRect(element, traits) {
      var fastRect = traitcache.getRect(element),
        exactWidth,
        display = traits.normDisplay,
        WIDE_ELEMENT_TO_BODY_RATIO = 0.7;

      // If not display:block -- use fast approach
      // because other elements are unlikely to have drastically incorrect widths
      if (display !== 'block') {
        return fastRect;
      }

      if (fastRect.width < bodyWidth * WIDE_ELEMENT_TO_BODY_RATIO) { // Not almost full width
        return fastRect;
      }

      // Almost full width, likely that it's a float which provides an incorrect width
      exactWidth = mhpos.getRangeRect(element).width;
      return $.extend({}, fastRect, { width: exactWidth }); // Replace the width
    }

    if (SC_UNIT) {
      $.extend(exports, traits);
    }
    
  });

  callback();
});