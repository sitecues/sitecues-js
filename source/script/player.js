eqnx.def('player', function(player, callback){

	// depends on conf module
	eqnx.use('conf', function(conf){

		// use azure if proper conf key was set
		if (conf.get('ttsEngine') === 'azure')
			eqnx.use('player/azure', callback);

		// do nothing otherwise
		else callback()

	});

});