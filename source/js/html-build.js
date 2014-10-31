/**
* Methods for giving us coordinates and sizes, where jQuery was not giving us what we needed.
*/
sitecues.def('html-build', function(htmlBuild, callback) {

	sitecues.use('jquery', function($){

		/**
		 * Returns a new div element with 'reset' styles applied, as a jQuery object.
		 * @return {jQuery object} An empty div with common style resets applied.
		 */
		htmlBuild.$div = function() {
			var div = $('<div />').css({
				'margin': 0,
				'padding': 0,
				'border': 0,
				'outline': 0,
				'font': 'normal normal 12px sans-serif',
				'vertical-align': 'baseline',
				'line-height': 1
			}, '', 'important');
			return div;
		};

		// done
		callback();

	});

});