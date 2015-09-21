////////////////////////////////////////////////////////////////////////////////
//
//    HELPER METHODS.
//
////////////////////////////////////////////////////////////////////////////////

// The viewport inset from the window edges.
window._vpi = 30;

// Helper method for processing the possibilty of N results in an array.
// If the array is empty, return undefined. If the array has one element,
// return the single result. Otherwise, return the array of results.
function processResult(array) {
	if (array.length == 0) {
		return undefined;
	}
	if (array.length == 1) {
		return array[0];
	}
	return array;
}

// Helper method to run a function for each element returned by the selector,
// and return the result of processResult() for an array comprising of
// all return values.
function forEachSelected(selector, f) {
	var result = [];
	$(selector).each(function() {
		result.push(f.apply(this));
	});
	return processResult(result);
}

// Left (positive number) and right (negative number) pads a string.
function pad(s, n) {
	s = s + '';
	var left = (n > 0);
	n = Math.abs(n) - s.length;
	if (n > 0) {
		var p = Array(n + 1).join(' ');
		return (left ? p + s : s + p);
	}
	return s;
}

// Convert a left/top/zoom combo to an object.
function toPositionObj(left, top, zoom) {
	zoom = zoom || 1;
	return {
		left: left,
		top: top,
		__zoom: zoom
	};
}

// Returns a string representation of an element.
function eToS(element) {
	if (!element) {
		return 'undefined';
	}
	var jElement = $(element);
	var tagName = (element.tagName ? element.tagName.toLowerCase() : 'unknown');
	var id = jElement.attr('id');
	return tagName + (id ? '#' + id : '');
}

// Sets the zoom of an element, with the body being the default element.
function setZoom(selector, zoom) {
	// If only one arg was passed, it is the zoom to apply to the body.
	if (arguments.length == 1) {
		zoom = selector;
		selector = document.body;
	}
	forEachSelected(selector, function() {
		_setZoom(this, zoom);
	});
}

// Position the 'spot' to the desired offset. The spot is used for visual reference.
// Use 's' + mouse click to place it on the screen.
function setSpotOffset(offsetCssOrX, offsetY) {
	var offsetCss = offsetCssOrX;
	if (typeof offsetY != 'undefined') {
		offsetCss = { left: offsetCssOrX, top: offsetY };
	} else {
		offsetCss = { left: offsetCss.left, top: offsetCss.top };
	}

	$('#spot').css(offsetCss);
	window.positionDisplaySpot.html(offsetCss.left + ' : ' + offsetCss.top);
}

// Position the highlight.
function setHighLight(obj) {
	var borderWidth = parseInt($('#hl').css(['borderWidth']).borderWidth);

	var css = {
		left:	obj.left - borderWidth,
		top:	obj.top  - borderWidth,
		width:	(obj.width  ? obj.width  : obj._width),
		height:	(obj.height ? obj.height : obj._height),
		visibility: 'visible'
	}

	$('#hl').css(css);
}

// Reset the highlight.
function resetHighLight(obj) {
	var css = {
		visibility: 'hidden'
	};

	$('#hl').css(css);
}

// Use getBoundingClientRect() to get the elements' bounding boxes.
function getBoundingBox(selector) {
	return forEachSelected(selector, function() {
		return this.getBoundingClientRect();
	});
}

// Use getBoundingClientRect() to get the elements' bounding boxes.
function getBoundingBox(selector) {
	return forEachSelected(selector, function() {
		return this.getBoundingClientRect();
	});
}

// Get the cumulative zoom for an element.
function getTotalZoom(selector) {
	var _recurse = function(element) {
		if (!element) {
			return 1;
		}
		var value = getZoom(element);
		return (value ? value : 1) * _recurse(element.parentElement);
	};

	return forEachSelected(selector, function() {
		return _recurse(this);
	});
}

// Reset the spot.
function resetSpot()
{
	$('#spot').css({
		width  : 10,
		height : 10
	});
	setSpotOffset(0, 0);
}

////////////////////////////////////////////////////////////////////////////////
//
//  INITIALIZATION LOGIC.
//
////////////////////////////////////////////////////////////////////////////////


/// START: Browser detection (obtained from 3rd party).

