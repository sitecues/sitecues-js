eqnx.def('badge', function(badge, callback){

	// use jquery, we can rid off this dependency
	// if we will start using vanilla js functions
	eqnx.use('jquery', 'ui', function($){

		// create badge element
		badge.element = $('<div>').

			// set element id for proper styling
			attr('id', 'eqnx-badge').

			// handle hover events
			hover(function(){
				// emit event about hover
				eqnx.emit('badge/hover', badge.element);
			}, function(){
				// emit event about leave
				eqnx.emit('badge/leave', badge.element);
			}).

			// handle click events
			click(function(){
				// emit event about badge click
				eqnx.emit('badge/click', badge.element);
			}).

			// append to html
			appendTo('html');

		// end
		callback();

	});

});