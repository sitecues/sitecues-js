sitecues.def('toolbar/slider', function(slider, callback){
		sitecues.use( 'jquery', 'conf', 'util/hammer', function ($, conf, hammer) {

			/**
			 * We're not going to do this automatically as we need to make sure the toolbar is on the page to set up the
			 * listeners properly. Otherwise we'd have to set the .on() methods to document scope which would be a
			 * performance hit.
			 * 
			 * @return void
			 */
			slider.build = function(parent) {
				var dropdownLink = $('<div class="sitecues-dropdown" rel="sitecues-main"><a>sitecues</a></div>').prependTo(parent);
				var menu = $('<div id="sitecues-main" class="sitecues-menu"><ul><li>Link 1</li><li>Link 2</li></div>').appendTo(parent);

				// create small A label
				$( '<div>' ).addClass( 'small' ).text( 'A' ).appendTo(parent);

				// create clider slider.wrap element
				slider.wrap = $( '<div>' ).addClass( 'slider-wrap' ).appendTo(parent);

				// create slider
				slider.slider = $( '<div class="sitecues-slider"></div>').appendTo( slider.wrap );
				var thumb = $( '<div class="sitecues-slider-thumb"></div>').appendTo( slider.slider );



				$( '<img>' ).addClass( 'ramp' ).attr({
						src:    sitecues.resolvesitecuesUrl('../images/panel/slider_ramp.png')
				}).appendTo( slider.wrap );


				// create big A label
				$( '<div>' ).addClass( 'big' ).text( 'A' ).appendTo( parent );
										conf.set( 'zoom', this.value );

														// handle zoom change and update slider
				conf.get( 'zoom', function( value ) {
						slider.slider.val( value );
				});

				var thumbHammer = Hammer(thumb.get(0));
				thumbHammer.on('dragleft dragright', function(e) {
					var sliderWidth = slider.slider.width()
					e.gesture.preventDefault();
					e.stopPropagation();
					var newLeft = e.gesture.touches[0].pageX - slider.slider.offset().left;
					if(newLeft < 0) {
						newLeft = 0;
					} else if (newLeft > sliderWidth) {
						//TODO We could optimize by caching this value, but
						//I'm not sure right now what we would have to do to
						//make sure it stayed accurate (resize, zoom, etc).
						newLeft = sliderWidth;
					}
					zoom = 1.0 + ((newLeft / sliderWidth) * 4.0);
					thumb.css('left', newLeft + "px");
					conf.set('zoom', zoom);
				});

			}



			callback();

		});
});