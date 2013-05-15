// image view for cursor
sitecues.def('cursor/image', function(cursor, callback){

	// cursor type -> url representation
	var types = {
		'pointer':	sitecues.resolvesitecuesUrl('../images/cursors/pointer-hand.png'),
		'default':	sitecues.resolvesitecuesUrl('../images/cursors/pointer-001.png')
	}

	// get dependencies
	sitecues.use('jquery', 'util/positioning', function($, pos){

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