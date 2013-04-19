/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - creates, inserts in DOM and shows in the window the custom cursor;
 * - hides the existing cursor when custom cursor is visible so that there are not two cursors;
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
eqnx.def('cursor', function (cursor, callback) {

	// static properties
	cursor.isEnabled = false; // if cursor module is enabled
	cursor.zoomLevel = 1;
	cursor.type = 'default'; // also, may be either 'none' or 'auto'.

	// constants
	cursor.kCursorHideRuleId = 'eqnx-cursor-hide-rule';
	cursor.kCursorId = 'eqnx-cursor';
	cursor.kMinCursorZoom = 1.5;

	// get dependencies
	eqnx.use('jquery', 'conf', 'util/positioning', 'cursor/style', 'cursor/canvas', 'ui', function ($, conf, positioning, style, view){

		// private variables
		cursor.styleRuleParent = $('head');
		cursor.isEnabled = false;

		// create cursor element and hode it
		cursor.element = $('<img>').
			attr('id', cursor.kCursorId).
			appendTo('html').
			hide();

		// set cursor type
		view.type(cursor.element, cursor.type);

		// init cursor
		cursor.init = function(value){
			cursor.zoomLevel = value * value;
			var cursorWasEnabled = cursor.isEnabled;

			cursor.isEnabled = cursor.zoomLevel >= cursor.kMinCursorZoom;

			if (cursor.isEnabled){
				if (cursorWasEnabled)
					cursor.update();
				else
					cursor.show();
			} else {
				cursor.hide();
			}
		};

		// show cursor in the viewport
		cursor.show = function(){
			// Hide native cursor if custom cursor.
			toggleRealCursor(false);

			// Init custom cursor position.
			if (cursor.clientX && cursor.clientY){
				cursor.element.css({
					left: this.clientX + 'px',
					top:  this.clientY + 'px'
				}).show();
			}

			cursor.update();

			$(window).
				on('mousemove', mouseMoveHandler).
				on('click', mouseMoveHandler).
				on('mouseout', mouseOutHandler);

			eqnx.emit('cursor/show', cursor.element);
		};

		cursor.update = function(){
			view.zoom(cursor.element, cursor.zoomLevel);
			eqnx.emit('cursor/update', this.element);
		};

		// hide cursor in the viewport
		cursor.hide = function(){
			toggleRealCursor(true);

			this.element.hide();

			$(window).
				off('mousemove', mouseMoveHandler).
				off('click', mouseMoveHandler).
				off('mouseout', mouseOutHandler);

			eqnx.emit('cursor/hide', this.element);
		};

		// takes care of 'mousemove' window event
		function mouseMoveHandler(e){
			// update image of the cursor element if the target requires
			changeCursorDisplay($(e.target));

			// update custom cursor position
			if (cursor.clientX && cursor.clientY){
				cursor.element.css({
					left: cursor.clientX + 'px',
					top: cursor.clientY + 'px'
				}).show();
			}
		}

		/**
		 * Takes care of 'mouseout' window event.
		 * Tracks that cursor is not in browser window any longer, if so - hides custom cursor.
		 * @param e
		 */
		function mouseOutHandler(e){
			if (e.target === document.documentElement)
				cursor.element.hide();
		}

		/* Auxiliary functions */

		/**
		 * Updates image of the cursor element if the target needs.
		 * @param target
		 */
		// todo: add better support for cursor types.
		function changeCursorDisplay(target){
			var newCursorType = style.detect(target);

			// if cursor type has changed
			if (cursor.type !== newCursorType){
				cursor.type = newCursorType;
				view.type(cursor.element, cursor.type);
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
					cursor.styleRuleParent.append('<style id="' + cursor.kCursorHideRuleId + '">* { cursor: none !important; }</style>');
				}
			}
		}

		// always track cursor position for proper first show
		$(document).bind('mousemove click', function(e){
			var position = positioning.getMouseCoords(e);

			cursor.clientX = position.left;
			cursor.clientY = position.top;
		});

		// handle zoom event
		eqnx.on('zoom', cursor.init);
		cursor.init(conf.get('zoom'));

		// Done.
		callback();
	});
});