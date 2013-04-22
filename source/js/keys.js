eqnx.def('keys', function(keys, callback){
	var extra_event_properties = {
		dom: {
			highlight_box: null
		}
	};

	// shortcut to hasOwnProperty
	var has = Object.prototype.hasOwnProperty;

	// define key testers
	keys.test = {
		'minus':	function(event){ return event.keyCode === 189; },
		'plus':		function(event){ return event.keyCode === 187; },
		'r':		function ( event ) {
			return ( event.keyCode === 82 );
		},
		'space':	function(event){ return event.keyCode === 32; }
	};

	// define keys map used to bind actions to hotkeys
	keys.map = {
		'minus':	{ event: 'zoom/decrease' },
		'plus':		{ event: 'zoom/increase' },
		'r':		{
			event: 'inverse/toggle'
		},
		'space':	{
			event: 'highlight/animate',
			preventDefault: true
		}
	};

	// handle key
	keys.handle = function ( key, event ) {
		// if event defined, emit it
		if ( key.event ) {
			eqnx.emit( key.event, event );
		}

		// prevent default if needed
		if (key.preventDefault) event.preventDefault();
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
	eqnx.use('jquery', function($){

		// key event hook
		keys.hook = function(event){
			// private variables
			var i, l, key, test, parts, result;

			// ignore events from editable elements
			if ( keys.isEditable( event.target ) ) {
				return;
			}

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
					result = ( !! result ) & ( test && test( event ) );
				}

				// if all checks passed, handle key
				if (result) return keys.handle(keys.map[key], $.extend( event, extra_event_properties ));
			}
		};

		// bind key hook to window
		$(window).on('keydown', keys.hook);

		eqnx.on( 'hlb/ready', function ( data ) {
			extra_event_properties.dom.highlight_box = $( data );

			keys.test[ 'esc' ] = function ( event ) {
				return ( event.keyCode === 27 );
			};

			keys.map[ 'esc' ] = {
				event: 'key/esc'
			};
		} );

		eqnx.on( 'hlb/closed', function () {
			delete keys.test[ 'esc' ];
			delete keys.map[ 'esc' ];
		} );

		// done
		callback();

	});

});