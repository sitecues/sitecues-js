/*
BP Controller
 */
define(
  [
    'core/bp/constants',
    'core/bp/model/state',
    'core/bp/helper',
    'core/metric',
    'core/conf/user/manager',
    'core/bp/view/view',
    'core/events',
    'core/dom-events',
    'core/native-functions'
  ],
  function (
    BP_CONST,
    state,
    helper,
    metric,
    conf,
    view,
    events,
    domEvents,
    nativeFn
  ) {

  // How long we wait before expanding BP
  var hoverIfNoMoveTimer,  // If mouse stays still inside badge, open
    hoverIfStayInsideTimer,  // If mouse stays inside badge pr toolbar, open
    isInitialized,
    // We ignore the first mouse move when a window becomes active, otherwise badge opens
    // if the mouse happens to be over the badge/toolbar
    doIgnoreNextMouseMove = true;

  function getBadgeElement() {
    return helper.byId(BP_CONST.BADGE_ID);
  }

  function isInActiveToolbarArea(evt, badgeRect) {
    var middleOfBadge = badgeRect.left + badgeRect.width / 2,
      allowedDistance = BP_CONST.ACTIVE_TOOLBAR_WIDTH / 2;

    return evt.clientX > middleOfBadge - allowedDistance &&
      evt.clientX < middleOfBadge + allowedDistance;
  }

  function isInBadgeArea(evt, badgeRect) {
    return evt.clientX >= badgeRect.left && evt.clientX <= badgeRect.right &&
      evt.clientY >= badgeRect.top && evt.clientY <= badgeRect.bottom;
  }

  function isInVerticalBadgeArea(evt, badgeRect) {
    return evt.clientY >= badgeRect.top && evt.clientY<= badgeRect.bottom;
  }

  function getVisibleBadgeRect() {
    return helper.getRect(helper.byId(BP_CONST.MOUSEOVER_TARGET));
  }

  // When window is newly activated, ignore the automatic first mousemove that is generated
  // that may happen to be over the badge/toolbar. Require that the user intentionally moves to the toolbar.
  function onWindowFocus() {
    doIgnoreNextMouseMove = true;
  }

  // Logic to determine whether we should begin to expand panel
  function onMouseMove(evt) {

    if (doIgnoreNextMouseMove) {
      doIgnoreNextMouseMove = false;
      return;
    }

    if (state.isExpanding()) {
      return;  // Already expanding -> do nothing
    }

    cancelHoverIfNoMoveTimer();

    // Is the event related to the visible contents of the badge?
    // (as opposed to the hidden areas around the badge)
    var badgeRect = getVisibleBadgeRect(),
      isInBadge = isInBadgeArea(evt, badgeRect),
      isInToolbar = state.get('isToolbarBadge') && isInActiveToolbarArea(evt, badgeRect);

    if (!isInVerticalBadgeArea(evt, badgeRect)) {
      return;
    }

    // Check if shrinking and need to reopen
    if (state.isShrinking()) {
      if (isInBadge) {
        changeModeToPanel();  // User changed their mind -- reverse course and reopen
      }
      return;
    }

    // Set timers to open the badge if the user stays inside of it
    // We use two timers so that if the user actually stops, the badge opens faster (more responsive feeling)
    if (isInToolbar || isInBadge) {
      // Hover if no move -- start a new timer every time mouse moves
      hoverIfNoMoveTimer = nativeFn.setTimeout(changeModeToPanel,
        isInBadge ? BP_CONST.HOVER_DELAY_NOMOVE_BADGE : BP_CONST.HOVER_DELAY_NOMOVE_TOOLBAR);
      // Hover if stay inside -- start a new timer first time inside badge
      if (!hoverIfStayInsideTimer) {
        hoverIfStayInsideTimer = nativeFn.setTimeout(changeModeToPanel, getHoverDelayStayInside(isInBadge));
      }
    }
  }

  function getHoverDelayStayInside(isInBadge) {
    // First interaction is most sensitive
    if (isFirstInteraction()) {
      return BP_CONST.HOVER_DELAY_STAY_INSIDE_FIRST_TIME;
    }
    // Badge is more sensitive than toolbar, because it's smaller
    if (isInBadge) {
      return BP_CONST.HOVER_DELAY_STAY_INSIDE_BADGE;
    }

    // Toolbar is least sensitive, because it's such a large target
    return BP_CONST.HOVER_DELAY_STAY_INSIDE_TOOLBAR;
  }

  function isFirstInteraction() {
    // Once the badge opens the first time, we show the actual zoom and tts states
    // Before that, we don't show real settings (we show a zoom of about 2 and TTS on)
    return !state.get('isRealSettings');
  }

  /*
   Show panel according to settings.
   */
  function expandPanel(isOpenedWithHover) {

    if (state.isPanel()) {
      return; // Already expanded or in the middle of shrinking
    }

    var isFirstBadgeUse = isFirstInteraction();
    state.set('isFirstBadgeUse', isFirstBadgeUse);  // Will stay true throught this use of the badge

    setPanelExpandedState(isOpenedWithHover);

    events.emit('bp/will-expand');

    new metric.BadgeHover({
      isFirstBadgeUse: isFirstBadgeUse
    }).send();

    view.update();
  }

  function turnOnRealSettings() {
    state.set('isRealSettings', true);    // Always use real settings once expanded
  }

  function setPanelExpandedState(isOpenedWithHover) {
    state.set('isSecondaryExpanded', false); // Only main panel expanded, not secondary
    state.set('wasMouseInPanel', isOpenedWithHover);
    state.set('isOpenedWithHover', isOpenedWithHover);
    state.set('transitionTo', BP_CONST.PANEL_MODE);
    turnOnRealSettings();
  }

  function changeModeToPanel(isOpenedWithKeyboard) {
    cancelHoverTimers();
    if (!state.get('isShrinkingFromKeyboard')) { // Don't re-expand while trying to close via Escape key
      expandPanel(!isOpenedWithKeyboard);
    }
  }

  function cancelHoverTimers() {
    cancelHoverIfNoMoveTimer();
    cancelHoverIfStayInsideTimer();
  }

  function cancelHoverIfNoMoveTimer() {
    clearTimeout(hoverIfNoMoveTimer);
    hoverIfNoMoveTimer = 0;
  }

  function cancelHoverIfStayInsideTimer() {
    clearTimeout(hoverIfStayInsideTimer);
    hoverIfStayInsideTimer = 0;
  }

  // When a click happens on the badge, it can be from one of two things:
  // - A fake click event pushed by a screen reader when the user presses Enter -- in this case we should expand the panel
  // - An actual click in the whitespace around the panel (before they moused over the visible area) -- we should ignore these
  //   so that clicks around the panel don't accidentally open it.
  function clickToOpenPanel(evt) {
    if (state.isBadge()) {
      var badgeElem = helper.byId(BP_CONST.BADGE_ID),
        isBadgeFocused = document.activeElement === badgeElem,
        target = evt.target,
        isChildClicked = target && target.parentNode === badgeElem,
        badgeRect = getVisibleBadgeRect(),
        isClickInVisibleBadgeRect = isInBadgeArea(evt, badgeRect);
      if (!isClickInVisibleBadgeRect) {
        // Click is in the toolbar, outside of visible badge
        // Focus should be in the document, otherwise HLB won't work (confusing)
        if (isBadgeFocused) {
          document.body.focus();
        }
        // Don't focus badge
        evt.preventDefault();
        return false;
      }
      else if (isBadgeFocused || isChildClicked) {
        // Click is in visible area and badge has focus --
        // * or *
        // Click in invisible child -- only screen readers can do this -- NVDA does it
        // Go ahead and open the panel

        // First ensure it has focus (it didn't in second case)
        badgeElem.focus();

        // Opened with click means opened with keyboard in screen reader
        nativeFn.setTimeout(function() {
          changeModeToPanel(true);
          // Set screen reader flag for the life of this page view
          state.set('isOpenedWithScreenReader', true);
        }, 0);
      }
    }
  }

  function processBadgeActivationKeys(evt) {
    var ENTER = 13, SPACE = 32;
    if (state.isBadge() &&
      (evt.keyCode === ENTER || evt.keyCode === SPACE)) {

      evt.preventDefault();
      changeModeToPanel(true); // Opened with keyboard
    }
  }

  function didExpand() {
    require(['bp-expanded/bp-expanded'], function (bpExpanded) {
      bpExpanded.init();
    });
  }

  function didZoom() {
    require(['bp-expanded/controller/slider-controller'], function (sliderController) {
      turnOnRealSettings();
      sliderController.init();
      view.update();
    });
  }

  function didChangeSpeech(isOn) {
    require(['bp-expanded/view/tts-button'], function(ttsButton) {
      // Update the TTS button view on any speech state change
      turnOnRealSettings();
      ttsButton.init();
      ttsButton.updateTTSStateView(isOn);
      view.update();
    });
  }

  /*
   Private functions.
   */

  function init() {
    if (!isInitialized) {
      isInitialized = true;

      var badgeElement = getBadgeElement();
      domEvents.on(badgeElement, 'keydown', processBadgeActivationKeys, { passive: false });
      domEvents.on(badgeElement, 'mousedown', clickToOpenPanel);
      domEvents.on(badgeElement, 'mousemove', onMouseMove);
      domEvents.on(badgeElement, 'mouseleave', cancelHoverTimers);

      domEvents.on(window, 'focus', onWindowFocus);
      events.on('bp/did-expand', didExpand);
      events.on('zoom', didZoom);
      events.on('speech/did-change', didChangeSpeech);

      // Turn on TTS button if the setting is on
      if (conf.get('ttsOn')) {
        didChangeSpeech(true);
      }

      if (SC_DEV) {
        sitecues.toggleStickyPanel = function () {
          var isSticky = !state.get('isStickyPanel');
          state.set('isStickyPanel', isSticky);
          return isSticky;
        };
      }
    }
  }

  return {
    init: init,
    expandPanel: expandPanel
  };
});
