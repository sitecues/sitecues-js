/**
 * The module provides HLB keystroke handling, such as arrow keys to scroll the HLB.
 */

sitecues.def('hlb/navkeys', function(navkeys, callback) {

  'use strict';

  sitecues.use('jquery', 'util/common',
    function($, common) {

    /////////////////////////
    // PRIVATE VARIABLES
    ////////////////////////

    var LINE_HEIGHT = 10, // TODO should we use the real line-height as getLineHeight() in highlight-position.js does?
      SCROLL_KEY_AMOUNTS =  // Map key codes to scroll direction
        { 38: { dir: -1, type: 'line' }, /* up */
          33: { dir: -1, type: 'page' }, /* pageup */
          36: { dir: -1, type: 'doc' }, /* home */
          40: { dir: 1, type: 'line' }, /* down */
          34: { dir: 1, type: 'page' }, /* pagedown */
          35: { dir: 1, type: 'doc' }  /* end */
        };

    /////////////////////////
    // PUBLIC METHODS
    ////////////////////////

    /**
     * Onkeydown event handler.
     * @param e EventObject
     */
    navkeys.keyDownHandler = function(e) {

      return; // Temporary for teaching HLB to move.

      var target = e.target,
          hlb = document.getElementById('sitecues-hlb'),
          keyEntry = SCROLL_KEY_AMOUNTS[e.keyCode],
          currTop = hlb.scrollTop,  // Where it's scrolled to now
          newTop;  // Where we want to scroll to

      // If it is a child then we just return, the event will bubble up to the HLB and treated there.
      if (!hlb || !keyEntry || common.isEditable(target)) {
        return true;
      }

      // Not in an editor, and inside the HLB -- prevent the key from
      // affecting the document
      e.preventDefault();
      e.stopPropagation();

      // Don't scroll target it's not a scrollable descendant of the HLB element
      if (!common.hasVertScroll(hlb)) {
        return false;
      }

      switch (keyEntry.type) {
        case 'page':
          // Pageup/pagedown default behavior always affect window/document scroll
          // (simultaneously with element's local scroll).
          // So prevent default and define new scroll logic.

          newTop = currTop + hlb.offsetHeight * keyEntry.dir / 2; // TODO why /2 ?
          break;
        case 'line':
          newTop = currTop + keyEntry.dir * LINE_HEIGHT;
          break;
        case 'doc':
          hlb.scrollTop = keyEntry.dir < 0 ? 0 : hlb.scrollHeight;
          return false;
        default:
          break;
      }
      // Prevent all scrolling events because the height exceeded.
      hlb.scrollTop = Math.max(0, newTop);
      return false;
    };

    // Done.
    callback();
  });

});