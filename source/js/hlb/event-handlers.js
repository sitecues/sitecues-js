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

  sitecues.use('jquery', 'util/common', 'keys', 'platform', 'conf', function($, common, keys, platform, conf) {

    /////////////////////////
    // PRIVATE VARIABLES
    ////////////////////////

    var has = Object.prototype.hasOwnProperty,

        // DEFAULT_IE_SCROLL_PIXEL_DELTA is the amount of pixels an element is scrolled in IE.
        // The number we use is actually 7 pixels greater than the actual pixels measured (93), however,
        // the results differed depending on how much the page has zoomed.  To be safe, and to not spend
        // too much time investigating and researching this number across all IE9+/Windows XP+, a greater
        // number is used.
        //
        // TEST PAGE: http://ts.dev.sitecues.com/hlb/scrolling/scrolling-hlb.html
        //
        // HOW IE SCROLLS: IE will always scroll a fixed amount of pixels.  If the current element is scrollable by
        // 1 pixel, and its parent is scrollable by 99 pixels, and IE default scroll is 90 pixels, then a single scroll
        // action within the current element will scroll it by 1 pixel and scroll the parent element by 89 pixels.  This
        // poses a problem when scrolling the HLB in IE.
        //
        // NOTE: Windows settings for mouse scrolling effects this value, and will break the scrolling functionality.
        //       Perhaps, in the future, we should compute this amount instead of relying on a "magic" number.

        DEFAULT_IE_SCROLL_PIXEL_DELTA = 100,
        isIE = platform.browser.isIE,

        // Set this to 0 to see how scrolling the HLB in IE will function.
        scrollOverflow = isIE ? DEFAULT_IE_SCROLL_PIXEL_DELTA : 0;

    /////////////////////////
    // PRIVATE FUNCTIONS
    ////////////////////////

    /**
     * [shouldPreventScroll determines if scrolling should be disabled or enabled]
     * @param  {[DOM scroll event]} e [Object representing scrolling data]
     * @return {[Boolean]}   [True turns off scrolling, false turns it on.]
     */
    function shouldPreventScroll (e) {

      var hlb                    = e.data.hlb[0],
          isChild                = targetIsChildOfHlb(hlb, e.target),
          scrollAmountMultiplier = getScrollAmountMultiplier(e),
          zoom                   = conf.get('zoom'),

          // Value will be 0 for non IE browsers.
          predictedScrollAmount  = scrollOverflow * scrollAmountMultiplier / zoom;

      return (!isChild && !common.hasVertScroll(hlb) ||
             (common.wheelUp(e) && $(hlb).scrollTop() - predictedScrollAmount <= 0) ||
             (common.wheelDown(e) && $(hlb).scrollTop() + hlb.clientHeight + 1 + predictedScrollAmount >= hlb.scrollHeight));
    }

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

    /**
     * Wheel scroll event handler.
     * @param e Event Object
     */
    function wheel(e) {
      e.preventDefault();
      e.returnValue = false;
      return false;
    }


    /**
     * [getScrollAmountMultiplier returns the amount of rotations a scrollwheel has made since
     *  the last scroll event was emitted. Always multiples of 120, and only matters for IE]
     * @param  {[DOM scroll event]} e [Object representing scrolling data]
     * @return {[Integer]}   [The amount of scroll wheel rotations.]
     */
    function getScrollAmountMultiplier (e) {

      if (isIE) {
        return Math.abs(e.originalEvent.wheelDelta) / 120;
      }

      return 1;

    }

    /////////////////////////
    // PUBLIC METHODS
    ////////////////////////

    /**
     * Onmousewheel event handler.
     * @param e EventObject
     */
    eventHandlers.wheelHandler = function(e) {

      var hlb = e.data.hlb[0];

      // If the mouse is hovering over a child that does not have a scrollbar.
      // The  function common.hasVertScroll returns true even when elements do not have a vertical scrollbar.
      // Don't scroll target if it is a HLB (not a descendant) and doesn't have scroll bar.
      if (shouldPreventScroll(e)) {

        if (isIE) {
          if (common.wheelUp(e)) {
            hlb.scrollTop = 0;
          } else {
            hlb.scrollTop = hlb.scrollHeight;
          }
        }

        eventHandlers.disableWheelScroll();
        e.returnValue = false;
        return false;
      }

      eventHandlers.enableWheelScroll();

    };

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
     * Unbinds wheel scroll event from window and document.
     * DOMMouseScroll : https://developer.mozilla.org/en-US/docs/DOM/DOM_event_reference/DOMMouseScroll (firefox only)
     * mousewheel     : https://developer.mozilla.org/en-US/docs/DOM/DOM_event_reference/mousewheel     (chrome, ie, safari)
     */
    eventHandlers.disableWheelScroll = function() {
      $(window).on('DOMMouseScroll mousewheel', wheel);
    };

    /**
     * Binds wheel scroll event to window and document.
     */
    eventHandlers.enableWheelScroll = function() {
      $(window).off('DOMMouseScroll mousewheel', wheel);
    };

    // Done.
    callback();

  });

});