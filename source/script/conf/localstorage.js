// module for storing settings in localstorage
eqnx.def('conf/localstorage', function(ls, callback){

	// break if local storage unsupported by browser
	if (!localStorage) return callback();

	//Disabling localstorage until TTS can intelligently re-fetch tokens
	return callback();

	// depends on conf module
	eqnx.use('conf', function(conf){

		// private variables
		var data;

		// get stored data in local storage
		if (data = localStorage.getItem('eqnx')){
			try {
				// parse json data, errors can
				// be thrown during parse
				data = JSON.parse(data);
			} catch(e){}

			// if data successfuly parsed
			if ('object' === typeof data){
				// pass stored data to conf
				for(var i in data)
					if (data.hasOwnProperty(i))
						conf.set(i, data[i]);
			}
		}

		// handle any conf value change
		conf.get('*', function(key, value){
			// get all conf data
			var data = conf.data();

			// pack it to json
			data = JSON.stringify(data);

			// save to local storage
			localStorage.setItem('eqnx', data);
		});

		// done
		callback();

	});

});