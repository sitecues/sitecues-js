eqnx.def( 'panel', function( panel, callback ) {

	// use jquery, we can rid off this dependency
	// if we will start using vanilla js functions
	eqnx.use( 'jquery', 'conf', 'speech', 'ui', function( $, conf, speech ) {

		// timer needed for handling
		// ui mistake - when user occasionally
		// move mouse cursor out of panel
		var timer;

		panel.hideDelay = 1000;

		// panel element
		panel.create = function(){
			// private variables
			var frame, wrap, slider, ttsButton;

			// create element and add element id for proper styling
			frame = $( '<div>' ).attr( 'id', 'eqnx-panel' );

			// create small A label
			$( '<div>' ).addClass( 'small' ).text( 'A' ).appendTo(frame);

			// create clider wrap element
			wrap = $( '<div>' ).addClass( 'slider-wrap' ).appendTo(frame);

			// create slider
			slider = $( '<input>' ).addClass( 'slider' ).attr({
				type: 			'range',
				min: 				'1',
				max: 				'5',
				step: 			'0.1',
				ariaLabel: 	'See it better'
			}).appendTo( wrap );

			// create big A label
			$( '<div>' ).addClass( 'big' ).text( 'A' ).appendTo( frame );

			// create TTS button and set it up
			ttsButton = $( '<div>' ).addClass( 'tts' ).appendTo( frame );
			if ( speech.isEnabled() ) {
				ttsButton.data( 'tts-enable', 'enabled' );
			} else {
				ttsButton.addClass( "tts-disabled" );
				ttsButton.data( 'tts-enable', 'disabled' );
			}
			ttsButton.click( function() {
				panel.ttsToggle();
			});

			// handle slider value change
			slider.change( function() {
				conf.set( 'zoom', this.value );
			});

			// handle zoom change and update slider
			conf.get( 'zoom', function( value ) {
				slider.val( value );
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

			// Animate instead of fade
			panel.element.hide().appendTo('html').animate(
				{
					right: '+=0',
					width: 'toggle',
					height: 'toggle',
					opacity: 1.0
				},
				750,
				function() {
					eqnx.emit('panel/show', panel.element);
				});
/*
			// append to html
			panel.element.hide().appendTo('html').fadeIn('fast', function(){
				// notify system about shown panel
				eqnx.emit('panel/show', panel.element);
			});
*/
			panel.element.hover(function() {
				//Hover in
				panel.element.data('hover','true');
			}, function() {
				//Hover out
				panel.element.data('hover','false');
			});
		}

		// hide panel
		panel.hide = function(){
			// nothing to hide
			if (!panel.element) return;

			if(panel.element.data('hover') === 'true' || panel.element.data('badge-hover') === 'true') {
				// We're hovering over the element, delay hiding it
				setTimeout(panel.hide, panel.hideDelay);
				return;
			}
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

		// Function that will toggle tts on or off
		panel.ttsToggle = function() {
			var ttsButton = $('#eqnx-panel .tts');
			if(ttsButton.data('tts-enable') === 'disabled') {
				// It's disabled, so enable it
				eqnx.emit('speech/enable');
				ttsButton.data('tts-enable','enabled');
				ttsButton.removeClass("tts-disabled");
			} else {
				// It's enabled (or unknown), so disable it
				eqnx.emit('speech/disable');
				ttsButton.data('tts-enable','disabled')
				ttsButton.addClass("tts-disabled");
			}
		}

		// setup trigger to show panel
		eqnx.on('badge/hover', function() {
			panel.show();
			panel.element.data('badge-hover','true');
		});

		// setup trigger to show panel
		eqnx.on('badge/leave', function() {
			panel.element.data('badge-hover','false');
			setTimeout(panel.hide, panel.hideDelay);
		});

		// panel is ready
		callback();

	});

});