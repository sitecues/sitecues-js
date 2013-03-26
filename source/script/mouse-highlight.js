eqnx.def('mouse-highlight', function(mh, callback){

	mh.minzoom = 1.2;
	mh.speed = 100;
	mh.color = '#fcecbc';

	// how long mouse ptr needs to pause before we get a new highlight
	mh.delay = 20;

	// depends on jquery, conf and mouse-highlight/picker modules
	eqnx.use('jquery', 'conf', 'mouse-highlight/picker', function(jquery, conf, picker){

		// private variables
		var timer;

		// show mouse highlight
		mh.show = function(element){
			// get element to work with
			element = element || mh.picked;

			// can't found any element to work with
			if (!element) return;

			// save styles
			mh.styles = [];
			element.each(function(index){
				mh.styles.push(this.getAttribute('style'));
			}).animate({
				backgroundColor: mh.color
			}, mh.speed);
		}

		// hide mouse highlight
		mh.hide = function(element){
			// get element to work with
			element = element || mh.picked;

			// can't found any element to work with
			if (!element) return;

			// stop animation
			element.stop(true, true);

			// reset styles
			element.each(function(index, element){
				var style;

				if (style = mh.styles[index])
					element.setAttribute('style', style)
				else
					$(element).removeAttr('style');
			});
		}

		mh.update = function(event){
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

		// todo: count is hack => improve toggling for mouse highlight; use event queue instead.
		// AK: In the beginning, I used eqnx.on('highlight/inflate') instead
		// but notification came *after* the HLB inflated and this is not what needed here.
		var count = 0;
		// hide mouse highlight once highlight box appears
		eqnx.on('highlight/animate', function (e) {
			if (count % 2 === 0) { // deflate
				// remove mousemove listener from body
				$('body').off('mousemove', mh.update);
				mh.hide();
			} else {
				if (mh.enabled) {
					// handle mouse move on body
					$('body').on('mousemove', mh.update);
				}
			}
			count++;
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