eqnx.def('zoom', function(zoom, callback){

	// values used for zoom math
	zoom.max = 5;
	zoom.min = 1;
	zoom.step = 0.1;
	zoom.default = 1;
	zoom.precision = 0.1;

	// detect if browser support zoom natively
	zoom.native = 'zoom' in document.createElement('div').style;

	// get dependencies
	eqnx.use('jquery', 'conf', function($, conf){

		// use conf module for sharing
		// current zoom level value
		conf.def('zoom', function(value){
			// value is too small
			if (value < zoom.min) return zoom.min;

			// value is too big
			if (value > zoom.max) return zoom.max;

			// use precision to get right value
			value = (value / zoom.precision) * zoom.precision;

			// value have float value
			return parseFloat((value).toFixed(1));
		});

		// define default value for zoom if needed
		if (!conf.get('zoom'))
			conf.set('zoom', $('body').css('zoom') || zoom.default);

		// handle zoom/increase event fired by any module
		eqnx.on('zoom/increase', function(){
			conf.set('zoom', conf.get('zoom') + zoom.step);
		});

		// handle zoom/decrease event fired by any module
		eqnx.on('zoom/decrease', function(){
			conf.set('zoom', conf.get('zoom') - zoom.step);
		});

		// react on any zoom change
		conf.get('zoom', function (value) {

			if (zoom.native){
				// if native zoom is supported, change it
				$('body').css({ zoom: value });
				eqnx.emit('zoom', value);
			} else {
				// native zoom isn't supported, use
				// css3 transforms scale option
				$('body').css({
					'transform': 'scale(' + value + ')',
					'transform-origin': '0 0'
				});
			}

			// notify all about zoom change
			eqnx.emit('zoom', value);

		});

		// done
		callback();

	});

});