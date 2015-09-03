/*
BP Controller
 */
define(['bp/constants', 'bp/model/state', 'bp/helper', 'metric/metric'],
  function (BP_CONST, state, helper, metric) {

  // How long we wait before expanding BP
  var hoverDelayTimer,
    hasEverExpanded,
    isInitialized,
    // We ignore the first mouse move when a window becomes active, otherwise badge opens
    // if the mouse happens to be over the badge/toolbar
    doIgnoreNextMouseMove = true,
    focusControl;

  function processKeyDown(evt) {
    if (isModifiedKey(evt) || !state.isPanel()) {
      return;
    }

    if (focusControl && !focusControl.processKey(evt)) {
      evt.preventDefault();
      return false;
    }
  }

  function isInActiveToolbarArea(evt, badgeRect) {
    var middleOfBadge = badgeRect.left + badgeRect.width / 2,
      allowedDistance = BP_CONST.ACTIVE_TOOLBAR_WIDTH / 2;

    return evt.clientX > middleOfBadge - allowedDistance &&
      evt.clientX < middleOfBadge + allowedDistance;
  }

  function isInHorizontalBadgeArea(evt, badgeRect) {
    return evt.clientX >= badgeRect.left && evt.clientX <= badgeRect.right;
  }

  function isInVerticalBadgeArea(evt, badgeRect) {
    return evt.clientY >= badgeRect.top && evt.clientY<= badgeRect.bottom;
  }

  function getVisibleBadgeRect() {
    return helper.byId(BP_CONST.MOUSEOVER_TARGET).getBoundingClientRect();
  }

  // When window is newly activated, ignore the automatic first mousemove that is generated
  // that may happen to be over the badge/toolbar. Require that the user intentionally moves to the toolbar.
  function onWindowFocus() {
    doIgnoreNextMouseMove = true;
  }

  // Logic to determine whether we should begin to expand panel
  function onMouseMove(evt) {
    cancelHoverDelayTimer();

    if (doIgnoreNextMouseMove) {
      doIgnoreNextMouseMove = false;
      return;
    }

    if (state.isExpanding()) {
      return;  // Already expanding -> do nothing
    }

    // Is the event related to the visible contents of the badge?
    // (as opposed to the hidden areas around the badge)
    var badgeRect = getVisibleBadgeRect(),
      isInBadge = isInHorizontalBadgeArea(evt, badgeRect),
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
      hoverDelayTimer = setTimeout(changeModeToPanel,
        isInBadge ? BP_CONST.HOVER_DELAY_BADGE : BP_CONST.HOVER_DELAY_TOOLBAR);
    }
  }

  /*
   Show panel according to settings.
   */
  function expandPanel() {

    if (state.isPanel()) {
      return; // Already expanded or in the middle of shrinking
    }

    sitecues.emit('bp/will-expand');

    metric('badge-hovered');

    setPanelExpandedState();

    didChange();
  }

  function turnOnRealSettings() {
    state.set('isRealSettings', true);    // Always use real settings once expanded
  }

  function setPanelExpandedState() {
    state.set('wasMouseInPanel', false);
    state.set('transitionTo', BP_CONST.PANEL_MODE);
    state.set('featurePanelName', null);  // We're not in a feature panel
    turnOnRealSettings();
  }

  function changeModeToPanel() {
    cancelHoverDelayTimer();
    if (!state.get('isShrinkingFromKeyboard')) {
      expandPanel();
    }
  }

  function cancelHoverDelayTimer() {
    clearTimeout(hoverDelayTimer);
    hoverDelayTimer = 0;
  }

  function onMouseOut(evt) {
    if (helper.getEventTarget(evt).id === BP_CONST.BADGE_ID) {
      cancelHoverDelayTimer();
    }
  }

  // When a click happens on the badge, it can be from one of two things:
  // - A fake click event pushed by a screen reader when the user presses Enter -- in this case we should expand the panel
  // - An actual click in the whitespace around the panel (before they moused over the visible area) -- we should ignore these
  //   so that clicks around the panel don't accidentally open it.
  function clickToOpenPanel() {
    var badgeElem = helper.byId(BP_CONST.BADGE_ID);
    if (document.activeElement === badgeElem) {
      // Click is in visible area and badge has focus -- go ahead and open the panel
      changeModeToPanel();
    }
  }

  function processBadgeActivationKeys(evt) {
    if (state.isBadge() &&
      (evt.keyCode === BP_CONST.KEY_CODES.ENTER || evt.keyCode === BP_CONST.KEY_CODES.SPACE)) {

      evt.preventDefault();
      changeModeToPanel();
    }
  }

  // Don't scroll while BP is open
  function preventScroll(evt) {
    return helper.cancelEvent(evt);
  }

  function willExpand() {
    window.addEventListener('keydown', processKeyDown, true);
    window.addEventListener('wheel', preventScroll);
  }

  function didExpand() {
    if (!hasEverExpanded) {
      hasEverExpanded = true;
      require(['bp/controller/slider-controller', 'bp/controller/shrink-controller', 'bp/controller/focus-controller',
          'bp/view/elements/tts-button', 'bp/view/elements/more-button', 'cursor/cursor'],
        function (sliderController, shrinkController, focusController, ttsButton, moreButton, cursor) {
        sliderController.init();
        shrinkController.init();
        focusController.init();
        ttsButton.init();
        moreButton.init();
        cursor.init();

        focusControl = focusController;
      });
    }
  }

  function didChange() {
    sitecues.emit('bp/did-change');
  }

  function didZoom() {
    require(['bp/controller/slider-controller'], function (sliderController) {
      turnOnRealSettings();
      sliderController.init();
      didChange();
    });
  }

  function didChangeSpeech(isOn) {
    require(['bp/view/elements/tts-button'], function(ttsButton) {
      // Update the TTS button view on any speech state change
      turnOnRealSettings();
      ttsButton.init();
      ttsButton.updateTTSStateView(isOn);
      didChange();
    });
  }

  function willShrink() {
    window.removeEventListener('keydown', processKeyDown, true);
    window.removeEventListener('wheel', preventScroll);
  }

  function didShrink() {
      state.set('isShrinkingFromKeyboard', false);
  }

  /*
   Private functions.
   */

  function isModifiedKey(evt) {
    return evt.altKey || evt.metaKey || evt.ctrlKey;
  }

  function init() {
    if (!isInitialized) {
      isInitialized = true;
      var badgeElement = helper.byId(BP_CONST.BADGE_ID);
      badgeElement.addEventListener('keydown', processBadgeActivationKeys);
      badgeElement.addEventListener('click', clickToOpenPanel);
      badgeElement.addEventListener('mousemove', onMouseMove);
      badgeElement.addEventListener('mouseout', onMouseOut);

      window.addEventListener('focus', onWindowFocus);
      sitecues.on('bp/will-expand', willExpand);
      sitecues.on('bp/did-expand', didExpand);
      sitecues.on('bp/will-shrink', willShrink);
      sitecues.on('bp/did-shrink', didShrink);
      sitecues.on('zoom', didZoom);
      sitecues.on('speech/did-change', didChangeSpeech);
    }
  }

  return {
    init: init
  };
});
