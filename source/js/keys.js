sitecues.def('keys', function (keys, callback, log) {
  var extra_event_properties = {
    dom: {
      highlight_box: null
    }
  };
  keys.zoomEnabled = true;
  // shortcut to hasOwnProperty
  var has = Object.prototype.hasOwnProperty;

  // define keys map used to bind actions to hotkeys
  // key codes vary across browsers and we need to support the numeric keypad. See http://www.javascripter.net/faq/keycodes.htm
  var origTest = keys.test = {
    'editor-safe-minus':   function(event) {
      return hasCommandModifier(event) &&
	      (event.keyCode === 189
        || event.keyCode === 109
        || event.keyCode === 173
        || event.keyCode === 45);
    },
    'editor-safe-plus':  function(event) {  // Also Equals (=) key
      return hasCommandModifier(event) &&
	      (event.keyCode === 187
        || event.keyCode === 61
        || event.keyCode === 107
        || event.keyCode === 43);
    },
    'plain-minus':   function(event) {
      return !hasCommandModifier(event) &&
	      (event.keyCode === 189
        || event.keyCode === 109
        || event.keyCode === 173
        || event.keyCode === 45);
    },
    'plain-plus':  function(event) {  // Also Equals (=) key
      return !hasCommandModifier(event) &&
	      (event.keyCode === 187
        || event.keyCode === 61
        || event.keyCode === 107
        || event.keyCode === 43);
    },
    'r':    function(event) {
	    return (event.keyCode === 82 && event.shiftKey && !event.ctrlKey && event.altKey && !event.metaKey);
    },
    'f8':     function(event) { return event.keyCode === 119 && !hasModifier(event); },
    'space':  function(event) { return event.keyCode === 32  && !hasModifier(event); }
  };

  keys.hlbKeysTest = {
    'esc':    function(event) { return event.keyCode === 27 && !hasModifier(event); },
    // scroll
    'up':     function(event) { return event.keyCode === 38 && !hasModifier(event); },
    'down':   function(event) { return event.keyCode === 40 && !hasModifier(event); },
    'pageup':   function(event) { return event.keyCode === 33 && !hasModifier(event); },
    'pagedown': function(event) { return event.keyCode === 34 && !hasModifier(event); },
    'end':    function(event) { return event.keyCode === 35 && !hasModifier(event); },
    'home':   function(event) { return event.keyCode === 36 && !hasModifier(event); }
  }

  var iframeDialogTest = {
    'esc':    function(event) { return event.keyCode === 27 && !hasModifier(event); }
  }

  // define keys map used to bind actions to hotkeys
  var origMap = keys.map = {
    'plain-minus':  { preventDefault: true, event: 'zoom/decrease', preventInEditors: true },
    'plain-plus':   { preventDefault: true, event: 'zoom/increase', preventInEditors: true },
    'editor-safe-minus':  { preventDefault: true, event: 'zoom/decrease' },
    'editor-safe-plus':   { preventDefault: true, event: 'zoom/increase' },
// Invert and toolbar disabled until further notice.
//    'r':      { preventDefault: true, event: 'inverse/toggle'},
//    'f8':     { event: 'ui/toggle' },
    'space':  {
      event: 'highlight/animate',
      preventDefault: true,
      requiresMouseHighlightActive: true
    }
  }

  keys.hlbKeysMap = {
    'esc':    {event: 'key/esc'},
    // If HLB is opened then scroll should only work for HLB inner content, not bubbling up to window.
    // scroll
    'up':     { stopOuterScroll: true, up: true },
    'pageup':   { stopOuterScroll: true, up: true },
    'home':   { stopOuterScroll: true, up: true },
    'down':   { stopOuterScroll: true, down: true },
    'pagedown': { stopOuterScroll: true, down: true },
    'end':    { stopOuterScroll: true, down: true }
  }

  var iframeDialogMap = {
    'esc':    {event: 'iframe-modal/hide'}
  }

  function hasCommandModifier(event) {
	  return event.altKey || event.ctrlKey || event.metaKey;
  }

  function hasModifier(event) {
	  return event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
  }

  sitecues.use('jquery', 'mouse-highlight', 'util/common', function($, mh, common){
    // Handle key
    keys.handle = function ( key, event ) {

      // prevent default if needed
      if (key.preventDefault) {
        common.preventDefault(event);
        // Keeps the rest of the handlers from being executed and prevents the event from bubbling up the DOM tree.
        event.stopImmediatePropagation();
      }

      // If event defined, emit it
      if ( key.event ) {
        //EQ-1342 (Block +/- keys while HLB open)
        //If hlb is open and the key event is zoom decrease or zoom increase...dont do anything.
        if (!keys.zoomEnabled && (key.event === 'zoom/decrease' || key.event === 'zoom/increase')) {
          return;
        }
	      sitecues.emit( key.event, event );
      }
    };

    // key event hook
    keys.hook = function(event) {

      // private variables
      var i, l, key, test, parts, result;

      // iterate over key map
      for(key in keys.map) {
        if (has.call(keys.map, key) && keys.test[key](event)) {
          if(keys.map[key].preventInEditors) {
	          // ignore events from editable elements
	          if (common.isEditable(event.target) ) {
		          return false;
	          }
          }
          if(keys.map[key].requiresMouseHighlightActive) {
	          if(!mh.enabled || !mh.isAppropriateFocus) {
		          // Mouse highlight is disabled, revert to default.
		          return false;
	          } else {
		          //We're going to attach the target dom element to the
		          //event, whether it's available or not.
		          var picked = mh.getHighlight();
		          extra_event_properties.dom.mouse_highlight = picked;
	          }
          }

          return keys.handle(keys.map[key], $.extend( event, extra_event_properties ));
        }
      }
      return true;
    };

    keys.registerTarget = function(target) {
      if (target && target.addEventListener) {
        target.addEventListener('keydown', keys.hook, true);
      }
    };

    // bind key hook to window
    // 3rd param changes event order: false == bubbling; true = capturing.
    keys.registerTarget(window);

    sitecues.on('hlb/ready', function (hlbElement) {
      extra_event_properties.dom.highlight_box = $(hlbElement);
      $.extend(keys.test, keys.hlbKeysTest);
      $.extend(keys.map, keys.hlbKeysMap);
    } );

    sitecues.on('hlb/create', function () {
      keys.zoomEnabled = false;
    });

    sitecues.on('hlb/closed', function () {
      keys.zoomEnabled = true;
    });

    sitecues.on( 'hlb/closed', function (hlbElement) {
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

      $(hlbElement).off('keydown');
    } );

    // Key handling needs some work. We need a stack of key states, so that new states can restore old ones
    // after they close. For the new dialog, we will keep the last keys map, and restore after.

    var prevTest = null;
    var prevMap  = null;
    sitecues.on('iframe-modal/open', function () {
      prevTest = keys.test;
      keys.test = $.extend(true, {}, origTest, iframeDialogTest);
      prevMap = keys.map;
      keys.map = $.extend(true, {}, origMap, iframeDialogMap);
    } );

    sitecues.on('iframe-modal/closed', function (hlbElement) {
      keys.test = prevTest;
      keys.map = prevMap;
    } );

    // done
    callback();
  });
});
