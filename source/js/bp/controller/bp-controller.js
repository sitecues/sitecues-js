/*
BP Controller
 */
define(['bp/constants', 'bp/controller/focus-controller', 'bp/model/state', 'bp/helper'],
  function (BP_CONST, focusController, state, helper) {

  'use strict';
  // How long we wait before expanding BP
  var hoverDelayTimer;

  // We ignore the first mouse move when a window becomes active, otherwise badge opens
  // if the mouse happens to be over the badge/toolbar
  var doIgnoreNextMouseMove = true;

  var DELTA_KEYS = {};
  DELTA_KEYS[BP_CONST.KEY_CODES.LEFT]  = -1;
  DELTA_KEYS[BP_CONST.KEY_CODES.UP]    = 1;
  DELTA_KEYS[BP_CONST.KEY_CODES.RIGHT] = 1;
  DELTA_KEYS[BP_CONST.KEY_CODES.DOWN]  = -1;

  // If it was always HTML we could just use elem.click()
  function simulateClick(element) {
    var event = document.createEvent('MouseEvents');
    // If you need clientX, clientY, etc., you can call
    // initMouseEvent instead of initEvent
    event.initEvent('click', true, true);
    element.dispatchEvent(event);
  }

  function processKeyDown(evt) {
    if (isModifiedKey(evt) || !state.isPanel()) {
      return;
    }


    if (!processKeyDownBehavior(evt)) {
      evt.preventDefault();
      return false;
    }
  }


  // Process key down and return true if key should be allowed to perform default behavior
  function processKeyDownBehavior(evt) {
    var keyCode = evt.keyCode;

    // Escape = close
    if (keyCode === BP_CONST.KEY_CODES.ESCAPE) {
      sitecues.emit('bp/do-shrink', true);
      return;
    }

    // Tab navigation
    if (keyCode === BP_CONST.KEY_CODES.TAB) {
      state.set('isKeyboardMode', true);
      sitecues.emit('bp/did-change');
      focusController.navigateInDirection(evt.shiftKey ? -1 : 1);
      return;
    }

    // Perform widget-specific commands
    // Can't use evt.target because in the case of SVG it sometimes only has fake focus (some browsers can't focus SVG elements)
    var item = focusController.getFocusedItem();

    if (item) {
      if (item.localName === 'textarea' || item.localName === 'input') {
        return true;
      }
      if (item.id === BP_CONST.ZOOM_SLIDER_BAR_ID) {
        performZoomSliderCommand(keyCode);
      }
      else {
        if (keyCode === BP_CONST.KEY_CODES.ENTER || keyCode === BP_CONST.KEY_CODES.SPACE) {
          simulateClick(item);
        }
      }
      // else fall through to native processing of keystroke
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

    setPanelExpandedState();

    sitecues.emit('bp/did-change');
  }

  function setPanelExpandedState() {
    state.set('wasMouseInPanel', false);
    state.set('transitionTo', BP_CONST.PANEL_MODE);
    state.set('isRealSettings', true);    // Always use real settings once expanded
    state.set('featurePanelName', null);  // We're not in a feature panel
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

  function willShrink() {
    window.removeEventListener('keydown', processKeyDown, true);
    window.removeEventListener('wheel', preventScroll);
  }

  function didShrink() {
      state.set('isShrinkingFromKeyboard', false);
  }

  function init() {
    var badgeElement = helper.byId(BP_CONST.BADGE_ID);
    badgeElement.addEventListener('keydown', processBadgeActivationKeys);
    badgeElement.addEventListener('click', clickToOpenPanel);
    badgeElement.addEventListener('mousemove', onMouseMove);
    badgeElement.addEventListener('mouseout', onMouseOut);
  }

  /*
   Private functions.
   */

  function isModifiedKey(evt) {
    return evt.altKey || evt.metaKey || evt.ctrlKey;
  }

  function performZoomSliderCommand(keyCode) {
    var deltaSliderCommand = DELTA_KEYS[keyCode];
    if (deltaSliderCommand) {
      require('zoom/zoom', function(zoomMod) {
        var zoomFn = deltaSliderCommand > 0 ? zoomMod.beginZoomIncrease : zoomMod.beginZoomDecrease;
        zoomFn();
      });
    }
  }

  window.addEventListener('focus', onWindowFocus);
  sitecues.on('bp/will-expand', willExpand);
  sitecues.on('bp/will-shrink', willShrink);
  sitecues.on('bp/did-shrink', didShrink);
  sitecues.on('bp/did-complete', init);
});