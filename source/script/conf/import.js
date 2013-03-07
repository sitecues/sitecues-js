eqnx.def('conf/import', function(module, callback){

	// private variables
	var push;

	// depends on conf module
	eqnx.use('conf', function(conf){
		// push setting up to conf
		push = function(data){
			// there is no data passed
			if (!data || !data.length) return;

			// get conf key
			var key = data.shift();

			// of only one value remains
			// in data use it as value
			if (data.length === 1)
				data = data[0];

			// export to conf
			conf.set(key, data);
		}

		// settings on the page found
		if ('_eqnx' in window){
			// iterate over them and push to conf
			for(var i=0, l=_eqnx.length; i<l; i++)
				push(_eqnx[i]);

			// replace global var
			_eqnx = { push: push }
		}

		// done
		callback();

	});

});