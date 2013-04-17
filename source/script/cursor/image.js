// image view for cursor
eqnx.def('cursor/image', function(cursor, callback){

	// cursor type -> url representation
	var types = {
		'pointer':	'//ai2.s3.amazonaws.com/assets/cursors/pointer-hand.png',
		'default':	'//ai2.s3.amazonaws.com/assets/cursors/pointer-001.png'
	}

	// get dependencies
	eqnx.use('jquery', 'util/positioning', function($, pos){

		// handle cursor type changes
		cursor.type = function(element, type){
			// get image url for cursor type
			var url = types[type] || types.default;

			// get pure DOM element ref
			element = element[0] || element;

			// update element url
			if (element.src !== url)
				element.src = url;
		}

		// handle cursor size changes
		cursor.zoom = function(element, zoom){
			pos.setZoom(element, zoom, { x: 0, y: 0 });
		}

		// done
		callback();

	});

});