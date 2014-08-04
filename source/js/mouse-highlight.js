sitecues.def('mouse-highlight', function (mh, callback) {

  'use strict';

  var EXTRA_HIGHLIGHT_PIXELS = 3,

  INIT_STATE = {
    isVisible: false,
    picked: null,     // JQuery for picked element(s)
    target: null,     // Mouse was last over this element
    isCreated: false, // Has highlight been created
    styles: [],
    savedCSS: null,   // map of saved CSS for highlighted element
    elementRect: null,
    fixedContentRect: null,  // Contains the smallest possible rectangle encompassing the content to be highlighted
    // Note however, that the coordinates used are zoomed pixels (at 1.1x a zoomed pixel width is 1.1 real pixels)
    viewRect: null,  // Contains the total overlay rect, in absolute coordinates, in real pixels so that it can live outside of <body>
    floatRects: {}, // Interesting float objects
    pathBorder: [], // In real pixels so that it can live outside of <body>
    pathFillPadding: [], // In real pixels outside <body>, extends CSS background beyond element
    pathFillBackground: [], // In element rect coordinates, used with CSS background
    highlightPaddingWidth: 0,
    highlightBorderWidth: 0,
    bgColor: '',    // highlight color or '' if only outline is being used (as when highlighting media element)
    doUseOverlayforBgColor: false,  // was an overlay used to create the background color? If not, CSS background will be used.
    hasDarkBackgroundColor: false,
    isOverBackgroundImage: false,
    hasLightText: false
  },

  // minimum zoom level to enable highlight
  // This is the default setting, the value used at runtime will be in conf.
  MIN_ZOOM = 1,

  // class of highlight
  HIGHLIGHT_OUTLINE_CLASS = 'sitecues-highlight-outline',

  // How many ms does mouse need to stop for before we highlight?
  MOUSE_STOP_MS = 30,

  state,

  showTimer,
  pickTimer;

    // depends on jquery, conf, mouse-highlight/picker and positioning modules
  sitecues.use('jquery', 'conf', 'mouse-highlight/picker', 'mouse-highlight/traitcache',
    'mouse-highlight/highlight-position', 'util/common',
    'audio', 'util/geo',
    function($, conf, picker, traitcache, mhpos, common, audio, geo) {

    mh.enabled = false;
    mh.cursorPos = null;
    mh.scrollPos = null;

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

    function isZIndexHigher(item1, item2, commonAncestor) {
      function getZIndex(item) {
        var styles = getAncestorStyles(item, commonAncestor);
        return getMaxZIndex(styles);
      }
      return getZIndex(item1) > getZIndex(item2);
    }

    /**
     * Checks if the color value given of a light tone or not.
     */
    function isLightTone(colorValue) {
      var RGBAColor = getRgba(colorValue),
        // http://en.wikipedia.org/wiki/YIQ
        yiq = ((RGBAColor.r*299)+(RGBAColor.g*587)+(RGBAColor.b*114)) * RGBAColor.a / 1000;

      return yiq >= 128;
    }

    function getElementsContainingText(selector) {
      return $(selector).find('*').andSelf().filter(function() {
        var $this = $(this);
        return $this.children().length === 0 && $.trim($this.text()).length > 0;
      });
    }

    function hasLightText(selector) {
      var textContainers = getElementsContainingText(selector),
        MAX_ELEMENTS_TO_CHECK = 100,
        containsLightText = false;

      textContainers.each(function(index) {
        if (index >= MAX_ELEMENTS_TO_CHECK) {
          return false;
        }
        if (isLightTone(traitcache.getStyleProp(this, 'color'))) {
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
      var MATCH_COLORS = /rgba?\((\d+), (\d+), (\d+),?( [\d?.]+)?\)/,
        match = MATCH_COLORS.exec(colorString) || {};

      return {
        r: parseInt(match[1] || 0),
        g: parseInt(match[2] || 0),
        b: parseInt(match[3] || 0),
        a: parseFloat(match[4] || 1)
      };

    }

    function isDarkBackground(style) {
      return !isLightTone(style.backgroundColor);
    }

    function hasDarkBackgroundOnAnyOf(styles) {

      for (var count = 0; count < styles.length; count ++) {
        if (isDarkBackground(styles[count])) {
          return true;
        }
      }

      return false;
    }

    /**
     * Is the element inside of an ancestor element that has a background image?
     */
    function isOverBackgroundImage(styles) {

      // TODO: we're only checking 3 up, because we get confused by layout/spacer images
      // We can't always know what size a background image is, without using canvas approach,
      // and then there are security limitations, unless we use CORS.
      // In other words, this is complicated.
      var numAncestorsToCheck = Math.min(3, styles.length);
      for (var count = 0; count < numAncestorsToCheck; count ++) {
        if (!common.isEmptyBgImage(styles[count].backgroundImage)) {
          return true;
        }
      }

      return false;
    }

    function hasBackgroundSprite(style) {
      return style[0].backgroundRepeat === 'no-repeat';
    }

    function updateColorApproach(picked, style) {
      // Get data on backgrounds and text colors used
      var hasBackgroundImage = !common.isEmptyBgImage(style[0].backgroundImage);
      state.isOverBackgroundImage = hasBackgroundImage || isOverBackgroundImage(style);
      state.hasDarkBackgroundColor = hasDarkBackgroundOnAnyOf(style);
      state.hasLightText = hasLightText(state.target);

      // Get the approach used for highlighting
      if (picked.length > 1 || common.isFormControl(picked) ||
         (hasBackgroundImage && hasBackgroundSprite(style))) {
        //  approach #1 -- use overlay for background color
        //                 use overlay for rounded outline
        //  pros: one single rectangle instead of potentially many
        //        works with form controls
        //  cons: does not highlight text the way user expects (washes it out)
        //  when-to-use: for article or cases where multiple items are selected
        //               when background sprites are used, which we don't want to overwrite with out background
        state.bgColor = getTransparentBackgroundColor();
        state.doUseOverlayForBgColor = true; // Washes foreground out
      } else if (common.isVisualMedia(picked) || hasBackgroundImage) {
        //  approach #2 -- don't change background color (don't use any color)
        //                 use overlay for rounded outline
        //  pros: foreground text does not get washed out
        //  cons: no background color
        //  when-to-use: over media or when existing element has background image
        state.bgColor = '';
        state.doUseOverlayForBgColor = false;
      } else {
        //  approach #3 -- use css background of highlighted element for background color
        //                use overlay for rounded outline
        //  pros: looks best on text, does not wash out colors
        //  cons: breaks the appearance of native form controls, such as <input type="button">
        //  when-to-use: on most elements
        state.bgColor = getAppropriateBackgroundColor();
        state.doUseOverlayForBgColor = false;
      }
    }


    // How visible is the highlight?
    function getHighlightVisibilityFactor() {
      var MIN_VISIBILITY_FACTOR_WITH_TTS = 2.1,
          vizFactor = (state.zoom + 0.4) * 0.9;
      if (audio.isSpeechEnabled() && vizFactor < MIN_VISIBILITY_FACTOR_WITH_TTS) {
        vizFactor = MIN_VISIBILITY_FACTOR_WITH_TTS;
      }
      return vizFactor;
    }

    function getHighlightBorderColor() {
      var viz = getHighlightVisibilityFactor(),
          opacity = viz - 1.3;
      opacity = Math.min(1, Math.max(opacity, 0));
      return 'rgba(0,0,0,' + opacity + ')';
    }

    function getHighlightBorderWidth() {
      var viz = getHighlightVisibilityFactor(),
          borderWidth = viz - 0.4;
      return Math.max(1, borderWidth);
    }

    function getTransparentBackgroundColor() {
      // Best to use transparent color when the background is interesting or dark, and we don't want to
      // change it drastically
      // This lightens at higher levels of zoom
      var viz = getHighlightVisibilityFactor(),
          alpha;
      viz = Math.min(viz, 2);
      alpha = 0.11 * viz;
      return 'rgba(245, 245, 205, ' + alpha + ')'; // Works with any background -- lightens it slightly
    }

    function getOpaqueBackgroundColor() {
      // Best to use opaque color, because inner overlay doesn't match up perfectly causing overlaps and gaps
      // It lightens at higher levels of zoom
      var viz = Math.min(getHighlightVisibilityFactor(), 2),
          decrement = viz * 1.4,
          red = Math.round(255 - decrement),
          green = red,
          blue = Math.round(254 - 5 * decrement),
          color = 'rgb(' + red + ',' + green + ',' + blue + ')';
      return color;
    }

    // Return an array of styles in the ancestor chain, including fromElement, not including toElement
    function getAncestorStyles(fromElement, toElement) {
      var styles = [ traitcache.getStyle(fromElement) ];
      $(fromElement).parentsUntil(toElement).each(function() {
        styles.push(traitcache.getStyle(this));
      });
      return styles;
    }

    function getFloatRectsArray() {
      return [ state.floatRects.topLeft, state.floatRects.topRight ];
    }

    function isCursorInHighlightShape(fixedRects, floatRects) {
      if (!mh.cursorPos || !geo.isPointInAnyRect(mh.cursorPos.x, mh.cursorPos.y, fixedRects)) {
        return false;
      }
      // The cursor is in the fixed rectangle for the highlight.
      // Now, we will consider the cursor to be in the highlight as long as it's not in any
      // parts cut out from the highlight when it is drawn around floats.
      return !geo.isPointInAnyRect(mh.cursorPos.x, mh.cursorPos.y, floatRects);
    }

    // show mouse highlight -- update() from mouse events finally results in show()
    function show() {
      // can't find any element to work with
      if (!state.picked) {
        return false;
      }

      state.zoom = conf.get('zoom');
      state.styles = getAncestorStyles(state.picked.get(0), document.documentElement);
      updateColorApproach(state.picked, state.styles);

      if (!createNewOverlayPosition(true)) {
        // Did not find visible rectangle to highlight
        return false;
      }

      state.isVisible = true;
      mh.updateElementBgImage();
    }

    // Choose an appropriate background color for the highlight
    // In most cases we want the opaque background because the background color on the element
    // can overlap the padding over the outline which uses the same color, and not cause problems
    // We need them to overlap because we haven't found a way to 'sew' them together in with pixel-perfect coordinates
    function getAppropriateBackgroundColor() {

      if (state.hasDarkBackgroundColor ||
          state.isOverBackgroundImage ||
          state.hasLightText) {
        // Use transparent background so that the interesting background or light foreground are still visible
        return getTransparentBackgroundColor();
      }

      return getOpaqueBackgroundColor();
    }

    mh.updateElementBgImage = function() {

      var element = state.picked.get(0),
          offsetLeft,
          offsetTop;

      // Approach #1 or #2 -- no change to background of element
      if (state.doUseOverlayForBgColor || !state.bgColor) {
        return false;
      }

      // Approach #3 --change CSS background of highlighted element
      var path = getAdjustedPath(state.pathFillBackground, state.fixedContentRect.left, state.fixedContentRect.top, state.zoom);

      // Get the rectangle for the element itself
      var svgMarkup = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
                      getSVGForPath(path, 0, 0, state.bgColor, 1) +
                      '</svg>';

      // Use element rectangle to find origin (left, top) of background
      offsetLeft = state.fixedContentRect.left - state.elementRect.left;
      offsetTop = (state.fixedContentRect.top - state.elementRect.top);

      state.savedCss = {
        'background-image'      : element.style.backgroundImage,
        'background-position'   : element.style.backgroundPosition,
        'background-origin'     : element.style.backgroundOrigin,
        'background-repeat'     : element.style.backgroundRepeat,
        'background-clip'       : element.style.backgroundClip,
        'background-attachment' : element.style.backgroundAttachment,
        'background-size'       : element.style.backgroundSize
      };

      var newBackgroundImage = 'url("data:image/svg+xml,' + escape(svgMarkup) + '")';

      element.style.backgroundImageOrigin = 'border-box';
      element.style.backgroundClip = 'border-box';
      element.style.backgroundAttachment = 'scroll';

      // This following line made the SVG background in IE smaller than the highlighted element.
      // element.style.backgroundSize = state.fixedContentRect.width * conf.get('zoom') + 'px ' + state.fixedContentRect.height * conf.get('zoom') + 'px';

      element.style.backgroundImage = newBackgroundImage;
      element.style.backgroundRepeat= 'no-repeat';

      // This only returns a non-zero value when there is an offset to the current element, try highlighting "Welcome to Bank of North America" on the eBank test site.
      element.style.backgroundPosition = (offsetLeft / state.zoom) + 'px '+ (offsetTop / state.zoom) + 'px';
    };

    function floatRectForPoint(x, y, expandFloatRectPixels) {
      var possibleFloat = document.elementFromPoint(Math.max(0, x), Math.max(0, y));
      if (possibleFloat && possibleFloat !== state.picked.get(0)) {
        var pickedAncestors = state.picked.parents(),
          possibleFloatAncestors = $(possibleFloat).parents();
        if (pickedAncestors.is(possibleFloat) || possibleFloatAncestors.is(state.picked)) {
          // If potential float is ancestor of picked, or vice-versa, don't use it.
          // We only use a cousin or sibling float.
          return null;
        }
        var commonAncestor = $(possibleFloat).closest(pickedAncestors);
        if (isZIndexHigher(possibleFloat, state.picked[0], commonAncestor)) {
          return null; // Don't draw highlight around an item that is going over the highlight
        }
        while (possibleFloat !== commonAncestor && possibleFloat !== document.body &&
               possibleFloat !== document.documentElement) {
          if (traitcache.getStyleProp(possibleFloat, 'float') !== 'none') {
            var COMBINE_ALL_RECTS = 99999,
              floatRect = mhpos.getAllBoundingBoxes(possibleFloat, COMBINE_ALL_RECTS, true)[0];
            return geo.expandOrContractRect(floatRect, expandFloatRectPixels);
          }
          possibleFloat = possibleFloat.parentNode;
        }
      }
      return null;
    }

    // Get rects of floats that intersect with the original highlight rect.
    // Floats are always aligned with the top of the element they're associated with,
    // so we don't need to support botLeft or botRight floats
    function getIntersectingFloatRects() {
      var EXTRA = 7, // Make sure we test a point inside where the float would be, not on a margin
        EXPAND_FLOAT_RECT = 7,
        mhRect = state.fixedContentRect,
        left = mhRect.left,
        right = mhRect.left + mhRect.width,
        top = mhRect.top,
        topLeftRect = floatRectForPoint(left + EXTRA, top + EXTRA, EXPAND_FLOAT_RECT),
        topRightRect = floatRectForPoint(right - EXTRA, top + EXTRA, EXPAND_FLOAT_RECT);

      // Perform specific sanity checks depending on float position and return the rects if they pass
      return {
        topLeft: topLeftRect && geo.isPointInRect(topLeftRect.right, topLeftRect.bottom, mhRect) ? topLeftRect : null,
        topRight: topRightRect && geo.isPointInRect(topRightRect.left, topRightRect.bottom, mhRect) ? topRightRect : null
      }
    }

    function extendAll(array, newProps) {
      for (var index = 0; index < array.length; index ++ ) {
        array[index] = $.extend(array[index], newProps);
      }
      return array;
    }

    function getPolygonPoints(rect) {
      // Build points for highlight polygon
      var orig = geo.expandOrContractRect(rect, 0);
      var floats = state.floatRects;

      var topLeftPoints;
      if (floats.topLeft) {
        // Draw around top-left float
        topLeftPoints = [
          { x: orig.left, y: floats.topLeft.bottom },
          { x: floats.topLeft.right, y: floats.topLeft.bottom },
          { x: floats.topLeft.right, y: orig.top}
        ];
      }
      else { // No top-left float, just use top-left point
        topLeftPoints = [
          {x: orig.left, y: orig.top }
        ];
      }

      var topRightPoints;
      if (floats.topRight) {
        // Draw around top-right float
        topRightPoints = [
          { x: floats.topRight.left, y: orig.top },
          { x: floats.topRight.left, y: floats.topRight.bottom },
          { x: orig.right, y: floats.topRight.bottom }
        ];
      }
      else { // No top-right float, just use top-right point
        topRightPoints = [ {x: orig.right, y: orig.top } ];
      }

      // Can't create bottom-right float, just use point
      var botRightPoints =  [ { x: orig.right, y: orig.bottom } ];

      // Can't create bottom left float, just use point
      var botLeftPoints = [{ x: orig.left, y: orig.bottom } ];

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
          x: points[index].x + points[index].growX * delta,
          y: points[index].y + points[index].growY * delta,
          growX: points[index].growX,
          growY: points[index].growY
        });
      }
      return newPath;
    }

    function getAdjustedPath(origPath, offsetX, offsetY, divisor) {
      var newPath = [];
      $.each(origPath, function() {
        newPath.push($.extend({}, this, {
          x: (this.x - offsetX) / divisor,
          y: (this.y - offsetY) / divisor
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

      return '<rect x="' + left / state.zoom + '" y="' + top / state.zoom + '"  width="' + width / state.zoom + '" height="' + height / state.zoom + '"' +
        getSVGStyle(0, 0, fillColor) + '/>';
    }

    // For list bullet area, when it is inside margin instead of padding, and thus couldn't be covered with bg image
    // Also for right or bottom overflow
    function getSVGForExtraPadding(extra) {
      var svg = '',
        color = getTransparentBackgroundColor(),  // TODO return to normal -- this is for debugging
        elementRect = state.picked[0].getBoundingClientRect(),
        extraLeft = (elementRect.left - state.fixedContentRect.left) ,
        extraRight = (state.fixedContentRect.right - elementRect.right) ,
        extraBottom = (state.fixedContentRect.bottom - elementRect.bottom) ;

      if (extraLeft > 0) {
        var topOffset = state.floatRects.topLeft ? state.floatRects.topLeft.height : extra; // Top-left area where the highlight is not shown
        svg += getSVGFillRectMarkup(extra, topOffset, extraLeft, state.fixedContentRect.height - topOffset, color);
      }
      if (extraRight > 0) {
        var topOffset = state.floatRects.topRight ? state.floatRects.topRight.height : extra; // Top-right area where the highlight is not shown
        svg += getSVGFillRectMarkup(elementRect.width  + extra, topOffset, extraRight, state.fixedContentRect.height - topOffset, color);
      }
      if (extraBottom > 0) {
        svg += getSVGFillRectMarkup(extra, elementRect.height  + extra, elementRect.width, extraBottom, color);
      }
      return svg;
    }

    // Update highlight overlay
    // Return false if no valid rect
    // Only update if createOverlay or position changes
    // IOW, if createOverlay is false, this will check to see if position changed. If not, will do nothing more.
    function createNewOverlayPosition(createOverlay) {

      var element,
          elementRect,
          fixedRects,
          absoluteRect,
          previousViewRect,
          stretchForSprites = true;

      if (!state.picked) {
        return false;
      }

      element = state.picked.get(0);
      elementRect = traitcache.getScreenRect(element); // Rough bounds

      if (!createOverlay) {   // Just a refresh
        if (!state.elementRect) {
          return false; // No view to refresh
        }
        if (elementRect.left === state.elementRect.left &&
            elementRect.top === state.elementRect.top) {
          // Optimization -- reuse old fixed content rect info
          // Show/hide highlight if cursor moves into or out of highlight
          var isCursorInHighlight = isCursorInHighlightShape([state.fixedContentRect], getFloatRectsArray());
          if (isCursorInHighlight !== state.isVisible) {
            if (!isCursorInHighlight) {
              pause();  // Hide highlight -- cursor has moved out of it
            }
            else {
              show(); // Create and show highlight -- cursor has moved into it
            }
          }
          return isCursorInHighlight;
        }

        stretchForSprites = state.doUseOverlayForBgColor; // For highlight refreshes, do not consider our bg a sprite
      }

      // Get exact bounds
      fixedRects = mhpos.getAllBoundingBoxes(element, 0, stretchForSprites);

      if (!fixedRects.length || !isCursorInHighlightShape(fixedRects, getFloatRectsArray())) {
        // No valid highlighted content rectangles or cursor not inside of them
        return false;
      }

      mhpos.combineIntersectingRects(fixedRects, 99999); // Merge all boxes
      state.fixedContentRect = fixedRects[0];

      state.elementRect = $.extend({}, elementRect);
      absoluteRect = mhpos.convertFixedRectsToAbsolute([state.fixedContentRect], state.zoom)[0];
      previousViewRect = $.extend({}, state.viewRect);
      state.highlightBorderWidth = getHighlightBorderWidth();
      state.highlightPaddingWidth = state.doUseOverlayForBgColor ? 0 : EXTRA_HIGHLIGHT_PIXELS;
      state.viewRect = $.extend({ }, absoluteRect);
      var extra = state.highlightPaddingWidth + state.highlightBorderWidth;

      if (createOverlay) {
        var ancestorStyles = getAncestorStyles(state.target, element).concat(state.styles);
        state.floatRects = getIntersectingFloatRects();
        state.pathFillBackground = getPolygonPoints(state.fixedContentRect);
        var adjustedPath = getAdjustedPath(state.pathFillBackground, state.fixedContentRect.left - extra * state.zoom,
            state.fixedContentRect.top - extra * state.zoom, state.zoom);
        state.pathFillPadding = getExpandedPath(adjustedPath, state.highlightPaddingWidth / 2 - 1);
        state.pathBorder = getExpandedPath(state.pathFillPadding, state.highlightPaddingWidth /2 + state.highlightBorderWidth /2 );

        // Create and position highlight overlay
        var paddingSVG = getSVGForPath(state.pathFillPadding, state.highlightPaddingWidth + 1, getTransparentBackgroundColor(),
                    state.doUseOverlayForBgColor ? getTransparentBackgroundColor() : null, 1);
        var outlineSVG = getSVGForPath(state.pathBorder, state.highlightBorderWidth, getHighlightBorderColor(), null, 3);
        var extraPaddingSVG = getSVGForExtraPadding(extra);
        var svgFragment = common.createSVGFragment(outlineSVG + paddingSVG + extraPaddingSVG, HIGHLIGHT_OUTLINE_CLASS);

        document.documentElement.appendChild(svgFragment);

        $('.' + HIGHLIGHT_OUTLINE_CLASS)
          .attr({
            width : (state.fixedContentRect.width / state.zoom + 2 * extra) + 'px',
            height: (state.fixedContentRect.height / state.zoom + 2 * extra) + 'px'
          })
          .css({
            zIndex: getMaxZIndex(ancestorStyles)  // Just below stuff like fixed toolbars
          });

        state.isCreated = true;

        addMouseWheelUpdateListenersIfNecessary();
        $(document).one('mouseleave', hideAndResetState);
      }
      else if (common.equals(previousViewRect, state.viewRect)) {
        return true; // Already created and in correct position, don't update DOM
      }

      // Finally update overlay CSS -- multiply by conf.zoom because it's outside the <body>
      $('.' + HIGHLIGHT_OUTLINE_CLASS)
        .style({
          top: (state.viewRect.top / state.zoom - extra / state.zoom) + 'px',
          left:  (state.viewRect.left / state.zoom - extra) + 'px'
        }, '', 'important');
      return true;
    }

    function isInScrollableContainer(element) {
      var canScroll = false;
      $(element).parentsUntil(document.body).each(function() {
        var style = traitcache.getStyle(this);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          this.scrollHeight > element.offsetHeight) {
          canScroll = true;
          return false;
        }
      });
      return canScroll;
    }

    function onMouseWheel() {
      refreshExistingHighlight();
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

    function update(event) {
      // break if highlight is disabled

      if (!mh.enabled) {
        return;
      }

      if (SC_DEV) {
        if (mh.isSticky && !event.shiftKey) {
          return;
        }
      }

      pickAfterShortWait(event.target, event.clientX, event.clientY);
    }

    function pickAfterShortWait(target, mouseX, mouseY) {
      clearTimeout(pickTimer);
      pickTimer = setTimeout(function () {
        // In case doesn't move after fast velocity, check in a moment and update highlight if no movement
        pickTimer = 0;
        checkPickerAfterUpdate(target, mouseX, mouseY);
      }, state.isCreated ? 0 : MOUSE_STOP_MS);
    }

    // Used for performance shortcut -- if still inside same highlight
    function isExistingHighlightRelevant() {
      if (!state.isCreated) {
        return false;
      }
      // If the picked element's rectangle has changed, always return false
      // because we will need to redraw the highlight anyway.
      if (!common.equals(state.elementRect, traitcache.getScreenRect(state.picked.get(0)))) {
        return false; // Original element has changed size
      }
      // Return true we're inside in the existing highlight
      return isCursorInHighlightShape([state.fixedContentRect], getFloatRectsArray());
    }

    function refreshExistingHighlight() {
      // Even though highlight is the same, the elements may have moved
      // This will do a quick check and only redraw if an update looks necessary
      // If it hasn't been created yet, we are waiting for showTimer to fire.
      if (state.isCreated) {    // If has already shown
        createNewOverlayPosition();
      }
    }

    // Fixed position rectangles are in screen coordinates.
    // If we have scrolled since the highlight was originally created,
    // we will need to update the fixed rect(s).
    function correctFixedRectangleCoordinatesForExistingHighlight(scrollX, scrollY) {
      var deltaX = mh.scrollPos.x - scrollX,
        deltaY =  mh.scrollPos.y - scrollY,
        rect = state.fixedContentRect;

      rect.top += deltaY;
      rect.bottom += deltaY;
      rect.left += deltaX;
      rect.right +=deltaX;
    }

    function checkPickerAfterUpdate(target, mouseX, mouseY) {
      var picked,
          doExitEarly = false,
          scrollX = window.pageXOffset,
          scrollY = window.pageYOffset;

      if (state.isCreated) {
        correctFixedRectangleCoordinatesForExistingHighlight(scrollX, scrollY);
      }

      // don't show highlight if current document isn't active,
      // or current active element isn't appropriate for spacebar command
      testFocus(); // update in case focus changed but no events (e.g. click in content after Chrome extension popup)
      if (!mh.isAppropriateFocus || isExistingHighlightRelevant()) {
        doExitEarly = true;
      }
      else if (!state.isCreated && mh.scrollPos &&
        (scrollY !== mh.scrollPos.y || scrollX !== mh.scrollPos.x ||
        mouseX !== mh.cursorPos.x || mouseY !== mh.cursorPos.y)) {
        // Don't update while still scrolling
        mh.cursorPos = { x: mouseX, y: mouseY };
        mh.scrollPos = { x: scrollX, y: scrollY };
        pickAfterShortWait(target, mouseX, mouseY);
        return;
      }

      mh.cursorPos = { x: mouseX, y: mouseY };
      mh.scrollPos = { x: scrollX, y: scrollY };

      if (doExitEarly) {
        return;
      }

      // save picked element
      picked = picker.find(target);

      if (!picked) {
        if (state.picked) {
          hideAndResetState();  // Nothing picked anymore
        }
        state.target = target;
        return;
      }

      hideAndResetState();

      state.picked = $(picked);
      state.target = target;

      // show highlight for picked element
      function showHighlightAfterShortDelay() {
        showTimer = 0;
        show();
      }
      clearTimeout(showTimer);
      showTimer = setTimeout(showHighlightAfterShortDelay, 15);
    }

    // refresh status of enhancement on page
    function refresh() {
      if (mh.enabled) {
        // handle mouse move on body
        $(document)
          .on('mousemove', update)
          .on('focusin focusout', testFocus);
        $(window)
          .on('focus', testFocus)
          .on('blur', onblurwindow)
          .on('resize', hideAndResetState);
      } else {
        // remove mousemove listener from body
        $(document)
          .off('mousemove', update)
          .off('mousewheel', onMouseWheel)  // In case it was added elsewhere
          .off('focusin focusout', testFocus);
        $(window)
          .off('focus', testFocus)
          .off('blur', onblurwindow)
          .off('resize', hideAndResetState);
      }
    }

    function onSettingsChanged() {
      state.zoom = conf.get('zoom');
      var was = mh.enabled;
          // The mouse highlight is always enabled when TTS is on.

      mh.enabled = audio.isSpeechEnabled() || state.zoom > MIN_ZOOM;

      if (SC_DEV) {
        if (mh.isSticky && state.picked) {
          // Reshow sticky highlight on same content after zoom change -- don't reset what was picked
          pause();
          mh.cursorPos = null; // Don't do cursor-inside-picked-content check, because it may not be after zoom change
          show();
          return;
        }

      }

      hideAndResetState();

      if (was !== mh.enabled) {
        refresh();
      }
    }

    function testFocus() {
      var wasAppropriateFocus = mh.isAppropriateFocus;
      // don't show highlight if current active isn't body
      var target = document.activeElement;
      mh.isAppropriateFocus = (!target || !common.isSpacebarConsumer(target)) && document.hasFocus();
      if (wasAppropriateFocus && !mh.isAppropriateFocus && !mh.isSticky) {
        pause();
      }
    }

    function onblurwindow() {
      mh.isAppropriateFocus = false;
      if (!mh.isSticky) {
        hideAndResetState();
      }
    }

    // enable mouse highlight
    function reenableIfAppropriate() {
      // handle mouse move on body
      if (mh.enabled) {
        refresh();
        show();
      }
    }

    // disable mouse highlight temporarily
    function disable() {
      $(document).off('mousemove', update);
      $(document).off('mousewheel', onMouseWheel);
      pause();
    }

    function hideAndResetState() {
      pause();
      resetState();
    }

    // hide mouse highlight temporarily, keep picked data so we can reshow without another mouse move
    function pause() {
      if (state.picked && state.savedCss) {
        $(state.picked).style(state.savedCss);
        state.savedCss = null;
        if ($(state.picked).attr('style') === '') {
          $(state.picked).removeAttr('style'); // Full cleanup of attribute
        }
      }
      $('.' + HIGHLIGHT_OUTLINE_CLASS).remove();
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = 0;
      }

      if (pickTimer) {
        clearTimeout(mh.pickTimer);
        pickTimer = 0;
      }

      state.isVisible = false;

      $(document)
        .off('mousewheel', onMouseWheel)
        .off('mouseleave', hideAndResetState);
    }

    function resetState() {
      state = $.extend({}, INIT_STATE); // Copy
    }

    mh.getHighlight = function() {
      return state;
    };

    resetState();

    // hide mouse highlight once highlight box appears. SC-1786
    sitecues.on('mh/disable', disable);

    // enable mouse highlight back once highlight box deflates
    sitecues.on('hlb/closed', reenableIfAppropriate);

    // handle zoom changes to toggle enhancement on/off
    conf.get('zoom', onSettingsChanged);

    // darken highlight appearance when speech is enabled
    sitecues.on('speech/enabled speech/disabled', onSettingsChanged);

    testFocus(); // Set initial focus state

    /**
     * Toggle Sticky state of highlight
     * When stick mode is on, shift must be pressed to move highlight
     */
    if (SC_DEV) {
      sitecues.toggleStickyMH = function () {
        mh.isSticky = !mh.isSticky;
        return mh.isSticky;
      };
    }

    sitecues.highlight = function(elem) {

      hideAndResetState();
      state.picked = $(elem);
      state.target = elem;
      var rect = mhpos.getAllBoundingBoxes(elem, 0, true)[0];
      mh.cursorPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      mh.scrollPos = { x: window.pageXOffset, y: window.pageYOffset };
      show();
    };

    // Initialize the highlight state;
    onSettingsChanged();

    // done
    callback();

    if (SC_UNIT) {
      $.extend(exports, mh);
      exports.picked = state.picked;
      exports.state = state;
      exports.INIT_STATE = INIT_STATE;
      exports.isOverBackgroundImage = isOverBackgroundImage;
      exports.isDarkBackground = isDarkBackground;
      exports.hasDarkBackgroundOnAnyOf = hasDarkBackgroundOnAnyOf;
      exports.hasLightText = hasLightText;
      exports.getElementsContainingText = getElementsContainingText;
      exports.getRgba = getRgba;
      exports.updateColorApproach = updateColorApproach;
      exports.getHighlightVisibilityFactor = getHighlightVisibilityFactor;
      exports.getHighlightBorderWidth = getHighlightBorderWidth;
      exports.show = show;
      exports.update = update;
      exports.createNewOverlayPosition = createNewOverlayPosition;
      exports.pickAfterShortWait = pickAfterShortWait;
      exports.hideAndResetState = hideAndResetState;
      exports.reenableIfAppropriate = reenableIfAppropriate;
      exports.disable = disable;
      exports.pause = pause;
      exports.resetState = resetState;
      exports.getMaxZIndex = getMaxZIndex;
      exports.showTimer = showTimer;
      exports.pickTimer = pickTimer;
    }
  });

});
