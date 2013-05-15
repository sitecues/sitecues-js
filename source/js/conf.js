// module provides confinguration management system
// for other modules to avoid direct communication
// between modules.
sitecues.def('conf', function(conf, callback){

	// private variables
	var data = {},
		handlers = {},
		listeners = {};

	var locale, langE=document.getElementsByTagName('html');
	if(langE && langE[0] && langE[0].lang) {
		locale = langE[0].lang;
	} else {
		langE=document.getElementsByTagName('body');
		if(langE && langE[0] && langE[0].lang) {
			locale = langE[0].lang;
		}
		// We're not going to set a default locale value, 
		// as that can vary per site.
	}
	if(locale) {
		conf.locale = locale.toLowerCase().replace('-','_');
		console.log("Locale: " + conf.locale);
	}

	// string handler, optional regular
	// expression can be passed to allow
	// only values matching it
	conf.string = function(regexp){
		return function(value){
			return !regexp || regexp.test(value)
				? value.toString()
				: undefined;
		}
	}

	// number handler, optional number of
	// digits after the decimal point can be
	// passed
	conf.number = function(digits){
		return function(value){
			value = parseFloat(value).toFixed(digits);
			return isNaN(value) ? undefined : parseFloat(value);
		}
	}

	// bool handler, optional boolean
	// can be passed if each value coming
	// should be inverted (true -> false).
	// string 'true' and 'false' vlaues will
	// be treated as booleans
	conf.bool = function(opposite){
		return function(value){
			if (value === 'true')
				return opposite ? false : true;

			if (value === 'false')
				return opposite ? true : false;

			return opposite ? !value : !!value;
		}
	}

	// get configuration value
	conf.get = function(key, callback){
		// private variables
		var list;

		// handle sync getting of value
		if (callback === undefined) {
			return data[key];
		}

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

	/**
	 * Gets a locale-specific configuration value.
	 * 
	 * If a locale is available, we'll append that to the key first.  
	 * If no value is found, we'll fall back to just using the key name.  
	 * For example:
	 * 
	 * conf.getLS('pageGreeting') on a page with <html lang="fr-CA"> 
	 * will call conf.get('pageGreeting_fr_ca') first, 
	 * and then conf.get('pageGreeting').
	 * 
	 * The locale is specified as a lang attribute on the html or body 
	 * element.  For consistency, it is converted to lowercase, and hypens
	 * are converted to underscores.
	 * 
	 * @TODO We may want to have it fall back from a region to a language 
	 * before we go to the default, so we try xxx_fr_ca, then xxx_fr.
	 *
	 */
	conf.getLS = function(key) {
		if(!conf.locale) {
			return conf.get(key);
		}
		var value = conf.get(key + '_' + conf.locale);
		if(value) {
			return value;
		}
		return conf.get(key);
	}

	// set configuration value
	conf.set = function(key, value){
		// private variables
		var list;

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

		// notify each update listeners about changes
		if (list = listeners['*'])
			for(var i=0, l=list.length; i<l; i++)
				list[i](key, value);

		// chain
		return conf;
	}

	// define key handler
	conf.def = function(key, handler){
		// set handler for key
		if ('function' === typeof handler)
			handlers[key] = handler;

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

	// get/update all stored values
	conf.data = function(update){
		// return data object if no updates
		if (undefined === update)
			return data;

		// update data otherwise
		for(var key in update) {
			if(update.hasOwnProperty(key)) {
				// If we already have a value for the key, 
				// don't overwrite it, except zoom
				if(!conf.get(key) || key === 'zoom') {
					conf.set(key, update[key]);
				}
			}
		}
	}

	// end
	callback();

});