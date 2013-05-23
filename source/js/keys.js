sitecues.def('keys', function(keys, callback) {
	var extra_event_properties = {
		dom: {
			highlight_box: null
		}
	};

	// shortcut to hasOwnProperty
	var has = Object.prototype.hasOwnProperty;

    // define key testers
	keys.test = {
		'minus':	function(event) { return event.keyCode === 189; },
		'plus':		function(event) { return event.keyCode === 187; },
		'r':		function(event) { return event.keyCode === 82;  },
		'space':	function(event) { return event.keyCode === 32;  },
		'f8':	    function(event) { return event.keyCode === 119; },
	};

	// define keys map used to bind actions to hotkeys
	keys.map = {
		'minus':	{ event: 'zoom/decrease'  },
		'plus':		{ event: 'zoom/increase'  },
		'r':		{ event: 'inverse/toggle' },
		'f8':		{ event: 'toolbar/toggle' },
		'space':	{
			event: 'highlight/animate',
			preventDefault: true,
			requiresMouseHighlight: true
		}
	};

	// handle key
	keys.handle = function ( key, event ) {
		// if event defined, emit it
		if ( key.event ) {
			sitecues.emit( key.event, event );
		}

		// prevent default if needed
		if (key.preventDefault) event.preventDefault();
		// stop bubble up if needed
		if (key.stopOuterScroll) {
			var hlb = $(event.dom.highlight_box);
			if ((key.down && hlb.scrollTop() + hlb[0].clientHeight >= hlb[0].scrollHeight)
			||  (key.up && hlb.scrollTop() <= 0)) {
				event.preventDefault();
			}
		}
	};

	keys.isEditable = function ( element ) {
		var tag = element.localName;

		if ( ! tag ) {
			return false;
		}

		tag = tag.toLowerCase();

		if ( tag === 'input' || tag === 'textarea' || tag === 'select' ) {
			return true;
		}

		if ( element.getAttribute( 'tabIndex' ) || element.getAttribute( 'onkeydown' ) || element.getAttribute( 'onkeypress' ) ) {
			return true; // Be safe, looks like a keyboard-accessible interactive JS widget
		}

		// Check for rich text editor
		var contentEditable = element.getAttribute('contenteditable');

		if ( contentEditable && contentEditable.toLowerCase() !== 'false' ) {
			return true; // In editor
		}

		if ( document.designMode === 'on' ) {
			return true; // Another kind of editor
		}

		return false;
	};

	// get dependencies
	sitecues.use('jquery', 'mouse-highlight', function($, mh){
		// key event hook
		keys.hook = function(event){

			// private variables
			var i, l, key, test, parts, result;

			// ignore events from editable elements
			if ( keys.isEditable(event.target) ) {
				return;
			}

			// iterate over key map
			for(key in keys.map) if (has.call(keys.map, key)) {
				if(keys.map[key].requiresMouseHighlight) {
					if(!mh.enabled) {
						// Mouse highlight is disabled, revert to default.
						return;
					} else {
						//We're going to attach the target dom element to the
						//event, whether it's available or not.
						extra_event_properties.dom.mouse_highlight = mh.picked ? mh.picked.get(0) : null;
					}
				}

				// prepare default value
				result = true;

				// split key definition to parts
				parts = key.split(/\s*\+\s*/);

				// check each part of key definition
				for(i=0, l=parts.length; i<l; i++){
					// get test for key
					test = keys.test[parts[i]];

					// collect all checks
					result = ( !! result ) & ( test && test( event ) );
				}

				// if all checks passed, handle key
				if (result) return keys.handle(keys.map[key], $.extend( event, extra_event_properties ));
			}
		};

		// bind key hook to window
		$(window).on('keydown', keys.hook);

		sitecues.on('hlb/ready', function (hlbElement) {
			extra_event_properties.dom.highlight_box = $(hlbElement);
			var hlbKeysTest = {
				'esc':		function(event) { return event.keyCode === 27; },
				// scroll
				'up':	    function(event) { return event.keyCode === 38; },
				'down':	    function(event) { return event.keyCode === 40; },
				'pageup':	function(event) { return event.keyCode === 32; },
				'pagedown':	function(event) { return event.keyCode === 34; },
				'end':	    function(event) { return event.keyCode === 35; },
				'home':	    function(event) { return event.keyCode === 36; }
			}
			$.extend(keys.test, hlbKeysTest);

			var hlbKeysMap = {
				'esc':		{event: 'key/esc'},
				// If HLB is on then scroll should only workd for HLB inner content, not bubbling up to window
				'up':	    { stopOuterScroll: true, up: true },
				'pageup':	{ stopOuterScroll: true, up: true },
				'home':	    { stopOuterScroll: true, up: true },
				'down':	    { stopOuterScroll: true, down: true },
				'pagedown':	{ stopOuterScroll: true, down: true },
				'end':	    { stopOuterScroll: true, down: true }
			}
			$.extend(keys.map, hlbKeysMap);
		} );

		sitecues.on( 'hlb/closed', function () {
			delete keys.test[ 'esc' ];
			delete keys.test[ 'up' ];
			delete keys.test[ 'down' ];
			delete keys.test[ 'pageup' ];
			delete keys.test[ 'pagedown' ];
			delete keys.test[ 'end' ];
			delete keys.test[ 'home' ];
			
			delete keys.map[ 'esc' ];
			delete keys.map[ 'up' ];
			delete keys.map[ 'down' ];
			delete keys.map[ 'pageup' ];
			delete keys.map[ 'pagedown' ];
			delete keys.map[ 'end' ];
			delete keys.map[ 'home' ];
		} );

		// done
		callback();

	});

});