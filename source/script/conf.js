eqnx.def('conf', function(conf, callback){

	// private variables
	var data = {},
		handlers = {},
		listeners = {}

	// get configuration value
	conf.get = function(key, callback){
		// private variables
		var list;

		// handle sync getting of value
		if (undefined === callback)
			return data[key];

		// create new list if needed
		if (undefined === (list = listeners[key]))
			list = listeners[key] = [];

		// push callback to listeners list
		list.push(callback);

		// call back if there is value for key
		key in data && callback(data[key]);

		// chain
		return conf;
	}

	// set configuration value or
	// define key handler
	conf.set = function(key, value){
		// private variables
		var list;

		// if value is function setup
		// handler for key
		if ('function' === typeof value){
			handlers[key] = value;
			return conf;
		}

		// call handler if needed
		value = handlers[key]
			? handlers[key](value)
			: value;

		// value isn't changed or is empty after handler
		if (undefined === value || value === data[key])
			return conf;

		// save value, use handler if needed
		data[key] = value;

		// if list isn't empty, call each listener
		// about new value
		if (list = listeners[key])
			for(var i=0, l=list.length; i<l; i++)
				list[i](value);

		// chain
		return conf;
	}

	// remove listener from list of listeners
	conf.off = function(key, callback){
		// private variables
		var list;

		// remove all listeners
		if (undefined === callback){
			delete listeners[key];
			return conf;
		}

		// remove callback from listeners
		if (list = listeners[key]){
			// create new array
			listeners[key] = [];

			// filter current list
			for(var i=0, l=list.length; i<l; i++)
				list[i] !== callback && listeners[key].push(list[i]);
		}

		// chain
		return conf;
	}

	// end
	callback();

});