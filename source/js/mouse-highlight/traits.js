/**
 *  Retrieve basic information about a node, such as:
 *  style
 *  bounding rectangle
 *  margin, padding, overall spacing
 */
sitecues.def('mouse-highlight/traits', function(traits, callback) {
  'use strict';
  sitecues.use('jquery', 'mouse-highlight/traitcache', 'mouse-highlight/highlight-position', 'zoom', 'util/common',
    function($, traitcache, mhpos, zoomMod, common) {

    // ---- PUBLIC ----

    traits.getTraitStack = function(nodes) {
      var traitStack;

      viewSize = traitcache.getCachedViewSize();
      bodyWidth = zoomMod.getBodyWidth();
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
          childCount: node.childElementCount
        };

      traits.isVisualMedia = isVisualMedia(traits, node);

      var rect = traitcache.getRect(node);

      traits.normDisplay = getNormalizedDisplay(traits.style, node, rect.height, zoom);

      traits.rect = getRect(node, traits, rect);

      traits.fullWidth = rect.width; // Full element width, even if visible text content is much less

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
    function getNormalizedDisplay(style, node, height, zoom) {
      function getApproximateLineHeight() {
        // See http://meyerweb.com/eric/thoughts/2008/05/06/line-height-abnormal/
        return (parseFloat(style.lineHeight) || parseFloat(style.fontSize)) * 1.5;
      }

      var doTreatAsInlineBlock = false;
      if (style.display === 'inline') {
        // Treat forms as inline-block across browsers (and thus are pickable).
        // If we don't do this, some browsers call them "inline" and they would not get picked
        if (common.isFormControl(node)) {
          doTreatAsInlineBlock = true;
        }
        else {
          var lineHeight = getApproximateLineHeight() * zoom;
          if (height < lineHeight && mhpos.getRangeRect(node.parentNode).height < lineHeight) {
            // Treat single line inlines that are part of another single-line element as inline-block.
            // This allows them to be picked -- they may be a row of buttons or part of a menubar.
            doTreatAsInlineBlock = true;
          }
        }
      }

      return doTreatAsInlineBlock ? 'inline-block' : style.display;
    }

    // Get an element's rectangle
    // In most cases, we use the fastest approach (cached getBoundingClientRect results)
    // However, a block parent of an inline or visible text needs the more exact approach, so that the element
    // does not appear to be much wider than it really is
    function getRect(element, traits, fastRect) {
      var exactWidth,
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

    function isVisualMedia(traits, node) {
      var style = traits.style;
      return common.isVisualMedia(node) ||
        // Or if one of those <div></div> empty elements just there to show a background image
        (traits.childCount === 0 && style.backgroundImage !== 'none' &&
          (style.backgroundRepeat === 'no-repeat' || style.backgroundSize === 'cover'
            || style.backgroundSize === 'contain') &&
          $(node).is(':empty'));
    }

    if (SC_UNIT) {
      $.extend(exports, traits);
    }
    
  });

  callback();
});