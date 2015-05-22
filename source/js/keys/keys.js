sitecues.def('keys', function(keys, callback) {

    sitecues.use('jquery', 'mouse-highlight', 'util/common', 'hlb',
      function($, mh, common, hlb) {

      var
        // KEY_TESTS defines keys used to bind actions to hotkeys.
        // The key tests return true if the correct key was pressed, the current focus
        // is not on an element that needs the key, and the sitecues state is appropriate).
        // 'Correct key' includes all key possible codes including alternate keys on the numeric keypad for +/-
        // and additional codes resulting from browser differences.
        // See http://www.javascripter.net/faq/keycodes.htm
        //
        // ** A key test should return true if the key is considered fired and valid **
        //
        // Note: for movement keys we also support the numeric keypad:
        // [7 Home ]  [ 8 Up ]  [9 PgUp  ]
        // [4 Left ]  [ 5    ]  [6 Right ]
        // [1 End  ]  [ 2 Dn ]  [3 PgDn  ]

        NUMPAD_0 = 48,
        NUMPAD_1 = 97,
        NUMPAD_2 = 98,
        NUMPAD_3 = 99,
        NUMPAD_4 = 100,
        NUMPAD_5 = 101,
        NUMPAD_6 = 102,
        NUMPAD_7 = 103,
        NUMPAD_8 = 104,
        NUMPAD_9 = 105,
        ESCAPE   = 27,
        SPACE    = 32,
        PAGE_UP  = 33,
        PAGE_DN  = 34,
        END      = 35,
        HOME     = 36,
        LEFT     = 37,
        UP       = 38,
        RIGHT    = 39,
        DOWN     = 40,
        DASH     = 189,
        NUMPAD_SUBTRACT = 109,
        MINUS_ALTERNATE_1 = 173,
        MINUS_ALTERNATE_2 = 45,
        EQUALS   = 187,
        NUMPAD_ADD = 107,
        PLUS_ALTERNATE_1 = 61,
        PLUS_ALTERNATE_2 = 43,
        LETTER_H = 72,
        QUOTE = 222,
        SHIFT = 16,
        F8 = 119,
        isShiftKeyDown,
        isAnyNonShiftKeyDown,

        KEY_TESTS = {
          'space': function(event) {
            // Space command occurs if:
            return (
              // The key is a space key, *and*
              event.keyCode === SPACE &&
              // It was not pressed with a modifier (we don't currently support cmd/ctrl/alt/shift with space), *and*
              !hasCommandModifier(event) &&
              // HLB is on or highlighting is enabled
              sitecues.isSitecuesOn() &&
              // It is not pressed when focus is on something that needs space (e.g. textfield, button or checkbox)
              !common.isSpacebarConsumer(event.target)
            );
          },
          'minus': function(event) {
            // Test all of the possible minus keycodes, including drom the numeric keypad
            if (event.keyCode === DASH || event.keyCode === NUMPAD_SUBTRACT ||
              event.keyCode === MINUS_ALTERNATE_1 || event.keyCode === MINUS_ALTERNATE_2) {

              // Minus cannot trigger if there is an HLB
              if (hlb.getElement()) {
                return;
              }

              // If modified (ctrl/cmd/etc.), then the minus command can be used no matter what is focused,
              // because it is not being used to type '-'
              if (hasCommandModifier(event)) {
                return true;
              }

              // Plain minus was pressed without a modifier -- the command is only valid if we're not in an editable field
              // (which needs to allow the user to type the minus key)
              return !common.isEditable(event.target);
            }
          },
          'plus': function(event) {
            // Test all of the possible plus keycodes, including from the numeric keypad.
            // Also tests for equals (=) key, which is effectively an unmodified + key press
            if (event.keyCode === EQUALS || event.keyCode === NUMPAD_ADD ||
              event.keyCode === PLUS_ALTERNATE_1 || event.keyCode === PLUS_ALTERNATE_2) {

              // Plus cannot trigger if there is an HLB
                if (hlb.getElement()) {
                  return;
                }

              // If modified (ctrl/cmd/etc.), then the plus command can be used no matter what is focused,
              // because it is not being used to type '+'
              if (hasCommandModifier(event)) {
                return true;
              }

              // Plain plus was pressed without a modifier -- the command is only valid if we're not in an editable field
              // (which needs to allow the user to type the plus key)
              return !common.isEditable(event.target);
            }
          },
          'reset': function(event) {   // Alt+0 resets all of sitecues
            return event.keyCode === NUMPAD_0 && event.altKey;
          },
          'zoom1x': function(event) {  // Ctrl+0, Cmd+0 or just 0 to reset zoom only
            return event.keyCode == NUMPAD_0 && (!common.isEditable(event.target) || hasCommandModifier(event));
          },
          'speech': function(event) {
            return event.keyCode === QUOTE && event.altKey && !common.isEditable(event.target);
          },
          'esc': function(event) {
             // Escape key is only valid if there is an HLB to close
             return event.keyCode === ESCAPE && (mh.getHighlight().isVisible || hlb.getElement());
          },
          // For arrow keys, allow number pad usage as well (2/4/6/8)
          'up': function(event) {
            return (event.keyCode === UP || event.keyCode === NUMPAD_8) && canMoveHighlight(event);
          },
          'down': function(event) {
            return (event.keyCode === DOWN || event.keyCode === NUMPAD_2) && canMoveHighlight(event);
          },
          'left': function(event) {
            return (event.keyCode === LEFT || event.keyCode === NUMPAD_4) && canMoveHighlight(event);
          },
          'right': function(event) {
            return (event.keyCode === RIGHT || event.keyCode === NUMPAD_6) && canMoveHighlight(event);
          },
          'heading': function(event) {
            return event.keyCode === LETTER_H && !common.isEditable(event.target) && !event.altKey && !event.ctrlKey && !event.metaKey;
          },
          'pageup': function(event) {
            return (event.keyCode === PAGE_UP || event.keyCode === NUMPAD_9) && canScrollHlb(event);
          },
          'pagedn': function(event) {
            return (event.keyCode === PAGE_DN || event.keyCode === NUMPAD_3) && canScrollHlb(event);
          },
          'home': function(event) {  // Also support cmd+up on Mac
            if (!canScrollHlb(event)) {
              return false;
            }
            return (event.keyCode === HOME && !hasAnyModifier(event)) ||
              event.keyCode === NUMPAD_7 ||
              (event.keyCode === UP && event.metaKey);
          },
          'end': function(event) {  // Also support cmd+down on Mac
            if (!canScrollHlb(event)) {
              return false;
            }
            return (event.keyCode === END && !hasAnyModifier(event)) ||
              event.keyCode === NUMPAD_1 ||
              (event.keyCode === DOWN && event.metaKey);
          },
          'f8': function(event) {
            return event.keyCode === F8 && !hasAnyModifier(event);
          }
        },
        // define keys map used to bind actions to hotkeys
        KEY_EVENT_MAP = {
          'space': 'key/space',
          'minus': 'zoom/decrease',
          'plus': 'zoom/increase',
          'reset': 'sitecues/do-reset',
          'zoom1x': 'zoom/do-reset',
          'esc': 'key/esc',
          'speech': 'speech/do-toggle'
        },
        KEY_EVENT_DEFAULT = 'key/nav';

      function canMoveHighlight(event) {
        return !hasCommandModifier(event) &&    // Plain or shifted keystroke
          (mh.getHighlight().isVisible || hlb.getElement()) &&    // Visible highlight or HLB
          !common.isEditable(event.target);   // Not focused in editable area
      }

      function canScrollHlb(event) {
        return hlb.getElement() && !common.isEditable(event.target);
      }

      // Non-shift modifier keys (ctrl, cmd, alt)
      function hasCommandModifier(event) {
        return event.altKey || event.ctrlKey || event.metaKey;
      }

      // Any modifer key, including shift
      function hasAnyModifier(event) {
        return event.shiftKey || hasCommandModifier(event);
      }

      // Handle key
      function handle(sitecuesEvent, event, keyName) {
        // Prevent default behavior of key. The browser listens to these events
        // and does not execute commands based on the key pressed
        // (such as spacebar to page down, cmd+plus to zoom, arrow key to scroll, shift+arrow to select)
        event.preventDefault();
        // Keeps the rest of the handlers from being executed and prevents the event from bubbling up the DOM tree.
        // It's nother layer of protection. Here's why we need it even though web browsers respect the defaultPrevented flag.
        // Scripts generally do not look at that flag. If they get a key, they just consume it.
        // Therefore, if the user is focused on a JS widget, such as a
        // <div onkeydown="..."/>, there is the possibility that both sitecues and the widget would handle the key.
        // Examples:
        // - spacebar in a button
        // - plus or minus key in a tree view or map (for zoom)
        // Spacebar is probably the most likely, but as we start handling other keys such
        // as arrows, we need to be careful. We could either decide which keys that we consume
        // need stopImmediatePropagation, or just do it always to be safe.
        // TODO put this back for all keys -- after we decide how metrics will learn about keys
        if (event.keyCode === 32 || event.keyCode === 27) {
          event.stopImmediatePropagation();
        }

        // Emit event defined for key
        sitecues.emit(sitecuesEvent, event, keyName);
      };

      // key event hook
      function onKeyDown(event) {

        // Shift key gets additional processing before other keys
        preProcessKeyDown(event);

        if (event.defaultPrevented) {
          return; // Another script already used this key and set this flag like a good citizen
        }

        // iterate over key map
        for (var key in KEY_TESTS) {
          if (KEY_TESTS.hasOwnProperty(key) && KEY_TESTS[key](event)) {
            handle(KEY_EVENT_MAP[key] || KEY_EVENT_DEFAULT, event, key);
            doFollowScroll(true);
            return false;
          }
        }

        // All other keys will fall through to default processing

        // Don't allow panning via arrow or other scroll keys to accidentally activate highlighting.
        // This happens when the panning causes the mouse on the screen to go over new content, firing a mouseover event.
        doFollowScroll(false);
      }

      function onKeyUp(event) {
        doFollowScroll(true);
        if (event.keyCode === SHIFT) {
          if (isOnlyShift()) {
            sitecues.emit('mh/do-speak', mh.getHighlight().picked, true);
          }
        }

        isShiftKeyDown = false;
        // Once the shift key is up, we clear the any key down flag.
        // This is a simple approach that handles all except very weird key behavior
        // such as shift up down up all while another key is pressed.
        isAnyNonShiftKeyDown = false;

        emitOnlyShiftStatus();
      }

      // Track to find out whether the shift key is pressed by itself
      function emitOnlyShiftStatus() {
        sitecues.emit('key/only-shift', isOnlyShift());
      }

      function isOnlyShift() {
        return isShiftKeyDown && !isAnyNonShiftKeyDown;
      }

      // If shift key down, process it
      function preProcessKeyDown(event) {
        var isShift = event.keyCode === SHIFT;
        if (!isShift || !isShiftKeyDown) {
          // Key down stops speech/audio
          // Exception is repeated shift key, which also starts speech when shift is held down
          sitecues.emit('audio/do-stop');
        }

        if (!isShift) {
          isAnyNonShiftKeyDown = true;
        }
        isShiftKeyDown = isShift;
        emitOnlyShiftStatus();
      }

      function doFollowScroll(isFollowMouseEnabled) {
        sitecues.emit('mh/track-scroll', isFollowMouseEnabled);
      }

      // bind key hook to window
      // 3rd param changes event order: false == bubbling; true = capturing.
      // We use capturing because we want to get the key before anything else does --
      // this allows us to have the first choice, and we can preventDefault on it so that
      // nothing else uses it after us.
      addEventListener('keydown', onKeyDown, true);

      // Will reenable highlight on mouse follow
      addEventListener('keyup', onKeyUp, true);

      // done
      callback();
    });
});