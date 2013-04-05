// module for storing settings on the server
eqnx.def('conf/server', function(server, callback){

	// url of conf settings server
	var url = '//up.sitecues.com/preferences/' + location.host.replace(/^www\./, '') + '/em';

	// depends on `conf` and `load` modules
	eqnx.use('conf', 'load', function(conf, load){

		// load data from server
		load.script(url, function(){

			// handle any `conf` setting change
			conf.get('*', function(key, value){
				// use image for cross-domain request to
				// preferences server.
				var img = document.createElement('img');

				// set src to start request
				img.setAttribute('src', url + '?' + key + '=' + value);
			});

		});

	});

});