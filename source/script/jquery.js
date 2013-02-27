eqnx.def('jquery', function(module, callback){

	// use already loaded instance jQuery if possible
	// there also can be used version check, if code
	// will be depended on some new jQuery features
	if ('jQuery' in window) return callback(jQuery);

	// if jQuery instance can't be found on the page
	// initiate loading from google cdn. after loading
	// switch if to no-confict mode in case of host
	// page already using $ for some purposes
	eqnx.use('load', function(load){
		load.script(
			'//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
			function(){
				callback(jQuery.noConflict(true));
			}
		);
	});

});