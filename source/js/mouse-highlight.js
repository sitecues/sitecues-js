eqnx.def('mouse-highlight', function(mh, callback){

	// minimum zoom level to enable highlight
	// This is the default setting, the value used at runtime will be in conf.
	mh.minzoom = 1.01;

	// class of highlight
	mh.kHighlightOverlayClass = 'eqnx-highlight-overlay';

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

	// highlight blacklist
	mh.blacklist = 'input';

	// depends on jquery, conf, mouse-highlight/picker and positioning modules
	eqnx.use('jquery', 'conf', 'mouse-highlight/picker', 'util/positioning', function($, conf, picker, positioning){

		conf.set('mouseHighlightMinZoom', mh.minzoom);

		mh.isBackgroundStyled = function(collection){
			var isBgStyled = false;
			$(collection).each(function () {
				// Is there any background on any element in collection or elements' ancestors or descendants
				if ($(this).css('backgroundImage') !== 'none'){
					isBgStyled = true;
					return false;
				}
				var bgColor = $(this).css('backgroundColor');
				if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgb(255, 255, 255)') {
					isBgStyled = true;
					return false;
				}
			});

			return isBgStyled;
		}

		mh.hasFloatingSibling= function(collection){
			var allSiblings = $(collection).add($(collection).siblings());
			var isNearFloat = false;
			$(allSiblings).each(function(){
				// Is there any background on any element in collection or elements' ancestors or descendants
				if ($(this).css('float') !== 'none'){
					isNearFloat = true;
					return false;
				}
			});

			return isNearFloat;
		}

		// show mouse highlight
		mh.show = function(collection){
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
				mh.isBackgroundStyled(collection))){
				// approach #1 -- overlay for outline only
				mh.doPreventHighlightColor = true;
			} else {
				if ($(collection).length > 1 ||
					$(collection).is(mh.kVisualMediaElements) ||
					$(collection).find(mh.kVisualMediaElements).length ||
					mh.isBackgroundStyled($(collection).add($(collection).parentsUntil(document.body)).add($(collection).find('> *, > * > *'))) ||
					mh.hasFloatingSibling(collection)){
					// approach #2 -- overlay for background color and rounded border
					mh.doUseOverlayForBgColor = true;
				} else {
					// approach #3 -- change css background of element + use overlay for rounded border
					mh.doUseOverlayForBgColor = false;
				}
			}

			// Position each focus rect absolutely over the item which is focused
			for (var count = 0; count < rects.length; count ++){
				var rect = rects[count];
				$('<div>')
					.attr('class', mh.kHighlightOverlayClass)
					.css({
						top: rect.top - 3,
						left: rect.left - 3,
						width: rect.width + 4,
						height: rect.height + 4,
						display: 'block'
					})
					.appendTo(document.body);
			}

			// add highlight color if necessary
			if (!mh.doPreventHighlightColor){
				if (mh.doUseOverlayForBgColor){
					$('.' + mh.kHighlightOverlayClass).css('backgroundColor', mh.kBackgroundColor);
				} else {
					// we only do this for single elements -- multiple items always get the overlay
					var element = collection.get(0);
					mh.savedCss = {
						backgroundColor: element.style.backgroundColor,
						outlineWidth: element.style.outlineWidth,
						outlineStyle: element.style.outlineStyle,
						outlineColor: element.style.outlineColor,
						outlineOffset: element.style.outlineOffset
					};
					$(element).css({
						backgroundColor: mh.kBackgroundColor,
						outlineWidth: '4px',
						outlineStyle: 'solid',
						outlineColor: 'rgba(250, 235, 200, .2)',
						outlineOffset: '-3px'
					});
				}
			}
		}

		// hide mouse highlight
		mh.hide = function(collection){
			if (collection && !mh.doPreventHighlightColor && !mh.doUseOverlayForBgColor && mh.savedCss){
				$(collection).css(mh.savedCss);
				mh.savedCss = null;
			}
			$('.' + mh.kHighlightOverlayClass).remove();
			collection = null;
		}

		mh.update = function(event){
			// break if highlight is disabled
			if (!mh.enabled) return;

			// don't show highlight if current active element
			// is in blacklist
			if ($(document.activeElement).is(mh.blacklist))
				return;

			if (event.target !== mh.target){
				// hide highlight for picked element

				if (mh.picked) mh.hide(mh.picked);

				// save target element
				mh.target = event.target;

				// save picked element
				mh.picked = picker.find(event.target);

				// show highlight for picked element
				if (mh.picked && mh.picked.length){
					mh.show(mh.picked);
				}
			}

		}

		// refresh status of enhancement on page
		mh.refresh = function(){
			if (mh.enabled){
				// handle mouse move on body
				$('body').on('mousemove', mh.update);
			} else {
				// remove mousemove listener from body
				$('body').off('mousemove', mh.update);

				// hide highlight
				mh.hide();
			}
		}

		mh.updateZoom = function(zoom){
			var was = mh.enabled;
			mh.enabled = zoom >= conf.get('mouseHighlightMinZoom');
			if (was !== mh.enabled) mh.refresh();
		}

		// enable mouse highlight
		mh.enable = function(){
			// handle mouse move on body
			$('body').on('mousemove', mh.update);
		}

		// disable mouse highlight
		mh.disable = function(element){
			// remove mousemove listener from body
			$('body').off('mousemove', mh.update);
			mh.hide($(element));
		}

		// hide mouse highlight once highlight box appears
		eqnx.on('hlb/create hlb/inflating hlb/ready', mh.disable);

		// enable mouse highlight back once highlight box deflates
		eqnx.on('hlb/closed', mh.enable);

		// handle zoom changes to toggle enhancement on/off
		conf.get('zoom', mh.updateZoom);

		// lower the threshold when speech is enabled
		eqnx.on('speech/enable', function(){
			conf.set('mouseHighlightMinZoom', 1.00);
			mh.updateZoom(conf.get('zoom'));
		});

		// revert the threshold when speech is enabled
		eqnx.on('speech/disable', function(){
			conf.set('mouseHighlightMinZoom', mh.minzoom);
			mh.updateZoom(conf.get('zoom'));
		});

		// done
		callback();

	});

});
