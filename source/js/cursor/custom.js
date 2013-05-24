/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - creates, inserts in DOM and shows in the window the custom cursor;
 * - hides the existing cursor when custom cursor is visible so that there are not two cursors;
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
sitecues.def('cursor/custom', function (cursor, callback) {

	// Static properties
	cursor.isEnabled = false; // if cursor module is enabled
	cursor.zoomLevel = 1;
	cursor.type = 'default';
	cursor.prevTarget = {};
	cursor.prevType = 'default';
	// Sefault data url string
	cursor.url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAaCAYAAAC3g3x9AAAB+klEQVRIS+2UPUvDQBzGe219ado6qHR0KP0QDoJSQRFHJ8HRtXR3cBI/QLfiKgo6OQp2dhG/QSmFKmqwviSm0TatzwOXkkvSQKE4efBwudzd7//KidiEh5gwL/Z3wMFgsCmEuB43glAPAbsBaB1qAlqQ0AHmPsR55AgDin6/bwM0zVu6rpdyudyphH1j/omCBoCO45zF4/Fd14VOp3OvadoO1j3oE/qCnFEuBoAIt4nDS+4FGDCTyeQK1vTuHXqT36FMBdjr9fYTicSJ/2S9Xr8qFApH+N9mFiBzVNgKELm7Re6WCQS8Dc/m+W2aZiubze5J754kmCkIDC9QKYb/ZKVSOSyXyzX8f4QItSOB/mL4Dzcajbt8Pn8ggS3MBsQ2UsbQQxTjAztzoZnGz263a1Wr1eNSqcRmf4BeIbaQCvQ0sbohRBG5u0in04veDdu2n1Op1JoMm8VhCw2bnXmroRDFgCUhNgzDOM9kMgvePcuydBjZll6yjZjLYegiwsNVXL6ENzkvEI3+gkbfkh4GgdiIQymZPw1zEkpICEOZgmblzJwzRIbKHEYCMzgwA7mFYp91PQYJpTEaYTFYRFZaDVle4GF6yQfBD+SaXtKYC6ShjlQAyAsMkWL47nCfK6753xXXLAJDZxTKk/Z3L7bH07E+/z0cK12hh38BlI3AG1Ei3IIAAAAASUVORK5CYII=";

	// Constants
	cursor.kCursorStyleRuleId = 'sitecues-cursor-style-rule';
	// Set custom cursor image for disabled elements
	cursor.kCursorStyleDisabledRuleId  = 'sitecues-cursor-disabled-rule';
	cursor.kCursorId = 'sitecues-cursor';
	cursor.kMinCursorZoom = 1.1;

	// get dependencies
	sitecues.use('jquery', 'conf', 'cursor/style', 'cursor/canvas', 'ui', function ($, conf, style, view) {

		// private variables
		cursor.styleRuleParent = $('head');
		cursor.isEnabled = false;

		/*
		 * Initialize cursor according to zoom level given.
		 */
		cursor.init = function(value) {
			cursor.zoomLevel = value * value;
			var cursorWasEnabled = cursor.isEnabled;
			cursor.isEnabled = cursor.zoomLevel >= cursor.kMinCursorZoom;

			if (cursor.isEnabled) {
				view.zoomImage(cursor.zoomLevel);
				cursor.url = view.getImageOfType(cursor.type);
				if (cursorWasEnabled)
					cursor.update();
				else
					cursor.show();
			} else {
				cursor.hide();
			}
		};

		/*
		 *  Show custom cursor in the viewport.
		 */
		cursor.show = function() {
			// Add rules for default cursor values.
			cursor.styleRuleParent
				.append('<style id="' + cursor.kCursorStyleRuleId + '">* { cursor: url("' + cursor.url + '"), ' + cursor.type +'}')
				.append('<style id="' + cursor.kCursorStyleDisabledRuleId + '">*:disabled { cursor: url("' + view.getImageOfType('default') + '"), default}');
			$(window).on('mousemove click', mouseMoveHandler);
			sitecues.emit('cursor/show');
		};

		/*
		 *  Update cursor properties, such as dimensions or color.
		 */
		cursor.update = function() {
			// Target is not changed, so update the same element's cursor style.
			$(cursor.prevTarget).css('cursor', 'url("' + cursor.url + '"), ' + cursor.type);
			// Update cursor image for disabled elements.
			$('#' + cursor.kCursorStyleDisabledRuleId).remove();
			cursor.styleRuleParent.append('<style id="' + cursor.kCursorStyleDisabledRuleId + '">*:disabled { cursor: url("' + view.getImageOfType('default') + '"), default}');
			sitecues.emit('cursor/update');
		};

		/*
		 *  Hide cursor in the viewport.
		 */
		cursor.hide = function() {
			// Reset the CSS cursor style.
			$('#' + cursor.kCursorStyleDisabledRuleId).remove();
			$(cursor.prevTarget).css('cursor', cursor.prevType);
			$(window).off('mousemove click', mouseMoveHandler);
			sitecues.emit('cursor/hide');
		};

		/* Auxiliary functions */

		/**
		 * Updates image of the cursor element if the target needs.
		 * @param target
		 */
		function changeCursorDisplay(target) {
			$('#' + cursor.kCursorStyleRuleId).remove();
			
			// If target is changed then update CSS cursor property for it.
			if (cursor.isEnabled && !$(target).is(cursor.prevTarget)) {
				// First, revert last target's cursor property to saved style.
				$(cursor.prevTarget).css('cursor', cursor.prevType);
				var newCursorType = style.detectCursorType(target) || 'default';

				// Save the new target and its original cursor style to be able to revert to it.
				cursor.prevTarget = target;
				cursor.prevType = newCursorType;
				cursor.type = newCursorType;
				cursor.url = view.getImageOfType(newCursorType);
				// Set cursor style on new target.
				$(target).css('cursor', 'url("' + cursor.url + '"), ' + cursor.type);
			}
		}

		function mouseMoveHandler(e) {
			changeCursorDisplay($(e.target));
		}

		// Handle zoom event.
		sitecues.on('zoom', cursor.init);
		cursor.init(conf.get('zoom') || cursor.zoomLevel);

		// Done.
		callback();
	});
});