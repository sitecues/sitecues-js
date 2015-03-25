
sitecues.def('mouse-highlight', function (mh, callback) {

  'use strict';

  var

  INIT_STATE = {
    isCreated: false, // Has highlight been created
    isVisible: false,  // Is highlight visible?
    picked: null,     // JQuery for picked element(s)
    target: null,     // Mouse was last over this element
    styles: [],
    savedCSS: null,   // map of saved CSS for highlighted element
    savedBgColors: null, // map of descendant elements to saved background colors
    elementRect: null,
    fixedContentRect: null,  // Contains the smallest possible rectangle encompassing the content to be highlighted
    hiddenElements: [], // Elements whose subtrees are hidden or not part of highlight rectangle (e.g. display: none, hidden off-the-page, out-of-flow)
    // Note however, that the coordinates used are zoomed pixels (at 1.1x a zoomed pixel width is 1.1 real pixels)
    absoluteRect: null,  // Total overlay rect in absolute window coordinates in real pixels
    overlayRect: null,  // Contains the total overlay rect, in absolute body coordinates,  zoomed pixels
    cutoutRects: {}, // Object map for possible topLeft, topRight, botLeft, botRight of rectangles cut out of highlight to create L shape
    pathBorder: [], // In real pixels so that it can live outside of <body>
    pathFillPadding: [], // In real pixels outside <body>, extends CSS background beyond element
    pathFillBackground: [], // In element rect coordinates, used with CSS background
    highlightPaddingWidth: 0,
    highlightBorderWidth: 0,
    bgColor: '',    // highlight color or '' if only outline is being used (as when highlighting media element)
    doUseOverlayforBgColor: false,  // was an overlay used to create the background color? If not, CSS background will be used.
    hasDarkBackgroundColor: false,
    hasLightText: false
  },

  // class of highlight
  HIGHLIGHT_OUTLINE_CLASS = 'sitecues-highlight-outline',

  // How many ms does mouse need to stop for before we highlight?
  MOUSE_STOP_MS = 30,

  // How many ms does scrolling need to stop for before we highlight?
  SCROLL_STOP_MS = 140,

  // Color values for YIQ computations
  MID_COLOR_INTENSITY = 160,   // Don't consider the text light unless the yiq is larger than this
  VERY_DARK_COLOR_INTENSITY = 16,
  VERY_LIGHT_COLOR_INTENSITY = 240,

  // Extra border width in pixels if background is dark and light bg color is being used
  EXTRA_DARK_BG_BORDER_WIDTH = 1,

  // Extra room around highlight
  EXTRA_PIXELS_TO_PRESERVE_LETTERS = 1, // Amount of extra space computed for fixed highlight rectangles
  EXTRA_PADDING_PIXELS = 3, // Amount of space around highlighted object before to separate border

  // Border color when on dark background
  DARK_BG_BORDER_COLOR = 'rgb(65, 60, 145)',

  state,

  isTrackingMouse, // Are we currently tracking the mouse?
  canTrackScroll = true,  // Is scroll tracking allowable? Turned off during panning from keyboard navigation
  willRespondToScroll = true, // After scroll tracking is turned on, we won't respond to it until at least one normal mousemove
  isOnlyShift, // Is shift down by itself?
  isAppropriateFocus,
  isWindowFocused = document.hasFocus(),
  isSticky,
  isColorDebuggingOn,
  isHighlightRectDebuggingOn,

  pickFromMouseTimer,

  cursorPos = {};

    // depends on jquery, conf, mouse-highlight/picker and positioning modules
  sitecues.use('jquery', 'conf', 'zoom', 'mouse-highlight/picker', 'mouse-highlight/traitcache',
    'mouse-highlight/highlight-position', 'util/common',
    'audio', 'util/geo', 'platform',
    function($, conf, zoomMod, picker, traitcache, mhpos, common, audio, geo, platform) {

    // Use SVG overlays in modern browsers, because they have nice, rounded corners.
    // We don't use them in IE9/10 because pointer-events none doesn't work, so mouseouts occur
    // when a user mouses over the visual border, causing menus to close.
    var DO_SUPPORT_SVG_OVERLAY = !platform.browser.isIE || platform.browser.version >= 11,
      COORDINATE_DECIMAL_PLACES = DO_SUPPORT_SVG_OVERLAY ? 4 : 0;


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

    // Returns value 0-255: 0 = darkest, 255=lightest
    // http://en.wikipedia.org/wiki/YIQ
    function getColorIntensity(colorValue) {
      var RGBAColor = getRgba(colorValue),
        yiq = ((RGBAColor.r*299)+(RGBAColor.g*587)+(RGBAColor.b*114)) * RGBAColor.a / 1000;

      return yiq;
    }

    /**
     * Checks if the color value given of a light tone or not.
     */
    function isLightIntensity(colorValue) {
      return getColorIntensity(colorValue) > MID_COLOR_INTENSITY;
    }

    function getElementsContainingOwnText(selector) {
      var TEXT_NODE = 3;
      return $(selector).find('*').addBack().filter(function() {
        var childNodes = this.childNodes,
          numChildNodes = childNodes.length,
          index,
          testNode;
        if (this.childElementCount === numChildNodes) {
          return false; // Same number of elements as child nodes -- doesn't have it's own text nodes
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

    function hasLightText(selector) {
      var textContainers = getElementsContainingOwnText(selector),
        MAX_ELEMENTS_TO_CHECK = 100,
        containsLightText = false;

      textContainers.each(function(index) {
        if (index >= MAX_ELEMENTS_TO_CHECK) {
          return false;
        }
        var textColor = traitcache.getStyleProp(this, 'color');
        if (isLightIntensity(textColor)) {
          containsLightText = true;
          return false;
        }
      });
      return containsLightText;
    }

    /**
     * Returns an object {r: #, g: #, b: #, a: #}
     * @param colorString  A color string provided by getComputedStyle() in the form of rgb(#, #, #) or rgba(#, #, #, #)
     * @returns {rgba object}
     */
    function getRgba(colorString) {
      // In some browsers, sometimes the computed style for a color is 'transparent' instead of rgb/rgba
      if (colorString === 'transparent') {
        return {
          r: 0,
          g: 0,
          b: 0,
          a: 0
        };
      }
      var MATCH_COLORS = /rgba?\((\d+), (\d+), (\d+),?( [\d?.]+)?\)/,
        match = MATCH_COLORS.exec(colorString) || {};

      return {
        r: parseInt(match[1] || 0),
        g: parseInt(match[2] || 0),
        b: parseInt(match[3] || 0),
        a: parseFloat(match[4] || 1)
      };
    }

    function getAlpha(color) {
      return getRgba(color).a;
    }

    function isDarkTone(bgColor) {
      return !isLightIntensity(bgColor);
    }

    function hasDarkBackgroundOnAnyOf(styles) {

      for (var count = 0; count < styles.length; count ++) {
        var bgColor = styles[count].backgroundColor,
          isMostlyOpaque = getAlpha(bgColor) > 0.8;
        if (isMostlyOpaque) {
          return isDarkTone(bgColor);
        }
      }
    }

    function updateColorApproach(picked, style) {
      // Get data on backgrounds and text colors used
      state.hasDarkBackgroundColor = hasDarkBackgroundOnAnyOf(style);
      state.hasLightText = hasLightText(picked);

      // Get the approach used for highlighting
      if (DO_SUPPORT_SVG_OVERLAY &&
        (picked.length > 1 || shouldAvoidBackgroundImage(picked) || state.hasLightText)) {
        //  approach #1 -- use overlay for background color
        //                 use overlay for rounded outline
        //  pros: one single rectangle instead of potentially many
        //        works with form controls
        //        visually seamless
        //  cons: washes dark text out (does not have this problem with light text)
        //  when-to-use: for article or cases where multiple items are selected
        //               when background sprites are used, which we don't want to overwrite with out background
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
          vizFactor = (state.zoom + 0.6) * 0.9;
      if (audio.isSpeechEnabled() && vizFactor < MIN_VISIBILITY_FACTOR_WITH_TTS) {
        vizFactor = MIN_VISIBILITY_FACTOR_WITH_TTS;
      }
      return vizFactor;
    }

    function getHighlightBorderColor() {

      if (state.hasDarkBackgroundColor) {
        return DARK_BG_BORDER_COLOR;
      }

      var viz = getHighlightVisibilityFactor(),
        colorMultiplier = -80,
        color = Math.round(Math.max(0, 200 + viz * colorMultiplier));
      return 'rgb(' + color + ',' + color + ',' + (color + 30) +')';
    }

    function getHighlightBorderWidth() {
      var viz = getHighlightVisibilityFactor(),
          borderWidth = viz + .33 + (state.hasDarkBackgroundColor ? EXTRA_DARK_BG_BORDER_WIDTH : 0);
      return Math.max(1, borderWidth) * state.zoom;
    }

    function getTransparentBackgroundColor() {
      // Best to use transparent color when the background is interesting or dark, and we don't want to
      // change it drastically
      // This lightens at higher levels of zoom
      var maxViz = state.hasDarkBackgroundColor || state.hasLightText ? 1 : 9,
        viz = Math.min(getHighlightVisibilityFactor(), maxViz),
        alpha = 0.11 * viz;
      return 'rgba(240, 240, 180, ' + alpha + ')'; // Works with any background -- lightens it slightly
    }

    function getOpaqueBackgroundColor() {
      // Best to use opaque color, because inner overlay doesn't match up perfectly causing overlaps and gaps
      // It lightens at higher levels of zoom
      var viz = getHighlightVisibilityFactor(),
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
    // return true if something was shown
    function updateView(doKeepHidden) {
      // can't find any element to work with
      if (!state.picked) {
        return;
      }

      // Update state to ensure it is current
      state.zoom = zoomMod.getCompletedZoom();
      state.styles = getAncestorStyles(state.picked[0], document.documentElement);

      updateColorApproach(state.picked, state.styles);

      if (!computeOverlay(true)) {
        // Did not find visible rectangle to highlight
        return;
      }

      // Show the actual overlay
      if (!doKeepHidden) {
        show();
        return true;
      }
    }

    function show() {
      // Create and position highlight overlay
      if (DO_SUPPORT_SVG_OVERLAY) {
        appendOverlayPathViaSVG();
      }
      else {
        // Use CSS outline with 0px wide/tall elements to draw lines of outline
        // These will show on screen but will thankfully not take mouse events (pointer-events: none doesn't work in IE)
        appendOverlayPathViaCssOutline(state.pathFillPadding, state.highlightPaddingWidth, getTransparentBackgroundColor());
        appendOverlayPathViaCssOutline(state.pathBorder, state.highlightBorderWidth, getHighlightBorderColor());
      }

      // Remove conflicting backgrounds on descendants
      removeConflictingDescendantBackgrounds();

      // Position overlay just on top of the highlighted element (and underneath fixed toolbars)
      updateHighlightOverlayZIndex();

      // Position the overlays correctly so they are over the highlighted content
      updateHighlightOverlayPosition();

      // Change background image for highlighted elements if necessary
      updateElementBgImage();

      // Add event listeners to keep overlay view up-to-date
      addMouseWheelUpdateListenersIfNecessary();
      $(document).one('mouseleave', onLeaveWindow);

      // Update state
      state.isVisible = true;
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
      return parseFloat(n.toFixed(COORDINATE_DECIMAL_PLACES));
    }

    function roundBorderWidth(n) {
      if (!DO_SUPPORT_SVG_OVERLAY) {
        // Use even numbers of pixels so that when we draw half of the outline width it's still a
        // whole pixel value. We draw half of the outline width on a line because it's drawn on both
        // sides of the line, which doubles the width.
        return Math.max(1, Math.round(n / 2) * 2);
      }
      return roundCoordinate(n);
    }

    function roundRectCoordinates(rect) {
      var newRect = {
        top: roundCoordinate(rect.top),
        bottom: roundCoordinate(rect.bottom),
        left: roundCoordinate(rect.left),
        right: roundCoordinate(rect.right)
      }
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

    function updateElementBgImage() {

      var element = state.picked[0],
          style = element.style,
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
        bgSizeString,
        // Get the rectangle for the element itself
        svgMarkup = '<svg xmlns="http://www.w3.org/2000/svg">' +
                     getSVGForPath(path, 0, 0, bgColor, 1) +
                     '</svg>';

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
      bgSizeString = roundCoordinate(bgPaintableWidth / state.zoom) + 'px ' + roundCoordinate(bgPaintableHeight / state.zoom) + 'px';
      offsetLeft = roundCoordinate(offsetLeft);
      offsetTop = roundCoordinate(offsetTop);

      state.savedCss = {
        'background-image'      : style.backgroundImage,
        'background-position'   : style.backgroundPosition,
        'background-origin'     : style.backgroundOrigin,
        'background-repeat'     : style.backgroundRepeat,
        'background-clip'       : style.backgroundClip,
        'background-attachment' : style.backgroundAttachment,
        'background-size'       : style.backgroundSize,
        'background-color'      : style.backgroundColor
      };

      // This only returns a non-zero value when there is an offset to the current element, try highlighting "Welcome to Bank of North America" on the eBank test site.
      var newBgPos = (offsetLeft / state.zoom) + 'px '+ (offsetTop / state.zoom) + 'px',
        newBg ='url("data:image/svg+xml,' + encodeURI(svgMarkup) + '") no-repeat ' + newBgPos + ' scroll',
        origStyle = traitcache.getStyle(element),
        // Use .slice() to make a copy so that original string is not changed
        origBgColor = origStyle.backgroundColor.slice(),
        origBgOrigin = origStyle.backgroundOrigin.slice(),
        origBgClip = origStyle.backgroundClip.slice(),
        origBgSize = origStyle.backgroundSize.slice(),
        // Remove color and other properties from the original background string, if they don't go into the shorthand background property
        origBgShorthandProperties = origStyle.backgroundImage === 'none' ? '' :
          ',' + origStyle.backgroundImage + ' ' + origStyle.backgroundRepeat + ' ' +
            origStyle.backgroundAttachment + ' ' + origStyle.backgroundPosition,
        // Put new background behind old one if it exists -- all browsers in our matrix support multiple backgrounds
        compositeBg = newBg + origBgShorthandProperties;

      style.background = compositeBg;
      style.backgroundOrigin = 'border-box,' + origBgOrigin;
      style.backgroundClip = 'border-box,' + origBgClip;
      style.backgroundColor = origBgColor;
      style.backgroundSize = bgSizeString + ',' + origBgSize;
    }

    function isCloseToHighlightColor(colorIntensity) {
      if (state.hasDarkBackgroundColor) {
        // On dark background, using dark highlight
        return colorIntensity < VERY_DARK_COLOR_INTENSITY
      }
      else {
        // On light background, using light highlight
        return colorIntensity > VERY_LIGHT_COLOR_INTENSITY
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
          bgColor = style.backgroundColor;
        if (style.backgroundImage ==='none' && getRgba(bgColor).a === 1) {
          var colorIntensity = getColorIntensity(bgColor);
          if (isCloseToHighlightColor(colorIntensity) &&
            !common.hasOwnBackgroundColor(this, style, state.styles[0])) { // If it's a unique color, we want to preserve it
            state.savedBgColors.push({ elem: this, color: this.style.backgroundColor });
            var prevStyle = this.getAttribute('style') || '';
            // Needed to do this as !important because of Perkins.org theme which also used !important
            this.setAttribute('style', 'background-color: transparent !important; ' + prevStyle);
          }
        }
      });
    }

    function getCutoutRectForPoint(x, y, expandFloatRectPixels, typeIfFloatRectShorter, typeIfFloatRectTaller) {
      var possibleFloat = common.elementFromPoint(x, y),  // Get from top-left or top-right of highlight
        picked = state.picked;
      if (possibleFloat && possibleFloat !== picked[0]) {
        var pickedAncestors = picked.parents(),
          possibleFloatAncestors = $(possibleFloat).parents();
        if (pickedAncestors.is(possibleFloat)) {
          // TODO commenting out second part cells in boxes at
          // http://venturebeat.com/2014/10/01/after-raising-50m-reddit-forces-remote-workers-to-relocate-to-sf-or-get-fired/
          // If potential float is ancestor of picked don't use it.
          // However, the picked element could be an ancestor of the float, and we still need to use it.
          // Example: http://thebillfold.com/2014/09/need-an-action-figure-of-a-dead-loved-one-meet-jeff-staab/
          return;
        }
        var commonAncestor = possibleFloatAncestors.is(picked) ? picked : $(possibleFloat).closest(pickedAncestors);
        if (isDifferentZIndex(possibleFloat, picked[0], commonAncestor)) {
          return; // Don't draw highlight around an item that is going over or under the highlight
        }
        while (!commonAncestor.is(possibleFloat) && !$(possibleFloat).is('body,html')) {
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
                var mhRectWithoutFloats = mhpos.getRect(picked, true) || mhRect,
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
      return ' style="' +'stroke-width: ' + strokeWidth + ';' +
          'stroke: ' + strokeColor + ';' +
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
      return state.styles[0].listStyleType !== 'none';
    }

    function getExtraPaddingColor() {
      if (SC_DEV && isColorDebuggingOn) {
        return 'rgba(255, 96, 0, .4)';
      }
      if (state.styles[0].backgroundImage) {
        return getTransparentBackgroundColor();
      }
      return getOpaqueBackgroundColor();
    }

    // For areas such as list bullet area, when it is inside margin instead of element bounds, and thus couldn't be covered with bg image
    function getSVGForExtraPadding(extra) {

      var highlightBgScreenRect = state.fixedContentRect, // Scaled by zoom
        svg = '',
        paddingColor = getExtraPaddingColor(),
        elementRect = roundRectCoordinates(state.picked[0].getBoundingClientRect()),
        REMOVE_GAPS_FUDGE_FACTOR = 0.5,
        extraLeft = elementRect.left - highlightBgScreenRect.left,
        extraRight = highlightBgScreenRect.right - elementRect.right,
        bgOffsetLeft = Math.max(0, state.fixedContentRect.left - state.elementRect.left),
        bgOffsetTop = Math.max(0, state.fixedContentRect.top - state.elementRect.top),
        // Don't be fooled by bottom-right cutouts
        extraTop = Math.max(0, elementRect.top - highlightBgScreenRect.top),
        extraBottom = Math.max(0, highlightBgScreenRect.bottom - elementRect.bottom),
        paddingWidth = highlightBgScreenRect.width,
        paddingHeight = highlightBgScreenRect.height - extraBottom;

      if (extraLeft > 0) {
        var topOffset = state.cutoutRects.topLeft ? state.cutoutRects.topLeft.height : extraTop; // Top-left area where the highlight is not shown
        var useColor = isPossibleBullet() ? paddingColor : getTransparentBackgroundColor(); // Don't hide bullets
        if (paddingHeight > topOffset) {
          svg += getSVGFillRectMarkup(extra, topOffset + extra, extraLeft + REMOVE_GAPS_FUDGE_FACTOR, paddingHeight - topOffset, useColor);
        }
      }
      if (extraRight > 0) {
        var topOffset = state.cutoutRects.topRight ? state.cutoutRects.topRight.height : extraTop; // Top-right area where the highlight is not shown
        if (paddingHeight > topOffset) {
          svg += getSVGFillRectMarkup(elementRect.width + extra + extraLeft - bgOffsetLeft - REMOVE_GAPS_FUDGE_FACTOR, topOffset + extra, extraRight + REMOVE_GAPS_FUDGE_FACTOR,
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

    // Update highlight overlay
    // @return falsey if no valid overlay can be created
    function computeOverlay() {

      var element,
          elementRect,
          overlayRect,
          stretchForSprites = true;

      if (!state.picked) {
        return;
      }

      element = state.picked[0];
      elementRect = element.getBoundingClientRect(); // Rough bounds

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

      state.elementRect = $.extend({}, elementRect);
      state.highlightBorderWidth = roundBorderWidth(getHighlightBorderWidth() / state.zoom);
      state.highlightPaddingWidth = roundBorderWidth(EXTRA_PADDING_PIXELS);
      var extra = getExtraPixels();

      state.cutoutRects = getCutoutRects();
      var basePolygonPath = getPolygonPoints(state.fixedContentRect);
      // Get the path for the overlay so that the top-left corner is located at 0,0
      // The updateHighlightOverlayPosition() code will set the top, left for it
      // (it can change because of scrollable sub-regions)
      var adjustedPath = getAdjustedPath(basePolygonPath, state.fixedContentRect.left,
          state.fixedContentRect.top, extra, state.zoom);
      state.pathFillBackground = basePolygonPath; // Helps fill gaps
      state.pathFillPadding = getExpandedPath(adjustedPath, state.highlightPaddingWidth / 2);
      state.pathBorder = getExpandedPath(state.pathFillPadding, state.highlightPaddingWidth /2 + state.highlightBorderWidth /2 );
      roundPolygonCoordinates(state.pathFillBackground);
      roundPolygonCoordinates(state.pathBorder);
      roundPolygonCoordinates(state.pathFillBackground);

      state.isCreated = true;

      var $measureDiv = $('<div>').appendTo(document.body).css({
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          position: 'absolute'
        }),
        // For some reason using the <body> works better in FF version <= 32
        isOldFirefox = platform.browser.isFirefox && platform.browser.version < 33,
        offsetElement = isOldFirefox ? document.body : $measureDiv[0],
        offsetRect = offsetElement.getBoundingClientRect();
      $measureDiv.remove();

      overlayRect = {
        left: (mainFixedRect.left - offsetRect.left) / state.zoom,
        top: (mainFixedRect.top - offsetRect.top) / state.zoom,
        width: mainFixedRect.width / state.zoom,
        height: mainFixedRect.height / state.zoom
      };
      overlayRect.right = overlayRect.left + overlayRect.width;
      overlayRect.bottom = overlayRect.top + overlayRect.height;
      state.overlayRect = roundRectCoordinates($.extend({ }, overlayRect));

      // So we can keep track of where highlight is even after panning
      state.absoluteRect = $.extend({}, mainFixedRect);
      // Next subtract the current scroll position
      state.absoluteRect.left += window.pageXOffset;
      state.absoluteRect.right += window.pageXOffset;
      state.absoluteRect.top += window.pageYOffset;
      state.absoluteRect.bottom += window.pageYOffset;

      // Finally update overlay CSS with zoom corrections
      updateHighlightOverlayPosition();

      return true;
    }

    function appendOverlayPathViaSVG() {

      // SVG overlays are supported
      // outlineFillColor:
      //   If the outline used used for the bg color and a bg color is being used at all
      var overlayBgColor = state.doUseOverlayForBgColor ? state.bgColor : null,
        // paddingColor:
        //   If overlay is used for fill color, we will put the fill in that, and don't need any padding color
        //   Otherwise, the we need the padding to bridge the gap between the background (clipped by the element) and the outline
        truePaddingColor = state.doUseOverlayForBgColor ? '' : state.bgColor,
        paddingColor = (SC_DEV && isColorDebuggingOn) ? 'rgba(0, 255, 0, .4)' : truePaddingColor,
          paddingSVG = paddingColor ? getSVGForPath(state.pathFillPadding, state.highlightPaddingWidth, paddingColor, null, 1) : '',
        outlineSVG = getSVGForPath(state.pathBorder, state.highlightBorderWidth, getHighlightBorderColor(),
          overlayBgColor, 3),
        // Extra padding: when there is a need for extra padding and the outline is farther away from the highlight
        // rectangle. For example, if there are list bullet items inside the padding area, this extra space needs to be filled
        extra = getExtraPixels(),
        extraPaddingSVG = paddingColor ? getSVGForExtraPadding(extra * state.zoom) : '',
        svgFragment = common.createSVGFragment(outlineSVG + paddingSVG + extraPaddingSVG, HIGHLIGHT_OUTLINE_CLASS);

      document.body.appendChild(svgFragment);
      var $svg = $('.' + HIGHLIGHT_OUTLINE_CLASS),
        width = state.fixedContentRect.width / state.zoom + 2 * extra + 1,  // Extra pixel ensures right side not cut off
        height = state.fixedContentRect.height / state.zoom + 2 * extra + 1;  // Extra pixel ensures bottom not cut off
      $svg.attr({
        width: width + 'px',
        height: height + 'px'
      }).css({
        position: 'absolute',
        pointerEvents: 'none'
      });
    }

    // Use CSS outline to draw a rectangle around a <div> with either width: 0 or height: 0.
    // Because the element has no area, it will not capture mouse events, even in IE9/10.
    // Beautiful hack? Or bastard of the slums?
    function appendOverlayPathViaCssOutline(pathPoints, lineWidth, color) {
      var index = 0,
        cssOutlineWidth = lineWidth / 2,
        numPoints = pathPoints.length,
        outlineCss = cssOutlineWidth + 'px solid ' + color,
        isHorizontal = true,
        appendTo = $('body');
      for (; index < numPoints; index ++ ) {
        var currPoint = pathPoints[index],
          nextPoint = pathPoints[(index + 1) % numPoints],  // At the end, nextPoint is at index 0
          leftXPoint = currPoint.x < nextPoint.x ? currPoint : nextPoint, // Draw from left to right
          topYPoint = currPoint.y < nextPoint.y ? currPoint : nextPoint,  // Draw from top to bottom
          x = leftXPoint.x + (isHorizontal ? cssOutlineWidth  : 0), // Make outline corners line up at right angles
          y = topYPoint.y,
          width = isHorizontal ? Math.abs(nextPoint.x - currPoint.x) - lineWidth : 0,
          height = isHorizontal ? 0 : Math.abs(nextPoint.y - currPoint.y);
        $('<div>')
          .css({
            outline: outlineCss,
            transform: 'translate(' + x + 'px,' + y + 'px)',
            width: width + 'px',
            height: height + 'px',
            position: 'absolute'
          })
          .addClass(HIGHLIGHT_OUTLINE_CLASS)
          .appendTo(appendTo);
        isHorizontal = !isHorizontal; // Every other line is horizontal
      }
    }

    function shouldAvoidBackgroundImage(picked) {
      // Don't highlight buttons, etc. because it ruins their native appearance
      // Fix highlighting on <tr> in WebKit by using overlay for highlight color
      // See https://bugs.webkit.org/show_bug.cgi?id=9268
      function isNativeFormControl() {
        // Return true for form controls that use a native appearance
        return picked.is(':button,:reset,:submit,:checkbox,:radio,input[type="color"],select[size="1"],select:not([size])');
      }
      return isNativeFormControl() || (picked.is('tr') && platform.browser.isWebKit);
    }

    // Number of pixels any edge will go beyond the fixedContentRect -- the highlight's border and padding
    function getExtraPixels() {
      return roundCoordinate(state.highlightPaddingWidth + state.highlightBorderWidth);
    }

    function isInScrollableContainer(element) {
      var canScroll = false;
      $(element).parentsUntil(document.body).each(function() {
        var style = traitcache.getStyle(this);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          this.scrollHeight > this.offsetHeight) {
          canScroll = true;
          return false;
        }
      });
      return canScroll;
    }

      function onMouseWheel() {
        if (!state.picked) {
          return;
        }
        var newRect = state.picked[0].getBoundingClientRect(),
          oldRect = state.elementRect,
          xDiff = newRect.left - oldRect.left,
          yDiff = newRect.top - oldRect.top;

        if (!xDiff && !yDiff) {
          return;
        }

        traitcache.updateCachedViewPosition();

        function correctRect(rect) {
          if (!rect) {
            return;
          }
          rect.left += xDiff;
          rect.right += xDiff;
          rect.top += yDiff;
          rect.bottom += yDiff;
        }

        correctRect(state.fixedContentRect);
        correctRect(state.cutoutRects.topLeft);
        correctRect(state.cutoutRects.topRight);
        correctRect(state.elementRect);
        correctRect(state.overlayRect);
      }

      function updateHighlightOverlayZIndex() {
        var ancestorStyles = getAncestorStyles(state.target, state.picked[0]).concat(state.styles);
        $('.' + HIGHLIGHT_OUTLINE_CLASS)
          .css('zIndex', getMaxZIndex(ancestorStyles));
      }

      function updateHighlightOverlayPosition() {
        var extra = getExtraPixels(),
          left = state.overlayRect.left - extra,
          top = state.overlayRect.top - extra;
        // TODO use .style with 'important' if we run into page css collisions
        // Otherwise, if we don't run into problems with that, we should probably get rid of the style plugin
        // and save the space.
        $('.' + HIGHLIGHT_OUTLINE_CLASS)
          .css({
            top: top + 'px',
            left: left + 'px'
          });
      }

      function addMouseWheelUpdateListenersIfNecessary() {
      // If the highlight is visible and there is a scrollable container, add mousewheel listener for
      // smooth highlight position updates as scrolling occurs.

      // The mousewheel event is better than the scroll event because we can add it in one place (on document) and it bubbles.
      // It also updates for each scroll change, rather than waiting until the scrolling stops.

      // IMPORTANT: add this only in situations where its necessary, because listening to mousewheel can cause bad performance.
      // It is deemed necessary when the highlight already exists and it's inside a scrollable element.

      if (isInScrollableContainer(state.target)) {
        $(document).on('mousewheel', onMouseWheel);
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

    // Fixed position rectangles are in screen coordinates.
    // If we have scrolled since the highlight was originally created,
    // we will need to update the fixed rect(s).
    function correctFixedRectangleCoordinatesForExistingHighlight(deltaX, deltaY) {
      function correctRect(rect) {
        rect.top += deltaY;
        rect.bottom += deltaY;
        rect.left += deltaX;
        rect.right +=deltaX;
      }

      correctRect(state.fixedContentRect);
      correctRect(state.elementRect);
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
     $('<div id="sc-debug-mh-rect">')
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
          // Already had a highlight
          var lastScrollX = cursorPos.scrollX;
          var lastScrollY = cursorPos.scrollY;
          if (window.pageXOffset === lastScrollX && window.pageYOffset == lastScrollY) {
            // Web page is lying about the scroll position
            // This happens because of funky scrolling effects on pages like
            // https://medium.com/backchannel/the-war-over-who-steve-jobs-was-92bda2cd1e1e
            var newElementRect = roundRectCoordinates(state.picked[0].getBoundingClientRect());
            correctFixedRectangleCoordinatesForExistingHighlight(newElementRect.left - state.elementRect.left,
                newElementRect.top - state.elementRect.top);
            state.elementRect = newElementRect;
          }
          else {
            cursorPos = getCursorPos(event, window.pageXOffset, window.pageYOffset);
            correctFixedRectangleCoordinatesForExistingHighlight(lastScrollX - cursorPos.scrollX, lastScrollY - cursorPos.scrollY);
          }
        }
        else {
          cursorPos = getCursorPos(event);
        }

        if (isExistingHighlightRelevant()) {
          SC_DEV && isHighlightRectDebuggingOn && updateDebugRect();
          return; // No highlighting || highlight is already good -- nothing to do
        }
        // Highlight was inappropriate -- cursor wasn't in it
        hide();
      }

      pickFromMouseTimer = setTimeout(function () {
        // In case doesn't move after fast velocity, check in a moment and update highlight if no movement
        pickFromMouseTimer = 0;
        pickFromMouse(event);
        SC_DEV && isHighlightRectDebuggingOn && updateDebugRect();
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
        sitecues.emit('mh/do-speak', picked);
      }

      updateView();
    }

    // refreshEventListeners turns on or off event listeners that enable the highlighter
    // return true if highlight visibility should be restored
    function refreshEventListeners(doForceOff) {
      // The mouse highlight is always enabled when TTS is on or zoom > MIN_ZOOM
      var doTrackMouse = sitecues.isSitecuesOn() && !doForceOff;

      if (doTrackMouse === isTrackingMouse) {
        return isTrackingMouse;
      }
      isTrackingMouse = doTrackMouse;

      if (isTrackingMouse) {
        // handle mouse move on body
        $(document)
          .on('mousemove', onMouseMove)
          .on('focusin focusout', testFocus)
          .ready(testFocus);
        if (platform.browser.isFirefox) {
          $(document).on('mouseover', onMouseMove); // Mitigate lack of mousemove events when scroll finishes
        }
        $(window)
          .on('focus', onFocusWindow)
          .on('blur', onBlurWindow)
          .on('resize', hide);
      } else {
        // remove mousemove listener from body
        $(document)
          .off('mousemove', onMouseMove)
          .off('mousewheel', onMouseWheel)  // In case it was added elsewhere
          .off('focusin focusout', testFocus);
        if (platform.browser.isFirefox) {
          $(document).off('mouseover', onMouseMove); // Mitigate lack of mousemove events when scroll finishes
        }
        $(window)
          .off('focus', onFocusWindow)
          .off('blur', onBlurWindow)
          .off('resize', hide);
      }

      return isTrackingMouse;
    }

    function getCursorPos(event, scrollX, scrollY) {
      return {
        x: event.clientX,
        y: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
        scrollX: scrollX || window.pageXOffset,
        scrollY: scrollY || window.pageYOffset,
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
          return;  // Highlight is appropriate and made visible again
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
      isAppropriateFocus = (!target || !common.isSpacebarConsumer(target)) && isWindowActive();
      if (!isSticky) {
        if (wasAppropriateFocus && !isAppropriateFocus) {
          hide();
        }
        else if (!wasAppropriateFocus && isAppropriateFocus) {
          resumeAppropriately();
        }
      }
    }

    function onFocusWindow() {
      isWindowFocused = true;
      testFocus();
    }

    function onBlurWindow() {
      isWindowFocused = false;
      isAppropriateFocus = false;
      onLeaveWindow();
    }

    // When the user blurs ours mouses out of the window, we should
    // hide and forget the highlight (unless sticky highlight is on)
    function onLeaveWindow() {
      if (!isSticky) {
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

    function autoPick(doSpeech) {
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
      var bodyWidth = zoomMod.getBodyWidth();
      var bodyHeight = document.body.scrollHeight;

      traitcache.resetCache();
      var viewSize = traitcache.getCachedViewSize();

      // Get first visible text and start from there
      function isAcceptableTextLeaf(node) {
        // Logic to determine whether to accept, reject or skip node
        if (common.isEmpty(node)) {
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
          sitecues.highlight(containingElement, true, true, true)) {
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

      sitecues.highlight(knownGoodState.target, true);
    }

    // Hide mouse highlight temporarily, keep picked data so we can reshow
    // the same highlight without another mouse move.
    // It's useful to call on it's own when the cursor goes outside of the highlight
    // but stays inside the same element.
    function hide(doRememberHighlight) {
      if (state.picked && state.savedCss) {
        // Restore the previous CSS on the picked elements (remove highlight bg etc.)
        $(state.picked).css(state.savedCss);
        state.savedCss = null;
        state.savedBgColors.forEach(function(savedBg) {
          savedBg.elem.style.backgroundColor = savedBg.color;
        });
        state.savedBgColors = [];

        if ($(state.picked).attr('style') === '') {
          $(state.picked).removeAttr('style'); // Full cleanup of attribute
        }
      }
      $('.' + HIGHLIGHT_OUTLINE_CLASS).remove();

      if (pickFromMouseTimer) {
        clearTimeout(pickFromMouseTimer);
        pickFromMouseTimer = 0;
      }

      state.isVisible = false;

      if (!doRememberHighlight) {
        // Forget highlight state, unless we need to keep it around temporarily
        forget();
      }

      // Now that highlight is hidden, we no longer need these
      $(document)
        .off('mousewheel', onMouseWheel)
        .off('mouseleave', onLeaveWindow);
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
    mh.getHighlight = function() {
      return state;
    };

    sitecues.isSitecuesOn = function() {
      return audio.isSpeechEnabled() || zoomMod.getCompletedZoom() > 1;
    };

    forget();

    // Temporarily hide and disable mouse highlight once highlight box appears. SC-1786
    // Also to this until zooming finished so that outline doesn't get out of place during zoom
    sitecues.on('zoom/begin mh/pause', pause);

    // enable mouse highlight back once highlight box deflates or zoom finishes
    sitecues.on('hlb/closed zoom', resumeAppropriately);

    // Turn mouse-tracking on or off
    sitecues.on('mh/track-scroll', setScrollTracking);

    // Turn mouse-tracking on or off
    sitecues.on('key/only-shift', setOnlyShift);

    // enable mouse highlight back once highlight box deflates or zoom finishes
    sitecues.on('mh/autopick', autoPick);

    // enable mouse highlight back once highlight box deflates or zoom finishes
    sitecues.on('mh/hide', hide);

    // Darken highlight appearance when speech is enabled
    conf.get('ttsOn', onSpeechChanged);

    testFocus(); // Set initial focus state

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
      }

      sitecues.getHighlight = mh.getHighlight;
    }

    /**
     * Show highlight on the specified seed element or hide if if nothing specified
     * @param seed        -- desired element to highlight, or a CSS selector for one
     * @param doUsePicker -- if truthy will find the best item to highlight ... seed or an ancestor of seed
     *                       if falsey will just highlight seed exactly
     * @param doKeepHidden -- if truthy will compute highlight but now display it
     */
    sitecues.highlight = function(seed, doUsePicker, doSuppressVoting, doKeepHidden) {

      hide();  // calling with no arguments will remove the highlight
      if (seed) {
        var elem = $(seed)[0];
        if (elem) {
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
    };

      // done
    callback();

    if (SC_UNIT) {
      $.extend(exports, mh);
      exports.picked = state.picked;
      exports.state = state;
      exports.INIT_STATE = INIT_STATE;
      exports.isDarkBackground = isDarkTone;
      exports.hasDarkBackgroundOnAnyOf = hasDarkBackgroundOnAnyOf;
      exports.hasLightText = hasLightText;
      exports.getElementsContainingOwnText = getElementsContainingOwnText;
      exports.getRgba = getRgba;
      exports.updateColorApproach = updateColorApproach;
      exports.getHighlightVisibilityFactor = getHighlightVisibilityFactor;
      exports.getHighlightBorderWidth = getHighlightBorderWidth;
      exports.show = show;
      exports.onMouseMove = onMouseMove;
      exports.computeOverlay = computeOverlay;
      exports.pickFromMouseAfterDelay = pickFromMouseAfterDelay;
      exports.resumeAppropriately = resumeAppropriately;
      exports.pause = pause;
      exports.hide = hide;
      exports.getMaxZIndex = getMaxZIndex;
      exports.pickTimer = pickFromMouseTimer;
    }
  });

});
