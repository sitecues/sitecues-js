eqnx.def('player/azure', function(player, callback){

	// create say listener, so
	// eqnx.emit('say', 'text')
	// will trigger this code
	eqnx.on('say', function(text){
		console.log('saying by azure: ' + text);
	});

	// done
	callback();

});