sitecues.def('sitecues/debug', function(module, callback){

	// remember start time
	var start = +new Date();

	// register profile handler
	sitecues.on('profile', function(type, time){
		// calculate time diff
		var time = (+new Date() - (time || start))/1000;

		// dump to console profile
		console.log(time + 's\t' + type);
	});

});