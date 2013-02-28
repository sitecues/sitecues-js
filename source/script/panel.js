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
			var frame, button, label;

			// create element and add element id for proper styling
			frame = $('<div>').attr('id', 'eqnx-panel');

			// button helper
			button = function(classname, event){
				// create link element
				$('<a>').
					// add all classes
					addClass('eqnx-panel-button ' + classname).

					// handle click
					click(function(){
						eqnx.emit(event, frame);
					}).

					// append to frame
					appendTo(frame);
			}

			// create panel buttons
			button('eqnx-zoomin', 'zoom/increase');
			button('eqnx-zoomout', 'zoom/decrease');
			button('eqnx-tts', 'tts/toggle');

			// add classes to zoom label
			label = $('<span>').addClass('eqnx-panel-label eqnx-zoom').
				html(parseInt((conf.get('zoom') || 1) * 100) + '%').
				appendTo(frame);

			// update label when zoom level is changing
			conf.get('zoom', function(value){
				label.html(parseInt(value * 100) + '%');
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
				timer = setTimeout(panel.hide, 500);
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