// returns the cursor type for a specific element
eqnx.def('cursor/style', function(module, callback){

	// dependencies
	eqnx.use('jquery', function($){

		module.detect = function(element, options){
			element = $(element);

			options = $.extend({
				cursor_elements: null
			}, options);

			var css_cursor = element.css('cursor');

			if (css_cursor === 'auto' || css_cursor === 'default' || css_cursor === 'none'){
				var cursor_elements  = (options.cursor_elements !== null) ? options.cursor_elements : {
					a:		{
						cursor: 'pointer'
					},
					button:   {
						cursor: 'pointer'
					},
					input:	{
						selectors: {
							'[type="button"]':   'pointer',
							'[type="checkbox"]': 'pointer',
							'[type="email"]':	'text',
							'[type="image"]':	'pointer',
							'[type="radio"]':	'pointer',
							'[type="search"]':   'text',
							'[type="submit"]':   'pointer',
							'[type="text"]':	 'text'
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
				};
				var element_tag_name = element.prop('tagName').toLowerCase();

				if (cursor_elements.hasOwnProperty(element_tag_name)) {
					var element_tag = cursor_elements[element_tag_name];
					var selectors   = element_tag.selectors;

					if (typeof selectors !== 'undefined') {
						for (var key in selectors) {
							if (element.is(key)) {
								return selectors[key];
							}
						}
					}
					else {
						return element_tag.cursor;
					}
				}
			}
			else if (
				css_cursor !== 'auto' &&
				css_cursor !== 'default' &&
				css_cursor !== null &&
				typeof css_cursor !== 'undefined'
			) {
				return css_cursor;
			}
			else {
				return null;
			}
		}

		// done
		callback();

	});

});