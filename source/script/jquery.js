eqnx.def('jquery', function(module, callback){

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