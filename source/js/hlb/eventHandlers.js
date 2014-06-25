/**
 * In order to keep each module as clear as possible we take out some unrelevant code to the separate files.
 * The module represents HLB event handlers.
 * For example, we want to onle allow scroll for HLB and its entities when HLB is open.
 * Stop event bubble up to window/document object.
 *  
 * Note: keydown event is also handled in keys.js
 */

sitecues.def('hlb/eventHandlers', function(eventHandlers, callback) {

  'use strict';
  // shortcut to hasOwnProperty
  var has = Object.prototype.hasOwnProperty;

  sitecues.use('jquery', 'util/common', 'keys', function($, common, keys) {
    
    /**
     * Onmousewheel event handler.
     * @param e EventObject
     */
    eventHandlers.wheelHandler = function(e) {
       
       var hlb = e.data.hlb[0],
           isChild = targetIsChildOfHlb(hlb, e.target);
       // If the mouse is hovering over a child that does not have a scrollbar. 
       // The function common.hasVertScroll returns true even when elements do not have a vertical scrollbar.
       // Don't scroll target if it is a HLB (not a descendant) and doesn't have scroll bar.
       if (!isChild && !common.hasVertScroll(hlb) ||
           (common.wheelUp(e) && $(hlb).scrollTop() <= 0) || 
           (common.wheelDown(e) && $(hlb).scrollTop() + hlb.clientHeight + 1 >= hlb.scrollHeight)) {
         eventHandlers.disableWheelScroll();
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
          target;
      // Iterate over hlb key map.
      for(key in keys.hlbKeysMap) {
        if (has.call(keys.hlbKeysMap, key)) {
          // Split key definition to parts.
          name = key.split(/\s*\+\s*/)[0];
          test = keys.test[name];
          if (test && test(e)) {
            isUp         = keys.hlbKeysMap[key].up;
            doStopScroll = keys.hlbKeysMap[key].stopOuterScroll;
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
      if ((!isUp && $(hlb).scrollTop() + hlb.clientHeight + 6 >=  hlb.scrollHeight) || (isUp &&  $(hlb).scrollTop() <= 0)) {
        common.stopDefaultEventBehavior(e);
        return false;
      }      
      // Otherwise, everything's OK, allow default.
      return true;
    };
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
      common.preventDefault(e);
    }

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