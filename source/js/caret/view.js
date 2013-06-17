// view for the caret enhancement
// NOTE: moved from TS codebase, need refactoring
sitecues.def('caret/view', function(view, callback) {

	// constants
	view.kZindex = 2147483647 - 1;
	view.kCaretId = 'sitecues-eq360-caret';

	// Add dependencies
	sitecues.use('jquery', 'conf', 'style', 'caret/coords', 'util/positioning', 'ui', function($, conf, styles, coords, positioning) {

		// show caret view
		view.show = function(target) {
			var sel = view.selection(target);
			var zoomLevel = conf.get('zoom');
			if (sel.start !== sel.end) {
				// We currently only support the collapsed selection (a caret, not selected text)
				return;
			}
			sitecues.log.info('Caret index: ' + sel.end);
			var style = styles.getComputed(target);

			// Create new caret
			if (!view.renderedCaret)
				view.renderedCaret = $('<div>').attr('id', 'sitecues-caret').appendTo('html');

			// Seems to help us not be off by as many pixels, at least in Chrome
			// However, it's not working perfectly -- sometimes still off by 1px -- argh!
			// Seems to be related to padding, I think. If I set the padding on the input everything is fine.
			// TODO EQ-118: make it perfect
			style['borderLeftWidth'] = Math.round(parseFloat(style['borderLeftWidth'])) + 'px';
			style['borderTopWidth'] = Math.round(parseFloat(style['borderTopWidth'])) + 'px';
			style['marginLeft'] = Math.round(parseFloat(style['marginLeft'])) + 'px';
			style['marginTop'] = Math.round(parseFloat(style['marginTop'])) + 'px';
			style['paddingLeft'] = Math.round(parseFloat(style['paddingLeft'])) + 'px';
			style['paddingTop'] = Math.round(parseFloat(style['paddingTop'])) + 'px';
			var caretRect = coords.getUpdatedCaretRect(target, style, sel.end, zoomLevel);
			var origPos = positioning.getOffset(target);
			caretRect.left = caretRect.left + origPos.left + 1;
			caretRect.top = caretRect.top + origPos.top + 1;

			// realign caret on zoom out
			$(target).off('zoomout').on('zoomout', function() {
				view.show(target, zoomLevel);
			});

			var zoom = conf.get('zoom');

			for(var i in caretRect) if (caretRect.hasOwnProperty(i))
				caretRect[i] = Math.ceil(caretRect[i] * zoom);

			sitecues.log.info(caretRect);
			view.renderedCaret.style({
				'z-index': view.kZindex.toString(),
				'top': caretRect.top + parseFloat(style['paddingTop']) + 'px',
				'left': caretRect.left + parseFloat(style['paddingLeft']) + 'px',
				'width': caretRect.width + 'px',
				'height': caretRect.height + 'px',

				// Copy the same border/padding/margin as element with caret
				// so that our caret has the same offset
				'margin-left': style['borderLeftWidth'] + 'px',
				'margin-top': style['borderTopWidth'] + 'px'
			}, '', 'important');
		}

		// hide caret view
		view.hide = function() {
			if (view.renderedCaret) {
				view.renderedCaret.remove();
				view.renderedCaret = null;
			}
		}

		// get selection for input element
		view.selection = function(el) {
			var start = 0, end = 0, normalizedValue, range,
				textInputRange, len, endRange;

			if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
				start = el.selectionStart;
				end = el.selectionEnd;
			} else {
				// Necessary only for IE8!!
				// Element must have focus in order to work
				// TODO EQ-229: what about contenteditable, designMode, etc.?
				// Let's just degrade gracefully for those in IE8 (don't show caret)
				range = document.selection.createRange();
				if (range && range.parentElement() == el) {
					len = el.value.length;
					normalizedValue = el.value.replace(/\r\n/g, "\n");
					// Create a working TextRange that lives only in the input
					textInputRange = el.createTextRange();
					textInputRange.moveToBookmark(range.getBookmark());
					// Check if the start and end of the selection are at the very end
					// of the input, since moveStart/moveEnd doesn't return what we want
					// in those cases
					endRange = el.createTextRange();
					endRange.collapse(false);
					if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
						start = end = len;
					} else {
						start = -textInputRange.moveStart("character", -len);
						start += normalizedValue.slice(0, start).split("\n").length - 1;
						if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
							end = len;
						} else {
							end = -textInputRange.moveEnd("character", -len);
							end += normalizedValue.slice(0, end).split("\n").length - 1;
						}
					}
				}
			}

			return {
				start:	start,
				end:	end
			}
		}

		// done
		callback();

	});

});