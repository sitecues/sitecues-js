/**
 *  Retrieve basic information about a node, such as:
 *  style
 *  bounding rectangle
 *  margin, padding, overall spacing
 */
define(
  [
    '$',
    'page/highlight/traitcache',
    'page/highlight/highlight-position',
    'page/zoom/zoom',
    'page/util/element-classifier'
  ],
  function($, traitcache, mhpos, zoomMod, elemClassifier) {

    'use strict';

    var bodyWidth, viewSize;

  // ---- PUBLIC ----

  function getTraitStack(nodes) {
    var traitStack;

    viewSize = traitcache.getCachedViewSize();
    bodyWidth = zoomMod.getBodyWidth();
    traitStack = nodes.map(getTraits);

    return traitStack;
  }

  // ---- PRIVATE ----

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

    var fastRect = traitcache.getRect(node);

    traits.normDisplay = getNormalizedDisplay(traits.style, node, fastRect.height, zoom, traits);

    traits.rect = getRect(node, traits, fastRect);

    traits.fullWidth = fastRect.width; // Full element width, even if visible text content is much less

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
  function getNormalizedDisplay(style, node, height, zoom, traits) {
    function getApproximateLineHeight() {
      // See http://meyerweb.com/eric/thoughts/2008/05/06/line-height-abnormal/
      return (parseFloat(style.lineHeight) || parseFloat(style.fontSize)) * 1.5;
    }

    var doTreatAsInlineBlock = false;
    if (style.display === 'inline') {
      // Treat forms as inline-block across browsers (and thus are pickable).
      // If we don't do this, some browsers call them "inline" and they would not get picked
      if (elemClassifier.isFormControl(node)) {
        doTreatAsInlineBlock = true;
      }
      else if (traits.childCount === 1 && elemClassifier.isVisualMedia(node.firstElementChild)) {
        doTreatAsInlineBlock = true;
      }
      else {
        var lineHeight = getApproximateLineHeight() * zoom;
        if (height < lineHeight && mhpos.getContentsRangeRect(node.parentNode).height < lineHeight) {
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
    var exactRect,
      display = traits.normDisplay,
      WIDE_ELEMENT_TO_BODY_RATIO = 0.7;

    // Use exact approach for:
    // * inline-block, because it lies about height when media is inside
    // * wide blocks, because they lie about width when there is a float
    if (display === 'inline-block' ||
      (display ==='block' && fastRect.width > bodyWidth * WIDE_ELEMENT_TO_BODY_RATIO)) {
      exactRect = mhpos.getContentsRangeRect(element);
      return $.extend({}, exactRect); // Replace the width
    }

    return fastRect;
  }

  function isVisualMedia(traits, node) {
    var style = traits.style;
    return elemClassifier.isVisualMedia(node) ||
      // Or if one of those <div></div> empty elements just there to show a background image
      (
        traits.childCount === 0          &&
        style.backgroundImage !== 'none' &&
        (
          style.backgroundRepeat === 'no-repeat' ||
          style.backgroundSize === 'cover'       ||
          style.backgroundSize === 'contain'
        )                                &&
        $(node).is(':empty')
      );
  }

    return {
      getTraitStack: getTraitStack
    };
  });
