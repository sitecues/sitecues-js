sitecues.def('keys', function(keys, callback) {

    sitecues.use('jquery', 'mouse-highlight', 'util/common', 'highlight-box',
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

        KEY_TESTS = {
          'space': function(event) {
            // Space command occurs if:
            return (
              // The key is a space key, *and*
              event.keyCode === 32 &&
              // It was not pressed with a modifier (we don't currently support cmd/ctrl/alt/shift with space), *and*
              !hasAnyModifier(event) &&
              // It is not pressed when focus is on something that needs space (e.g. textfield, button or checkbox)
              !common.isSpacebarConsumer(event.target)
            );
          },
          'minus': function(event) {
            // Test all of the possible minus keycodes, including drom the numeric keypad
            if (event.keyCode === 189 || event.keyCode === 109 ||
              event.keyCode === 173 || event.keyCode === 45) {

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
            if (event.keyCode === 187 || event.keyCode === 61 || event.keyCode === 107 || event.keyCode === 43) {

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
          'esc': function(event) {
             // Escape key is only valid if there is an HLB to close
             return event.keyCode === 27 && hlb.getElement();
          }
        },
        // define keys map used to bind actions to hotkeys
        KEY_EVENT_MAP = {
          'space': 'hlb/toggle',
          'minus': 'zoom/decrease',
          'plus': 'zoom/increase',
          'esc': 'hlb/toggle'
        };

      // Non-shift modifier keys (ctrl, cmd, alt)
      function hasCommandModifier(event) {
        return event.altKey || event.ctrlKey || event.metaKey;
      }

      // Any modifer key, including shift
      function hasAnyModifier(event) {
        return event.shiftKey || hasCommandModifier(event);
      }

      // Handle key
      function handle(sitecuesEvent, event) {
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
        if (event.keyCode === 32) {
          event.stopImmediatePropagation();
        }

        // Emit event defined for key
        sitecues.emit(sitecuesEvent, event);
      };

      // key event hook
      function onKeyDown(event) {
        if (event.defaultPrevented) {
          return; // Another script already used this key and set this flag like a good citizen
        }
        // iterate over key map
        for (var key in KEY_EVENT_MAP) {
          if (KEY_EVENT_MAP.hasOwnProperty(key) && KEY_TESTS[key](event)) {
            handle(KEY_EVENT_MAP[key], event);
            return false;
          }
        }
      }

      // bind key hook to window
      // 3rd param changes event order: false == bubbling; true = capturing.
      // We use capturing because we want to get the key before anything else does --
      // this allows us to have the first choice, and we can preventDefault on it so that
      // nothing else uses it after us.
      addEventListener('keydown', onKeyDown, true);

      // done
      callback();
    });
});
