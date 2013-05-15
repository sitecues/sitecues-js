(function(){
	// break if there is sitecues instance on the page
	if ('sitecues' in window) {
		console.log("sitecues already defined.");
		return;
	}

	// private variables
	var arr, has, noop,
		sitecues, modules, coreConfig;

	// private functions
	var resolveUrl, parseUrlQuery, parseUrl;

	// modules container
	modules = {};

	// core config container
	coreConfig = {};

	// array's prototype
	arr = Array.prototype;

	// object's has own property
	has = Object.prototype.hasOwnProperty;

	// empty function
	noop = function(){};

	// the top-level namespace. all public classes and modules will
	// be attached to this
	sitecues = this.sitecues = {};

	// Return the core config.
	sitecues.getCoreConfig = function() {
		return coreConfig;
	};

	// bind an event, specified by a string name, `events`, to a `callback`
	// function. passing `"*"` will bind the callback to all events fired
	sitecues.on = function(events, callback, context){
		var ev, list, tail;
		events = events.split(/\s+/);
		var calls = this._events || (this._events = {});
		while (ev = events.shift()){
			// create an immutable callback list, allowing traversal during
			// modification. the tail is an empty object that will always be used
			// as the next node
			list = calls[ev] || (calls[ev] = {});
			tail = list.tail || (list.tail = list.next = {});
			tail.callback = callback;
			tail.context = context;
			list.tail = tail.next = {};
		}
		return this;
	};

	// remove one or many callbacks. if `context` is null, removes all callbacks
	// with that function. if `callback` is null, removes all callbacks for the
	// event. if `events` is null, removes all bound callbacks for all events
	sitecues.off = function(events, callback, context){
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
	};

	// emit an event, firing all bound callbacks. callbacks are passed the
	// same arguments as `trigger` is, apart from the event name.
	// listening for `"*"` passes the true event name as the first argument
	sitecues.emit = function(events){
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
	};

	// Module states management:
	var MODULE_STATE = {
		NONE: 1,         // A 'def' or 'use' call has never been made for the module.
		LOADING: 2,      // A 'use' call has been made for a module, and a load request has been started.
		INITIALIZING: 3, // A 'def' call has been made for a module, and the module is initializing.
		READY: 4         // The module is initialized and ready for use.
	};

	// Returns the state of the requested module.
	var getModuleState = function(name) {
		var module = modules[name];

		if (!module) {
			// There is no entry, so the there is no state.
			return MODULE_STATE.NONE;
		}

		// The entry is a number, so just return that saved state.
		if (typeof module === "number") {
			return module;
		}

		// Otherwise, the entry is an object, so the module is ready.
		return MODULE_STATE.READY;
	};

	// define equinox module
	var _def = function(name, constructor){
		// do not define modules twice.
		if (getModuleState(name) >= MODULE_STATE.INITIALIZING) {
			console.log("sitecues: module '" + name + "' already defined.");
			return;
		}

		var module = {};

		// module is initializing
		modules[name] = MODULE_STATE.INITIALIZING;

		// call constructor for module
		constructor(module, function(result){
			
			// if return present
			if (result) {
				module = result;
			} else {
				// Modules can double-load when an sitecues.def use statement does not fire callback();
				// This caused the issue with the double-loading of the badge and highlight-box.
				// See: https://fecru.ai2.at/cru/EQJS-39#c187
				//      https://equinox.atlassian.net/browse/EQ-355
				// console.warn( 'No callback() set when def.use("' + name );
			}

			// save module for future call
			modules[name] = module;

			// notify about new module
			sitecues.emit('module', name, module);

			// notify about new module load once
			sitecues.emit('load/' + name, module).
				off('load/' + name);
		});
	};

	// exposed function for defining modules: queues until core is ready.
	var READY_FOR_DEF_CALLS = false;
	var DEF_QUEUE = [];
	sitecues.def = function(name, constructor){
		if (READY_FOR_DEF_CALLS) {
			_def(name, constructor);
		} else {
			DEF_QUEUE.push({
				name: name,
				constructor: constructor
			});
		}
	};

	// processes the def queue once initialization has completed.
	var _processDefQueue = function() {
		var defObj;
		while (DEF_QUEUE.length) {
			defObj = DEF_QUEUE.shift();
			_def(defObj.name, defObj.constructor);
		}
		READY_FOR_DEF_CALLS = true;
	};

	// Called to initialize the sitecues library.
	var _initialize = function() {
		_processDefQueue();
	};

	// load equinox modules
	sitecues.use = function(){
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
				if (--count === 0 && 'function' === typeof callback) {
					callback.apply(t, result);
				}
			}
		};

		// perform all actions in next tick
		// this needed for correct loading
		// modules defined below `use` call
		count && setTimeout(function(){
			// modules to load
			load = [];

			// iterate over module names
			for(i=0, l=count; i<l; i++) (function(name, push){
				var moduleState = getModuleState(name);

				if (moduleState === MODULE_STATE.NONE) {
					// The module has never been used or defined.

					// mark module as loading
					modules[name] = MODULE_STATE.LOADING;

					// add to load queue
					load.push(name);

					// wait for module load
					t.on('load/' + name, push);
				} else if (moduleState === MODULE_STATE.READY) {
					// The module is ready for use, so no need to load it
					push();
				} else {
					// A previous request to either use or define the module has occurred, but it is not yet ready
					t.on('load/' + name, push);
				}
			}(args[i], register(i, args[i])));

			// load all needed modules
			load.length && t.load.apply(t, load);

		}, 0);
	};

	//////////////////////////////////////////////////
	//
	//  START: URL Processing Helper Methods
	//
	//////////////////////////////////////////////////

	// Parse a URL query into key/value pairs.
	parseUrlQuery = function(queryStr){
		var query = {};
		query.raw = queryStr;
		query.parameters = {};

		// Parse the query into key/value pairs.
		var start = 0, end = 0;
		if (queryStr[start] == '?')
			start++;

		while (start < queryStr.length){
			end = queryStr.indexOf('=', start);
			if (end < 0) end = queryStr.length;

			var key = decodeURIComponent(queryStr.substring(start, end));
			start = end + 1;

			var value = null;
			if (start <= queryStr.length){
				end = queryStr.indexOf('&', start);
				if (end < 0) end = queryStr.length;

				value = decodeURIComponent(queryStr.substring(start, end));
				start = end + 1;
			}
			query.parameters[key] = value;
		}
	};

	// Parse a URL into its components.
	parseUrl = function(urlStr){
		// Ran across this in a Google search... loved the simplicity of the solution.
		var url = {};
		var parser = document.createElement('a');
		parser.href = urlStr;

		// No one ever wants the hash on a full URL...
		if (parser.hash)
			url.raw = parser.href.substring(parser.href.length - parser.hash.length);
		else
			url.raw = parser.href;

		url.protocol = parser.protocol.substring(0, parser.protocol.length - 1).toLowerCase();
		url.secure   = (url.protocol == "https");
		url.hostname = parser.hostname;
		url.host     = parser.host;

		if (parser.search)
			url.query = parseUrlQuery(parser.search);
		else
			url.query = null;

		// Extract the path and file portion of the pathname.
		var pathname = parser.pathname;
		var index = pathname.lastIndexOf('/') + 1;
		url.path = pathname.substring(0, index);
		url.file = pathname.substring(index);

		return url;
	};

	var scriptSrcUrl = null,
	scriptSrcRegExp = new RegExp('^[a-zA-Z]*:/{2,3}.*/(equinox|sitecues)\.js'),
	scriptTags = document.getElementsByTagName('script');

	sitecues.getScriptSrcUrl =  function() {
		return scriptSrcUrl;
	};

	// Obtain all script tags, and search util we find our script.
	for (var i = 0; i < scriptTags.length; i++){
		var match = scriptTags[i].src.match(scriptSrcRegExp);
		if (match){
			scriptSrcUrl = parseUrl(match[0]);
			break;
		}
	}

	// TODO: What if we don't find the base URL?
	// The regular expression for an absolute URL. There is a capturing group for the protocol-relative
	// portion of the URL.
	var ABSOLUTE_URL_REQEXP = /^[a-z]+:(\/\/.*)$/i;

	// Resolve a URL as relative to a base URL.
	resolveUrl = function(urlStr, baseUrl) {
		var absRegExpResult =  ABSOLUTE_URL_REQEXP.exec(urlStr);
		if (absRegExpResult){
			// We have an absolute URL, with protocol. That's a no-no, so, convert to a
			// protocol-relative URL.
			urlStr = absRegExpResult[1];
		} else if (urlStr.indexOf('//') === 0) {
			// Protocol-relative No need to modify the URL, as we will inherit the containing page's protocol.
		} else if (urlStr.indexOf('/') === 0) {
			// Host-relative URL.
			urlStr = '//' + baseUrl.host + urlStr;
		} else {
			// A directory-relative URL.
			urlStr = '//' + baseUrl.host + baseUrl.path + urlStr;
		}

		return urlStr;
	};

	// Resolve a URL as relative to the main script URL.
	sitecues.resolvesitecuesUrl = function(urlStr){
		return resolveUrl(urlStr, scriptSrcUrl);
	};

	//////////////////////////////////////////////////
	//
	//  END: URL Processing Helper Methods
	//
	//////////////////////////////////////////////////

	// async script loading
	sitecues.loadScript = function(url, callback){
		// Resolve the URL as relative to the library URL.
		url = sitecues.resolvesitecuesUrl(url);

		// create script DOM element
		var script = document.createElement('script');

		// set proper script type
		script.type = 'text/javascript';

		// set url
		script.src = url;

		// enforce async loading
		script.async = true;

		// add callback to track when it will be loaded
		script.onload = script.onreadystatechange = callback;

		// add element to head to start loading
		document.getElementsByTagName('head')[0].appendChild(script);
	};

	// trigger module loading
	sitecues.load = function(){
		// iterate over passed module names
		for(var i=0, l=arguments.length; i<l; i++){
			// and initiate loading of code for each
			sitecues.loadScript(arguments[i] + '.js');
		}
	};

	//////////////////////////////////////////////////
	//
	//  START: Core Configuration
	//		This section loads the core configuration,
	//		whose absence will prevent the library
	// 		from loading.
	//
	//////////////////////////////////////////////////

	var CORE_CONFIG_NAMES = [ "hosts" ], coreLoadCount;

	// Validation method for core configuration. If valid, initialize sitecues.
	var _validateCoreConfigs = function() {
		var valid = true;
		if (window.sitecues.__sitecues_cfg) {
			coreConfig = window.sitecues.__sitecues_cfg;
			window.sitecues.__sitecues_cfg = undefined;

			if (coreConfig.hosts) {
				if (coreConfig.hosts.ws) {
					console.log("sitecues ws host: " + coreConfig.hosts.ws);
				} else {
					console.log("sitecues ws host not specified.");
					valid = false;
				}

				if (coreConfig.hosts.up) {
					console.log("sitecues up host: " + coreConfig.hosts.up);
				} else {
					console.log("sitecues up host not specified.");
					valid = false;
				}
			} else {
				console.log("sitecues core hosts config not found.");
				valid = false;
			}
		} else {
			console.log("sitecues core config not found.");
			valid = false;
		}

		// If the core configs are valid, initialize the library.
		if (valid) {
			_initialize();
		} else {
			console.log("invalid sitecues core config. aborting.");
		}
	};

	// Called after all core configs that require loading are loaded, triggering validation.
	var onCoreLoadComplete = function() {
		coreLoadCount--;
		if (coreLoadCount <= 0) {
			_validateCoreConfigs();
		}
	};

	// Determine which core configs require loading.
	var coreLoadNames = [];
	if (!window.sitecues.__sitecues_cfg) {
		// We need all of the core configs.
		coreLoadNames = CORE_CONFIG_NAMES.splice(0, CORE_CONFIG_NAMES.length);
	} else {
		for (i=0; i<CORE_CONFIG_NAMES.length; i++) {
			if (!window.sitecues.__sitecues_cfg[CORE_CONFIG_NAMES[i]]) {
				coreLoadNames.push(CORE_CONFIG_NAMES[i]);
			}
		}
	}
	// Set the counter of outstanding core configs.
	coreLoadCount = coreLoadNames.length;

	// If there are no outstanding core configs, trigger validation.
	if (coreLoadCount <= 0) {
		_validateCoreConfigs();
	} else { // Trigger loading of missing core configs.
		for (i=0; i<coreLoadNames.length; i++) {
			sitecues.loadScript(".cfg/" + coreLoadNames[i] + ".js", onCoreLoadComplete);
		}
	}

	//////////////////////////////////////////////////
	//
	//  END: Core Configuration
	//
	//////////////////////////////////////////////////

}).call(this);
