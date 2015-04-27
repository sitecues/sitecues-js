/**
 * In order to keep each module as clear as possible we take out some unrelevant code to the separate files.
 * The module represents HLB event handlers.
 * For example, we want to onle allow scroll for HLB and its entities when HLB is open.
 * Stop event bubble up to window/document object.
 *
 * Note: keydown event is also handled in keys.js
 */
// TODO: Call this module scrolling.js
sitecues.def('hlb/event-handlers', function(eventHandlers, callback) {

  'use strict';

  sitecues.use('jquery', 'util/common', 'keys', 'platform', function($, common, keys, platform) {

    /////////////////////////
    // PRIVATE VARIABLES
    ////////////////////////

        // Decide which event to use depending on which browser is being used
    var wheelEventName = platform.browser.isSafari ? 'mousewheel' : 'wheel',

        //  Wheel event callback, must be scoped at the module level because
        //  we create this event callback every time the HLB opens because
        //  the callback requires a reference to the HLB element...s
        wheelEventCallback,

      isCapturing;

    /**
     * [releaseWheelEvents disables the capturing of wheel events.  This is called once the HLB is closed.]
     */
    eventHandlers.releaseWheelEvents = function () {

      window.removeEventListener(wheelEventName, wheelEventCallback);

      isCapturing = false;

    };

    /**
     * [captureWheelEvents captures wheel events while the HLB is open. ]
     * @param  {[jQuery Element]} $hlb [The HLB element]
     */
    eventHandlers.captureWheelEvents = function ($hlb) {

      if (isCapturing) {
        return; // Already capturing
      }

      isCapturing = true;

      /**
       * [wheelHandler listens to all scroll events in the window and prevents scroll outside of HLB]
       * @param  {[DOM scroll event]} e [Object representing scrolling data]
       * TODO: Determine if this is the best way to handle this situation.  The reason we create a new
       * function every time we want to listen to wheel events is because the callback needs reference
       * to the HLB element. That is the problem that this approach solves, probably isn't ideal...
      */
      wheelEventCallback = function (event) {

        // Get the deltaY value when the user scrolls (how fast the user is scrolling)
        var deltaY = event.deltaY || -event.wheelDeltaY;

        // Sometimes there is no deltaY number, or a deltaY of "0"
        // (when the user is scrolling horizontally along X)
        if (isNaN(deltaY) || deltaY >-1 && deltaY <1) {

          // We prevent the scroll event for horizontal scrolls
          return preventScroll(event);
        }

        /*

          Dimension Calculations:

                     /////////
                   ↑ /       / ↕ Scroll Top
            Scroll | XXXXXXXXX
            Height | X       X ↑
                   | X  HLB  X | Client Height
                   | X       X ↓
                   | XXXXXXXXX
                   ↓ /       / ↕ Scroll Bottom
                     /////////

        */

        // Get the dimensions
        var elem             = $hlb[0]       // The HLB Element
          , scrollHeight     = elem.scrollHeight    // The total height of the scrollable area
          , scrollTop        = elem.scrollTop       // Pixel height of invisible area above element (what has been scrolled)
          , clientHeight     = elem.clientHeight    // The height of the element in the window
          , scrollBottom     = scrollHeight-scrollTop-clientHeight // The pixels height invisible area below element (what is left to scroll)
          , scrollingDown    = deltaY > 0           // If the user is scrolling downwards
          , scrollingUp      = deltaY < 0           // If the user is scrolling upwards
          , scrolledToBottom = scrollBottom <= 1    // There are now more invisible pixels below the element
          , scrolledToTop    = elem.scrollTop <= 1  // There are now more invisible pixels above the element
          ;


        // Prevent any scrolling if the user is:
        //   a) Not scrolling on the HLB element directly.
        //   b) Not scrolling on a decendant of the HLB element.
        if (!$hlb.is(event.target) && !$.contains(elem, event.target))  {
          preventScroll(event);
        }

        // If the user is scrolling down, (but has not reached the bottom), and
        // is trying to scroll down more pixels that there are left to scroll...
        if (scrollingDown && deltaY >= scrollBottom) {
          // ...set the scroll to the bottom...
          elem.scrollTop = elem.scrollHeight;
          // ...and stop scrolling.
          preventScroll(event);
        }

        // If the user tries to scroll down past the bottom...
        if (scrolledToBottom && scrollingDown) {
          preventScroll(event); // ...stop scrolling.
        }

        // If the user is scrolling up, (but has not reached the top), and is
        // trying to scroll up more pixels that there are left to scroll...
        if (scrollingUp && scrollTop-(-deltaY) <= 0) {
          // ...set the scroll to the top...
          elem.scrollTop = 0;
          // ...and stop scrolling.
          preventScroll(event);
        }

        // If the user tries to scroll down past the bottom...
        if (scrolledToTop && scrollingUp) {
          preventScroll(event); // ...stop scrolling.
        }

        // Prevent the original scroll event
        function preventScroll() {
          event.preventDefault();
          event.returnValue = false;
          return false;
        }

      };


      // Trap the mousewheel events (wheel for all browsers except Safari, which uses mousehweel)
      window.addEventListener(wheelEventName, wheelEventCallback);

    };

    // Done.
    callback();

  });

});