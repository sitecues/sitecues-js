sitecues.def('keys', function(keys, callback) {


    var zoomKeysEnabled = true,
      extra_event_properties = {
        dom: {
            highlight_box: null
        }
      },
      // shortcut to hasOwnProperty
      has = Object.prototype.hasOwnProperty,

      // define keys map used to bind actions to hotkeys
      // key codes vary across browsers and we need to support the numeric keypad. See http://www.javascripter.net/faq/keycodes.htm
      origTest = {
        'editor-safe-minus': function(event) {
            return hasCommandModifier(event) &&
                (event.keyCode === 189 || event.keyCode === 109 || event.keyCode === 173 || event.keyCode === 45);
        },
        'editor-safe-plus': function(event) { // Also Equals (=) key
            return hasCommandModifier(event) &&
                (event.keyCode === 187 || event.keyCode === 61 || event.keyCode === 107 || event.keyCode === 43);
        },
        'plain-minus': function(event) {
            return !hasCommandModifier(event) &&
                (event.keyCode === 189 || event.keyCode === 109 || event.keyCode === 173 || event.keyCode === 45);
        },
        'plain-plus': function(event) { // Also Equals (=) key
            return !hasCommandModifier(event) &&
                (event.keyCode === 187 || event.keyCode === 61 || event.keyCode === 107 || event.keyCode === 43);
        },
        'space': function(event) {
            return event.keyCode === 32 && !hasModifier(event);
        }
      },
      hlbKeysTest = {
        'esc': function(event) {
            return event.keyCode === 27 && !hasModifier(event);
        },
        // scroll
        'up': function(event) {
            return event.keyCode === 38 && !hasModifier(event);
        },
        'down': function(event) {
            return event.keyCode === 40 && !hasModifier(event);
        },
        'pageup': function(event) {
            return event.keyCode === 33 && !hasModifier(event);
        },
        'pagedown': function(event) {
            return event.keyCode === 34 && !hasModifier(event);
        },
        'end': function(event) {
            return event.keyCode === 35 && !hasModifier(event);
        },
        'home': function(event) {
            return event.keyCode === 36 && !hasModifier(event);
        }
      },
      // define keys map used to bind actions to hotkeys
      origMap = {
        'plain-minus': {
            preventDefault: true,
            event: 'zoom/decrease',
            preventInEditors: true
        },
        'plain-plus': {
            preventDefault: true,
            event: 'zoom/increase',
            preventInEditors: true
        },
        'editor-safe-minus': {
            preventDefault: true,
            event: 'zoom/decrease'
        },
        'editor-safe-plus': {
            preventDefault: true,
            event: 'zoom/increase'
        },
        'space': {
            event: 'hlb/toggle',
            preventDefault: true,
            requiresMouseHighlightActive: true
        }
      },
      hlbKeysMap = {
        'esc': {
            event: 'key/esc'
        },
        // If HLB is opened then scroll should only work for HLB inner content, not bubbling up to window.
        // scroll
        'up': {
            stopOuterScroll: true,
            up: true
        },
        'pageup': {
            stopOuterScroll: true,
            up: true
        },
        'home': {
            stopOuterScroll: true,
            up: true
        },
        'down': {
            stopOuterScroll: true,
            down: true
        },
        'pagedown': {
            stopOuterScroll: true,
            down: true
        },
        'end': {
            stopOuterScroll: true,
            down: true
        }
    };

    // Non-shift modifier keys
    function hasCommandModifier(event) {
        return event.altKey || event.ctrlKey || event.metaKey;
    }

    // Any modifer key, including shift
    function hasModifier(event) {
        return event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
    }

    sitecues.use('jquery', 'mouse-highlight', 'util/common', function($, mh, common) {
        // Handle key
        function handle(key, event) {

            // prevent default if needed
            if (key.preventDefault) {
                event.preventDefault();
                // Keeps the rest of the handlers from being executed and prevents the event from bubbling up the DOM tree.
                event.stopImmediatePropagation();
            }

            // If event defined, emit it
            if (key.event) {
                //EQ-1342 (Block +/- keys while HLB open)
                //If hlb is open and the key event is zoom decrease or zoom increase...dont do anything.
                if (!zoomKeysEnabled && (key.event === 'zoom/decrease' || key.event === 'zoom/increase')) {
                    return;
                }
                sitecues.emit(key.event, event);
            }
        };

        // key event hook
        function onKeyDown(event) {

            // private variable
            var key;

            // iterate over key map
            for (key in origMap) {
                if (has.call(origMap, key) && origTest[key](event)) {
                    if (origMap[key].preventInEditors) {
                        // ignore events from elements that need the spacebar
                        if (common.isSpacebarConsumer(event.target)) {
                            return false;
                        }
                    }
                    if (origMap[key].requiresMouseHighlightActive) {
                        if (!mh.isActive()) {
                            // Mouse highlight is not available, revert to default.
                            return false;
                        } else {
                            //We're going to attach the target dom element to the
                            //event, whether it's available or not.
                            var picked = mh.getHighlight();
                            extra_event_properties.dom.mouse_highlight = picked;
                        }
                    }

                    return handle(origMap[key], $.extend(event, extra_event_properties));
                }
            }
            return true;
        }

        keys.getHLBKeysMap = function() {
          return hlbKeysMap;
        };

        keys.getKeysTester = function() {
          return origTest;
        };

        // bind key hook to window
        // 3rd param changes event order: false == bubbling; true = capturing.
        // We use capturing because we want to get the key before anything else does --
        // this allows us to have the first choice, and we can preventDefault on it so that
        // nothing else uses it after us.
        addEventListener('keydown', onKeyDown, true);

        // TODO Is this right architecture? Seems like keys module should possibly be agnostic of HLB,
        // TODO and that HLB code should call in to keys with it's changes? Anyway this works okay for now,
        // TODO but we might want to refactor keys at some point. It's a little confusing IMO.
        sitecues.on('hlb/ready', function(hlbElement) {
            extra_event_properties.dom.highlight_box = $(hlbElement);
            $.extend(origTest, hlbKeysTest);
            $.extend(origMap, hlbKeysMap);
        });

        sitecues.on('hlb/create', function() {
            zoomKeysEnabled = false;
        });

        sitecues.on('hlb/closed', function() {
          zoomKeysEnabled = true;
          for (var key in hlbKeysTest) {
            delete origTest[key];
            delete origMap[key];
          };
        });

        // TODO Key handling needs some work. We need a stack of key states, so that new states can restore old ones
        // TODO after they close. For the new dialog, we will keep the last keys map, and restore after.

        // done
        callback();
    });
});
