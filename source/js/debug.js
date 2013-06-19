sitecues.def('sitecues/debug', function(module, callback, console){

	// remember start time
	var start = +new Date();

	// register profile handler
	sitecues.on('profile', function(type, time){
		// calculate time diff
		var time = (+new Date() - (time || start))/1000;

		// dump to log profile
		console.info(time + 's\t' + type);
	});

});