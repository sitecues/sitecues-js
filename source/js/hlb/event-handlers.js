/**
 * In order to keep each module as clear as possible we take out some unrelevant code to the separate files.
 * The module represents HLB event handlers.
 * For example, we want to onle allow scroll for HLB and its entities when HLB is open.
 * Stop event bubble up to window/document object.
 *
 * Note: keydown event is also handled in keys.js
 */

sitecues.def('hlb/event-handlers', function(eventHandlers, callback) {

  'use strict';

  sitecues.use('jquery', 'util/common', 'keys', 'platform', function($, common, keys, platform) {

    /////////////////////////
    // PRIVATE VARIABLES
    ////////////////////////

    var has = Object.prototype.hasOwnProperty,

        // Decide which event to use depending on which browser is being used
        wheelEventName = platform.browser.isSafari ? 'mousewheel' : 'wheel',

        //  Wheel event callback, must be scoped at the module level because
        //  we create this event callback every time the HLB opens because
        //  the callback requires a reference to the HLB element...s
        wheelEventCallback;

    /////////////////////////
    // PRIVATE FUNCTIONS
    ////////////////////////

    /**
     * Check is current target is an descentor of hlb element.
     * @param hlb Html Object
     * @param eTarget Object
     */
    function targetIsChildOfHlb(hlb, eTarget) {

      var isChild;

      $(hlb).children().each(function() {
        if ($(this).is(eTarget)) {
          isChild = true;
          return;
        }
      });
      return isChild;
    }

    /////////////////////////
    // PUBLIC METHODS
    ////////////////////////


    /**
     * Onkeydown event handler.
     * @param e EventObject
     */
    eventHandlers.keyDownHandler = function(e) {

      var hlb = e.data.hlb[0],
          key,
          name,
          test,
          isUp,
          doStopScroll,
          isChild,
          target,
          hlbKeysMap = keys.getHLBKeysMap(),
          keysTester = keys.getKeysTester();
      // Iterate over hlb key map.
      for (key in hlbKeysMap) {
        if (has.call(hlbKeysMap, key)) {
          // Split key definition to parts.
          name = key.split(/\s*\+\s*/)[0];
          test = keysTester[name];
          if (test && test(e)) {
            isUp = hlbKeysMap[key].up;
            doStopScroll = hlbKeysMap[key].stopOuterScroll;
            break;
          }
        }
      }
      // Some unrelevant key pressed, skip.
      if (!doStopScroll) {
        return;
      }
      // Find out if target is a child of HLB(inner content element).
      isChild = targetIsChildOfHlb(hlb, e.target);
      // Don't scroll target if it is a HLB(not a descendant) and doesn't have scroll bar.
      if (!isChild && !common.hasVertScroll(hlb)) {
        common.stopDefaultEventBehavior(e);
        return false;
      }
      // Pageup/pagedown default behavior always affect window/document scroll(simultaniously with element's local scroll).
      // So prevent default and define new scroll logic.
      if (name === 'pagedown' || name === 'pageup') {
        target = isChild ? e.target : hlb;
        common.smoothlyScroll(e, target, Math.round(target.offsetHeight / 2), isUp);
        return false;
      }
      // todo: add all text input elements in this check
      // If it is a child then we just return, the event will bubble up to the HLB and treated there.
      if (isChild || hlb.tagName.toLowerCase() === 'input' || hlb.tagName.toLowerCase() === 'textarea') {
        return true;
      }

      switch (name) {
        case 'down':
        case 'up':
          common.smoothlyScroll(e, hlb, 10, isUp);
          break;
        case 'end':
        case 'home':
          if (isUp) {
            $(hlb).scrollTop(0);
          } else {
            $(hlb).scrollTop($(hlb)[0].offsetHeight);
          }
          break;
        default:
          break;
      }
      // Prevent all scrolling events because the height exceeded.
      if ((!isUp && $(hlb).scrollTop() + hlb.clientHeight + 6 >= hlb.scrollHeight) || (isUp && $(hlb).scrollTop() <= 0)) {
        common.stopDefaultEventBehavior(e);
        return false;
      }
      // Otherwise, everything's OK, allow default.
      return true;
    };

    /**
     * [releaseWheelEvents disables the capturing of wheel events.  This is called once the HLB is closed.]
     */
    eventHandlers.releaseWheelEvents = function () {

      window.removeEventListener(wheelEventName, wheelEventCallback);

    };

    /**
     * [captureWheelEvents captures wheel events while the HLB is open. ]
     * @param  {[jQuery Element]} $hlbElement [The HLB element]
     */
    eventHandlers.captureWheelEvents = function ($hlbElement) {

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
        var elem             = $hlbElement[0]       // The HLB Element
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
        if (!$hlbElement.is(event.target) && !$.contains(elem, event.target))  {
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