// canvas view for cursor
sitecues.def('cursor/canvas', function(cursor, callback){

	// private variables
	var data, types, paint;

	// cursor image data
	data = {
		color:	'#000',
		stroke:	'#fff',
		shadow:	'#000',
		size:	15
	}

	// cursor types
	types = {
		'auto'   :  'A',
		'default':	'A',
		'text'   :  'A',
		'pointer':	'B'

	}

	paint = function(type) {
		var canvas = document.createElement('canvas'),
			span = document.createElement('span'),
			divHolder = document.createElement('div'),
			body = document.body,
			spanWidth, spanHeight,
			text = types[type] || types['default'];

		span.innerHTML = text;
		span.style.fontSize = data.size + 'px';
		divHolder.style.fontFamily = 'sitecues-cursor';
		divHolder.appendChild(span);
		body.appendChild(divHolder);

		// span width and height
		spanWidth = span.offsetWidth;
		spanHeight = span.offsetHeight;
		body.removeChild(divHolder);

		if (canvas && canvas.getContext){
			var ctx = canvas.getContext('2d'),
				lineWidth = 3,
				shadowBlur = 10,
				size = data.size,
				canvasWidth, canvasHeight;

			if (data.size < 60){
				lineWidth = 2;
				shadowBlur = 5;
			}

			canvasWidth  = spanWidth + 2 * lineWidth + shadowBlur;
			canvasHeight = spanHeight + 2 * lineWidth + shadowBlur;

			// set main canvas element width and height
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;

			// set necessary cursor settings
			ctx.textBaseline = 'top';
			ctx.font = size + 'px sitecues-cursor';
			ctx.lineWidth = lineWidth;

			// cursor color settings
			ctx.fillStyle = data.color;
			ctx.strokeStyle = data.stroke;

			// shadow settings
			ctx.shadowColor = data.shadow;
			ctx.shadowOffsetX = lineWidth;
			ctx.shadowOffsetY = lineWidth;
			ctx.shadowBlur = shadowBlur;

			// create letter
			ctx.fillText(text, lineWidth/2, lineWidth);

			// clear the shadow
			ctx.shadowColor = 0;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			ctx.shadowBlur = 0;

			// restroke without the shadow
			ctx.strokeText(text, lineWidth/2, lineWidth);

			return canvas.toDataURL();
		}
	}

	// get dependencies
	sitecues.use('jquery', 'load', 'conf', function($, load, conf){

		// private variables
		var wait, images;

		// wait for font loading
		wait = function(name, callback){
			// private variables
			var span, width, height, interval, times;

			// make polling max running
			times = 100;

			// hide span
			span = $('<span>').css({
				position: 'absolute',
				visibility: 'hidden'
			}).text('A').appendTo('body');

			// remember span size
			width = span.width();
			height = span.height();

			// set font-family
			span.css('font-family', name);

			// setup polling for changes
			interval = setInterval(function(){
				if (!times-- || span.width() !== width || span.height() !== height){
					clearInterval(interval);
					span.remove();
					callback();
				}
			}, 100);
		}

		// repaint cursor images
		cursor.repaint = function() {
			images = {};

			for(var type in types)
				if (types.hasOwnProperty(type))
					images[type] = paint(type);
		}

		// set cursor type
		cursor.getImageOfType = function(type){
			// save type
			data.type = type;
			// get image url for cursor type
			return images[type] || images['default'];
		}

		// keep the compatibily for /element.js
		// todo: remove or modify the code?
		cursor.type = function(element, type){
			// save type
			data.type = type;
			// get image url for cursor type
			var url = images[type] || images['default'];
			// get pure DOM element ref
			element = element[0] || element;
			// reset style height
			element.style.height = 'auto';
			// update element url
			if (element.src !== url)
				element.src = url;
		}

		// set cursor zoom
		// todo: remove or modify the code?
		cursor.zoom = function(element, zoom){
			data.size = 15 * Math.sqrt(zoom);
			cursor.repaint();
			cursor.type(element, data.type);
		}

		// set cursor zoom
		cursor.zoomImage = function(zoom) {
			data.size = 15 * Math.sqrt(zoom);
			cursor.repaint();
		}

		// load special cursor css
		load.style('../css/cursor.css', function(){
			wait('sitecues-cursor', function(){
				cursor.repaint();
				callback();
			});
		});
	});
});
