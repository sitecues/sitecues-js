/*
 Panel Controller
 */
define(['bp/constants', 'bp/model/state', 'bp/helper', 'core/metric'],
  function (BP_CONST, state, helper, metric) {

  var MIN_DISTANCE = 75, // Min distance before shrink
    mouseLeaveShrinkTimer,  // How long we wait before shrinking BP from any mouseout (even only just barely outside panel)
    isListening,
    isZooming,
    isExpandingOrExpanded = true,  // First time, we will already be expanded
    isInitialized,
    isSticky,
    byId = helper.byId;

  function cancelMouseLeaveShrinkTimer() {
    clearTimeout(mouseLeaveShrinkTimer);
    mouseLeaveShrinkTimer = 0;
  }

  // Return truthy value if a button is pressed on a mouse event.
  // There are three properties for mouse buttons, and they all work differently -- both
  // in terms of browsers and on mousemove events in particular.
  // DANGER! Does not work in IE9 -- always returns falsey value.
  // If we need it in IE9 we'll need to globally track mousedown and mouseup events.
  function isButtonDown(mouseEvent) {
    return (typeof mouseEvent.buttons === 'undefined' ? mouseEvent.which : mouseEvent.buttons);
  }

    // Don't close panel too quickly when the mouse leaves the window, because the panel
  // may be near the window's edge and users with shaky hands may accidentally move mouse outside the window.
  // We don't know anything about the mouse other than the fact that it left the window
  function winMouseLeave(evt) {
    if (helper.getEventTarget(evt).id === BP_CONST.BADGE_ID) {
      mouseLeaveShrinkTimer = setTimeout(shrinkPanel, BP_CONST.MOUSELEAVE_DELAY_SHRINK_BP);
    }
  }

  function winMouseMove(evt) {

    if (isButtonDown(evt)) {
      return; // Slider in use or text selection, etc.
    }

    if (isMouseOutsidePanel(evt, MIN_DISTANCE)) {
      if (SC_DEV && isSticky) {
        return;
      }
      if (state.get('wasMouseInPanel')) {
        shrinkPanel();
      }
    }
    else {
      state.set('wasMouseInPanel', true);
      cancelMouseLeaveShrinkTimer();
    }
  }

  function fireClickMetric(evt) {
    var ancestor = helper.getEventTarget(evt),
      id; // default name if we don't find a metric target
    while (ancestor) {
      id = ancestor.id;
      if (id || id === BP_CONST.BP_CONTAINER_ID) {
        break;
      }
      ancestor = ancestor.parentNode;
    }

    function getTrimmedId(id) {
      return id.split('scp-')[1] || id;
    }

    metric('panel-clicked', { target: id ? getTrimmedId(id) : 'window' });
  }


  function winMouseDown(evt) {
    if (SC_DEV && isSticky) {
      return;
    }

    if (isMouseOutsidePanel(evt, 0)) { // Any click anywhere outside of visible contents, no safe-zone needed
      shrinkPanel();
    }

    fireClickMetric(evt);
  }

  function winBlur() {
    if (SC_DEV && isSticky) {
      return;
    }
    shrinkPanel(true);
  }

  // @param isFromKeyboard -- optional, if truthy, then the shrink command is from the keyboard (e.g. escape key)
  // bpc.processKeyDown, buttonPress, winMouseMove, winMouseDown call this function...
  function shrinkPanel(isFromKeyboard) {
    if (state.isShrinking()) {
      return; // Not a panel or is already shrinking -- nothing to do
    }

    /*
     bp/will-shrink sets and removes attributes used for screen readers.
     bp/will-shrink removes mousedown, mousemove, and keydown event listeners bound to the window.
     bp/will-shrink cancels badge->panel animation
     bp/will-shrink removes click handler for toggling speech
     */
    sitecues.emit('bp/will-shrink');

    state.set('transitionTo', BP_CONST.BADGE_MODE);
    state.set('isShrinkingFromKeyboard', isFromKeyboard);
    state.set('isSecondaryPanel', false);
    state.set('secondaryPanelTransitionTo', 0);

    // If the secondary panel is active, deactivate it.
    if (state.isSecondaryPanelRequested()) {
      disableSecondaryPanel();
    }

    // Finally, begin the shrinking animation.
    sitecues.emit('bp/did-change');

    metric('panel-closed');
  }

  /*
  Private functions.
   */

  /**
   * disableSecondaryPanel is called when the panel is about to shrink.
   * It is responsible for deactivating the secondary panel.
   */
  function disableSecondaryPanel() {

    var moreToggle = helper.byId(BP_CONST.MORE_BUTTON_GROUP_ID);
    moreToggle.setAttribute('aria-label', 'View more options');
  }

  function isWithinContainer(elem, id) {
    while (elem) {
      if (elem.id === id) {
        return true;
      }
      elem = elem.parentNode;
    }
  }

  function getVisiblePanelRect() {
    var mainOutline = byId(BP_CONST.MAIN_OUTLINE_ID),
      secondaryOutlineHeight,
      rect = helper.getRect(mainOutline);
    if (state.isSecondaryPanelRequested()) {
      secondaryOutlineHeight = byId(BP_CONST.MORE_OUTLINE_ID).getBoundingClientRect().height;
      rect.height = secondaryOutlineHeight;
      rect.bottom = rect.top + rect.height;
    }
    return rect;
  }
  function isMouseOutsideRect(evt, rect, minDistance) {
    return evt.clientY > rect.bottom + minDistance || evt.clientY < rect.top - minDistance ||
      evt.clientX > rect.right + minDistance || evt.clientX < rect.left - minDistance;
  }

  function isMouseOutsidePanel(evt, distance) {
    var target = helper.getEventTarget(evt),
      targetId = target.id;
    if (targetId !== BP_CONST.BP_CONTAINER_ID && targetId !== BP_CONST.BADGE_ID &&
      !isWithinContainer(target, BP_CONST.MORE_BUTTON_CONTAINER_ID)) {
      return isMouseOutsideRect(evt, getVisiblePanelRect(), distance);
    }
  }

  // These listeners are temporary – only bound when the panel is open.
  // Good for performance – it prevents extra code from being run on every mouse move/click when we don't need it
  function toggleListeners(doTurnOn) {
    var addOrRemoveFn = doTurnOn ? 'addEventListener' : 'removeEventListener';

    // Pressing tab or shift tab when panel is open switches it to keyboard mode
    window[addOrRemoveFn]('mousedown', winMouseDown);
    window[addOrRemoveFn]('mousemove', winMouseMove);
    window[addOrRemoveFn]('blur', winBlur);
    window[addOrRemoveFn]('mouseout', winMouseLeave);
  }

  function refresh() {
    var shouldBeOn = !isZooming && isExpandingOrExpanded;
    if (shouldBeOn !== isListening) {
      isListening = shouldBeOn;
      toggleListeners(isListening);
    }
  }

  function willZoom() {
    isZooming = true;
    refresh();
  }

  function didZoom() {
    isZooming = false;
    refresh();
  }

  function willExpand() {
    isExpandingOrExpanded = true;
    refresh();
  }

  function willShrink() {
    isExpandingOrExpanded = false;
    refresh();
  }

  function didShrink() {
    state.set('isShrinkingFromKeyboard', false);
  }

  if (SC_DEV) {
    sitecues.toggleStickyPanel = function () {
      isSticky = !isSticky;
      return isSticky;
    };
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    sitecues.on('info/did-show', shrinkPanel);
    sitecues.on('bp/will-expand', willExpand);
    sitecues.on('bp/will-shrink', willShrink);
    sitecues.on('bp/did-shrink', didShrink);
    sitecues.on('zoom/begin', willZoom);
    sitecues.on('zoom', didZoom);

    toggleListeners(true);
  }

  return {
    init: init,
    shrinkPanel: shrinkPanel
  };
});
