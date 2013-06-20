// module for storing settings on the server
sitecues.def('conf/server', function (server, callback, log) {

	// url of conf settings server
	var url = '//' + sitecues.getCoreConfig().hosts.up + '/preferences/' + location.host.replace(/^www\./, '');

	// depends on `conf` and `load` modules
	sitecues.use('conf', 'load', function(conf, load){

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