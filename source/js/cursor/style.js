// returns the cursor type for a specified element
sitecues.def('cursor/style', function (module, callback, log){

	// dependencies
	sitecues.use('jquery', function($){

    var neutralCursorTypes = ['', 'auto', 'default', 'none'];

		module.detectCursorType = function(element, options) {
			var $element = $(element);
			var defaultCursorType = 'default';

			options = $.extend({
				cursorElements: null
			}, options);

			var cssCursorValue = $element.css('cursor');

			// If the value is good for us(not found in array), return it.
			if ($.inArray(cssCursorValue, neutralCursorTypes) < 0) {
				return cssCursorValue;
			}

			// Otherwise, try to detect a new one.
			var cursorElements  = (options.cursorElements !== null) ? options.cursorElements : getCursorElements();
			var elementTagName  = $element.prop('tagName').toLowerCase();

      // We didn't prepare value for this element.
			if (!cursorElements.hasOwnProperty(elementTagName)) {
        return cssCursorValue || defaultCursorType;
      }

      var elementTag  = cursorElements[elementTagName];
      var selectors   = elementTag.selectors;

      if (typeof selectors !== 'undefined') {
        for (var key in selectors) {
          if ($element.is(key)) {
            return selectors[key];
          }
        }
      } else {
        return elementTag.cursor || defaultCursorType;
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