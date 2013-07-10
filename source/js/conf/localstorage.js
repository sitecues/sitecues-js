// module for storing settings in localstorage
sitecues.def('conf/localstorage', function (ls, callback, log){

	// break if local storage unsupported by browser
	if (!localStorage) return callback();

	//Disabling localstorage until TTS can intelligently re-fetch tokens
	return callback();

	// depends on conf module
	sitecues.use('conf/main', function(conf_main){

		// private variables
		var data;

		// get stored data in local storage
		if (data = localStorage.getItem('sitecues')){
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
						conf_main.set(i, data[i]);
			}
		}

		// handle any conf value change
		conf_main.get('*', function(key, value){
			// get all conf data
			var data = conf_main.data();

			// pack it to json
			data = JSON.stringify(data);

			// save to local storage
			localStorage.setItem('sitecues', data);
		});

		// done
		callback();

	});

});