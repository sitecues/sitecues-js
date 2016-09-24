// We do not want the mouse wheel to scroll the document when it's over the BP
define(
  [
    'core/events',
    'core/bp/helper',
    'core/bp/constants'
  ],
  function (
    events,
    helper,
    BP_CONST
  ) {
  'use strict';

  var isInitialized;

  // Return truthy if document will be scrolled
  // This occurs if the current element is already scrolled all the way in this direction
  function isFinishedScrollingElement(elem, event) {
    var
      deltaY = parseInt(event.deltaY || -event.wheelDeltaY),    // parseInt() sanitizes by converting strange -0 value to 0
      scrollHeight     = elem.scrollHeight,    // The total height of the scrollable area
      scrollTop        = elem.scrollTop,       // Pixel height of invisible area above element (what has been scrolled)
      clientHeight     = elem.clientHeight,    // The height of the element in the window
      scrollBottom     = scrollHeight-scrollTop-clientHeight, // The pixels height invisible area below element (what is left to scroll)
      scrollingDown    = deltaY > 0,           // If the user is scrolling downwards
      scrollingUp      = deltaY < 0;           // If the user is scrolling upwards

    return (scrollingDown && deltaY > scrollBottom) ||   // Already at bottom
      (scrollingUp && -deltaY > scrollTop) ||   // Already at top
      !deltaY; // Horizontal scrolling will always scroll document
  }

  function shouldCancelScrollEvent(evt) {
    var target = helper.getEventTarget(evt);

    if (!target.hasAttribute('data-allow-scroll')) {
      // Most elements in BP don't allow scrolling at all
      return true;
    }

    // In an element that needs scrolling such as textarea
    if (isFinishedScrollingElement(target, evt)) {
      // Finished scrolling element -- scroll event will propagate up unless we cancel it.
      // Unfortunately you cannot just stopPropagation() on a scroll event to prevent it from scrolling the parent
      return true;
    }
  }

  // Don't scroll document while BP is open
  function preventDocumentScroll(evt) {
    if (shouldCancelScrollEvent(evt)) {
      return helper.cancelEvent(evt);
    }
  }

  function getBpContainer() {
    return helper.byId(BP_CONST.BP_CONTAINER_ID);
  }

  function willExpand() {
    getBpContainer().addEventListener('wheel', preventDocumentScroll);
  }

  function willShrink() {
    getBpContainer().removeEventListener('wheel', preventDocumentScroll);
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    willExpand(); // First time
    events.on('bp/will-expand', willExpand);
    events.on('bp/will-shrink', willShrink);
  }

  return {
    init: init
  };
});
