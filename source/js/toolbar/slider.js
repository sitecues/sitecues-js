sitecues.def('toolbar/slider', function(slider, callback, log){

    slider.imagePath = '../../images/toolbar/toolbar-slider-thumb.png';
	sitecues.use( 'jquery', 'conf', 'util/hammer', function ($, conf, hammer) {

		sitecues.on('toolbar/slider/update-position', function(zoom) {
			slider.moveOnZoom(zoom);
		});

		/**
		 * We're not going to do this automatically as we need to make sure the toolbar is on the page to set up the
		 * listeners properly. Otherwise we'd have to set the .on() methods to document scope which would be a
		 * performance hit.
		 * 
		 * @return void
		 */

		slider.build = function(parent) {
			// create clider slider.wrap element
			slider.wrap = $( '<div>' ).addClass( 'slider-wrap' ).appendTo(parent);

			// create slider
			slider.slider = $( '<div class="sitecues-slider"></div>').appendTo( slider.wrap );
			slider.thumb = $( '<img class="sitecues-slider-thumb"/>')
                            .attr('src', slider.imagePath)
                            .appendTo( slider.slider );

			conf.set( 'zoom', this.value );

			// handle zoom change and update slider
			conf.get( 'zoom', function( value ) {
				slider.slider.val(value);
				
				//slider.moveThumb(xPos);
				slider.moveOnZoom(value);
			});


			var thumbHammer = Hammer(slider.thumb.get(0));
			thumbHammer.on('dragleft dragright', function(e) {
				e.gesture.preventDefault();
				e.stopPropagation();
				var pos = slider.moveThumb(e.gesture.touches[0].pageX);
				slider.updateZoom( pos );
			});

			slider.slider.click(function(e) {
				e.preventDefault();
				e.stopPropagation();
				var pos = slider.moveThumb(e.clientX);
				slider.updateZoom( pos );
			});

		}

		slider.repaint = function(toolbar) {
			var wrapHeight = slider.wrap.height();
			slider.wrap.css('width', (wrapHeight * 4) + 'px');
		},

		// This function updates the slider position when a zoom level is passed to it
		slider.moveOnZoom = function( zoom ){
			var sliderWidth = slider.slider.width()
				,	left = slider.slider.offset().left
				
				// NOTE: 'magic-numbers'...
				// 4 = the range of zoom, ie: the difference between min and max
				// 1 = the minimum zoom level
				, xPos = (sliderWidth / 4 * (zoom-1)) + left
				;
			slider.moveThumb(xPos);
		};

		slider.moveThumb = function(x) {
			//console.log('moveThumb: '+x);	
			var sliderWidth = slider.slider.width();
			var newLeft = x - slider.slider.offset().left;
			if(newLeft < 0) {
				newLeft = 0;
			} else if (newLeft > sliderWidth) {
				//TODO We could optimize by caching this value, but
				//I'm not sure right now what we would have to do to
				//make sure it stayed accurate (resize, zoom, etc).
				newLeft = sliderWidth;
			}
			slider.thumb.css('left', newLeft + "px");
			return newLeft;
		},

		slider.updateZoom = function(pos){
			var sliderWidth = slider.slider.width();
			zoom = 1.0 + ((pos / sliderWidth) * 4.0);
			conf.set('zoom', zoom);
		},

		sitecues.on("toolbar/resized", function(toolbar) {
			slider.repaint(toolbar);
		});

		callback();

	});
});