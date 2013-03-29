eqnx.def('mouse-highlight', function(mh, callback){

	// minimum zoom level to enable highlight
	mh.minzoom = 1.2;

	// how long mouse ptr needs to pause before we get a new highlight
	mh.delay = 20;

	// depends on jquery, conf and mouse-highlight/picker modules
	eqnx.use('jquery', 'conf', 'mouse-highlight/picker', 'ui', function($, conf, picker){

		// private variables
		var timer;

		// show mouse highlight
		mh.show = function(element){
			// get element to work with
			element = element || mh.picked;

			// can't found any element to work with
			if (!element) return;

			// save styles
			element.addClass('eqnx-highlight');
		}

		// hide mouse highlight
		mh.hide = function(element){
			// get element to work with
			element = element || mh.picked;

			// can't found any element to work with
			if (!element) return;

			// reset styles
			element.removeClass('eqnx-highlight');
		}

		mh.update = function(event){
			// break if highlight is disabled
			if (!mh.enabled) return;

			// clear timeout if it was set
			if (timer) clearTimeout(timer);

			// set new timeout
			timer = setTimeout(function(){
				if (event.target !== mh.target){
					// hide highlight for picked element
					if (mh.picked) mh.hide(mh.picked);

					// save target element
					mh.target = event.target;

					// save picked element
					mh.picked = picker.find(event.target);

					// show highlight for picked element
					if (mh.picked && mh.picked.length)
						mh.show(mh.picked);
				}
			}, mh.delay);
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

		// hide mouse highlight once highlight box appears
		eqnx.on('hlb/ready hlb/create', function(element){
			// remove mousemove listener from body
			$('body').off('mousemove', mh.update);
			mh.hide($(element));
		});

		// enable mouse highlight back once highlight box deflates
		eqnx.on('hlb/closed', function(){
			// handle mouse move on body
			$('body').on('mousemove', mh.update);
		});

		// handle zoom changes to toggle enhancement on/off
		conf.get('zoom', function(zoom){
			var was = mh.enabled;
			mh.enabled = zoom >= mh.minzoom;
			if (was !== mh.enabled) mh.refresh();
		});

		// done
		callback();

	});

});