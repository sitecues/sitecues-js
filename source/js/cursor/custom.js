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

	// static properties
	cursor.isEnabled = false; // if cursor module is enabled
	cursor.zoomLevel = 1;
	cursor.type = 'default';
	// default data url string
	cursor.url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAaCAYAAAC3g3x9AAAB+klEQVRIS+2UPUvDQBzGe219ado6qHR0KP0QDoJSQRFHJ8HRtXR3cBI/QLfiKgo6OQp2dhG/QSmFKmqwviSm0TatzwOXkkvSQKE4efBwudzd7//KidiEh5gwL/Z3wMFgsCmEuB43glAPAbsBaB1qAlqQ0AHmPsR55AgDin6/bwM0zVu6rpdyudyphH1j/omCBoCO45zF4/Fd14VOp3OvadoO1j3oE/qCnFEuBoAIt4nDS+4FGDCTyeQK1vTuHXqT36FMBdjr9fYTicSJ/2S9Xr8qFApH+N9mFiBzVNgKELm7Re6WCQS8Dc/m+W2aZiubze5J754kmCkIDC9QKYb/ZKVSOSyXyzX8f4QItSOB/mL4Dzcajbt8Pn8ggS3MBsQ2UsbQQxTjAztzoZnGz263a1Wr1eNSqcRmf4BeIbaQCvQ0sbohRBG5u0in04veDdu2n1Op1JoMm8VhCw2bnXmroRDFgCUhNgzDOM9kMgvePcuydBjZll6yjZjLYegiwsNVXL6ENzkvEI3+gkbfkh4GgdiIQymZPw1zEkpICEOZgmblzJwzRIbKHEYCMzgwA7mFYp91PQYJpTEaYTFYRFZaDVle4GF6yQfBD+SaXtKYC6ShjlQAyAsMkWL47nCfK6753xXXLAJDZxTKk/Z3L7bH07E+/z0cK12hh38BlI3AG1Ei3IIAAAAASUVORK5CYII=";

	// constants
	cursor.kCursorHideRuleId = 'sitecues-cursor-hide-rule';
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
		cursor.init = function(value){
			cursor.zoomLevel = value * value;
			var cursorWasEnabled = cursor.isEnabled;

			cursor.isEnabled = cursor.zoomLevel >= cursor.kMinCursorZoom;

			if (cursor.isEnabled){
				view.zoom(this.zoomLevel);
				cursor.url = view.getImageOfType(this.type);
				if (cursorWasEnabled)
					cursor.update();
				else
					cursor.show();
			} else {
				cursor.hide();
			}
		};

		/*
		 *  Show custom cursor in the viewport, hiding the default one if necessary.
		 */
		cursor.show = function(){
			// Hide native cursor if custom cursor.
			toggleRealCursor(false);
			cursor.update();
			sitecues.emit('cursor/show');
		};

		/*
		 *  Update cursor properties, such as dimensions or color.
		 */
		cursor.update = function(){
			view.zoom(cursor.zoomLevel);
			cursor.url = view.getImageOfType(this.type);
			updateCustomCursor();
			sitecues.emit('cursor/update');
		};

		/*
		 *  hide cursor in the viewport
		 */
		cursor.hide = function(){
			toggleRealCursor(true);
			sitecues.emit('cursor/hide');
		};

		/* Auxiliary functions */

		/**
		 * Updates image of the cursor element if the target needs.
		 * @param target
		 */
		function changeCursorType(target) {
			var newCursorType = style.detect(target);

			// if cursor type has changed
			if (cursor.type !== newCursorType){
				cursor.type = newCursorType;
			}
		}

		/**
		 * Hides or show the real mouse cursor dependently on the parameter given.
		 * If we are showing our own mouse cursor we don't want the real cursor because that would be a double cursor.
		 * @param setRealCursorVisible
		 */
		function toggleRealCursor(setRealCursorVisible){
			if (setRealCursorVisible){
				$('#' + cursor.kCursorHideRuleId).remove();
			} else {
				// if the rule is not already in DOM
				if ($('#' + cursor.kCursorHideRuleId).length === 0) {
					// todo: set a few cursor types in the rule, so no need to remove/add new rules until zoom level changes.
					cursor.styleRuleParent.append('<style id="' + cursor.kCursorHideRuleId + '">* { cursor: url("' + cursor.url + '"), ' + cursor.type + '}</style>');
				}
			}
		}

		// todo: set a few cursor types in the rule, so no need to remove/add new rules until zoom level changes.
		function updateCustomCursor() {
			$('#' + cursor.kCursorHideRuleId).remove();
			cursor.styleRuleParent.append('<style id="' + cursor.kCursorHideRuleId + '">* { cursor: url("' + cursor.url + '"), ' + cursor.type + '}</style>');
		}

		// Handle zoom event.
		sitecues.on('zoom', cursor.init);
		cursor.init(conf.get('zoom') || 1);

		// Done.
		callback();
	});
});