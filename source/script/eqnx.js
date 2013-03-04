(function(){

	// private variables
	var arr, has, noop,
		extend, entity, events,
		eqnx, modules;

	// array's prototype
	arr = Array.prototype;

	// object's has own property
	has = Object.prototype.hasOwnProperty;

	// empty function
	noop = function(){}

	// the top-level namespace. all public classes and modules will
	// be attached to this. exported for both commonjs and the browser
	if (typeof exports !== 'undefined')
		eqnx = exports, global.eqnx = eqnx;
	else
		eqnx = this.eqnx = {};

	// extend object`o` with objects coming in all other arguments
	// @example	extend({}, a, b, c)
	// @example	var a = extend({}, a, b, c)
	extend = function(o){
		var i, l, p;

		if (o) for(i=1, l=arguments.length; i<l; i++)
			for(p in arguments[i]) if (has.call(arguments[i], p))
				o[p] = arguments[i][p];

		return o;
	}

	// define entity
	entity = function(parent, proto){
		// get entity instance
		var node = function entity(){
			var inst, init;

			// get init from entity proto
			init = entity.prototype.init;

			// get entity instance
			inst = this instanceof entity
				? this
				: (noop.prototype = entity.prototype, new noop);

			// call init function
			return 'function' === typeof init && init.apply(
				inst, arguments
			) || inst;
		}

		// if no parent passed first
		if (undefined === proto && 'function' !== typeof parent)
			proto = parent, parent = undefined;

		// set entity prototype to parent
		if ('function' === typeof parent){
			noop.prototype = parent.prototype;
			node.prototype = new noop;
			node.prototype.constructor = node;
		}

		// extend entity proto
		extend(node.prototype, proto);

		// return new entity
		return node;
	}

	// events entity
	events = entity({

		// bind an event, specified by a string name, `events`, to a `callback`
		// function. passing `"*"` will bind the callback to all events fired
		on:		function(events, callback, context){
					var ev, list, tail;
					events = events.split(/\s+/);
					var calls = this._events || (this._events = {});
					while (ev = events.shift()){
						// create an immutable callback list, allowing traversal during
						// modification. the tail is an empty object that will always be used
						// as the next node
						list  = calls[ev] || (calls[ev] = {});
						tail = list.tail || (list.tail = list.next = {});
						tail.callback = callback;
						tail.context = context;
						list.tail = tail.next = {};
					}
					return this;
				},

		// remove one or many callbacks. if `context` is null, removes all callbacks
		// with that function. if `callback` is null, removes all callbacks for the
		// event. if `events` is null, removes all bound callbacks for all events
		off:	function(events, callback, context){
					var ev, calls, node;
					if (!events){
						delete this._events;
					} else if (calls = this._events){
						events = events.split(/\s+/);
						while (ev = events.shift()){
							node = calls[ev];
							delete calls[ev];
							if (!callback || !node) continue;

							// create a new list, omitting the indicated event/context pairs
							while ((node = node.next) && node.next) {
								if (node.callback === callback &&
									(!context || node.context === context)) continue;
								this.on(ev, node.callback, node.context);
							}
						}
					}

					return this;
				},

		// emit an event, firing all bound callbacks. callbacks are passed the
		// same arguments as `trigger` is, apart from the event name.
		// listening for `"*"` passes the true event name as the first argument
		emit:	function(events){
					var event, node, calls, tail, args, all, rest;
					if (!(calls = this._events)) return this;

					all = calls['*'];
					(events = events.split(/\s+/)).push(null);

					// save references to the current heads & tails
					while (event = events.shift()){
						if (all) events.push({next: all.next, tail: all.tail, event: event});
						if (!(node = calls[event])) continue;
						events.push({next: node.next, tail: node.tail});
					}

					// traverse each list, stopping when the saved tail is reached.
					rest = arr.slice.call(arguments, 1);
					while (node = events.pop()){
						tail = node.tail;
						args = node.event ? [node.event].concat(rest) : rest;
						while ((node = node.next) !== tail){
							node.callback.apply(node.context || this, args);
						}
					}

					return this;
				}

	});

	// modules container
	modules = {};

	// we use vents methods as system bus
	eqnx.on = events.prototype.on;
	eqnx.off = events.prototype.off;
	eqnx.emit = events.prototype.emit;

	// define equinox module
	eqnx.def = function(name, constructor){
		var module = {};

		// call constructor for module
		constructor(module, function(result){
			// if return present
			result && (module = result);

			// save module for future call
			modules[name] = module;

			// notify about new module
			eqnx.emit('module', name, module);

			// notify about new module load once
			eqnx.emit('load/' + name, module).
				off('load/' + name);
		});
	}

	// load equinox modules
	eqnx.use = function(){
		var i, l, t = this, count = 0,
			args, load, result, callback, register;

		// prepare result
		result = [];

		// get all arguments as array
		args = arr.slice.call(arguments, 0);

		// get callback as last argument
		callback = 'function' === typeof args[args.length - 1]
			? args.pop()
			: undefined;

		// count of modules
		count = args.length;

		// register helper
		register = function(index, name){
			// return push result function
			return function(){
				// put module in result set
				result[index] = modules[name];

				// call callback if finished
				if (--count === 0 && 'function' === typeof callback)
					callback.apply(t, result);
			}
		}

		// perform all actions in next tick
		// this needed for correct loading
		// modules defined below `use` call
		count && setTimeout(function(){
			// modules to load
			load = [];

			// iterate over module names
			for(i=0, l=count; i<l; i++) (function(name, push){
				// module is on the way
				if (name in modules){
					// module was loaded, push up
					if (modules[name]) push();

					// module is loading, wait for it
					else t.on('load/' + name, push);

				// module wasn't loaded, load it
				} else {
					// mark module as loading
					modules[name] = undefined;

					// add to load queue
					load.push(name);

					// wait for module load
					t.on('load/' + name, push);
				}
			}(args[i], register(i, args[i])));

			// load all needed modules
			load.length && t.load.apply(t, load);
		}, 0);
	}

	// trigger module loading
	eqnx.load = function(){
		var i, l, script;

		// detect env code is running. support of different
		// envs needed for testing purposes
		if ('object' === typeof window){
			// this is browser, use async script loading

			// iterate over passed module names
			for(i=0, l=arguments.length; i<l; i++){
				// and initiate loading of code for each
				script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = '/' + arguments[i] + '.js';
				script.async = true;
				document.getElementsByTagName('head')[0].appendChild(script);
			}
		} else {
			// this is node.js, use require
			arr.slice.call(arguments, 0).
				// append ./ prefix for each module
				map(function(a){ return './' + a; }).

				// require each module
				forEach(function(module){
					try {
						// try to require module
						require(module);
					} catch(e){
						// if failed - emit error
						t.emit('error', e.toString());
					}
				});
			
		}
	}

}).call(this);