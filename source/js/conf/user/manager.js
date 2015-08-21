/**
 * This module manages all user configuration properties. These
 * properties represent the state of the user session, and are
 * persisted in the user preferences data store.
 */
define([], function () {
	'use strict';

	// private variables
	var storedData      = {}
		, handlers  = {}
		, listeners = {}
    ;

	// get configuration value
	function get(key, callback) {

		// private variables
		var list;

		// handle sync getting of value
		if (callback === undefined) {
			return storedData[key];
		}

		// create new list if needed
		if (undefined === (list = listeners[key])) {
			list = listeners[key] = [];
		}

		// push callback to listeners list
		list.push(callback);

		if (key in storedData) {
			// call back if there is value for key
			callback(storedData[key]);
		}
	}

	// set configuration value
	function set(key, value) {
		// private variables
		var list, i, l;

		// call handler if needed
		value = handlers[key] ? handlers[key](value) : value;

		// value isn't changed or is empty after handler
		if (undefined === value || value === storedData[key]) {
			return;
    }

		// save value, use handler if needed
		storedData[key] = value;

		// if list isn't empty, call each listener
		// about new value
    list = listeners[key];
		if (list) {
      for(i=0, l=list.length; i<l; i++) {
				list[i](value);
      }
    }

		// notify each update listeners about changes
    list = listeners['*'];
		if (list) {
      for (i=0, l=list.length; i<l; i++) {
				list[i](key, value);
      }
    }
	}

	// define key handler
	function def(key, handler) {
		// set handler for key
		if ('function' === typeof handler) {
      handlers[key] = handler;
    }
	}

	// get/update all stored values
	function data() {
		// return data object if no updates
  	return storedData;
	}

  var publics = {
    get: get,
    set: set,
    def: def,
    data: data
  };
  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});