/*
 Panel Controller
 */
define(
  [
    'run/bp/constants',
    'run/bp/model/state',
    'run/bp/helper',
    'run/metric/metric',
    'run/bp/view/view',
    'run/events',
    'run/dom-events',
    'core/native-global'
  ],
  function (
    BP_CONST,
    state,
    helper,
    metric,
    view,
    events,
    domEvents,
    nativeGlobal
  ) {
  'use strict';

    var MIN_DISTANCE = 75, // Min distance before shrink
      mouseLeaveShrinkTimer,  // How long we wait before shrinking BP from any mouseout (even only just barely outside panel)
      isListening,
      isZooming,
      isExpandingOrExpanded = true,  // First time, we will already be expanded
      isInitialized,
      byId = helper.byId;

    function isSticky() {
      return state.get('isStickyPanel');
    }

    function cancelMouseLeaveShrinkTimer() {
      clearTimeout(mouseLeaveShrinkTimer);
      mouseLeaveShrinkTimer = 0;
    }

    // Return truthy value if a button is pressed on a mouse event.
    // There are three properties for mouse buttons, and they all work differently -- both
    // in terms of browsers and on mousemove events in particular.
    function isButtonDown(mouseEvent) {
      return (typeof mouseEvent.buttons === 'undefined' ? mouseEvent.which : mouseEvent.buttons);
    }

    // Don't close panel too quickly when the mouse leaves the window, because the panel
    // may be near the window's edge and users with shaky hands may accidentally move mouse outside the window.
    // We don't know anything about the mouse other than the fact that it left the window
    function winMouseLeave(evt) {
      if (helper.getEventTarget(evt).id === BP_CONST.BADGE_ID) {
        mouseLeaveShrinkTimer = nativeGlobal.setTimeout(shrinkPanel, BP_CONST.MOUSELEAVE_DELAY_SHRINK_BP);
      }
    }

    // return truthy value if mouseout should cause panel to close
    function canShrinkFromMouseout() {
      // Only allow close from hover if mouse was in panel once
      return state.get('wasMouseInPanel');
    }

    function winMouseMove(evt) {

      if (isButtonDown(evt)) {
        return; // Slider in use or text selection, etc.
      }

      if (isMouseOutsidePanel(evt, MIN_DISTANCE)) {
        if (SC_DEV && isSticky()) {
          return;
        }
        if (canShrinkFromMouseout()) {
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
        role,
        id; // default name if we don't find a metric target
      while (ancestor) {
        role = helper.getAriaOrNativeRole(ancestor);
        if (role !== 'presentation') {  // Do not fire metrics for items only included to help presentation, e.g. a shadow
          id = ancestor.id;
          if (id || id === BP_CONST.BP_CONTAINER_ID) {
            break;
          }
        }
        ancestor = ancestor.parentNode;
      }

      new metric.PanelClick({
        target: id,
        role: role,
        isFirstBadgeUse: isFirstBadgeUse()
      }).send();
    }

    function isFirstBadgeUse() {
      return state.get('isFirstBadgeUse');
    }

    function winMouseDown(evt) {
      if (SC_DEV && isSticky()) {
        return;
      }

      if (isMouseOutsidePanel(evt, 0)) {
        if (!state.get('isOpenedWithScreenReader')) {
          // Any click anywhere outside of visible contents should close panel, no safe-zone needed
          // Unless opened by a screen reader in virtual cursor mode, because JAWS sends spurious clicks outside of panel (SC-3211)
          shrinkPanel();
        }
        return;
      }

      // Fire metrics only for clicks inside the panel
      if (isWithinContainer(evt.target, BP_CONST.BP_CONTAINER_ID)) {
        fireClickMetric(evt);
      }
    }

    function onBlur(event) {
      if (event.target === window) {
        maybeShrinkPanel();
      }
    }
    
    function maybeShrinkPanel() {
      if (SC_DEV && isSticky()) {
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
      events.emit('bp/will-shrink');

      state.set('transitionTo', BP_CONST.BADGE_MODE);
      state.set('isShrinkingFromKeyboard', isFromKeyboard);
      state.set('isSecondaryPanel', false);
      state.set('secondaryPanelTransitionTo', 0);

      // If the secondary panel is active, deactivate it.
      if (state.isSecondaryPanelRequested()) {
        disableSecondaryPanel();
      }

      // Finally, begin the shrinking animation.
      view.update();

      new metric.PanelClose({
        isFirstBadgeUse: isFirstBadgeUse()
      }).send();
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
      if (state.isSecondaryFeaturePanel()) {
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
      var addOrRemoveFn = doTurnOn ? domEvents.on : domEvents.off;
      addOrRemoveFn(window, 'mousedown', winMouseDown);

      if (!state.get('isOpenedWithScreenReader')) {
        // Mousemove can close panel after mouseout, unless opened with a screen reader
        addOrRemoveFn(window, 'mousemove', winMouseMove);
      }
      addOrRemoveFn(window, 'mouseout', winMouseLeave);
      addOrRemoveFn(window, 'blur', onBlur);
      addOrRemoveFn(window, 'resize', maybeShrinkPanel); // Don't allow user to resize window in middle of using panel, leads to layout issues
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

    function init() {
      if (isInitialized) {
        return;
      }
      isInitialized = true;

      events.on('info/did-show', shrinkPanel);
      events.on('bp/will-expand', willExpand);
      events.on('bp/will-shrink', willShrink);
      events.on('bp/did-shrink', didShrink);
      events.on('zoom/begin', willZoom);
      events.on('zoom', didZoom);

      toggleListeners(true);
    }

    return {
      init: init,
      shrinkPanel: shrinkPanel
    };
  });
