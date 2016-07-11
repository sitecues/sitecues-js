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
    nativeFn
  ) {

  // How long we wait before expanding BP
  var hoverDelayTimer,
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

    cancelHoverDelayTimer();

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

    // Use the event
    if (isInToolbar || isInBadge) {
      hoverDelayTimer = nativeFn.setTimeout(changeModeToPanel,
        isInBadge ? BP_CONST.HOVER_DELAY_BADGE : BP_CONST.HOVER_DELAY_TOOLBAR);
    }
  }

  /*
   Show panel according to settings.
   */
  function expandPanel(isOpenedWithHover) {

    if (state.isPanel()) {
      return; // Already expanded or in the middle of shrinking
    }

    setPanelExpandedState(isOpenedWithHover);

    events.emit('bp/will-expand');

    new metric.BadgeHover().send();

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
    cancelHoverDelayTimer();
    if (!state.get('isShrinkingFromKeyboard')) { // Don't re-expand while trying to close via Escape key
      expandPanel(!isOpenedWithKeyboard);
    }
  }

  function cancelHoverDelayTimer() {
    clearTimeout(hoverDelayTimer);
    hoverDelayTimer = 0;
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
      badgeElement.addEventListener('keydown', processBadgeActivationKeys);
      badgeElement.addEventListener('mousedown', clickToOpenPanel);
      badgeElement.addEventListener('mousemove', onMouseMove);
      badgeElement.addEventListener('mouseout', cancelHoverDelayTimer);

      window.addEventListener('focus', onWindowFocus);
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
