sitecues.def('hlb/event-handlers', function(eventHandlers, callback) {
    // shortcut to hasOwnProperty
    var has = Object.prototype.hasOwnProperty;
	sitecues.use('jquery', 'util/common', 'keys',  function($, common, keys) {
        
        eventHandlers.wheelHandler = function(e) {
           var target = e.data.hlb[0];
           // Find out if target is a child of HLB(inner content element)
           var isChild;
           $(target).children().each(function() {
                if ($(this).is(e.target)) {
                    isChild = true;
                    return;
                }
           })
           target = isChild ? e.target : target;
            // Don't scroll target if it is a HLB(not a descendant) and doesn't have scroll bar.
           if (!isChild && !common.hasVertScroll(target)
               || (common.wheelUp(e) && $(target).scrollTop() <= 0)
               || (common.wheelDown(e) && $(target).scrollTop() + target.clientHeight + 1 >= target.scrollHeight)) {
                   eventHandlers.disableWheelScroll();
                   return false;
           }

           eventHandlers.enableWheelScroll();
        }
        
        eventHandlers.keyDownHandler = function(e) {
            var target = e.data.hlb[0];
            // Iterate over hlb key map
            for(var key in keys.hlbKeysMap) if (has.call(keys.hlbKeysMap, key)) {
                // Split key definition to parts
                var name = key.split(/\s*\+\s*/)[0];
                var test = keys.test[name];
                if (test && test(e)) {
                    var isUp = keys.hlbKeysMap[key].up;
                    var doStopScroll = keys.hlbKeysMap[key].stopOuterScroll;
                    break;
                }
            }

            if (!doStopScroll) { // some unrelevant key pressed, skip
                return;
            }
 
            // Find out if target is a child of HLB(inner content element)
            var isChild;
            $(target).children().each(function() {
                if ($(this).is(e.target)) {
                    isChild = true;
                    return;
                }
            })

            // Don't scroll target if it is a HLB(not a descendant) and doesn't have scroll bar.
            if (!isChild && !common.hasVertScroll(target)) {
                common.stopDefaultEventBehavior(e);
                return false;
            }

            // Pageup/pagedown default behavior always affect window/document scroll(simultaniously with element's local scroll).
            // So prevent default and define new scroll logic.
            if (name === 'pagedown' || name === 'pageup') {
                target = isChild ? e.target : target;
                common.smoothlyScroll(e, target, Math.round(target.offsetHeight / 4), isUp);
                return false;
           }

            // Handle name === 'end, 'home', 'up', 'down' etc

            // todo: add all text input elements in this check
            // If it is a child then we just return, the event will bubble up to the HLB
            if (isChild || target.tagName.toLowerCase() == 'input' || target.tagName.toLowerCase() == 'textarea') {
               return true;
            }

            switch (name) {
                case 'down':
                case 'up':
                    common.smoothlyScroll(e, target, 1, isUp);
                    break;
                case 'end':
                case 'home':
                    isUp? $(target).scrollTop(0) : $(target).scrollTop($(target).width());
                    break;
                default:
                    break;
            }

            // Prevent all scrolling events because the height exceeded.
            if ((!isUp && $(target).scrollTop() + target.clientHeight + 6 >=  target.scrollHeight)
            ||  (isUp &&  $(target).scrollTop() <= 0)) {
                common.stopDefaultEventBehavior(e);
                return false;
            }
            return true;
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
             */
            eventHandlers.disableWheelScroll = function() {
                if (window.addEventListener) {
                    window.addEventListener('DOMMouseScroll', wheel, false);
                }
                window.onmousewheel   =  wheel;
                document.onmousewheel = wheel;
            }

            /**
             * Binds wheel scroll event to window and document.
             */
            eventHandlers.enableWheelScroll = function() {
                if (window.removeEventListener) {
                    window.removeEventListener('DOMMouseScroll', wheel, false);
                }
                window.onmousewheel = null; 
                document.onmousewheel = null;
            }
        
    // Done.
    callback();
    });

});