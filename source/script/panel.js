eqnx.def('panel', function(panel, callback){

	// use jquery, we can rid off this dependency
	// if we will start using vanilla js functions
	eqnx.use('jquery', 'conf', 'ui', function($, conf){

		// timer needed for handling
		// ui mistake - when user occasionally
		// move mouse cursor out of panel
		var timer;

		// panel element
		panel.create = function(){
			// private variables
			var frame, wrap, slider;

			// create element and add element id for proper styling
			frame = $('<div>').attr('id', 'eqnx-panel');

			// create small A label
			$('<div>').addClass('small').text('A').appendTo(frame);

			// create clider wrap element
			wrap = $('<div>').addClass('slider-wrap').appendTo(frame);

			// create slider
			slider = $('<input>').addClass('slider').attr({
				type: 'range',
				min: '1',
				max: '5',
				step: '0.1',
				ariaLabel: 'See it better'
			}).appendTo(wrap);

			// create big A label
			$('<div>').addClass('big').text('A').appendTo(frame);

			// create TTS button
			$('<div>').addClass('tts').appendTo(frame);

			// handle slider value change
			slider.change(function(){
				conf.set('zoom', this.value);
			});

			// handle zoom change and update slider
			conf.get('zoom', function(value){
				slider.val(value);
			});

			// return panel
			return frame;
		}

		// show panel
		panel.show = function(){
			// clear timer if present
			timer && clearTimeout(timer);

			// already shown
			if (panel.element) return;

			// create new panel
			panel.element = panel.create();

			// hide panel when mouse leave panel
			// use small delay just in case of ui mistake
			panel.element.on('mouseleave', function(){
				timer = setTimeout(panel.hide, 1500);
			});

			// append to html
			panel.element.hide().appendTo('html').fadeIn('fast', function(){
				// notify system about shown panel
				eqnx.emit('panel/show', panel.element);
			});
		}

		// hide panel
		panel.hide = function(){
			// nothing to hide
			if (!panel.element) return;

			// hide panel
			panel.element.fadeOut('fast', function(){
				// notify about panel hiding
				eqnx.emit('panel/hide', panel.element);

				// remove element from dom
				panel.element.remove();

				// delete panel element
				panel.element = undefined;
			});
		}

		// setup trigger to show panel
		eqnx.on('badge/hover', panel.show);

		// panel is ready
		callback();

	});

});