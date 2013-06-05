// returns the cursor type for a specified element
sitecues.def('cursor/style', function(module, callback){

	// dependencies
	sitecues.use('jquery', function($){

		module.detectCursorType = function(element, options) {
			element = $(element);
			var defaultCursorType = 'default';

			options = $.extend({
				cursorElements: null
			}, options);

			var cssCursorValue = element.css('cursor');

			// If the value is good for us, return it.
			if (cssCursorValue && cssCursorValue !== 'auto' && cssCursorValue !== 'default' && cssCursorValue !== 'none') {
				return cssCursorValue;
			}
			// Otherwise, try to detect a new one.
			var cursorElements  = (options.cursorElements !== null) ? options.cursorElements : getCursorElements();
			var elementTagName  = element.prop('tagName').toLowerCase();

			if (cursorElements.hasOwnProperty(elementTagName)) {
				var elementTag  = cursorElements[elementTagName];
				var selectors   = elementTag.selectors;

				if (typeof selectors !== 'undefined') {
					for (var key in selectors) {
						if (element.is(key)) {
							return selectors[key];
						}
					}
				} else {
					return elementTag.cursor || defaultCursorType;
				}
			} else {
				return cssCursorValue || defaultCursorType;
			}
			
		}

		function getCursorElements() {
			return {
				a:	{
					cursor: 'pointer'
				},
				button:   {
					cursor: 'pointer'
				},
				input:	{
					selectors: {
						'[type="button"]'  : 'pointer',
						'[type="checkbox"]': 'pointer',
						'[type="email"]'   : 'text',
						'[type="image"]'   : 'pointer',
						'[type="radio"]'   : 'pointer',
						'[type="search"]'  : 'text',
						'[type="submit"]'  : 'pointer',
						'[type="text"]'    : 'text'
					}
				},
				label:	{
					cursor: 'pointer'
				},
				p:		{
					cursor: 'text'
				},
				select:   {
					cursor: 'pointer'
				},
				textarea: {
					cursor: 'text'
				}
			}
		}

		// done
		callback();

	});

});