eqnx.def('keys', function(keys, callback){

	// shortcut to hasOwnProperty
	has = Object.prototype.hasOwnProperty;

	// define key testers
	keys.test = {
		'plus':		function(event){ return event.keyCode === 187; },
		'minus':	function(event){ return event.keyCode === 189; }
	}

	// define keys map used to bind actions to hotkeys
	keys.map = {
		'plus':			{ event: 'zoom/increase' },
		'minus':		{ event: 'zoom/decrease' }
	}

	// handle key
	keys.handle = function(key, event){
		// if event defined, emit it
		if (key.event) eqnx.emit(key.event, event);
	}

	// get dependencies
	eqnx.use('jquery', function($){

		// key event hook
		keys.hook = function(event){
			// private variables
			var i, l, key, test, parts, result;

			// ignore events from input fields
			if ($(event.target).is('input')) return;

			// iterate over key map
			for(key in keys.map) if (has.call(keys.map, key)){
				// prepare default value
				result = true;

				// split key definition to parts
				parts = key.split(/\s*\+\s*/);

				// check each part of key definition
				for(i=0, l=parts.length; i<l; i++){
					// get test for key
					test = keys.test[parts[i]];

					// collect all checks
					result &= test && test(event);
				}

				// if all checks passed, handle key
				if (result) return keys.handle(keys.map[key], event);
			}
		}

		// bind key hook to window
		$(window).on('keydown', keys.hook);

		// done
		callback();

	});

});