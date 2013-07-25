sitecues.def('keys', function (keys, callback, log) {
  var extra_event_properties = {
    dom: {
      highlight_box: null
    }
  };

  // shortcut to hasOwnProperty
  var has = Object.prototype.hasOwnProperty;

  // define keys map used to bind actions to hotkeys
  // key codes vary across browsers and we need to support the numeric keypad. See http://www.javascripter.net/faq/keycodes.htm
  var origTest = keys.test = {
    'minus':   function(event) {
      return event.keyCode === 189
        || event.keyCode === 109
        || event.keyCode === 173
        || event.keyCode === 45;
    },
    'plus':  function(event) {  // Also Equals (=) key
      return event.keyCode === 187
        || event.keyCode === 61
        || event.keyCode === 107
        || event.keyCode === 43;
    },
    'r':    function(event) { return event.keyCode === 82; },
    'f8':     function(event) { return event.keyCode === 119; },
    'space':  function(event) { return event.keyCode === 32; }
  };

  keys.hlbKeysTest = {
    'esc':    function(event) { return event.keyCode === 27; },
    // scroll
    'up':     function(event) { return event.keyCode === 38; },
    'down':   function(event) { return event.keyCode === 40; },
    'pageup':   function(event) { return event.keyCode === 33; },
    'pagedown': function(event) { return event.keyCode === 34; },
    'end':    function(event) { return event.keyCode === 35; },
    'home':   function(event) { return event.keyCode === 36; }
  }

  var iframeDialogTest = {
    'esc':    function(event) { return event.keyCode === 27; }
  }

  // define keys map used to bind actions to hotkeys
  var origMap = keys.map = {
    'minus':  { preventDefault: true, event: 'zoom/decrease' },
    'plus':   { preventDefault: true, event: 'zoom/increase' },
    'r':    { preventDefault: true, event: 'inverse/toggle'},
    'f8':     { event: 'ui/toggle' },
    'space':  {
      event: 'highlight/animate',
      preventDefault: true,
      requiresMouseHighlight: true
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

  sitecues.use('jquery', 'mouse-highlight', 'util/common', function($, mh, common){
    // Handle key
    keys.handle = function ( key, event ) {

      // This is shim for browser short cuts; none of our current features requires 'ctrl' or 'alt' so far
      if (event.ctrlKey || event.altKey) {
        return true;
      }

      // If event defined, emit it
      if ( key.event ) {
        sitecues.emit( key.event, event );
      }

      // prevent default if needed
      if (key.preventDefault) {
        common.preventDefault(event);
        // Keeps the rest of the handlers from being executed and prevents the event from bubbling up the DOM tree.
        event.stopImmediatePropagation();
      }
    };

    keys.isEditable = function ( element ) {
      var tag = element.localName;

      if (!tag) {
        return false;
      }

      tag = tag.toLowerCase();

      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return true;
      }

      if (element.getAttribute('tabIndex') || element.getAttribute('onkeydown') || element.getAttribute('onkeypress')) {
        return true; // Be safe, looks like a keyboard-accessible interactive JS widget
      }

      // Check for rich text editor
      var contentEditable = element.getAttribute('contenteditable');

      if (contentEditable && contentEditable.toLowerCase() !== 'false') {
        return true; // In editor
      }

      if (document.designMode === 'on') {
        return true; // Another kind of editor
      }

      return false;
    };

    // key event hook
    keys.hook = function(event) {

      // private variables
      var i, l, key, test, parts, result;

      // ignore events from editable elements
      if ( keys.isEditable(event.target) ) {
        return;
      }

      // iterate over key map
      for(key in keys.map) {
        if (has.call(keys.map, key)) {
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
          for (i=0, l=parts.length; i<l; i++) {
            // get test for key
            test = keys.test[parts[i]];

            // collect all checks
            result = ( !! result ) & ( test && test( event ) );
          }

          if (result) {
            return keys.handle(keys.map[key], $.extend( event, extra_event_properties ));
          }
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
