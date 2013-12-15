// Ensure that the body zooms from the origin.
$(document.body).css({transformOrigin:'0 0'})

// Returns the offset of the provided element, with calculations based upon
// getBoundingClientRect().
function _getPosition_boundingBox(selector) {
	// Perform the calculations for all selected elements.
	return forEachSelected(selector, function() {
		var sp = getScrollPosition();
		var bb = this.getBoundingClientRect();
		var position = {
			left:		bb.left + sp.left,
			top:		bb.top  + sp.top,
			_width:		bb.width,
			_height:	bb.height
		};
		
		return position;
	});
}
var getPosition = _getPosition_boundingBox;

// Returns the base position data. Specifically, as transform scaling can
// be (and by default, is) performed from the center of an element, the
// displayed origin corner of the element is not the placement origin
// of the element. 
function _getBasePosition(selector) {
	return forEachSelected(selector, function() {
		var zoom = getZoom(this);

		// The following computation is assuming all transform origins
		// are the default center. Production use would require parsing
		// the transform origin CSS property.

		// Additionally, note that only a transform applied directly
		// to the element can offset it's anchor from it's origin.
		// Inheriting a zoom will not cause such a shift. Thus,
		// only the zoom applied to the element is used in the
		// calculations.

		var bb = this.getBoundingClientRect();
		var baseWidth  = bb.width  / zoom;
		var baseHeight = bb.height / zoom;
		var centerLeft = bb.left + (bb.width  / 2);
		var centerTop  = bb.top  + (bb.height / 2);
		var anchorLeft = centerLeft - (baseWidth / 2);
		var anchorTop  = centerTop  - (baseHeight / 2);

		var basePosition = {
			left: anchorLeft,
			top:  anchorTop,
			_width: 	baseWidth,
			_height:	baseHeight,
			// Deltas of the base origin and perceieved origin.
			_leftDelta:	anchorLeft - bb.left,
			_topDelta:	anchorTop  - bb.top
		};

		return basePosition;
	});
}
var getBasePosition = _getBasePosition;

// Set the offset of the element relative to (0,0).
function _transform_setPosition(selector, position) {
	// The provided position is expected to be normalized (e.g., in non-zoomed pixels)
	forEachSelected(selector, function() {
		var jElement = $(this);

		// The value of getPosition() is also normalized.
		var offsetParent	= jElement.offsetParent();
		var parentPosition	= getPosition(offsetParent);

		// We must use the position anchor for the placement of
		// the element.
		var basePosition = getBasePosition(jElement);

		// We must normalize the pixels we set as left and top by dividing by the desired
		// pixels by the total zoom being applied to the element's *positioning*. The
		// elements positioning is applied to the *offset parent*, not to the
		// current element.
		var positioningZoom = getTotalZoom(offsetParent);

		var left = (position.left + basePosition._leftDelta - parentPosition.left) / positioningZoom;
		var top  = (position.top  + basePosition._topDelta  - parentPosition.top)  / positioningZoom;

		// Set the position, along with some helper styles.
		jElement.css({
			position:	'relative',
			left:		left,
			top:		top,
			opacity:	0.5,
			zIndex:		2147483640
		});
	});
}
var setPosition = _transform_setPosition;

// Returns the center of the provided element.
function _transform_getCenter(selector) {
	return forEachSelected(selector, function() {
		var p = getPosition(this);

		return {
			left: p.left + (p._width  / 2),
			top:  p.top  + (p._height / 2)
		};
	});
}
var getCenter = _transform_getCenter;

// Center another element over a provided center, zooming the centered element if provided.
function _transform_centerOn(selector, center, zoom, keepInView) {
	// Use the proper center.
	center = {
		left : (center.centerX || center.left),
		top  : (center.centerY || center.top)
	};

	// Ensure a zoom value.
	forEachSelected(selector, function() {
		// Ensure a zoom exists, which could be specific to this element.
		var appliedZoom = zoom || getZoom(this);
	
		// Pretty simple at this point. The core work is done in setPosition().		
		var position = getPosition(this);

		var left = center.left - (position._width  / 2);
		var top  = center.top  - (position._height / 2);

		var newPosition = {
			left: left,
			top: top
		};

		// Finally, set the new position and zoom. The setPosition() function does
		// most of the magic.
		setPosition(this, newPosition);
		setZoom(this, appliedZoom);
	});
}
var centerOn = _transform_centerOn;

function _transform_setZoom(selector, zoom) {
	$(selector).css(_transform_applyZoom(zoom));
}

function _transform_applyZoom(zoom, cssObj) {
	cssObj = (cssObj ? cssObj : {})
	cssObj.transform = 'scale(' + zoom + ',' + zoom + ')';
	return cssObj;
}

var _setZoom  = _transform_setZoom;
var applyZoom = _transform_applyZoom; 

// Get the zoom from the selected element's transform style.
var _MATRIX_REGEXP = /matrix\s*\(\s*([-0-9.]+)\s*,\s*[-0-9.]+\s*,\s*[-0-9.]+\s*,\s*([-0-9.]+)\s*,\s*[-0-9.]+\s*,\s*[-0-9.]+\s*\)/i;
function _transform_getZoom(selector) {
	var zoom = 1;
	var jElement = $(selector);
	if (jElement.size()) {
		var transformStr = jElement.css('transform');
		if (transformStr) {
			var result = _MATRIX_REGEXP.exec(transformStr);
			if (result && result.length > 1) {
				var scaleX = parseFloat(result[1]);
				// There is an issue here... what should we do in the case of skewed scaling?
				zoom = scaleX;
			}
		}
	}
	return zoom;
}
var getZoom = _transform_getZoom;

// Get the mouse event coordinates relative to the document origin.
function getMouseCoords(e)
{
	var scrollPosition = getScrollPosition();
	return {
		left: scrollPosition.left + e.clientX,
		top:  scrollPosition.top  + e.clientY
	};
}

// Obtain the scroll position.
function getScrollPosition() {
	return {
		left: window.pageXOffset,
		top:  window.pageYOffset
	};
}

// Obtains the viewport dimensions, with an optional inset.
function getViewport(inset)
{
	inset = inset || window._vpi || 0;
	var insetX2 = inset * 2;
	var scrollPos = getScrollPosition();
	var result = {
		left:   scrollPos.left + inset,
		top:    scrollPos.top  + inset,
		width:  document.documentElement.clientWidth  - insetX2,
		height: document.documentElement.clientHeight - insetX2
	};
	result.right   = result.left + result.width;
	result.bottom  = result.top  + result.height;
	result.centerX = result.left + (result.width  / 2);
	result.centerY = result.top  + (result.height / 2);

	return result;
}

