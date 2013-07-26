sitecues.def('mouse-highlight', function(mh, callback, console) {

  // Tracks if the user has heard the "first high zoom" cue.
  var FIRST_HIGH_ZOOM_PARAM = "firstHighZoom";
  // The high zoom threshold.
  var HIGH_ZOOM_THRESHOLD = 2;
  // Time in millis after which the "first high zoom" cue should replay.
  var FIRST_HIGH_ZOOM_RESET_MS = 7 *86400000; // 7 days

  // minimum zoom level to enable highlight
	// This is the default setting, the value used at runtime will be in conf.
	mh.minZoom = 1.01;

	// class of highlight
	mh.kHighlightOverlayClass = 'sitecues-highlight-overlay';

	// was highlight color avoided (in case of single media element just use outline)
	mh.doPreventHighlightColor = false;

	// was an overlay used to create the background color?
	mh.doUseOverlayForBgColor = false;

	// background color
	mh.kBackgroundColor = 'rgba(250, 235, 200, 0.2)';

	// saved CSS for highlighted element
	mh.savedCss = [];

	// adjacent paragraph rects are combined (for reading of articles / sections)
	mh.kPixelsBeforeRectsCombined = 25;

	// elements which need overlay for background color
	mh.kVisualMediaElements = 'img,canvas,video,embed,object,iframe,frame';

	// this is the initial zoom level, we're only going to use the verbal cue if someone increases it
	mh.initZoom = 0;
    
   var defaultToolbarHeight = 40;

  // Chrome returns an rgba color of rgba(0, 0, 0, 0) instead of transparent.
    // http://stackoverflow.com/questions/5663963/chrome-background-color-issue-transparent-not-a-valid-value
    // Array of what we'd expect if we didn't have a background color
    var transparentColorNamesSet = [
        'transparent',
        'rgba(0, 0, 0, 0)',
        'rgb(255, 255, 255)'
    ];

	// depends on jquery, conf, mouse-highlight/picker and positioning modules
	sitecues.use('jquery', 'conf', 'mouse-highlight/picker', 'util/positioning', 'util/common', 'speech', function($, conf, picker, positioning, common, speech) {

		conf.set('mouseHighlightMinZoom', mh.minZoom);
    // EQ-734: temporarily fix for MH since toolbar is now stored in user pref and thus has incorrect initial state.
    // TODO: remove when 'toolBarVisible' is no longer overriden, as disacussed in comment to EQ-734.
    conf.set('toolBarVisible', false);

		// Remember the initial zoom state
		mh.initZoom = conf.get('zoom');

		mh.isBackgroundStyled = function(collection) {
			var isBgStyled = false;
			$(collection).each(function () {
				// Is there any background on any element in collection or elements' ancestors or descendants
				if ($(this).css('background-image') !== 'none') {
					isBgStyled = true;
					return false;
				}
				var bgColor = $(this).css('background-color');
                // If no match then $.inArray() returns '-1' value
				if ($.inArray(bgColor, transparentColorNamesSet) < 0) {
					isBgStyled = true;
					return false;
				}
			});

			return isBgStyled;
		}

		mh.hasFloatingSibling = function(collection) {
			var allSiblings = $(collection).add($(collection).siblings());
			var isNearFloat = false;
			$(allSiblings).each(function() {
				// Is there any background on any element in collection or elements' ancestors or descendants
				if ($(this).css('float') !== 'none') {
					isNearFloat = true;
					return false;
				}
			});

			return isNearFloat;
		}

		// show mouse highlight
		mh.show = function(collection) {
			// get element to work with
			collection = collection || mh.picked;

			// can't found any element to work with
			if (!collection) return;

			var rects = positioning.getAllBoundingBoxes(collection, mh.kPixelsBeforeRectsCombined);

			// Multi-pronged approach.
			// Determine which of the following approaches to use:
			// 1. No background color, just outline
			//	pros: does not interfere with media
			//	cons: does not highlight text the way user expects
			//	when-to-use: on lone media elements
			// 2. overlay (absolutely positioned DOM element) for bg color (note: overlay still used for rounded outline)
			//	pros: works over any collection of elements
			//	cons: washes out foreground text (harder to read)
			//	when-to-use: when CSS background changes would cause problems, e.g.
			//		highlighting multiple elements, existing backgrounds, floats, media
			// 3. styling background (change the background-color + use overlay for rounded outline)
			//	pros: foreground text does not get washed out
			//	cons: creates discontiguous areas so does not work when > 1 elements to be highlighted,
			//		does not work well when there is a background or background image
			//		when-to-use: whenever we can without breaking -- this is the preferred approach
			mh.doPreventHighlightColor = false;
			mh.doUseOverlayForBgColor = false;
			if (collection.length === 1 && ($(collection).is(mh.kVisualMediaElements) ||
				mh.isBackgroundStyled(collection))) {
				// approach #1 -- overlay for outline only
				mh.doPreventHighlightColor = true;
			} else {
				if ($(collection).length > 1 ||
					$(collection).is(mh.kVisualMediaElements) ||
					$(collection).find(mh.kVisualMediaElements).length ||
					mh.isBackgroundStyled($(collection).add($(collection).parentsUntil(document.body)).add($(collection).find('> *, > * > *'))) ||
					mh.hasFloatingSibling(collection)) {
					// approach #2 -- overlay for background color and rounded border
					mh.doUseOverlayForBgColor = true;
				} else {
					// approach #3 -- change css background of element + use overlay for rounded border
					mh.doUseOverlayForBgColor = false;
				}
			}

            // Take into calculations toolbar's height as it shifts elements position.
            // TODO: once toolbar is completed, remove this
            // repeated code(line below is used accross the files) to a correspondent util module.
            var toolBarHeight = $('body').css('position') !== 'static' && conf.get('toolbarEnabled') && conf.get('toolBarVisible')
                ? conf.get('toolbarHeight') || defaultToolbarHeight / (conf.get('zoom') || 1)
                : 0;

			// Position each focus rect absolutely over the item which is focused
			for (var count = 0; count < rects.length; count ++) {
				var rect = rects[count];
				$('<div>')
					.attr('class', mh.kHighlightOverlayClass)
					.style({
						'top': rect.top - 3 - toolBarHeight + 'px',
						'left': rect.left - 3 + 'px',
						'width': rect.width + 4 + 'px',
						'height': rect.height + 4 + 'px',
						'display': 'block'
					}, '', '')
					.appendTo(document.body);
			}

			// add highlight color if necessary
			if (!mh.doPreventHighlightColor) {
				if (mh.doUseOverlayForBgColor) {
					$('.' + mh.kHighlightOverlayClass).style('background-color', mh.kBackgroundColor, '');
				} else {
					// we only do this for single elements -- multiple items always get the overlay
					var element = collection.get(0);
                    var style = common.getElementComputedStyles(element, '', true);
					mh.savedCss = {
						'background-color': style.backgroundColor,
						'outline-width'   : style.outlineWidth,
						'outline-style'   : style.outlineStyle,
						'outline-color'   : style.outlineColor,
						'outline-offset'  : style.outlineOffset
					};
					$(element).style({
						'background-color': mh.kBackgroundColor,
						'outline-width'   : '4px',
						'outline-style'   : 'solid',
						'outline-color'   : 'rgba(250, 235, 200, .2)',
						'outline-offset'  : '-3px'
					}, '', '');
				}
			}
		}

		// hide mouse highlight
		mh.hide = function(collection) {
			if (collection && !mh.doPreventHighlightColor && !mh.doUseOverlayForBgColor && mh.savedCss) {
				$(collection).style(mh.savedCss, '', '');
				mh.savedCss = null;
			}
			$('.' + mh.kHighlightOverlayClass).remove();
			collection = null;
		}

		mh.update = function(event) {
			// break if highlight is disabled
			if (!mh.enabled) return;

			// don't show highlight if current active isn't body
			if (!$(document.activeElement).is('body')) {
                return;
            }

			// don't show highlight if window isn't active
			if (!document.hasFocus()) {
                return;
            }
		    
            // hide previous mh target if now mouseiver sitecues toolbar
            var isInBody = false;
            $.each($(event.target).parents(), function(i, parent) {
                if ($(parent).is(document.body)) {
                    isInBody = true;
                }
            })
 
            if (!isInBody) {
                if (mh.picked) {
                    mh.hide(mh.picked);
                }
            }
 
			if (event.target !== mh.target) {
				// hide highlight for picked element

				if (mh.picked) {
                    mh.hide(mh.picked);
                }

				// save target element
				mh.target = event.target;

				// save picked element
				mh.picked = picker.find(event.target);

				// show highlight for picked element
				if (mh.picked && mh.picked.length) {
					mh.timer && clearTimeout(mh.timer);
					mh.timer = setTimeout(function() {
						mh.show(mh.picked);
					}, 100);
				}
			}

		}

		// refresh status of enhancement on page
		mh.refresh = function() {
			if (mh.enabled) {
				// handle mouse move on body
				$(document).on('mousemove', mh.update);
			} else {
				// remove mousemove listener from body
				$(document).off('mousemove', mh.update);
			}
		}

		mh.updateZoom = function(zoom) {
            zoom = parseFloat(zoom);
			var was = mh.enabled;
      // The mouse highlight is always enabled when TTS is on.
			mh.enabled = speech.isEnabled() || (zoom >= conf.get('mouseHighlightMinZoom'));
			mh.hide(mh.picked);
			if (was !== mh.enabled) {
				mh.refresh();
			}
			mh.picked = null;
			mh.target = null;
			// If highlighting is enabled, zoom is large enough, zoom is larger
			// than we started, and we haven't already cued, then play an audio
			// cue to explain highlighting
			if (mh.enabled && zoom >= HIGH_ZOOM_THRESHOLD && zoom > mh.initZoom) {
				mh.verbalCue();
			}
		}

		// enable mouse highlight
		mh.enable = function() {
			// handle mouse move on body
			$(document).on('mousemove', mh.update);
		}

    /**
     * Returns true if the "first high zoom" cue should be played.
     * @return {boolean}
     */
    var shouldPlayFirstHighZoomCue = function() {
      var fhz = conf.get(FIRST_HIGH_ZOOM_PARAM);
      return (!fhz || ((fhz + FIRST_HIGH_ZOOM_RESET_MS) < (new Date()).getTime()));
    };

    /**
     * Signals that the "first high zoom" cue has played.
     */
    var playedFirstHighZoomCue = function() {
      conf.set(FIRST_HIGH_ZOOM_PARAM, (new Date()).getTime());
    };

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
			mh.hide($(element));
		}

		// Deselect the current highlighted element.
		mh.unpick = function() {
			mh.picked = null;
		}

		// hide mouse highlight once highlight box appears
		sitecues.on('hlb/create hlb/inflating hlb/ready', mh.disable);

		// hide mouse highlight once highlight box is dismissed
		sitecues.on('hlb/deflating', mh.unpick);

		// enable mouse highlight back once highlight box deflates
		sitecues.on('hlb/closed', mh.enable);

		// handle zoom changes to toggle enhancement on/off
		conf.get('zoom', mh.updateZoom);

		// lower the threshold when speech is enabled
		sitecues.on('speech/enable', function() {
			conf.set('mouseHighlightMinZoom', mh.minZoom);
			mh.updateZoom(conf.get('zoom'));
		});

		// revert the threshold when speech is enabled
		sitecues.on('speech/disable', function() {
			conf.set('mouseHighlightMinZoom', mh.minZoom);
			mh.updateZoom(conf.get('zoom'));
		});

		// hide mouse hightlight when user leave window
		$(window).blur(function() {
            mh.hide(mh.picked);
        });

		// done
		callback();

	});

});
