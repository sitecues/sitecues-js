eqnx.def('caret/coords', function(coords, callback){

	// 
	eqnx.use('jquery', 'conf', 'geo', function($, conf, geo){

		coords.getUpdatedCaretRect = function getUpdatedCaretRect(element, styleObj, caretPos, zoomLevel) {
			// Create an object with the same positioning but flexible width and height
			// in order to measure the text up to the caret
			var isDebuggingOn = false;// TODO EQ-255 compile this stuff out when false

			var extendStyle = {
				'width': 'auto',
				'height': 'auto',
				'margin-left': '0px',
				'margin-top': '0px',
				'position': 'absolute',
				'display': 'inline-block',
				'visibility': 'hidden',
				'-webkit-text-security': 'none'
			};

			console.log('Old border: ' + styleObj['border-top-width']);
			if (isDebuggingOn){
				extendStyle['visibility'] = 'visible';
				var inputRect = geo.getAbsolutePosition(element);
				extendStyle['left'] = inputRect.left;
				extendStyle['top'] = inputRect.top;
			}

			var item = $(element);
			var text = item.val().slice(0, caretPos);// Cut text to caret position for measuring

			// Password rules
			if (item.attr('type') === 'password'){
				text = text.replace(/\s|\S/g, '\u2022'); // password bullet char
			}

			// add zero-width space -- need at least something in order to get line
			// and need to ensure that multiple spaces are counted
			text = '\ufeff' + text.replace(/(\s)/g, '$1\ufeff');

			// Create span with duplicated, trimmed text and css
			var span = $('<span>').appendTo('body').css(styleObj).css(extendStyle).text(text);

			// First measure with all text up to the caret position -- from this we get the bottom y coordinate of the caret
			var totHeight = span.height();
			var totWidth = 0;
			var lineHeight;

			// get current zoom level
			var zoom = conf.get('zoom');
			var scale = geo.getScale(element);

			// Now, trim to use just the last line -- from this we can get the x coordinate as well as the line height
			if (element.localName !== 'input'){
				CaretCoordinates.trimToLastLine(span, text, item.width());
			}

			lineHeight = span.height();
			var caretRect = {
				top: (totHeight - lineHeight - item.scrollTop() * zoom) * scale,
				left: (span.width() - item.scrollLeft() * zoom) * scale,
				width: 1 * scale,
				height: lineHeight * scale
			};

			setTimeout(function (){
				span.remove();
			}, 500);

			return caretRect;
		}

		coords.trimToLastLine = function trimToLastLine(span, text, width) {
			// Trim to string from last hard break to end
			var lastHardLineBreak = text.lastIndexOf('\n');
			if (lastHardLineBreak >= 0){
				text = text.slice(lastHardLineBreak + 1, -1);
			}

			// Trim to last line by adding one word at a time to compute start of each line
			var words = text.split(' ');
			var numWords = words.length;
			span.empty();
			var currLine = '';
			for(var wordIndex = 0; wordIndex < numWords; wordIndex++) {
				var wasEmpty = currLine.length === 0;

				// Add each the word to the current line with a space and zero-width space char,
				// which ensures trailing spaces are measured.
				var word = words[wordIndex] + (wordIndex < numWords - 1 ? ' \ufeff' : '');
				currLine += word;
				span.text(currLine);
				if ($(span).width() > width){
					if (wasEmpty){
					} else {
						// Couldn't fit -- first word on new line
						span.text(currLine = word);
					}
				}
			}
		}

		// done
		callback();

	});

});