// TODO Work in Firefox + EEOC menus
// TODO Test! Especially in IE
//TODO: Break this module down a bit, there are too many dependencies and it is huge
/*jshint -W072 */ //Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
define(
  [
    '$',
    'core/conf/user/manager',
    'page/highlight/pick',
    'page/highlight/traitcache',
    'page/highlight/highlight-position',
    'page/util/common',
    'page/util/color',
    'page/util/geo',
    'page/util/element-classifier',
    'core/platform',
    'page/highlight/constants',
    'core/events',
    'core/dom-events',
    'page/zoom/zoom',
    'page/zoom/util/body-geometry',
    'core/native-functions',
    'core/inline-style/inline-style'
  ],
  function (
    $,
    conf,
    picker,
    traitcache,
    mhpos,
    common,
    colorUtil,
    geo,
    elementClassifier,
    platform,
    constants,
    events,
    domEvents,
    zoomMod,
    bodyGeo,
    nativeFn,
    inlineStyle
  ) {
/*jshint +W072 */
  'use strict';

  var

  isInitialized,

  INIT_STATE = {
    isCreated: false, // Has highlight been created
    isVisible: false,  // Is highlight visible?
    picked: null,     // JQuery for picked element(s)
    target: null,     // Mouse was last over this element
    styles: [],
    savedCss: null,   // map of saved CSS for highlighted element
    savedBgColors: null, // map of descendant elements to saved background colors
    elementRect: null,    // Bounding client rect (fixed/screen rect) of picked element
    fixedContentRect: null,  // Contains the smallest possible rectangle encompassing the content to be highlighted
    hiddenElements: [], // Elements whose subtrees are hidden or not part of highlight rectangle (e.g. display: none, hidden off-the-page, out-of-flow)
    overlayContainer: null, // The scrollable container that will contain the highlight overlay as a child
    // Note however, that the coordinates used are zoomed pixels (at 1.1x a zoomed pixel width is 1.1 real pixels)
    overlayRect: null,  // Contains the total overlay rect, in absolute body coordinates,  zoomed pixels
    cutoutRects: {}, // Object map for possible topLeft, topRight, botLeft, botRight of rectangles cut out of highlight to create L shape
    pathBorder: [], // In real pixels so that it can live outside of <body>
    pathFillPadding: [], // In real pixels outside <body>, extends CSS background beyond element
    pathFillBackground: [], // In element rect coordinates, used with CSS background
    highlightPaddingWidth: 0,
    highlightBorderWidth: 0,
    highlightBorderColor: '',
    bgColor: '',    // highlight color or '' if only outline is being used (as when highlighting media element)
    doUseOverlayforBgColor: false,  // was an overlay used to create the background color? If not, CSS background will be used.
    hasDarkBackgroundColor: false,
    hasLightText: false
  },

  // class of highlight
  HIGHLIGHT_OUTLINE_CLASS = constants.HIGHLIGHT_OUTLINE_CLASS,
  HIGHLIGHT_OUTLINE_ATTR = constants.HIGHLIGHT_OUTLINE_ATTR,
  HIGHLIGHT_STYLESHEET_NAME = constants.HIGHLIGHT_STYLESHEET_NAME,

  //Highlight event
  HIGHLIGHT_TOGGLE_EVENT = constants.HIGHLIGHT_TOGGLE_EVENT,

  // How many ms does mouse need to stop for before we highlight?
  MOUSE_STOP_MS = 30,

  // How many ms does scrolling need to stop for before we highlight?
  SCROLL_STOP_MS = 140,

  // Color values for YIQ computations
  MID_COLOR_INTENSITY = 0.62,   // Don't consider the text light unless the yiq is larger than this
  VERY_DARK_COLOR_INTENSITY = 0.06,
  VERY_LIGHT_COLOR_INTENSITY = 0.94,

  // Extra border width in pixels if background is dark and light bg color is being used
  EXTRA_DARK_BG_BORDER_WIDTH = 1,

  // Extra room around highlight
  EXTRA_PIXELS_TO_PRESERVE_LETTERS = 1, // Amount of extra space computed for fixed highlight rectangles
  EXTRA_PADDING_PIXELS = 4, // Amount of space around highlighted object before to separate border

  // Border color when on dark background
  DARK_BG_BORDER_COLOR = '#bec36e',

  // All CSS background properties except color
  // Image must be listed last for multiple backgrounds code to work
  BG_PROPS = [
    'backgroundPosition', 
    'backgroundOrigin', 
    'backgroundRepeat', 
    'backgroundClip', 
    'backgroundAttachment', 
    'backgroundSize', 
    'backgroundImage'
  ],

  state,

  isSitecuesOn = true, // We don't initialize this module until sitecues is on
  isTrackingMouse, // Are we currently tracking the mouse?
  canTrackScroll = true,  // Is scroll tracking allowable? Turned off during panning from keyboard navigation
  willRespondToScroll = true, // After scroll tracking is turned on, we won't respond to it until at least one normal mousemove
  isTrackingWheelEvents,
  isOnlyShift, // Is shift down by itself?
  isAppropriateFocus,
  isWindowFocused = document.hasFocus(),
  isSticky,
  isBPOpen,
  isSpeechEnabled = false,
  isLensEnabled,
  isColorDebuggingOn,
  isHighlightRectDebuggingOn,
  $highlightStyleSheet,   // Style sheet for overlay via :after

  pickFromMouseTimer,

  cursorPos = {};

  function getMaxZIndex(styles) {
    var maxZIndex = 0;
    for (var count = 0; count < styles.length; count ++) {
      var zIndexInt = parseInt(styles[count].zIndex);
      if (zIndexInt > maxZIndex) {
        maxZIndex = zIndexInt;
      }
    }
    return maxZIndex;
  }

  function isDifferentZIndex(item1, item2, commonAncestor) {
    function getZIndex(item) {
      var styles = getAncestorStyles(item, commonAncestor);
      return getMaxZIndex(styles);
    }
    return getZIndex(item1) !== getZIndex(item2);
  }

  /**
   * Checks if the color value given of a light tone or not.
   */
  function isLightIntensity(colorValue) {
    return colorUtil.getLuminanceFromColorName(colorValue) > MID_COLOR_INTENSITY;
  }

  function getElementsContainingOwnVisibleText($subtree) {
    var TEXT_NODE = 3;
    return $subtree.filter(function() {
      var childNodes = this.childNodes,
        numChildNodes = childNodes.length,
        index,
        testNode,
        css;
      if (this.childElementCount === numChildNodes) {
        return false; // Same number of elements as child nodes -- doesn't have it's own text nodes
      }

      css = traitcache.getStyle(this);
      if (parseInt(css.textIndent) < -99) {
        return false; // Used to hide text in conjunction with background image
      }

      for (index = 0; index < numChildNodes; index ++) {
        testNode = childNodes[index];
        if (testNode.nodeType === TEXT_NODE && testNode.textContent.trim() !== '') {
          return true;
        }
      }

      return false;
    });
  }

  function getTextInfo(selector) {
    var $subtree = $(selector).find('*').addBack(),
      textContainers = getElementsContainingOwnVisibleText($subtree),
      elementsToCheck = textContainers.length ? textContainers : $subtree,
      MAX_ELEMENTS_TO_CHECK = 100,
      containsLightText = false,
      containsDarkText = false;

    elementsToCheck.each(function(index) {
      if (index >= MAX_ELEMENTS_TO_CHECK) {
        return false;
      }
      var textColor = traitcache.getStyleProp(this, 'color');
      if (isLightIntensity(textColor)) {
        containsLightText = true;
      }
      else {
        containsDarkText = true;
      }
    });

    return {
      hasLightText: containsLightText,
      hasDarkText: containsDarkText,
      hasVisibleText: textContainers.length > 0
    };
  }

  function hasDarkBackgroundOnAnyOf(styles, textInfo) {

    var hasOnlyLightText = textInfo.hasLightText && !textInfo.hasDarkText,
      count = 0;

    for (; count < styles.length; count ++) {
      var style = styles[count],
        bgRgba = colorUtil.getRgba(style.backgroundColor),
        isMostlyOpaque = bgRgba.a > 0.8;
      if (style.backgroundImage && style.backgroundImage !== 'none') {
        if (hasOnlyLightText) {
          return true; // Has a background image, has light text and NO dark text -- probably a dark background
        }
        if (!textInfo.hasVisibleText) {

        }
      }
      if (isMostlyOpaque) {
        return !isLightIntensity(bgRgba);     // Opaque, dark background
      }
    }
  }

  function updateColorApproach(picked, style) {
    // Get data on backgrounds and text colors used
    var textInfo = getTextInfo(picked);
    state.hasLightText = textInfo.hasLightText;
    state.hasDarkText = textInfo.hasDarkText;
    state.hasDarkBackgroundColor = hasDarkBackgroundOnAnyOf(style, textInfo);

    // Get the approach used for highlighting
    if (picked.length > 1 || shouldAvoidBackgroundImage(picked) || state.hasLightText || !textInfo.hasVisibleText) {
      //  approach #1 -- use overlay for background color
      //                 use overlay for rounded outline
      //  pros: one single rectangle instead of potentially many
      //        works with form controls
      //        visually seamless
      //  cons: washes dark text out (does not have this problem with light text)
      //  when-to-use: for article or cases where multiple items are selected
      //               when images or background sprites are used, which we don't want to overwrite with out background
      //               a lack of text indicates a good opportunity to use technique as it is an indicator of image content
      state.bgColor = getTransparentBackgroundColor();
      state.doUseOverlayForBgColor = true; // Washes foreground out
    } else {
      //  approach #2 -- use css background of highlighted element for background color
      //                use overlay for rounded outline
      //  pros: looks best on text, does not wash out colors
      //  cons: breaks the appearance of native form controls, such as <input type="button">
      //  when-to-use: on most elements
      state.bgColor = getAppropriateBackgroundColor();
      state.doUseOverlayForBgColor = false;
    }
  }

  // How visible is the highlight?
  // Currently goes from 1.44 (at 1x) to 3.24 (at 3x)
  // The smaller the number, the less visible the highlight is
  function getHighlightVisibilityFactor() {
    var MIN_VISIBILITY_FACTOR_WITH_TTS = 2.1,
        vizFactor = (zoomMod.getCompletedZoom() + 0.6) * 0.9;
    if (isSpeechEnabled && vizFactor < MIN_VISIBILITY_FACTOR_WITH_TTS) {
      vizFactor = MIN_VISIBILITY_FACTOR_WITH_TTS;
    }
    return vizFactor;
  }

  function getHighlightBorderColor() {

    if (state.hasDarkBackgroundColor) {
      return DARK_BG_BORDER_COLOR;
    }

    var viz = state.highlightIntensity,
      colorMultiplier = -80,
      color = Math.round(Math.max(0, 200 + viz * colorMultiplier));
    return 'rgb(' + color + ',' + color + ',' + (color + 30) +')';
  }

  function getHighlightBorderWidth() {
    var viz = state.highlightIntensity,
        borderWidth = viz + 0.33 + (state.hasDarkBackgroundColor ? EXTRA_DARK_BG_BORDER_WIDTH : 0);
    return Math.max(1, borderWidth) * state.zoom;
  }

  function getTransparentBackgroundColor() {
    // Best to use transparent color when the background is interesting or dark, and we don't want to
    // change it drastically
    // This lightens at higher levels of zoom
    var maxViz = state.hasDarkBackgroundColor || state.hasLightText ? 1 : 9,
      viz = Math.min(state.highlightIntensity, maxViz),
      alpha = 0.11 * viz;
    return 'rgba(240, 240, 180, ' + alpha + ')'; // Works with any background -- lightens it slightly
  }

  function getOpaqueBackgroundColor() {
    // Best to use opaque color, because inner overlay doesn't match up perfectly causing overlaps and gaps
    // It lightens at higher levels of zoom
    var viz = state.highlightIntensity,
        decrement = viz * 1.4,
        red = Math.round(255 - decrement),
        green = red,
        blue = Math.round(254 - 5 * decrement),
        color = 'rgb(' + red + ',' + green + ',' + blue + ')';
    return color;
  }

  // Return an array of styles in the ancestor chain, including fromElement, not including toElement
  function getAncestorStyles(fromElement, toElement) {
    var styles = [ ];

    while (fromElement) {
      styles.push(traitcache.getStyle(fromElement));
      if (fromElement === toElement) {
        break; // Finished
      }
      fromElement = fromElement.parentElement;
    }
    return styles;
  }

  function getCutoutRectsArray() {
    return [
      state.cutoutRects.topLeft,
      state.cutoutRects.topRight,
      state.cutoutRects.botLeft,
      state.cutoutRects.botRight
    ];
  }

  function isCursorInHighlightShape(fixedRects, cutoutRects) {
    if (!cursorPos.doCheckCursorInHighlight) {
      return true; // No cursor -- last pick may have been from keyboard
    }

    var extraPixels = getExtraPixels() * state.zoom;
    if (!geo.isPointInAnyRect(cursorPos.x, cursorPos.y, fixedRects, extraPixels)) {
      return false;
    }
    // The cursor is in the fixed rectangle for the highlight.
    // Now, we will consider the cursor to be in the highlight as long as it's not in any
    // parts cut out from the highlight when it is drawn around floats.
    return !geo.isPointInAnyRect(cursorPos.x, cursorPos.y, cutoutRects);
  }

  // Update mouse highlight view and show unless doKeepHidden is truthy
  // return true if something is shown
  function updateView(doKeepHidden) {
    // can't find any element to work with
    if (!state.picked) {
      return;
    }

    // Update state to ensure it is current
    state.styles = getAncestorStyles(state.picked[0], document.documentElement);
    state.highlightIntensity = getHighlightVisibilityFactor();

    updateColorApproach(state.picked, state.styles);

    if (!computeOverlay(true)) {
      // Did not find visible rectangle to highlight
      return;
    }

    // Show the actual overlay
    if (!doKeepHidden) {
      show();
    }
    return true;
  }

  function didToggleVisibility(isVisible) {
    state.isVisible = isVisible;
    events.emit(HIGHLIGHT_TOGGLE_EVENT, isVisible);
  }

  function show() {
    // Create and position highlight overlay
    appendOverlayPathViaSVG();

    // Remove conflicting backgrounds on descendants
    removeConflictingDescendantBackgrounds();

    // Position overlay just on top of the highlighted element (and underneath fixed toolbars)
    // Change background image for highlighted elements if necessary
    updateElementBgImage();

    // Add event listeners to keep overlay view up-to-date
    addMouseWheelListener();
    addEventListener('mouseout', onLeaveWindow, { passive : true });

    // Update state
    didToggleVisibility(true);

    // Get Lens code loaded and ready so that it shows up quickly the first time
    if (!isLensEnabled) {
      isLensEnabled = true;
      require(['hlb/hlb'], function() {});
    }
  }

  // Choose an appropriate background color for the highlight
  // In most cases we want the opaque background because the background color on the element
  // can overlap the padding over the outline which uses the same color, and not cause problems
  // We need them to overlap because we haven't found a way to 'sew' them together in with pixel-perfect coordinates
  function getAppropriateBackgroundColor() {

    if (state.hasDarkBackgroundColor ||
        state.hasLightText) {
      // Use transparent background so that the interesting background or light foreground are still visible
      return getTransparentBackgroundColor();
    }

    return getOpaqueBackgroundColor();
  }

  // Helps with SC-1471, visually seamless highlight rectangle
  function roundCoordinate(n) {
    return Math.round(n);
  }

  function roundBorderWidth(n) {
    return roundCoordinate(n);
  }

  function roundRectCoordinates(rect) {
    var newRect = {
      top: roundCoordinate(rect.top),
      bottom: roundCoordinate(rect.bottom),
      left: roundCoordinate(rect.left),
      right: roundCoordinate(rect.right)
    };
    newRect.width = newRect.right - newRect.left;
    newRect.height= newRect.bottom - newRect.top;
    return newRect;
  }

  function roundPolygonCoordinates(points) {
    var index = 0,
      numPoints = points.length,
      point;
    for (; index < numPoints; index ++) {
      point = points[index];
      point.x = roundCoordinate(point.x);
      point.y = roundCoordinate(point.y);
    }
  }

  function setMultipleBackgrounds(element, newBg, origBg, doPlaceOrigOnTop) {
    var value,
      hasOrigBgImage = origBg.backgroundImage !== 'none',
      styles = {};
    BG_PROPS.forEach(function (property) {
      if (!hasOrigBgImage) {
        value = newBg[property];
      }
      else if (doPlaceOrigOnTop) {
        value = origBg[property] + ',' + newBg[property];
      }
      else {
        value = newBg[property] + ',' + newBg[property];
      }
      styles[property] = value;
    });
    inlineStyle.override(element, styles);
  }

  function copyBackgroundCss(origElem) {
    var copy = {},
        style = inlineStyle(origElem);
    BG_PROPS.forEach(function (property) {
      copy[property] = style[property].slice();
    });
    return copy;
  }

  // width and height are optional
  function getSVGDataURI(svgMarkup, width, height) {
    var attrs = width ? ' width="' + width + '" height="' + height + '" ' : '',
      wrappedSvg = '<svg xmlns="http://www.w3.org/2000/svg"' + attrs + '>' + svgMarkup + '</svg>';
    // Use encodeURIComponent instead of encodeURI because we also want # -> %23,
    // otherwise Firefox is unhappy when we set the fill color
    return 'url("data:image/svg+xml,' + encodeURIComponent(wrappedSvg) + '")';
  }

  function updateElementBgImage() {

    var element = state.picked[0],
        offsetLeft,
        offsetTop;

    // Approach #1 -- no change to background of element
    if (state.doUseOverlayForBgColor) {
      return false;
    }

    // Approach #2 --change CSS background of highlighted element
    var path = getAdjustedPath(state.pathFillBackground, state.fixedContentRect.left, state.fixedContentRect.top, 0, state.zoom),
      bgColor = (SC_DEV && isColorDebuggingOn) ? 'rgba(0,255,255,.4)' : state.bgColor,
      bgPaintableWidth = state.fixedContentRect.width,
      bgPaintableHeight = state.fixedContentRect.height,
      newBgSize,
      // Get the rectangle for the element itself
      svgMarkup = getSVGForPath(path, 0, 0, bgColor, 1);

    // Use element rectangle to find origin (left, top) of background
    // The background is getting clipped before being offset to the left
    offsetLeft = state.fixedContentRect.left - state.elementRect.left;
    if (offsetLeft < 0) {
      bgPaintableWidth += offsetLeft;
      offsetLeft = 0;
    }

    offsetTop = state.fixedContentRect.top - state.elementRect.top;
    if (offsetTop < 0) {
      bgPaintableHeight += offsetTop;
      offsetTop = 0;
    }

    bgPaintableWidth = Math.min(bgPaintableWidth + state.zoom, state.elementRect.width);
    bgPaintableHeight = Math.min(bgPaintableHeight  + state.zoom, state.elementRect.height);
    newBgSize = roundCoordinate(bgPaintableWidth / state.zoom) + 'px ' + roundCoordinate(bgPaintableHeight / state.zoom) + 'px';
    offsetLeft = roundCoordinate(offsetLeft);
    offsetTop = roundCoordinate(offsetTop);

    // This only returns a non-zero value when there is an offset to the current element, try highlighting "Welcome to Bank of North America" on the eBank test site.
    var origBgStyle = traitcache.getStyle(element),
      newBgStyle = {
        backgroundImage: getSVGDataURI(svgMarkup),
        backgroundPosition: (offsetLeft / state.zoom) + 'px '+ (offsetTop / state.zoom) + 'px',
        backgroundOrigin: 'border-box',
        backgroundRepeat: 'no-repeat',
        backgroundClip: 'border-box',
        backgroundAttachment: 'scroll',
        backgroundSize: newBgSize
      },
      doPlaceOrigOnTop = common.isSprite(origBgStyle);  // Place sprites on top of our background, and textures underneath it

    // Save the current inline style for later restoration when the highlight is hidden
    state.savedCss = copyBackgroundCss(element);

    // Set the new background
    setMultipleBackgrounds(element, newBgStyle, origBgStyle, doPlaceOrigOnTop);
  }

  function isCloseToHighlightColor(colorIntensity) {
    if (state.hasDarkBackgroundColor) {
      // On dark background, using dark highlight
      return colorIntensity < VERY_DARK_COLOR_INTENSITY;
    }
    else {
      // On light background, using light highlight
      return colorIntensity > VERY_LIGHT_COLOR_INTENSITY;
    }
  }

  // Check all descendants for redundant background colors that will
  // carve chunks out of the highlight color.
  // For example, a theme on perkins.org that sets white backgrounds on many elements.
  // When we highlight an ancestor of one of those elements, we need to temporarily set
  // the background to transparent so that the highlight color can show through
  function removeConflictingDescendantBackgrounds() {
    if (state.doUseOverlayForBgColor) {
      return; // Not necessary in this case, as the highlight color is over the top of descendants
    }
    if (state.savedBgColors !== null) {
      return; // Already computed
    }
    state.savedBgColors = [];
    state.picked.find('*').each(function() {
      var style = traitcache.getStyle(this),
        bgColor = style.backgroundColor,
        bgRgba,
        colorIntensity;
      if (style.backgroundImage ==='none') {
        bgRgba = colorUtil.getRgba(bgColor);
        colorIntensity = colorUtil.getPerceivedLuminance(bgColor);
        if (bgRgba.a === 1 && isCloseToHighlightColor(colorIntensity) &&
          !common.hasOwnBackgroundColor(this, style, state.styles[0])) { // If it's a unique color, we want to preserve it
          state.savedBgColors.push({ elem: this, color: inlineStyle(this).backgroundColor });
          // Needed to do this as !important because of Perkins.org theme which also used !important
          inlineStyle.override(this, ['background-color', 'transparent', 'important']);
        }
      }
    });
  }

  function getCutoutRectForPoint(x, y, expandFloatRectPixels, typeIfFloatRectShorter, typeIfFloatRectTaller) {
    var possibleFloat = common.elementFromPoint(x, y),  // Get from top-left or top-right of highlight
      $picked = state.picked;
    if (possibleFloat && possibleFloat !== $picked[0]) {
      var $pickedAncestors = $picked.parents(),
        $possibleFloatAncestors = $(possibleFloat).parents();
      if ($pickedAncestors.is(possibleFloat)) {
        // TODO commenting out second part cells in boxes at
        // http://venturebeat.com/2014/10/01/after-raising-50m-reddit-forces-remote-workers-to-relocate-to-sf-or-get-fired/
        // If potential float is ancestor of picked don't use it.
        // However, the picked element could be an ancestor of the float, and we still need to use it.
        // Example: http://thebillfold.com/2014/09/need-an-action-figure-of-a-dead-loved-one-meet-jeff-staab/
        return;
      }
      var commonAncestor = $possibleFloatAncestors.is($picked) ? $picked : $(possibleFloat).closest($pickedAncestors);
      if (isDifferentZIndex(possibleFloat, $picked[0], commonAncestor)) {
        return; // Don't draw highlight around an item that is going over or under the highlight
      }
      while (commonAncestor[0] !== possibleFloat && !$(possibleFloat).is('body,html')) {
        if (traitcache.getStyleProp(possibleFloat, 'float') !== 'none') {
          var floatRect = mhpos.getRect(possibleFloat),
            mhRect = state.fixedContentRect,
            extra = getExtraPixels();
          if (!floatRect) {
            return;
          }
          floatRect = roundRectCoordinates(floatRect);
          var results = {};
          if (floatRect.left > mhRect.left - extra && floatRect.right <= mhRect.right + extra &&
            floatRect.top >= mhRect.top - extra && floatRect.bottom <= mhRect.bottom + extra) {
            // Completely inside highlight rect -- don't bother
            if (mhRect.bottom === floatRect.bottom) {
              // Float is taller than the rect
              // and we likely need to bottom-right or bottom-left cut out.
              // If the float is to the right, we will be cutting out the bottom-left, and
              // if the float is to the left, we will be cutting out the bottom-right!!!
              // We can compute this by comparing the bottom if the highlight rect
              // with and without floats included. If the highlight rect would be taller
              // when floats are included, then we will make a bottom cutout next to the bottom of the float,
              // on the other side of the highlight.
              var mhRectWithoutFloats = mhpos.getRect($picked, true) || mhRect,
                top = mhRectWithoutFloats.bottom + expandFloatRectPixels,
                cutoutRect;

              if (top > mhRect.bottom - extra) {
                return; // Not a significant cutout
              }

              cutoutRect = {
                  top: top,
                  left: -9999,
                  bottom: 9999,
                  right: 9999
                };

              if (typeIfFloatRectTaller === 'botRight') {
                cutoutRect.left = floatRect.right + expandFloatRectPixels;
              }
              else {
                cutoutRect.right = floatRect.left - expandFloatRectPixels;
              }
              cutoutRect.height = cutoutRect.bottom - cutoutRect.top;
              cutoutRect.width = cutoutRect.right - cutoutRect.left;
              results[typeIfFloatRectTaller] = cutoutRect;
            }
          }
          else {
            // float is shorter than highlight rect
            results[typeIfFloatRectShorter] = geo.expandOrContractRect(floatRect, expandFloatRectPixels);
          }
          return results;
        }
        possibleFloat = possibleFloat.parentNode;
      }
    }
  }

  // Get rects of cutouts caused fy floats intersecting with the original highlight rect.
  function getCutoutRects() {
    var EXTRA = 7, // Make sure we test a point inside where the float would be, not on a margin
      EXPAND_FLOAT_RECT = 7,
      mhRect = state.fixedContentRect,
      left = mhRect.left,
      right = mhRect.left + mhRect.width,
      top = mhRect.top,
      // If there's a left float, rect1 will be top-left, unless the float is taller than
      // everything else in the highlight, and then it will be bot-right
      rect1 = getCutoutRectForPoint(left + EXTRA, top + EXTRA, EXPAND_FLOAT_RECT, 'topLeft', 'botRight'),
      // If there's a right float, rect2 will be top-right, unless the float is taller than
      // everything else in the highlight, and then it will be bot-left
      rect2 = getCutoutRectForPoint(right - EXTRA, top + EXTRA, EXPAND_FLOAT_RECT, 'topRight', 'botLeft');

    return $.extend( {}, rect1, rect2);
  }

  function extendAll(array, newProps) {
    for (var index = 0; index < array.length; index ++ ) {
      array[index] = $.extend(array[index], newProps);
    }
    return array;
  }

  function getPolygonPoints(orig) {
    // Build points for highlight polygon
    var
      // Shortcuts
      topLeftCutout = state.cutoutRects.topLeft,
      topRightCutout = state.cutoutRects.topRight,
      botLeftCutout = state.cutoutRects.botLeft,
      botRightCutout = state.cutoutRects.botRight,
      // List of points for each corner
      // We start out with one point, but if a cutout intersects, we will end up with 3 points for that corner
      topLeftPoints = [{x: orig.left, y: orig.top }],
      topRightPoints = [{x: orig.right, y: orig.top }],
      botRightPoints =  [{ x: orig.right, y: orig.bottom }],
      botLeftPoints = [{ x: orig.left, y: orig.bottom }],
      mhRect = state.fixedContentRect;

    if (topLeftCutout) {
      if (!geo.isPointInRect(topLeftCutout.right, topLeftCutout.bottom, mhRect)) {
        if (topLeftCutout.right > orig.left &&
          topLeftCutout.bottom > orig.bottom) {  // Sanity check
          topLeftPoints[0].x = topLeftCutout.right;
          botLeftPoints[0].x = topLeftCutout.right;
        }
      }
      else {
        // Draw around top-left float
        topLeftPoints = [
          { x: orig.left, y: topLeftCutout.bottom },
          { x: topLeftCutout.right, y: topLeftCutout.bottom },
          { x: topLeftCutout.right, y: orig.top}
        ];
      }
    }

    if (topRightCutout) {
      if (!geo.isPointInRect(topRightCutout.left, topRightCutout.bottom, mhRect)) {
        if (topRightCutout.left < orig.right &&
          topRightCutout.bottom > orig.bottom) { // Sanity check
          topRightPoints[0].x = topRightCutout.left;
          botRightPoints[0].x = topRightCutout.left;
        }
      }
      else
      {
        // Draw around top-right float
        topRightPoints = [
          { x: topRightCutout.left, y: orig.top },
          { x: topRightCutout.left, y: topRightCutout.bottom },
          { x: orig.right, y: topRightCutout.bottom }
        ];
      }
    }

    if (botRightCutout) {
      botRightPoints = [
        { x: orig.right, y: botRightCutout.top },
        { x: botRightCutout.left, y: botRightCutout.top },
        { x: botRightCutout.left, y: orig.bottom }
      ];
    }

    if (botLeftCutout) {
      botLeftPoints  = [
        { x: botLeftCutout.right, y: orig.bottom },
        { x: botLeftCutout.right, y: botLeftCutout.top },
        { x: orig.left, y: botLeftCutout.top }
      ];
    }
    // growX and growY are set to 1 or -1, depending on which direction coordinates should move when polygon grows
    extendAll(topLeftPoints, { growX: -1, growY: -1 });
    extendAll(topRightPoints, { growX: 1, growY: -1 });
    extendAll(botRightPoints, { growX: 1, growY: 1 });
    extendAll(botLeftPoints, { growX: -1, growY: 1 });

    return topLeftPoints.concat(topRightPoints, botRightPoints, botLeftPoints);
  }

  function getExpandedPath(points, delta) {
    var newPath = [];
    for (var index = 0; index < points.length; index ++) {
      newPath.push({
        x: roundCoordinate(points[index].x + points[index].growX * delta),
        y: roundCoordinate(points[index].y + points[index].growY * delta),
        growX: points[index].growX,
        growY: points[index].growY
      });
    }
    return newPath;
  }

  // Scale and move a path
  function getAdjustedPath(origPath, offsetX, offsetY, extra, divisor) {
    var newPath = [];
    $.each(origPath, function() {
      newPath.push($.extend({}, this, {
        x: (this.x - offsetX) / divisor + extra,
        y: (this.y - offsetY) / divisor + extra
      }));
    });
    return newPath;
  }

  function getSVGStyle(strokeWidth, strokeColor, fillColor) {
    return ' style="' +
        'pointer-events:none;' +
        'stroke-width: ' + strokeWidth + ';' +
        (strokeWidth ? 'stroke: ' + strokeColor + ';' : '') +
        'fill: ' + (fillColor ? fillColor : 'none' ) + '"';
  }

  function getSVGForPath(points, strokeWidth, strokeColor, fillColor, radius) {
    var svgBuilder = '<path d="';
    var count = 0;
    do {
      // Start of vertical line (except for first time)
      var vertCornerDir = (count === 0) ? 1 : (points[count].y > points[count-1].y) ? -1 : 1;
      var horzCornerDir = (points[(count + 1) % points.length].x > points[count].x) ? 1 : -1;
      svgBuilder += (count ? 'L ' : 'M ') +  // Horizontal line to start of next curve
        (points[count].x) + ' ' + (points[count].y + radius * vertCornerDir) + ' ';
      svgBuilder += 'Q ' +  // Curved corner
        points[count].x + ' ' + points[count].y + ' ' +    // Control point
        (points[count].x + radius * horzCornerDir) + ' ' + points[count].y + ' ';
      ++ count;

      // Start of horizontal line
      vertCornerDir = (points[(count + 1) % points.length].y > points[count].y) ? 1 : -1;
      horzCornerDir = (points[count].x > points[count-1].x) ? -1 : 1;
      svgBuilder += 'L ' + // Vertical line to start of next curve
        (points[count].x + radius * horzCornerDir) + ' ' + points[count].y + ' ';
      svgBuilder += 'Q ' +  // Curved corner
        points[count].x + ' ' + points[count].y + ' ' +   // Control point
        points[count].x + ' ' + (points[count].y + radius * vertCornerDir) + ' ';
      ++count;
    }
    while (count < points.length);

    svgBuilder += ' Z"' + getSVGStyle(strokeWidth, strokeColor, fillColor) + '/>';

    return svgBuilder;
  }

  function getSVGFillRectMarkup(left, top, width, height, fillColor) {
    var zoom = state.zoom;
    return '<rect x="' + (left/zoom)  + '" y="' + (top/zoom) + '"  width="' + (width/zoom)  + '" height="' + (height/zoom)  + '"' +
      getSVGStyle(0, 0, fillColor) + '/>';
  }


  function isPossibleBullet() {
    var style = state.styles[0];
    return style.listStyleType !== 'none' || style.listStyleImage !== 'none';
  }

  function getExtraPaddingColor() {
    if (SC_DEV && isColorDebuggingOn) {
      return 'rgba(255, 96, 0, .4)';
    }
    return getTransparentBackgroundColor();
  }

  // For areas such as list bullet area, when it is inside margin instead of element bounds, and thus couldn't be covered with bg image
  function getSVGForExtraPadding(extra) {

    var highlightBgScreenRect = state.fixedContentRect, // Scaled by zoom
      svg = '',
      paddingColor = getExtraPaddingColor(),
      elementRect = roundRectCoordinates(state.picked[0].getBoundingClientRect()),
      REMOVE_GAPS_FUDGE_FACTOR = 0,
      extraLeft = elementRect.left - highlightBgScreenRect.left,
      extraRight = highlightBgScreenRect.right - elementRect.right,
      bgOffsetTop = Math.max(0, state.fixedContentRect.top - state.elementRect.top),
      // Don't be fooled by bottom-right cutouts
      extraTop = Math.max(0, elementRect.top - highlightBgScreenRect.top),
      extraBottom = Math.max(0, highlightBgScreenRect.bottom - elementRect.bottom),
      paddingWidth = highlightBgScreenRect.width,
      paddingHeight = highlightBgScreenRect.height - extraBottom,
      topOffset,
      useColor;

    if (extraLeft > 0) {
      topOffset = state.cutoutRects.topLeft ? state.cutoutRects.topLeft.height : extraTop; // Top-left area where the highlight is not shown
      useColor = isPossibleBullet() ? getTransparentBackgroundColor() : paddingColor; // Don't hide bullets
      if (paddingHeight > topOffset) {
        svg += getSVGFillRectMarkup(extra, topOffset + extra, extraLeft + REMOVE_GAPS_FUDGE_FACTOR, paddingHeight - topOffset, useColor);
      }
    }
    if (extraRight > 0) {
      topOffset = state.cutoutRects.topRight ? state.cutoutRects.topRight.height : extraTop; // Top-right area where the highlight is not shown
      if (paddingHeight > topOffset) {
        svg += getSVGFillRectMarkup(elementRect.width + extra + extraLeft - REMOVE_GAPS_FUDGE_FACTOR, topOffset + extra, extraRight + REMOVE_GAPS_FUDGE_FACTOR,
            paddingHeight - topOffset, paddingColor);
      }
    }
    if (extraTop > 0) {
      var leftCutoutWidth = state.cutoutRects.topLeft ? state.cutoutRects.topLeft.width: 0;
      var widthForTop = paddingWidth;
      if (state.cutoutRects.topRight) {
        widthForTop = state.cutoutRects.topRight.left - elementRect.left;
      }
      widthForTop -= leftCutoutWidth;
      svg += getSVGFillRectMarkup(leftCutoutWidth + extra, extra, widthForTop, extraTop + REMOVE_GAPS_FUDGE_FACTOR, paddingColor);
    }
    if (extraBottom > 0 && !state.cutoutRects.botLeft && !state.cutoutRects.botRight) {
      svg += getSVGFillRectMarkup(extra, elementRect.height + extraTop + extra - bgOffsetTop - REMOVE_GAPS_FUDGE_FACTOR, paddingWidth,
          extraBottom + REMOVE_GAPS_FUDGE_FACTOR, paddingColor);
    }
    return svg;
  }

  // TODO Make this robust -- what if the page itself is putting in a transform?
  function getZoom(overlayContainerElem) {
    var isFixed = traitcache.getStyleProp(overlayContainerElem, 'position') === 'fixed';

    if (isFixed) {
      var elemTransform = inlineStyle(overlayContainerElem)[platform.transformProperty],
        scaleSplit = elemTransform.split('scale(');
      return parseFloat(scaleSplit[1]) || 1;
    }

    // Not a fixed element, so use the current zoom level on the body
    return zoomMod.getCompletedZoom();
  }

  function getOverlayRect() {
    var mainFixedRect = state.fixedContentRect,
      overlayRect = {
        left: 0,
        top: 0,
        width: mainFixedRect.width / state.zoom,
        height: mainFixedRect.height / state.zoom
      },
      offsetRect;
    if (state.overlayContainer === document.body) {
      var $measureDiv = $('<sc>').appendTo(document.body).css({
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          position: 'absolute',
          display: 'block'
        }),
        // For some reason using the <body> works better in FF version <= 32
        offsetElement = $measureDiv[0];
      offsetRect = offsetElement.getBoundingClientRect();
      $measureDiv.remove();
    }
    else {
      offsetRect = state.overlayContainer.getBoundingClientRect();
      var containerStyle = traitcache.getStyle(state.overlayContainer),
        borderTop = parseFloat(containerStyle.borderTopWidth || 0),
        borderLeft = parseFloat(containerStyle.borderLeftWidth || 0);
      overlayRect.left = state.overlayContainer.scrollLeft - borderLeft;
      overlayRect.top = state.overlayContainer.scrollTop - borderTop;
    }

    overlayRect.left += (mainFixedRect.left - offsetRect.left) / state.zoom;
    overlayRect.top += (mainFixedRect.top - offsetRect.top) / state.zoom;
    overlayRect.right = overlayRect.left + overlayRect.width;
    overlayRect.bottom = overlayRect.top + overlayRect.height;
    return roundRectCoordinates(overlayRect);
  }

  function getBestOverlayContainer() {

    var
      numAncestors = state.styles.length,
      ancestor = state.picked[0],
      ancestorStyle,
      index = 0;

    function hasVerticalOverflow() {
      var scrollHeight = ancestor.scrollHeight - EXTRA_PADDING_PIXELS;
      if (scrollHeight > ancestor.offsetHeight) {
        return true; // Container is directly scrollable
      }
      if (ancestor.parentElement !== document.body &&
        ancestorStyle.position !== 'static' && traitcache.getStyleProp(ancestor.parentElement, 'overflowY')!== 'visible' &&
        scrollHeight > ancestor.parentElement.offsetHeight) {
        return true; // Container is vertically positioned within smaller parent
      }
    }

    while (++ index < numAncestors - 1) {
      ancestor = ancestor.parentElement;
      ancestorStyle = state.styles[index];
      if (ancestorStyle.position === 'fixed') {
        return ancestor;  // fixed elements have their own zoom and panning
      }
      if (ancestorStyle.position === 'absolute' && hasVerticalOverflow()) {
        return ancestor;
      }
      // Don't tie to horizontal scroll -- these tend to not scrolled via
      // scrollbars, etc. but rather by visible buttons in the interface, and they are often a red herring,
      // causing us to put the highlight in a container where the top or bottom will get clipped.
      // Therefore, we require containers to be vertically scrollable before we tie the highlight overlay to them,
      // after all users know how to vertically scroll with a scrollwheel etc. but they don't know how to horizontally scroll
//        if (ancestorStyle.overflowX !== 'visible') {  // Use if horizontally scrollable
//          var scrollWidth = ancestor.scrollWidth - EXTRA_PADDING_PIXELS;
//          // Either this container scrolls directly or is positioned within a smaller parent
//          if (scrollWidth > ancestor.offsetWidth || scrollWidth > ancestor.parentElement.offsetWidth) {
//            if (SC_DEV) { console.log('Highlight overlay container - h-scroll: %o', ancestor); }
//            return ancestor;
//          }
//        }
      if (ancestorStyle.overflowY !== 'visible') {  // use if vertically scrollable
        // Either this container scrolls directly or is positioned within a smaller parent
        if (hasVerticalOverflow()) {
          if (SC_DEV) { console.log('Highlight overlay container - v-scroll: %o', ancestor); }
          return ancestor;
        }
      }
    }
    return document.body;
  }

  function getAbsoluteRect() {
    var rect = $.extend({}, state.fixedContentRect),
      viewPos = traitcache.getCachedViewPosition();
    // Next subtract the current scroll position
    rect.left += viewPos.x;
    rect.right += viewPos.x;
    rect.top += viewPos.y;
    rect.bottom += viewPos.x;
    return rect;
  }

    // Update highlight overlay
  // @return falsey if no valid overlay can be created
  function computeOverlay() {

    var element,
        elementRect,
        stretchForSprites = true;

    if (!state.picked) {
      return;
    }

    element = state.picked[0];
    elementRect = element.getBoundingClientRect(); // Rough bounds
    state.overlayContainer = getBestOverlayContainer();
    state.zoom = getZoom(state.overlayContainer);

    // Get exact bounds
    var mhPositionInfo = mhpos.getHighlightPositionInfo(element, 0, stretchForSprites),
      fixedRects = mhPositionInfo.allRects;
    state.hiddenElements = mhPositionInfo.hiddenElements;
    geo.expandOrContractRects(fixedRects, EXTRA_PIXELS_TO_PRESERVE_LETTERS);

    if (!fixedRects.length || !isCursorInHighlightShape(fixedRects, getCutoutRectsArray())) {
      // No valid highlighted content rectangles or cursor not inside of them
      return;
    }

    mhpos.combineIntersectingRects(fixedRects, 99999); // Merge all boxes
    var mainFixedRect = fixedRects[0]; // For now just use 1
    state.fixedContentRect = roundRectCoordinates(mainFixedRect);

    state.elementRect = roundRectCoordinates(elementRect);
    state.highlightBorderWidth = roundBorderWidth(getHighlightBorderWidth() / state.zoom);
    state.highlightBorderColor = getHighlightBorderColor();
    state.highlightPaddingWidth = roundBorderWidth(EXTRA_PADDING_PIXELS);
    var extra = getExtraPixels();

    state.cutoutRects = getCutoutRects();
    var basePolygonPath = getPolygonPoints(state.fixedContentRect);
    // Get the path for the overlay so that the top-left corner is located at 0,0
    var adjustedPath = getAdjustedPath(basePolygonPath, state.fixedContentRect.left,
        state.fixedContentRect.top, extra, state.zoom);
    state.pathFillBackground = basePolygonPath; // Helps fill gaps
    state.pathFillPadding = getExpandedPath(adjustedPath, state.highlightPaddingWidth / 2);
    state.pathBorder = getExpandedPath(state.pathFillPadding, state.highlightPaddingWidth /2 + state.highlightBorderWidth /2 );
    roundPolygonCoordinates(state.pathFillBackground);
    roundPolygonCoordinates(state.pathBorder);
    roundPolygonCoordinates(state.pathFillBackground);

    state.isCreated = true;

    state.overlayRect = getOverlayRect();
    state.absoluteRect = getAbsoluteRect();

    return true;
  }

  function insertOverlay(svg) {
    var
      extra = getExtraPixels(),
      width = roundCoordinate(state.fixedContentRect.width / state.zoom + 2 * extra + 1),  // Extra pixel ensures right side not cut off
      height = roundCoordinate(state.fixedContentRect.height / state.zoom + 2 * extra + 1),  // Extra pixel ensures bottom not cut off
      left = state.overlayRect.left - extra,
      top = state.overlayRect.top - extra,
      zIndex = getMaxZIndex(state.styles);
    if (state.overlayContainer === document.body) {
      // Body uses fast approach
      // A last child of the <body> is unlikely to mess with scripts
      appendOverlayElement(svg, left, top, width, height, zIndex);
    }
    else {
      // Updating the stylesheet is visibly slower on complex pages such as nytimes.com
      // So, while cleaner, it's only used if we're inserting in the middle of the document
      // where we're likely to mess something up
      updateStyleSheet(svg, left, top, width, height, zIndex);
      // Now we set the attribute (don't do it before updating the stylesheet,
      // otherwise we end up with 2 style reflows, one based on the old stylesheet contents
      // which is still around)
      state.overlayContainer.setAttribute(HIGHLIGHT_OUTLINE_ATTR, '');
    }
  }

  // Inserting actual <svg> element is faster but more obtrusive than updating
  // stylesheet to use :after. For now we only do this when the overlay parent will be <body>.
  function appendOverlayElement(svg, left, top, width, height, zIndex) {
    var svgFragment = common.createSVGFragment(svg, HIGHLIGHT_OUTLINE_CLASS);
    state.overlayContainer.appendChild(svgFragment);
    $('.' + HIGHLIGHT_OUTLINE_CLASS).attr({
      width: width + 'px',
      height: height + 'px',
      'data-sc-reversible': false
    }).css({
      position: 'absolute',
      left: left + 'px',
      top: top + 'px',
      zIndex: zIndex,
      pointerEvents: 'none'
    });

  }

  function updateStyleSheet(svg, left, top, width, height, zIndex) {
    var
      svgUri = getSVGDataURI(svg, width, height),
      LINE_ENDING = ' !important;\n',
      doSetPositionRelative = traitcache.getStyle(state.overlayContainer).position === 'static',
      styleSheetText =
        '[' + HIGHLIGHT_OUTLINE_ATTR + ']:after {\n' +
        'content:' + svgUri + LINE_ENDING +
        'display:block' + LINE_ENDING +
        'visibility:visible' + LINE_ENDING +
        'position:absolute' + LINE_ENDING +
        'pointer-events:none' + LINE_ENDING +
        'left:' + left + 'px' + LINE_ENDING +
        'top:' + top + 'px' + LINE_ENDING +
        'width:' + width + 'px' + LINE_ENDING +
        'height:' + height + 'px' + LINE_ENDING +
        'overflow:hidden' + LINE_ENDING +
        'z-index:' + zIndex + LINE_ENDING +
    '}\n';

    if (doSetPositionRelative) {
      // Make sure child pseudo element is positioned relative to the parent
      // (We can't use position relative on the :after element because it will take up space in the layout)
      // We only need to do this when the parent doesn't already have a non-static position.
      styleSheetText +=
        '[' + HIGHLIGHT_OUTLINE_ATTR + '] {\n' +
        'position:relative' + LINE_ENDING +
        'top:0' + LINE_ENDING +
        'left:0' + LINE_ENDING +
        '}';
    }

    if (!$highlightStyleSheet) {
      $highlightStyleSheet = $('<style>').appendTo('head')
        .attr('id', HIGHLIGHT_STYLESHEET_NAME);
    }
    $highlightStyleSheet.text(styleSheetText);
  }

  function appendOverlayPathViaSVG() {

    // SVG overlays are supported
    // outlineFillColor:
    //   If the outline used used for the bg color and a bg color is being used at all
    var overlayBgColor = state.doUseOverlayForBgColor ? state.bgColor : null,
      // paddingColor:
      //   If overlay is used for fill color, we will put the fill in that, and don't need any padding color
      //   Otherwise, the we need the padding to bridge the gap between the background (clipped by the element) and the outline
      truePaddingColor = state.doUseOverlayForBgColor ? '' : (isPossibleBullet() ? getTransparentBackgroundColor() : state.bgColor),
      paddingColor = (SC_DEV && isColorDebuggingOn) ? 'rgba(0, 255, 0, .4)' : truePaddingColor,
      paddingSVG = paddingColor ? getSVGForPath(state.pathFillPadding, state.highlightPaddingWidth, paddingColor, null, 1) : '',
      outlineSVG = getSVGForPath(state.pathBorder, state.highlightBorderWidth, state.highlightBorderColor,
        overlayBgColor, 3),
      // Extra padding: when there is a need for extra padding and the outline is farther away from the highlight
      // rectangle. For example, if there are list bullet items inside the padding area, this extra space needs to be filled
      extra = getExtraPixels(),
      extraPaddingSVG = paddingColor ? getSVGForExtraPadding(extra * state.zoom) : '',
      svg = outlineSVG + paddingSVG + extraPaddingSVG;

    insertOverlay(svg);
  }

  function shouldAvoidBackgroundImage(picked) {
    // Don't highlight buttons, etc. because it ruins their native appearance
    // Fix highlighting on <tr> in WebKit by using overlay for highlight color
    // See https://bugs.webkit.org/show_bug.cgi?id=9268
    function isNativeFormControl() {
      // Return true for form controls that use a native appearance
      return picked.is('input[type="button"],input[type="reset"],input[type="submit"],button,input[type="checkbox"],input[type="radio"],input[type="color"],select[size="1"],select:not([size])');
    }
    return isNativeFormControl() || (picked.is('tr') && platform.browser.isWebKit);
  }

  // Number of pixels any edge will go beyond the fixedContentRect -- the highlight's border and padding
  function getExtraPixels() {
    return roundCoordinate(state.highlightPaddingWidth + state.highlightBorderWidth);
  }

  function correctHighlightScreenRects() {

    if (!state.isCreated) {
      return;
    }

    var newRect = roundRectCoordinates(state.picked[0].getBoundingClientRect()),
      oldRect = state.elementRect,
      xDiff = newRect.left - oldRect.left,
      yDiff = newRect.top - oldRect.top;

    if (!xDiff && !yDiff) {
      return;
    }

    function correctRect(rect) {
      if (!rect) {
        return;
      }
      rect.left += xDiff;
      rect.right += xDiff;
      rect.top += yDiff;
      rect.bottom += yDiff;
    }

    // -- Fixed rects --
    // These rects are in screen coordinates and must always be updated
    state.elementRect = newRect;
    correctRect(state.fixedContentRect);
    correctRect(state.cutoutRects.topLeft);
    correctRect(state.cutoutRects.topRight);
    correctRect(state.cutoutRects.botLeft);
    correctRect(state.cutoutRects.botRight);

    if (SC_DEV && isHighlightRectDebuggingOn) {
      updateDebugRect();
    }
  }

  function addMouseWheelListener() {
    // If the highlight is visible and there is a scrollable container, add mousewheel listener for
    // smooth highlight position updates as scrolling occurs.

    // The mousewheel event is better than the scroll event because we can add it in one place (on document) and it bubbles.
    // It also updates for each scroll change, rather than waiting until the scrolling stops.

    // IMPORTANT: add this only in situations when there is an active highlight
    // because listening to mousewheel can cause bad performance.

    if (!isTrackingWheelEvents) {
      domEvents.on(document, 'wheel', correctHighlightScreenRects);
      isTrackingWheelEvents = true;
    }
    traitcache.updateCachedViewPosition();
  }

  function removeMouseWheelListener() {
    if (isTrackingWheelEvents) {
      domEvents.off(document, 'wheel', correctHighlightScreenRects);
      isTrackingWheelEvents = false;
    }
  }


  function isScrollEvent(event) {
    return cursorPos &&
      event.screenX === cursorPos.screenX && event.screenY === cursorPos.screenY;
  }

  // Used for performance shortcut -- if still inside same highlight
  function isExistingHighlightRelevant() {
    if (!state.isCreated) {
      return false;
    }
    // Return true we're inside in the existing highlight
    return isCursorInHighlightShape([state.fixedContentRect], getCutoutRectsArray());
  }

  function onMouseMove(event) {
    if (SC_DEV) {
      if (isSticky && !event.shiftKey) {
        return;
      }
    }

    pickFromMouseAfterDelay(event);
  }

  function updateDebugRect() {
    $('#sc-debug-mh-rect').remove();
    if (!state.isCreated) {
      return;
    }
    $('<sc id="sc-debug-mh-rect">')
      .appendTo(document.documentElement)
      .css({
        top: state.fixedContentRect.top + 'px',
        left: state.fixedContentRect.left + 'px',
        width: state.fixedContentRect.width + 'px',
        height: state.fixedContentRect.height + 'px',
        position: 'fixed',
        pointerEvents: 'none',
        outline: '2px solid rgba(150,0,0,.5)'
      });
 }

  // We run the picker if the mouse position hasn't changed for a while, meaning
  // that the mouse has paused over content
  function pickFromMouseAfterDelay(event) {
    clearTimeout(pickFromMouseTimer);

    var wasScrollEvent = isScrollEvent(event);

    // Are we responding to scroll events?
    if (!willRespondToScroll) {
      if (wasScrollEvent) {
        return;
      }
      willRespondToScroll = true; // A real mouse move -- now we will respond to scrolls
    }

    if (!isAppropriateFocus) {
      return;
    }

    if (state.isCreated && cursorPos && cursorPos.doCheckCursorInHighlight) {
      // We have an old highlight and mouse moved.
      // What to do about the old highlight? Keep or hide? Depends on whether mouse is still in it
      if (!cursorPos || isScrollEvent(event)) {
        cursorPos = getCursorPos(event);
      }
      else {
        // No need to recalculate scroll position -- it stayed the same
        cursorPos = getCursorPos(event, cursorPos.pageXOffset, cursorPos.pageYOffset);
      }

      if (isExistingHighlightRelevant()) {
        if (SC_DEV && isHighlightRectDebuggingOn) {
          updateDebugRect();
        }
        return; // No highlighting || highlight is already good -- nothing to do
      }
      // Highlight was inappropriate -- cursor wasn't in it
      hide();
    }

    pickFromMouseTimer = nativeFn.setTimeout(function () {
      // In case doesn't move after fast velocity, check in a moment and update highlight if no movement
      pickFromMouseTimer = 0;
      pickFromMouse(event);
      if (SC_DEV && isHighlightRectDebuggingOn) {
        updateDebugRect();
      }
    }, wasScrollEvent ? SCROLL_STOP_MS : MOUSE_STOP_MS);
  }

  function pickFromMouse(event) {
    var target = event.target,
        picked;

    cursorPos = getCursorPos(event);

    // save picked element
    picked = picker.find(target);

    if (!picked) {
      if (state.picked) {
        hide();  // Nothing picked anymore
      }
      state.target = target;
      return;
    }

    hide();

    state.picked = $(picked);
    state.target = target;

    if (event.shiftKey && isOnlyShift) {
      // When shift held down, emit command to speak the newly highlighted text
      require(['page/keys/commands'], function(commands) {
        commands.speakHighlight();
      });
    }

    updateView();
  }

  // refreshEventListeners turns on or off event listeners that enable the highlighter
  // return true if highlight visibility should be restored
  function refreshEventListeners(doForceOff) {
    // The mouse highlight is always enabled when TTS is on or zoom > MIN_ZOOM
    var doTrackMouse = isSitecuesOn && !doForceOff;

    if (doTrackMouse === isTrackingMouse) {
      return isTrackingMouse;
    }
    isTrackingMouse = doTrackMouse;

    var addOrRemoveFn = isTrackingMouse ? domEvents.on : domEvents.off;
    addOrRemoveFn(document, 'mousemove', onMouseMove);
    if (platform.browser.isFirefox) {
      // Mitigate lack of mousemove events when scroll finishes
      addOrRemoveFn(document, 'mouseover', onMouseMove);
    }

    addOrRemoveFn(document, 'focusin', testFocus);
    addOrRemoveFn(document, 'focusout', testFocus);
    addOrRemoveFn(window, 'focus', onFocusWindow);
    addOrRemoveFn(window, 'blur', onBlur);
    addOrRemoveFn(window, 'resize', hide);

    if (!isTrackingMouse) {
      removeMouseWheelListener();
    }

    return isTrackingMouse;
  }

  function getCursorPos(event, scrollX, scrollY) {
    return {
      x: event.clientX,
      y: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      scrollX: typeof scrollX === 'number' ? scrollX : window.pageXOffset,
      scrollY: typeof scrollY === 'number' ? scrollY : window.pageYOffset,
      doCheckCursorInHighlight: true
    };
  }

  // Reenable highlight if appropriate
  // Clear the existing highlight if we don't reenable or if highlight can't be shown
  // (e.g. because focus is not in the right place, or the mouse cursor isn't inside the highlight)
  // Mouse event is passed if available.
  function resumeAppropriately(mouseEvent) {
    if (refreshEventListeners()) {
      // Don't do cursor-inside-picked-content check, because it may not be after zoom change
      if (mouseEvent) {
        cursorPos = getCursorPos(mouseEvent);
      }
      if (updateView()) {
        return;  // Highlight is appropriate and visible
      }
    }

    hide();
  }

  function onSpeechChanged() {
    if (!refreshEventListeners()) {
      hide(true);
    }
  }

  function isWindowActive() {
    return platform.browser.isSafari ? isWindowFocused : document.hasFocus();
  }

  function testFocus() {
    var wasAppropriateFocus = isAppropriateFocus;
    // don't show highlight if current active isn't body
    var target = document.activeElement;
    isAppropriateFocus = isBPOpen || (!target || !elementClassifier.isSpacebarConsumer(target)) && isWindowActive();
    if (!isSticky) {
      if (wasAppropriateFocus && !isAppropriateFocus) {
        hide();
      }
      else if (!wasAppropriateFocus && isAppropriateFocus) {
        resumeAppropriately();
      }
    }
  }

  function willExpand() {
    isBPOpen = true;
    testFocus();
  }

  function didShrink() {
    isBPOpen = false;
    testFocus();
  }

  function onFocusWindow() {
    isWindowFocused = true;
    testFocus();
  }

  function onBlur(event) {
    if (event.target !== window) {
      return;
    }
    isWindowFocused = false;
    isAppropriateFocus = false;
    // When the user blurs (unfocuses) the window, we should
    // hide and forget the highlight (unless sticky highlight is on)
    if (!isSticky) {
      hide();
    }
  }

  // When the user mouses out of the window, we should
  // hide and forget the highlight (unless sticky highlight is on)
  function onLeaveWindow(evt) {
    function isRealLeaveEvent(evt) {
      // Browsers firing spurious mouseout events when mouse moves over highlight edge
      // This check seems to work to see if the user really exited the window
      // Note, for mouseout events, relatedTarget is the event targt the pointing device exited to
      return !evt.relatedTarget || evt.relatedTarget === document.documentElement;
    }
    if (isRealLeaveEvent(evt) && !isSticky) {
      hide();
    }
  }

  // pause() -- temporarily hide mouse highlight
  // and remove event listeners so that we don't update the highlight on mouse move
  // (until they're enabled again, via resume())
  function pause() {
    hide(true);
    refreshEventListeners(true);
  }

  function tryExistingHighlight() {
    var REQUIRED_RATIO_HIGHLIGHT_ONSCREEN = 0.5,
      prevHighlightRect = state.absoluteRect;
    if (!prevHighlightRect) {
      return;
    }
    var scrollX = window.pageXOffset,
      scrollY = window.pageYOffset,
      screenWidth = window.innerWidth,
      screenHeight = window.innerHeight,
      left = Math.max(prevHighlightRect.left, scrollX),
      right = Math.min(prevHighlightRect.right, scrollX + screenWidth),
      top = Math.max(prevHighlightRect.top, scrollY),
      bottom = Math.min(prevHighlightRect.bottom, scrollY + screenHeight),
      onScreenWidth = right - left,
      onScreenHeight = bottom - top,
      onScreenHighlightArea = onScreenWidth * onScreenHeight,
      totalHighlightArea = prevHighlightRect.width * prevHighlightRect.height,
      visibleRatio = onScreenHighlightArea / totalHighlightArea;

    if (visibleRatio < REQUIRED_RATIO_HIGHLIGHT_ONSCREEN) {
      return;  // Not enough of highlight is onscreen
    }

    return updateView();
  }

  function autoPick() {
    // First try for existing hidden highlight
    // If it would still be onscreen, use it
    if (tryExistingHighlight()) {
      return;
    }

    // Retrieve some leaf nodes
    var nodeIterator = document.createNodeIterator(document.body,
      NodeFilter.SHOW_TEXT, null, false);
    var knownGoodState = state;
    var knownGoodScore = -9;
    var skipElement;
    var bodyWidth = bodyGeo.getBodyWidth();
    var bodyHeight = document.body.scrollHeight;

    traitcache.resetCache();
    var viewSize = traitcache.getCachedViewSize();

    // Get first visible text and start from there
    function isAcceptableTextLeaf(node) {
      // Logic to determine whether to accept, reject or skip node
      if (common.isWhitespaceOrPunct(node)) {
        return; // Only whitespace or punctuation
      }
      var rect = traitcache.getScreenRect(node.parentNode);
      if (rect.width === 0 || rect.height === 0 ||
        rect.top > viewSize.height || rect.left > viewSize.width ||
        rect.right < 0 || rect.bottom < 0) {
        return; // Hidden
      }

      return true;
    }

    while (true) {
      var nextLeaf = nodeIterator.nextNode(),
        containingElement;
      if (!nextLeaf) {
        break;
      }
      if (!isAcceptableTextLeaf(nextLeaf)) {
        continue;
      }
      if (skipElement && $.contains(skipElement, nextLeaf)) {
        continue; // We've already check this content
      }
      containingElement = nextLeaf.parentNode;
      if (containingElement &&
        highlight(containingElement, true, true, true)) {
        skipElement = state.picked[0]; // Don't try anything else in this container
        var scoreInfo = picker.getAutoPickScore(state.picked, state.fixedContentRect, state.absoluteRect, bodyWidth, bodyHeight),
          score = scoreInfo.score;
        if (score > knownGoodScore) {
          knownGoodState = $.extend({}, state);
          knownGoodScore = score;
        }
        if (scoreInfo.skip) {
          skipElement = scoreInfo.skip;
        }
        else if (state.fixedContentRect.bottom > window.innerHeight) {
          break;
        }
        // else try for something better
      }
    }

    highlight(knownGoodState.target, true);
  }

  // Hide mouse highlight temporarily, keep picked data so we can reshow
  // the same highlight without another mouse move.
  // It's useful to call on it's own when the cursor goes outside of the highlight
  // but stays inside the same element.
  function hide(doRememberHighlight) {
    // Now that highlight is hidden, we no longer need these
    removeEventListener('mouseout', onLeaveWindow);

    if (state.picked && state.savedCss) {
      // Restore the previous CSS on the picked elements (remove highlight bg etc.)
      inlineStyle.restore(state.picked[0], BG_PROPS);
      state.savedCss = null;
      state.savedBgColors.forEach(function (savedBg) {
        inlineStyle.restore(savedBg.elem, 'background-color');
      });
      state.savedBgColors = [];

      if (state.picked.attr('style') === '') {
        inlineStyle.clear(state.picked[0]); // Full cleanup of attribute
      }
      removeMouseWheelListener();
    }

    if (state.overlayContainer) {
      state.overlayContainer.removeAttribute(HIGHLIGHT_OUTLINE_ATTR);
    }
    $('.' + HIGHLIGHT_OUTLINE_CLASS).remove();

    if (pickFromMouseTimer) {
      clearTimeout(pickFromMouseTimer);
      pickFromMouseTimer = 0;
    }

    didToggleVisibility(false);

    if (!doRememberHighlight) {
      // Forget highlight state, unless we need to keep it around temporarily
      forget();
    }
  }

  function forget() {
    state = $.extend({}, INIT_STATE);
  }

  function setScrollTracking(isOn) {
    canTrackScroll = isOn;
    willRespondToScroll = false;
  }

  function setOnlyShift(isShift) {
    isOnlyShift = isShift;
  }

  // Return all of the highlight information provided in the |state| variable
  function getHighlight() {
    return state;
  }

  function init() {

    if (isInitialized) {
      return;
    }
    isInitialized = true;

    forget();

    // Temporarily hide and disable mouse highlight once highlight box appears. SC-1786
    // Also to this until zooming finished so that outline doesn't get out of place during zoom
    events.on('zoom/begin mh/pause', pause);

    // enable mouse highlight back once highlight box deflates or zoom finishes
    events.on('hlb/closed zoom', resumeAppropriately);

    // Turn mouse-tracking on or off
    events.on('keys/sitecues-key-down', setScrollTracking);

    // Turn mouse-tracking on or off
    events.on('key/only-shift', setOnlyShift);

    // Mouse highlighting not available while BP is open
    events.on('bp/will-expand', willExpand);
    events.on('bp/did-shrink', didShrink);

    events.on('speech/did-change', function(isOn) {
      isSpeechEnabled = isOn;
    });

    events.on('sitecues/did-toggle', function(isOn) {
      isSitecuesOn = isOn;
      refreshEventListeners();
    });

    // Darken highlight appearance when speech is enabled
    conf.get('ttsOn', onSpeechChanged);

    testFocus(); // Set initial focus state
    if (document.readyState !== 'loading') {  // Focus is set again when document finishes loading
      document.addEventListener('DOMContentLoaded', testFocus);
    }

    refreshEventListeners();  // First time we initialize, highlighting should be turned on
  }

  if (SC_DEV) {
    /**
     * Toggle Sticky state of highlight
     * When stick mode is on, shift must be pressed to move highlight
     */
    sitecues.toggleStickyMH = function () {
      isSticky = !isSticky;
      return isSticky;
    };

    /**
     * Toggle color debugging which makes it easier to see where white gaps in highlight are coming from
     */
    sitecues.toggleMHColorDebugging = function () {
      isColorDebuggingOn = !isColorDebuggingOn;
      return isColorDebuggingOn;
    };

    /**
     * Toggle debugging of the current highlight rect, which needs to keep up-to-date with scrolling
     */
    sitecues.toggleMHRectDebugging = function() {
      isHighlightRectDebuggingOn = ! isHighlightRectDebuggingOn;
      return isHighlightRectDebuggingOn;
    };

    sitecues.getHighlight = getHighlight;
  }

  /**
   * Show highlight on the specified seed element or hide if if nothing specified
   * @param seed        -- desired element to highlight, or a CSS selector for one
   * @param doUsePicker -- if truthy will find the best item to highlight ... seed or an ancestor of seed
   *                       if falsey will just highlight seed exactly
   * @param doKeepHidden -- if truthy will compute highlight but not display it
   */
  function highlight(seed, doUsePicker, doSuppressVoting, doKeepHidden) {

    hide();  // calling with no arguments will remove the highlight
    if (seed) {
      var elem = $(seed)[0];
      if (elem) {
        traitcache.updateCachedViewPosition(); // Reset cache view to ensure scrolling accounted for
        state.picked = doUsePicker ? picker.find(elem, doSuppressVoting) : $(elem);
        state.target = elem;
        if (state.picked) {
          cursorPos.doCheckCursorInHighlight = false;
          cursorPos.scrollX = window.pageXOffset;
          cursorPos.scrollY = window.pageYOffset;
          if (updateView(doKeepHidden)) {
            return state.picked;
          }
        }
      }
    }
  }

  return {
    getHighlight: getHighlight,
    highlight: highlight,
    autoPick: autoPick,
    setScrollTracking: setScrollTracking,
    hide: hide,
    init: init
  };

});
