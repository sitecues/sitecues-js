sitecues.def('ui', function(ui, callback){

	// this module should be used by all modules
	// which are injecting elements on the page
	// or ui elements. this way we can postpone
	// actual initializing of user interface until
	// important resources will be loaded for example

	// require load module for async style loading
	sitecues.use('load', 'jquery/color', 'jquery/transform2d', 'jquery/style', function(load){

		// load default style, and only after it
		// is loaded module is ready
		load.style('../css/default.css', callback)
	});
});