// Use of jQuery.browser is frowned upon.
// More details: http://api.jquery.com/jQuery.browser
// jQuery.uaMatch maintained for back-compat
(function(){
	var matched, browser;

	$.uaMatch = function( ua ) {
		ua = ua.toLowerCase();

		var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
		    /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
		    /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
		    /(msie) ([\w.]+)/.exec( ua ) ||
		    ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
		    [];

		return {
		    browser: match[ 1 ] || "",
		    version: match[ 2 ] || "0"
		};
	};

	matched = $.uaMatch(navigator.userAgent);
	browser = {};

	if (matched.browser) {
		browser[matched.browser] = true;
		browser.version = matched.version;
	}

	// Chrome is Webkit, but Webkit is also Safari.
	if (browser.chrome) {
		browser.webkit = true;
	} else if (browser.webkit) {
		browser.safari = true;
	}

	$.browser = browser;
})();

/// END: Browser detection.

// Create and initialize the mouse position display element.
$(document).ready(function() {
	// Determine the proper script for the browser.
	var scriptType = 'default';
	
	// Was actually able to get all tested browsers using the same code! Unbelievable!

	//if ($.browser.msie) {
	//	var version = $.browser.version.split('.', 2)[0];
	//	scriptType = 'ie' + version;
	//}

	// Load the browser specific script.
	$.getScript("impl/" + scriptType + "_positioning.js")
		.done(function(script, textStatus) {
				$('html').prepend(
				'<div id="positionDisplay" style="z-index: 2147483647; position: fixed; left: 0px; top: 0px; width: 100px; height: 18px; border: 1px solid rgb(0, 0, 0); background-color: rgb(224, 224, 224); text-align: center;">0 : 0</div>' +

				'<div id="positionDisplaySpot" style="z-index: 2147483647; position: fixed; left: 104px; top: 0px; width: 400px; height: 18px; border: 1px solid rgb(0, 0, 255); color: rgb(0, 0, 255); background-color: rgb(224, 224, 224); text-align: center;">0 : 0</div>' +

				'<div id="spot" style="z-index: 2147483646; position: absolute; left: 0; top: 0; width: 10px; height: 10px; background-color: rgb(0, 0, 0); opacity: 0.5;"></div>',
				'<div id="hl" style="visibility: hidden; z-index: 2147483646; position: absolute; left: 0; top: 0; width: 100px; height: 100px; background-color: none; opacity: 0.75; border: 5px ridge #FFFF00;"></div>'
			)[0].style.set('cursor', 'crosshair', 'important');
			window.positionDisplay = $('#positionDisplay');
			window.positionDisplayOrig = $('#positionDisplayOrig');
			window.positionDisplaySpot = $('#positionDisplaySpot');
			window.positionDisplayOrigSpot = $('#positionDisplayOrigSpot');

			var setSpot = false;

			$(document).keydown(function(e) {
				if (e.keyCode == 115 || e.keyCode == 83) {
					setSpot = true;
				}
			});

			$(document).keyup(function(e) {
				if (e.keyCode == 115 || e.keyCode == 83) {
					setSpot = false;
				}
			});

			$(document).mousemove(function(e) {
				var pos = window.getMouseCoords(e);
				window.positionDisplay.html(pos.left + ' : ' + pos.top);
			});
			$(document).mousedown(function(e) {
				if (setSpot) {
					var pos = window.getMouseCoords(e);
					window.spot(pos);
				}
			});

			// Set the initial spot position.
			window.setSpotOffset(0, 0);

			// Aliases.
			window.s = JSON.stringify;
			window.p = toPositionObj;			
			window.st = window.scrollTo;
			window.sz = window.jumpTo;
			window.gz = window.getZoom;
			window.gtz = window.getTotalZoom;
			window.spot = window.setSpotOffset;
			window.gc = window.getCenter;
			window.gp = window.getPosition;
			window.sp = window.setPosition;
			window.gbp = window.getBasePosition;
			window.bb = window.getBoundingBox;
			window.co = window.centerOn;
			window.gvp = window.getViewport;
			window.rs = window.resetSpot;
			window.hl = window.setHighLight;
			window.rhl = window.resetHighLight;

			console.log('Successfully loaded ' + scriptType + ' positioning.');
		})
		.fail(function(jqxhr, settings, exception) {
			console.log('Unable to load ' + scriptType + ' positioning.');
		});
});

