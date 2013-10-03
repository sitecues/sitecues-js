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
				lastCursorPos: { x: -1, y: -1},
				isCreated: false, // Has highlight been created
				styles: [],
				savedCSS: null,   // map of saved CSS for highlighted element
				elementRect: null,
				fixedContentRect: null,  // Contains the smallest possible rectangle encompassing the content to be highlighted
				// Note however, that the coordinates used are zoomed pixels (at 1.1x a zoomed pixel width is 1.1 real pixels)
				viewRect: null,  // Contains the total overlay rect, in absolute coordinates, in real pixels so that it can live outside of <body>
				doUseBgColor: false,   // was highlight color avoided (in case of single media element just use outline)
				doUseOverlayforBgColor: false  // was an overlay used to create the background color?
			},

			// minimum zoom level to enable highlight
			// This is the default setting, the value used at runtime will be in conf.
      MIN_ZOOM = 1.01,

			// class of highlight
	    HIGHLIGHT_OUTLINE_CLASS = 'sitecues-highlight-outline',
	    HIGHLIGHT_PADDING_CLASS = 'sitecues-highlight-padding',  // An inner border inside outline (not actually using CSS padding)

			// elements which need overlay for background color
	    VISUAL_MEDIA_ELEMENTS = 'img,canvas,video,embed,object,iframe,frame',
	    state;

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
			if ($(state.picked).length > 1) {
				//  approach #1 -- use overlay for background color
				//                 use overlay for rounded outline
				//	pros: one single rectangle instead of potentially many
				//	cons: does not highlight text the way user expects (washes it out)
				//	when-to-use: for article or cases where multiple items are selected
				state.doUseBgColor = true;
				state.doUseOverlayForBgColor = true; // Washes foreground out
			}	else if ($(state.picked).is(VISUAL_MEDIA_ELEMENTS) || !common.isEmptyBgImage(style.backgroundImage)) {
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

		// show mouse highlight (mh.update calls mh.show)
		mh.show = function() {
			// can't find any element to work with
			if (!state.picked) {
				return false;
			}

			state.styles = getAncestorStyles(state.picked.get(0), document.documentElement);

			if (!mh.updateOverlayPosition(true)) {
				return false;  // Did not find visible rectangle to highldight
			}

			mh.updateOverlayColor();
		}

		mh.updateOverlayColor = function() {
			
			var element = state.picked.get(0),
			    highlightOutline = $('.' + HIGHLIGHT_OUTLINE_CLASS),
			    hasInterestingBg,
			    backgroundColor,
			    bgRect,
			    originRect,
			    offsetLeft,
			    offsetTop,
			    canvas,
			    ctx;

			//what approach will we use to update the highlight?
			updateColorApproach(state.styles);
			
			// Approach #1 -- use overlay for bg color
			if (state.doUseOverlayForBgColor) {
				highlightOutline.children().style('background-color', getTransparentBackgroundColor(), '');
				return;
			}
			// Approach #2 -- no bg color
			if (!state.doUseBgColor) {
				return false;
			}
			// Approach #3 -- change background
			// TODO: L shaped highlights near floats when necessary -- don't require the highlight to be rectangular

			// In most cases we want the opaque background because the background color on the element
			// can overlap the padding over the outline which uses the same color, and not cause problems
			// We need them to overlap because we haven't found a way to 'sew' them together in with pixel-perfect coordinates
			hasInterestingBg = hasInterestingBackgroundOnAnyOf(state.styles) ||
		                       hasInterestingBackgroundImage(state.styles);

			backgroundColor = hasInterestingBg ? getTransparentBackgroundColor() : getOpaqueBackgroundColor();

			bgRect = {   // Address gaps by overlapping with extra padding -- better safe than sorry. Looks pretty good
				left: state.viewRect.left - EXTRA_HIGHLIGHT_PIXELS,
				top: state.viewRect.top - EXTRA_HIGHLIGHT_PIXELS,
				width: state.viewRect.width + 2 * EXTRA_HIGHLIGHT_PIXELS,
				height: state.viewRect.height + 2 * EXTRA_HIGHLIGHT_PIXELS
			};
			// Get the rectangle for the element itself
			originRect = positioning.convertFixedRectsToAbsolute([state.elementRect], state.zoom)[0];

			// Use element rectangle to find origin (left, top) of background
			offsetLeft = bgRect.left < originRect.left ? 0 : Math.round(bgRect.left - originRect.left);
			offsetTop = bgRect.top < originRect.top? 0 : Math.round(bgRect.top - originRect.top);

			// Build canvas rectangle
			canvas = document.createElement("canvas");
			$(canvas).attr({'width': bgRect.width, 'height': bgRect.height});
			ctx = canvas.getContext('2d');
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(0, 0, bgRect.width, bgRect.height);

			state.savedCss = {
				'background-image'   : element.style.backgroundImage,
				'background-position': element.style.backgroundPosition,
				'background-origin'  : element.style.backgroundOrigin,
				'background-repeat'  : element.style.backgroundRepeat,
				'background-clip'    : element.style.backgroundClip,
				'background-attachment' : element.style.backgroundAttachment,
				'background-size': element.style.backgroundSize
			};

			$(element).style({
				'background-image': 'url(' + canvas.toDataURL("image/png") + ')',
				'background-origin': 'border-box',
				'background-clip' : 'border-box',
				'background-attachment': 'scroll',
				'background-size': bgRect.width + 'px ' + bgRect.height + 'px',
			}, '', '!important');

			$(element).style({
				'background-repeat': 'no-repeat',
				'background-position-x': offsetLeft + 'px',
				'background-position-y': offsetTop + 'px'
			}, '', ''); // Not using !important for these because it prevented them from getting cleaned up on mh.hide() in Chrome

			// Add a color border as a child of outline so that the background color on element goes beyond element bounds
			// and colors all the way to the outline.
			highlightOutline
				.append('<div>')
				.children()
				.attr('class', HIGHLIGHT_PADDING_CLASS)
				.style({
					'border-left-width': (EXTRA_HIGHLIGHT_PIXELS +.5) * state.zoom + 'px',
					'border-right-width': (EXTRA_HIGHLIGHT_PIXELS +.5) * state.zoom + 'px',
					'border-top-width': (EXTRA_HIGHLIGHT_PIXELS + 1) * state.zoom + 'px',
					'border-bottom-width': (EXTRA_HIGHLIGHT_PIXELS + 1) * state.zoom + 'px',
					'border-color': backgroundColor
				}, '', 'important');
		}

		// Update highlight overlay
		// Return false if no valid rect
		// Only update if createOverlay or position changes
		mh.updateOverlayPosition = function(createOverlay) {
			
			var element,
					elementRect,
					fixedRects,
					absoluteRects,
					previousViewRect,
					highlightBorderWidth,
					extra,
					borderColor;

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

			if (!fixedRects.length) {   // No valid rectangle
				mh.hide();
				return false;
			}

			state.zoom = positioning.getTotalZoom(element, true);
			var x = state.lastCursorPos.x / state.zoom;
			var y = state.lastCursorPos.y / state.zoom;
			if (!geo.isPointInAnyRect(x, y, fixedRects)) {
				mh.hide();
				return false;
			}

			positioning.combineIntersectingRects(fixedRects, 99999); // Merge all boxes
			state.fixedContentRect = fixedRects[0];
			state.elementRect = $.extend({}, elementRect);
			absoluteRects = positioning.convertFixedRectsToAbsolute([state.fixedContentRect], state.zoom);
			previousViewRect = $.extend({}, state.viewRect);
			highlightBorderWidth = getHighlightBorderWidth();

			state.viewRect = $.extend({ 'borderWidth': highlightBorderWidth }, absoluteRects[0]);


			if (createOverlay) {
				var ancestorStyles = getAncestorStyles(state.target, element).concat(state.styles);
				// Create and position highlight overlay
				$('<div>')
					.attr('class', HIGHLIGHT_OUTLINE_CLASS)
					.css('z-index', getMaxZIndex(ancestorStyles) + 1) // Below stuff like fixed toolbars
					.appendTo(document.documentElement);
				state.isCreated = true;
			}
			else if (JSON.stringify(previousViewRect) === JSON.stringify(state.viewRect)) {
				return true; // Already created and in correct position, don't update DOM
			}

			// Finally update overlay CSS -- multiply by state.zoom because it's outside the <body>
			extra = EXTRA_HIGHLIGHT_PIXELS + highlightBorderWidth;
			borderColor = getHighlightBorderColor();

			$('.' + HIGHLIGHT_OUTLINE_CLASS)
				.style({
					'top': ((state.viewRect.top - extra) * state.zoom) + 'px',
					'left': ((state.viewRect.left - extra) * state.zoom) + 'px',
					'width': ((state.viewRect.width + 2 * extra) * state.zoom) + 'px',
					'height': ((state.viewRect.height + 2 * extra) * state.zoom) + 'px',
					'border-width': (state.viewRect.borderWidth * state.zoom) + 'px',
					'border-color': borderColor
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
			if (!mh.isAppropriateFocus) {
				return;
			}

			state.lastCursorPos.x = event.clientX;
			state.lastCursorPos.y = event.clientY;

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
		      } else {
		        // remove mousemove listener from body
		        $(document).off('mousemove mousewheel', mh.update)
			        .off('focusin focusout', testFocus);
			      $(window)
				      .off('focus', testFocus)
				      .off('blur', onblurwindow)
		      }
		}

		mh.updateZoom = function(zoom) {
	    zoom = parseFloat(zoom);
			var was = mh.enabled;
	        // The mouse highlight is always enabled when TTS is on.
			mh.enabled = speech.isEnabled() || (zoom >= conf.get('mouseHighlightMinZoom'));
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
			$('.' + HIGHLIGHT_PADDING_CLASS).remove();
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
