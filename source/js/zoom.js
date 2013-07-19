sitecues.def('zoom', function (zoom, callback, log) {

	// Values used for zoom math
	zoom.max = 5;
	zoom.min = 1;
	zoom.step = 0.1;
	zoom['default'] = 1;
	zoom.precision = 0.1;

	zoom.toolbarWidth = 0;

	// Calculate the zoom range. This calc is used throughout library. Easier to do here only.
	zoom.range = zoom.max - zoom.min;

	// detect if browser support zoom natively
	zoom['native'] = 'zoom' in document.createElement('div').style;

	zoom.documentHasScrollbar = false;


	// Handle the appearing/dissapearing vertical scrollbar in document (changes document width)
	zoom.checkForScrollbar = function () {

    var scrollbarWidth = window.innerHeight-document.documentElement.clientHeight;

    if (scrollbarWidth>0) {
    	zoom.storedScrollbarWidth = scrollbarWidth;
    }

    // TODO: Replace this try-catch with some better logic
		try{ 
		
			var currentToolbarWidth = $('#sitecues-BWCG').get(0).getBoundingClientRect().width;

			// console.log([ 'currentToolbarWidth: ' + currentToolbarWidth, 'winDocHeightDiff: ' 		+ winDocHeightDiff, 'window.innerWidth: ' 	+ window.innerWidth ]);
		}catch(e){

		}

  	// Check whether a scrollbar has appeared in the document now zoom has changed
    if (currentToolbarWidth && currentToolbarWidth < window.innerWidth && scrollbarWidth > 0) {

    	// If scrollbar was not present during last resize...
    	if (zoom.documentHasScrollbar === false) {

    		// Set the zoom scrollbar boolean ready for next resize check
    		zoom.documentHasScrollbar = true;

    		// Emit the scrollbar show event to subscribers as the doc now has scrollbar
    		sitecues.emit('zoom/documentScrollbarShow', scrollbarWidth);

    	}
    
    } else if ((currentToolbarWidth && currentToolbarWidth >= window.innerWidth) || scrollbarWidth === 0) {
			
			// If scrollbar was present during last resize...
    	if (zoom.documentHasScrollbar === true) {
    		
				// Emit the scrollbar hide event to subscribers as the doc scrollbar is gone
    		sitecues.emit('zoom/documentScrollbarHide', zoom.storedScrollbarWidth);

    		// Set the zoom scrollbar boolean ready for next resize check
    		zoom.documentHasScrollbar = false;

    	}
    	
    }

  };


	// get dependencies
	sitecues.use('jquery', 'conf', 'ui', function($, conf) {
        
    var $body = $('body');

		// use conf module for sharing
		// current zoom level value
		conf.def('zoom', function(value) {

			var value = parseFloat(value);

			//console.log( 'zoom.js: '+value );

			// value is too small
			if (value < zoom.min){
				return zoom.min;
			}

			// value is too big
			if (value > zoom.max){
				return zoom.max;
			}

			// use precision to get right value
			value = (value / zoom.precision) * zoom.precision;

			// value have float value
			return value.toFixed(1);
		});

		// define default value for zoom if needed
		if (!conf.get('zoom')) {
			conf.set('zoom', $body.css('zoom') || zoom['default']);
		}

		// handle zoom/increase event fired by any module
		sitecues.on('zoom/increase', function() {
			var zoomVal = conf.get('zoom') + zoom.step;
			conf.set('zoom', zoomVal);
		});

		// handle zoom/decrease event fired by any module
		sitecues.on('zoom/decrease', function() {
			var zoomVal = conf.get('zoom') - zoom.step;
			conf.set('zoom', zoomVal);
		});

		// react on any zoom change
		conf.get('zoom', function (value) {

			if (zoom['native']) {

				// if native zoom is supported, change it
				$body.style({zoom: value}, '', 'important');
				sitecues.emit('zoom', value);

			} else {

				// native zoom isn't supported, use
				// css3 transforms scale option
				
				$body.style({
					'transform': 'scale(' + value + ')',
					'transform-origin': '0 0'
				}, '', 'important');

			}

      zoom.checkForScrollbar();

			// notify all about zoom change
			sitecues.emit('zoom', value);

		});

		// done
		callback();

	});

});