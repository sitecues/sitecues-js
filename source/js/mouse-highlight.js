sitecues.def('mouse-highlight', function (mh, callback) {
  		// Tracks if the user has heard the "first high zoom" cue.
  var FIRST_HIGH_ZOOM_PARAM = "firstHighZoom",
  		// The high zoom threshold.
      HIGH_ZOOM_THRESHOLD = 2,
  		// Time in millis after which the "first high zoom" cue should replay.
      FIRST_HIGH_ZOOM_RESET_MS = 7 *86400000, // 7 days

      EXTRA_HIGHLIGHT_PIXELS = 3,

			INIT_STATE = {
				picked: null,     // JQuery for picked element(s)
				target: null,     // Mouse was last over this element
				lastCursorPos: null,
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
				doUseBgColor: false,   // was highlight color avoided (in case of single media element just use outline)
				doUseOverlayforBgColor: false  // was an overlay used to create the background color?
			},

			// minimum zoom level to enable highlight
			// This is the default setting, the value used at runtime will be in conf.
      MIN_ZOOM = 1.01,

			// class of highlight
	    HIGHLIGHT_OUTLINE_CLASS = 'sitecues-highlight-outline',

      state, nativeZoom = 'zoom' in document.createElement('div').style; //EQ-880

		// depends on jquery, conf, mouse-highlight/picker and positioning modules
	sitecues.use('jquery', 'conf', 'mouse-highlight/picker', 'util/positioning', 'util/common', 'speech', 'geo', function($, conf, picker, positioning, common, speech, geo) {

		conf.set('mouseHighlightMinZoom', MIN_ZOOM);
		
		mh.enabled = false;
		// this is the initial zoom level, we're only going to use the verbal cue if someone increases it
		mh.initZoom = 0;
		// Remember the initial zoom state
		mh.initZoom = conf.get('zoom');

		/**
		 * Returns true if the "first high zoom" cue should be played.
		 * @return {boolean}
		 */
		function shouldPlayFirstHighZoomCue() {
		  var fhz = conf.get(FIRST_HIGH_ZOOM_PARAM);
		  return (!fhz || ((fhz + FIRST_HIGH_ZOOM_RESET_MS) < (new Date()).getTime()));
		};

		/**
		 * Signals that the "first high zoom" cue has played.
		 */
		function playedFirstHighZoomCue() {
		  conf.set(FIRST_HIGH_ZOOM_PARAM, (new Date()).getTime());
		};

		function getMaxZIndex(styles) {
			var maxZIndex = 0;
			for (var count = 0; count < styles.length; count ++) {
				var zIndexInt = parseInt(styles[count].zIndex);
				if (zIndexInt > maxZIndex)
					maxZIndex = zIndexInt;
			}
			return maxZIndex;
		}

		function isInterestingBackground(style) {

			var matchColorsAlpha,
					match,
					matchColorsNoAlpha,
					mostlyWhite;

			if (style.backgroundColor === 'transparent') {
				return false;
			}
			
			matchColorsAlpha = /rgba\((\d{1,3}), (\d{1,3}), (\d{1,3}), ([\d.]{1,10})\)/;
			match = matchColorsAlpha.exec(style.backgroundColor);
			
			if (match != null) {
				if (parseFloat(match[4]) < .10) {
					return false; // Mostly transparent, not interesting
				} // Else fall through and analyze rgb colors
			} else { // Background is not in rgba() format, check for rgb() format next
				matchColorsNoAlpha = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/;
				match = matchColorsNoAlpha.exec(style.backgroundColor);
				if (match === null) {
					return true;
				}
			}
			// Check r,g,b values  -- We consider it "non-interesting" if mostly white
			mostlyWhite = parseInt(match[1]) > 242 && parseInt(match[2]) > 242 && parseInt(match[3]) > 242;
			
			return !mostlyWhite;
		
		}

		function hasInterestingBackgroundOnAnyOf(styles) {

			for (var count = 0; count < styles.length; count ++) {
				if (isInterestingBackground(styles[count])) {
					return true;
				}
			}

			return false;
		}

		function hasInterestingBackgroundImage(styles) {

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


		function updateColorApproach(style) {
			// Get the approach used for highlighting
			if ($(state.picked).length > 1 ||
         (style[0].backgroundImage !== 'none' && style[0].backgroundRepeat === 'no-repeat')) {
				//  approach #1 -- use overlay for background color
				//                 use overlay for rounded outline
				//	pros: one single rectangle instead of potentially many
				//	cons: does not highlight text the way user expects (washes it out)
				//	when-to-use: for article or cases where multiple items are selected
                //               when background sprites are used, which we don't want to overwrite with out background
				state.doUseBgColor = true;
				state.doUseOverlayForBgColor = true; // Washes foreground out
			}	else if (common.isVisualMedia(state.picked) || !common.isEmptyBgImage(style[0].backgroundImage)) {
				//  approach #2 -- don't change background color
				//                 use overlay for rounded outline
				//	pros: foreground text does not get washed out
				//	cons: no background color
				//  when-to-use: over media or interesting backgrounds
				state.doUseBgColor = false;
				state.doUseOverlayForBgColor = false;
			} else {
				//  approach #3 -- use css background of highlighted element for background color
				//                use overlay for rounded outline
				//	pros: looks best on text, does not wash out colors
				//	when-to-use: on most elements
				state.doUseBgColor = true;
				state.doUseOverlayForBgColor = false;
			}
		}


		// How visible is the highlight?
		function getHighlightVisibilityFactor() {
			var MIN_VISIBILITY_FACTOR_WITH_TTS = 2.1,
			    vizFactor = (state.zoom +.4) * .9;
			if (speech.isEnabled() && vizFactor < MIN_VISIBILITY_FACTOR_WITH_TTS) {
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
			    borderWidth = viz - .4;
			return Math.max(1, borderWidth);
		}

		function getTransparentBackgroundColor() {
			// Best to use transparent color when the background is interesting or dark, and we don't want to
			// change it drastically
			// This lightens at higher levels of zoom
			var viz = getHighlightVisibilityFactor(),
					alpha;
			viz = Math.min(viz, 2);
			alpha = .11 * viz;
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
			var styles = [ common.getElementComputedStyles(fromElement, '', true) ];
			$(fromElement).parentsUntil(toElement).each(function() {
				styles.push(common.getElementComputedStyles(this, '', true));
			});
			return styles;
		}
 		
 		function isCursorInFixedRects(fixedRects) {
      return !state.lastCursorPos ||
    		     geo.isPointInAnyRect(state.lastCursorPos.x / state.zoom, state.lastCursorPos.y / state.zoom, fixedRects);
    }
		// show mouse highlight (mh.update calls mh.show)
		mh.show = function() {
			// can't find any element to work with
			if (!state.picked) {
				return false;
			}

			state.styles = getAncestorStyles(state.picked.get(0), document.documentElement);
            updateColorApproach(state.styles);

			if (!mh.updateOverlayPosition(true)) {
				// Did not find visible rectangle to highlight
				state.picked = null; // Don't let HLB open for this
				return false;
			}

			mh.updateOverlayColor();
		}

		mh.updateOverlayColor = function() {
			
			var element = state.picked.get(0),
			    hasInterestingBg,
			    backgroundColor,
			    offsetLeft,
			    offsetTop;

			// Approach #1 or #2 -- no change to background of element
			if (state.doUseOverlayForBgColor || !state.doUseBgColor) {
				return false;
			}
			// Approach #3 -- change background
			// In most cases we want the opaque background because the background color on the element
			// can overlap the padding over the outline which uses the same color, and not cause problems
			// We need them to overlap because we haven't found a way to 'sew' them together in with pixel-perfect coordinates
			hasInterestingBg = hasInterestingBackgroundOnAnyOf(state.styles) ||
		                       hasInterestingBackgroundImage(state.styles);
			backgroundColor = hasInterestingBg ? getTransparentBackgroundColor() : getOpaqueBackgroundColor();

			var path = getAdjustedPath(state.pathFillBackground, state.fixedContentRect.left, state.fixedContentRect.top, 1);

			// Get the rectangle for the element itself
			var svgMarkup = '<svg xmlns="http://www.w3.org/2000/svg">'
				+ getSVGForPath(path, 0, 0, backgroundColor)
				+ '</svg>'

			// Use element rectangle to find origin (left, top) of background
			offsetLeft = state.fixedContentRect.left - state.elementRect.left;
			offsetTop = state.fixedContentRect.top - state.elementRect.top;

			state.savedCss = {
				'background-image'      : element.style.backgroundImage,
				'background-position'   : element.style.backgroundPosition,
				'background-origin'     : element.style.backgroundOrigin,
				'background-repeat'     : element.style.backgroundRepeat,
				'background-clip'       : element.style.backgroundClip,
				'background-attachment' : element.style.backgroundAttachment,
				'background-size'       : element.style.backgroundSize
			};

			var newBackgroundImage = "url('data:image/svg+xml;utf8," + svgMarkup + "')";
			// TODO: If IE9 (also 10?), base 64 background image must be done as base64
			// Here's a nice base 64 encoder: http://phpjs.org/functions/base64_encode/
			// background-image: url("data:image/svg+xml;base64,[data]>")
			// If still doesn't work: might need to make sure base64 text ends in enough === that the length
			// is always divisible by 4 ... or that might be a Webkit-only issue, not sure
			$(element).style({
				'background-image': newBackgroundImage,
				'background-origin': 'border-box',
				'background-clip' : 'border-box',
				'background-attachment': 'scroll',
				'background-size': state.fixedContentRect.width + 'px ' + state.fixedContentRect.height + 'px',
			}, '', '!important');

			$(element).style({
				'background-repeat': 'no-repeat',
				'background-position-x': offsetLeft + 'px',
				'background-position-y': offsetTop + 'px'
			}, '', ''); // Not using !important for these because it prevented them from getting cleaned up on mh.hide() in Chrome
		}

		function floatRectForPoint(x, y, expandFloatRectPixels) {
			var possibleFloat = document.elementFromPoint(Math.max(0, x * state.zoom), Math.max(0, y * state.zoom));
			if (possibleFloat && possibleFloat !== state.picked.get(0)) {
				var pickedAncestors = state.picked.parents();
				var possibleFloatAncestors = $(possibleFloat).parents();
				if (pickedAncestors.is(possibleFloat) || possibleFloatAncestors.is(state.picked)) {
					// If potential float is ancestor of picked, or vice-versa, don't use it.
					// We only use a cousin or sibling float.
					return null;
				}
				var commonAncestor = $(possibleFloat).closest(pickedAncestors);
				while (possibleFloat !== commonAncestor && possibleFloat != document.body &&
+            possibleFloat != document.documentElement && possibleFloat != document) {
					if ($(possibleFloat).css('float') !== 'none') {
						var floatRect = possibleFloat.getBoundingClientRect();
						return geo.expandOrContractRect(floatRect, expandFloatRectPixels);
				    }
					possibleFloat = possibleFloat.parentNode;
				}
			}
			return null;
		}
		function getIntersectingFloatRects() {
			var EXTRA = 3; // Make sure we test a point inside where the float would be, not on a margin
			var EXPAND_FLOAT_RECT = 7;
			var left = state.fixedContentRect.left;
			var right = state.fixedContentRect.left + state.fixedContentRect.width;
			var top = state.fixedContentRect.top;
			return {
				// Floats are always aligned with the top of the element they're associated with,
				// so we don't need to support botLeft or botRight floats
				topLeft: floatRectForPoint(left + EXTRA, top + EXTRA, EXPAND_FLOAT_RECT),
				topRight: floatRectForPoint(right - EXTRA, top + EXTRA, EXPAND_FLOAT_RECT)
			};
		}

		function extendAll(array, newProps)
		{
			for (var index = 0; index < array.length; index ++ )
				array[index] = $.extend(array[index], newProps );
			return array;
		}

		function getPolygonPoints(rect) {
			// Build points for highlight polygon
			var orig = geo.expandOrContractRect(rect, 0);
			var floats = state.floatRects;

			var topLeftPoints;
			if (floats.topLeft)
				// Draw around top-left float
				topLeftPoints = [
					{ x: orig.left, y: floats.topLeft.bottom },
					{ x: floats.topLeft.right, y: floats.topLeft.bottom },
					{ x: floats.topLeft.right, y: orig.top}
				];
			else  // No top-left float, just use top-left point
				topLeftPoints = [ {x: orig.left, y: orig.top } ];

			var topRightPoints;
			if (floats.topRight)
				// Draw around top-right float
				topRightPoints = [
					{ x: floats.topRight.left, y: orig.top },
					{ x: floats.topRight.left, y: floats.topRight.bottom },
					{ x: orig.right, y: floats.topRight.bottom }
				];
			else  // No top-right float, just use top-right point
				topRightPoints = [ {x: orig.right, y: orig.top } ];

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

		function getSVGForPath(points, strokeWidth, strokeColor, fillColor) {
			var radius = 3;
			var svgBuilder = '<path d="';
			var count = 0;
			do {
				// Start of vertical line (except for first time)
				var vertCornerDir = (count === 0) ? 1 : (points[count].y > points[count-1].y) ? -1 : 1;
				var horzCornerDir = (points[(count + 1) % points.length].x > points[count].x) ? 1 : -1;
				svgBuilder += (count ? "L " : "M ")  // Horizontal line to start of next curve
					+ (points[count].x) + ' ' + (points[count].y + radius * vertCornerDir) + ' ';
				svgBuilder += "Q "  // Curved corner
					+ points[count].x + ' ' + points[count].y + ' '    // Control point
					+ (points[count].x + radius * horzCornerDir) + ' ' + points[count].y + ' ';
				++ count;

				// Start of horizontal line
				var vertCornerDir = (points[(count + 1) % points.length].y > points[count].y) ? 1 : -1;
				var horzCornerDir = (points[count].x > points[count-1].x) ? -1 : 1;
				svgBuilder += "L "  // Vertical line to start of next curve
					+ (points[count].x + radius * horzCornerDir) + ' ' + points[count].y + ' ';
				svgBuilder += "Q "  // Curved corner
					+ points[count].x + ' ' + points[count].y + ' '    // Control point
					+ points[count].x + ' ' + (points[count].y + radius * vertCornerDir) + ' ';
				++count;
			}
			while (count < points.length);

			svgBuilder += ' Z"' + getSVGStyle(strokeWidth, strokeColor, fillColor) + '/>';
			
			return svgBuilder;
		}

		// For list bullet area, when it is inside margin instead of padding, and thus couldn't be covered with bg image
    function getSVGForExtraLeftPadding(extra) {
      extra *= state.zoom;
      var extraLeft = (state.elementRect.left - state.fixedContentRect.left) * state.zoom;
      if (extraLeft <= 0)
        return "";

      return '<rect x="' + extra + '" y="' + extra +
          '"  width="' + extraLeft + '" height="' + (state.fixedContentRect.height * state.zoom) + '"' +
          getSVGStyle(0, 0, getTransparentBackgroundColor()) + '/>';
    }

		// Update highlight overlay
		// Return false if no valid rect
		// Only update if createOverlay or position changes
		mh.updateOverlayPosition = function(createOverlay) {
			
			var element,
					elementRect,
					fixedRects,
					absoluteRect,
					previousViewRect;

			if (!state.picked) {
				return false;
			}

			element = state.picked.get(0);
			elementRect = element.getBoundingClientRect(); // Rough bounds

			if (!createOverlay) {   // Just a refresh
				if (!state.elementRect) {
					return false; // No view to refresh
				}
				if (elementRect.left === state.elementRect.left &&
					elementRect.top === state.elementRect.top) {
					return true; // Optimization -- return quickly if nothing has changed, don't update overlay
				}
			}

			// Get exact bounds
			fixedRects = positioning.getAllBoundingBoxes(element, 0);
			
			state.zoom = positioning.getTotalZoom(element, true);

			if (!fixedRects.length || !isCursorInFixedRects(fixedRects)) {
        // No valid highlighted content rectangles or cursor not inside of them
        mh.hide();
        return false;
      }

			positioning.combineIntersectingRects(fixedRects, 99999); // Merge all boxes
			state.fixedContentRect = fixedRects[0];
			state.elementRect = $.extend({}, elementRect);
			absoluteRect = positioning.convertFixedRectsToAbsolute([state.fixedContentRect], state.zoom)[0];
			previousViewRect = $.extend({}, state.viewRect);
			state.highlightBorderWidth = getHighlightBorderWidth();
            state.highlightPaddingWidth = state.doUseOverlayForBgColor ? 0 : EXTRA_HIGHLIGHT_PIXELS;
			state.viewRect = $.extend({ }, absoluteRect);
			var extra = state.highlightPaddingWidth + state.highlightBorderWidth;

			if (createOverlay) {
				var ancestorStyles = getAncestorStyles(state.target, element).concat(state.styles);
				state.floatRects = getIntersectingFloatRects();
				state.pathFillBackground = getPolygonPoints(state.fixedContentRect);
				var adjustedPath = getAdjustedPath(state.pathFillBackground, state.fixedContentRect.left - extra, state.fixedContentRect.top - extra, 1/state.zoom);
				state.pathFillPadding = getExpandedPath(adjustedPath, state.highlightPaddingWidth / 2);
				state.pathBorder = getExpandedPath(state.pathFillPadding, state.highlightPaddingWidth /2 + state.highlightBorderWidth /2 );

				// Create and position highlight overlay
				var paddingSVG = getSVGForPath(state.pathFillPadding, state.highlightPaddingWidth, getTransparentBackgroundColor(),
                    state.doUseOverlayForBgColor ? getTransparentBackgroundColor() : null);
				var outlineSVG = getSVGForPath(state.pathBorder, state.highlightBorderWidth, getHighlightBorderColor(), null);
				var extraLeftPaddingSVG = getSVGForExtraLeftPadding(extra);
				var svgFragment = common.createSVGFragment(outlineSVG + paddingSVG + extraLeftPaddingSVG, HIGHLIGHT_OUTLINE_CLASS);
				document.documentElement.appendChild(svgFragment);
				$('.' + HIGHLIGHT_OUTLINE_CLASS)
					.attr({
						'width' : (state.fixedContentRect.width + 2 * extra) * state.zoom,
						'height': (state.fixedContentRect.height + 2 * extra) * state.zoom
					})
					.css('z-index', getMaxZIndex(ancestorStyles) + 1); // Just below stuff like fixed toolbars

				state.isCreated = true;
			}
			else if (JSON.stringify(previousViewRect) === JSON.stringify(state.viewRect)) {
				return true; // Already created and in correct position, don't update DOM
			}

			// Finally update overlay CSS -- multiply by state.zoom because it's outside the <body>
			$('.' + HIGHLIGHT_OUTLINE_CLASS)
				.style({
					'top': ((state.viewRect.top - extra) * state.zoom) + 'px',
					'left': nativeZoom ? ((state.viewRect.left - extra) * state.zoom) + 'px' : state.elementRect.left - extra + 'px'
				}, '', 'important');

			return true;
		}

		mh.update = function(event) {
			// break if highlight is disabled
			if (!mh.enabled) {
				return false;
			}

			if (mh.isSticky && !event.shiftKey) {
			    return false;
			}

			// Pick an element but don't slow down scrolling
			mh.pickTimer && clearTimeout(mh.pickTimer );
			mh.pickTimer  = setTimeout(function() { updateImpl(event) }, 0);
		}

		function updateImpl(event) {
			// don't show highlight if current document isn't active,
			// or current active element isn't appropriate for spacebar command
			testFocus(); // update in case focus changed but no events (e.g. click in content after Chrome extension popup)
			if (!mh.isAppropriateFocus) {
				return;
			}

			state.lastCursorPos = {
				'x': event.clientX,
				'y': event.clientY
			}

			if (state.isCreated && event.target === state.target) {
				// Update rect in case of sub-element scrolling -- we get mouse events in that case
				mh.updateOverlayPosition();
				return;
			}

			// hide highlight for picked element

			var oldState = $.extend({}, state);

			// save picked element
			var picked = picker.find(event.target);

			if (!picked) {
				if (state.picked){
					mh.hideAndResetState();  // Nothing picked anymore
				}
				return;
			}

			if (state.isCreated && picked.is(state.picked)) {  // Same thing picked as before
				mh.updateOverlayPosition(); // Update rect in case of sub-element scrolling
				return;
			}

			mh.hideAndResetState();
			state.picked = $(picked);
			state.target = event.target;
			// show highlight for picked element
			mh.showTimer && clearTimeout(mh.showTimer);
			mh.showTimer = setTimeout(mh.show, 40);
		}

		// refresh status of enhancement on page
		mh.refresh = function() {
	      if (mh.enabled) {
	        // handle mouse move or scroll on body
		    // Necessary to listen to mousewheel event because it bubbles (unlike scroll event)
		    // and there is no delay waiting for the user to stop before the event is fired
	        $(document)
		        .on('mousemove mousewheel', mh.update)
		        .on('focusin focusout', testFocus);
		      $(window)
			      .on('focus', testFocus)
			      .on('blur', onblurwindow)
			      .on('resize', mh.hideAndResetState);
		      } else {
		        // remove mousemove listener from body
		        $(document).off('mousemove mousewheel', mh.update)
			        .off('focusin focusout', testFocus);
			      $(window)
				      .off('focus', testFocus)
				      .off('blur', onblurwindow)
				      .off('resize', mh.hideAndResetState);
		      }
		}

		mh.updateZoom = function(zoom) {
	    zoom = parseFloat(zoom);
			var was = mh.enabled;
	        // The mouse highlight is always enabled when TTS is on.
			mh.enabled = speech.isEnabled() || (zoom >= conf.get('mouseHighlightMinZoom'));
      
      if (mh.isSticky && state.picked) {
        // Reshow sticky highlight on same content after zoom change -- don't reset what was picked
        mh.hide();
        state.lastCursorPos = null; // Don't do cursor-inside-picked-content check, because it may not be after zoom change
        mh.show();
        return;
      }
			
			mh.hideAndResetState();
			
			if (was !== mh.enabled) {
				mh.refresh();
			}
			// If highlighting is enabled, zoom is large enough, zoom is larger
			// than we started, and we haven't already cued, then play an audio
			// cue to explain highlighting
			if (mh.enabled && zoom >= HIGH_ZOOM_THRESHOLD && zoom > mh.initZoom) {
				mh.verbalCue();
			}
		}

		function testFocus() {
			var wasAppropriateFocus = mh.isAppropriateFocus;
			// don't show highlight if current active isn't body
			var target = document.activeElement;
			mh.isAppropriateFocus = (!target || !common.isEditable(target)) && document.hasFocus();
			if (wasAppropriateFocus && !mh.isAppropriateFocus)
				mh.hide();
		}

		function onblurwindow() {
			mh.isAppropriateFocus = false;
			if (!mh.isSticky) {
				mh.hide();
			}
		}

		// enable mouse highlight
		mh.reenableIfAppropriate = function() {
			// handle mouse move on body
			if (mh.enabled) {
				mh.refresh();
				mh.show();
			}
		}

		/*
		 * Play a verbal cue explaining how mouse highlighting works.
		 *
		 * @TODO If we start using verbal cues elsewhere, we should consider
		 *       moving this to the speech module.
		 */
		mh.verbalCue = function() {
			if(shouldPlayFirstHighZoomCue()) {
				speech.cueByKey('verbalCueHighZoom', function() {
	        playedFirstHighZoomCue();
				});
	  	}
		}

		// disable mouse highlight
		mh.disable = function(element) {
			// remove mousemove listener from body
			$(document).off('mousemove', mh.update);

			mh.hide();

		}

		mh.hideAndResetState = function() {
			mh.hide();
			mh.resetState();
		}

		// hide mouse highlight
		mh.hide = function() {
			if (state.picked && state.savedCss) {
				$(state.picked).style(state.savedCss);
				state.savedCss = null;
				if ($(state.picked).attr('style') === '') {
					$(state.picked).removeAttr('style'); // Full cleanup of attribute
				}
			}
			$('.' + HIGHLIGHT_OUTLINE_CLASS).remove();
		}

		mh.resetState = function() {
			if (mh.showTimer) {
				clearTimeout(mh.showTimer);
				mh.showTimer = 0;
			}

			if (mh.pickTimer) {
				clearTimeout(mh.pickTimer);
				mh.pickTimer = 0;
			}

			state = $.extend({}, INIT_STATE); // Copy
		}

		mh.getPicked = function() {
			return state.picked;
		}

		mh.resetState();

		// hide mouse highlight once highlight box appears
		sitecues.on('hlb/create hlb/inflating hlb/ready', mh.disable);

		// hide mouse highlight once highlight box is dismissed
		sitecues.on('hlb/deflating', mh.hide);

		// enable mouse highlight back once highlight box deflates
		sitecues.on('hlb/closed', mh.reenableIfAppropriate);

		// handle zoom changes to toggle enhancement on/off
		conf.get('zoom', mh.updateZoom);

		// lower the threshold when speech is enabled
		sitecues.on('speech/enable', function() {
			conf.set('mouseHighlightMinZoom', MIN_ZOOM);
			mh.updateZoom(conf.get('zoom'));
		});

		// revert the threshold when speech is enabled
		sitecues.on('speech/disable', function() {
			conf.set('mouseHighlightMinZoom', MIN_ZOOM);
			mh.updateZoom(conf.get('zoom'));
		});

		testFocus(); // Set initial focus state

		/**
		 * Toggle Sticky state of highlight
		 * When stick mode is on, shift must be pressed to move highlight
		 */
		sitecues.toggleStickyMH = function () {
			mh.isSticky = !mh.isSticky;
			return mh.isSticky;
		};

		// done
		callback();
	  if (sitecues.tdd) {
	    mh.state = state;
	    mh.INIT_STATE = INIT_STATE;
	    mh.isInterestingBackground = isInterestingBackground;
	    mh.hasInterestingBackgroundOnAnyOf = hasInterestingBackgroundOnAnyOf;
	    mh.updateColorApproach = updateColorApproach;
	    mh.getHighlightVisibilityFactor = getHighlightVisibilityFactor;
	    mh.getHighlightBorderWidth = getHighlightBorderWidth;
	    exports.mh = mh;
  	}
	});

});
