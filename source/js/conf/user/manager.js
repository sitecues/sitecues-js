/**
 * This module manages all user configuration properties. These
 * properties represent the state of the user session, and are
 * persisted in the user preferences data store.
 */
sitecues.def('conf/user/manager', function (manager, callback) {
	'use strict';

	// private variables
	var data      = {}
		, handlers  = {}
		, listeners = {}
    ;

	// string handler, optional regular
	// expression can be passed to allow
	// only values matching it
	manager.string = function(regexp){
		return function(value){
			return !regexp || regexp.test(value) ? value.toString() : undefined;
		};
	};

	// number handler, optional number of
	// digits after the decimal point can be
	// passed
	manager.number = function(digits){
		return function(value){
			value = parseFloat(value).toFixed(digits);
			return isNaN(value) ? undefined : parseFloat(value);
		};
	};

	// bool handler, optional boolean
	// can be passed if each value coming
	// should be inverted (true -> false).
	// string 'true' and 'false' vlaues will
	// be treated as booleans
	manager.bool = function(opposite){
		return function(value){
			if (value === 'true'){
				return opposite ? false : true;
      }

			if (value === 'false'){
				return opposite ? true : false;
      }

			return opposite ? !value : !!value;
		};
	};

	// get configuration value
	manager.get = function(key, callback){

		// private variables
		var list;

		// handle sync getting of value
		if (callback === undefined) {
			return data[key];
		}

		// create new list if needed
		if (undefined === (list = listeners[key])){
			list = listeners[key] = [];
		}

		// push callback to listeners list
		list.push(callback);

		if (key in data) {
			// call back if there is value for key
			callback(data[key]);
		}

		// chain
		return manager;
	};

	// set configuration value
	manager.set = function (key, value) {
		// private variables
		var list, i, l;

		// call handler if needed
		value = handlers[key] ? handlers[key](value) : value;

		// value isn't changed or is empty after handler
		if (undefined === value || value === data[key]){
			return manager;
    }

		// save value, use handler if needed
		data[key] = value;

		// if list isn't empty, call each listener
		// about new value
    list = listeners[key];
		if (list){
      for(i=0, l=list.length; i<l; i++){
				list[i](value);
      }
    }

		// notify each update listeners about changes
    list = listeners['*'];
		if (list){
      for(i=0, l=list.length; i<l; i++){
				list[i](key, value);
      }
    }
		// chain
		return manager;
	};

	// define key handler
	manager.def = function(key, handler){
		// set handler for key
		if ('function' === typeof handler)
			handlers[key] = handler;

		// chain
		return manager;
	};

	// remove listener from list of listeners
	manager.off = function(key, callback){
		// private variables
		var list;

		// remove all listeners
		if (undefined === callback){
			delete listeners[key];
			return manager;
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
		return manager;
	};

	// get/update all stored values
	manager.data = function(update){
		// return data object if no updates
		if (undefined === update){
			return data;
		}

		// update data otherwise
		for(var key in update) {
			if(update.hasOwnProperty(key)) {
				// If we already have a value for the key, 
				// don't overwrite it, except zoom
				if(!manager.get(key) || key === 'zoom') {
					manager.set(key, update[key]);
				}
			}
		}
	};

	// end
	callback();
});