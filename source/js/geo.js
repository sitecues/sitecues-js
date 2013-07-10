/**
* Methods for giving us coordinates and sizes, where jQuery was not giving us what we needed.
*/
sitecues.def('geo', function(geo, callback, log) {

	sitecues.use('jquery', 'conf', function($, conf){

		// Coordinates relative to <body>
		geo.getAbsolutePosition = function(obj){
			var box = obj.getBoundingClientRect();
			var top = geo.scrollTop();
			var left = geo.scrollLeft();

			return {
				bottom: box.bottom + top,
				height: box.height,
				left: box.left + left,
				right: box.right + left,
				top: box.top + top,
				width: box.width
			}
		}

		// get css3 scale level applied to element
		geo.getScale = function(element){
			var scale = 1, regex = /matrix\((-?\d*\.?\d+),\s*0,\s*0,\s*(-?\d*\.?\d+),\s*0,\s*0\)/;
			$(element).parents().each(function () {
				var match, trans = $(this).css('transform');
				if(match = trans.match(regex)) {
					if(match[1] === match[2]) {
						scale *= parseFloat(match[1]);
					}
				}
			});
			return scale;
		}

		// Coordinates relative to obj.offsetParent
		geo.getOffsetRect = function(obj){
			var jObj = $(obj);
			var jPos = jObj.position();
			var myWindow = window;
			var currZoom = conf.get('zoom');

			// For some reason, this... constant... fixes positioning when the view port is scrolled. I feel
			// like Sir Isaac Newton.
			var universalConstant = currZoom - 1;
			var marginLeft = geo.getStylePixelValue(obj, "marginLeft");
			var marginTop = geo.getStylePixelValue(obj, "marginTop");
			var left = jPos.left + marginLeft - (universalConstant * (myWindow.scrollX / currZoom));
			var top = jPos.top + marginTop - (universalConstant * (myWindow.scrollY / currZoom));
			return {
				left: left,
				top: top,
				width: jObj.width(),
				height: jObj.height()
			}
		}

		geo.getStylePixelValue = function(obj, name){
			var result = null;
			var cssStyles = (window).getComputedStyle(obj);
			if(cssStyles) {
				var valStr = cssStyles[name];
				if(valStr) {
					valStr = valStr.replace(/px$/, "");
					result = parseFloat(valStr);
				}
			}
			return (result ? result : 0);
		}

		// FireFox doesn't support zoom(zoom == undefined). Hence, scrollLeft/scrollTop/windowWidth/windowHeight returned NAN.
		geo.getNativePageZoomLevel = function(){
			var zoom = window.top.document.body.style.zoom;
			return (typeof zoom === 'undefined' || $.trim(zoom) === '') ? 1 : parseFloat(zoom);
		};

		// Need to divide scroll by zoom, at least for Chrome, jQuery's offset() method doesn't do this.
		geo.scrollLeft = function(){
			var zoom = geo.getNativePageZoomLevel();
			return (window.top.pageXOffset || window.top.document.documentElement.scrollLeft) / zoom;
		};

		geo.scrollTop = function(){
			var zoom = geo.getNativePageZoomLevel();
			return (window.top.pageYOffset || window.top.document.documentElement.scrollTop) / zoom;
		};

		geo.windowWidth = function(){
			var zoom = geo.getNativePageZoomLevel();
			return $(window.top).width() / zoom;
		};

		geo.windowHeight = function(){
			var zoom = geo.getNativePageZoomLevel();
			return $(window.top).height() / zoom;
		};

		// done
		callback();

	});

});