"use strict";

// This module does two things:
// 1. Request zoom changes after processing user input
// 2. Listen for thumb change callbacks and repositions the thumb based on that
//
// --------------     Request zoom changes       ---------------      Thumb change callback    ---------------------
// | User input |   ---------------------->      | Zoom module |     ---------------------->   |  Update thumb pos |
// --------------                                ---------------                               ---------------------
//
// The thumb position only changes based on the thumb change callback!!
// Effectively this means the zoom module needs is in control of the thumb position.
sitecues.define("bp-expanded/view/slider", [ "run/bp/constants", "run/bp/model/state", "run/bp/helper", "run/locale" ], function(BP_CONST, state, helper, locale) {
  /*
   *** Public methods ***
   */
  /**
   * Reposition the zoom slider thumb on badge-panel state change or thumb change callback.
   * This does not change the current zoom of the page -- it only changes the slider appearance.
   */
  function updateThumbPosition(currZoom) {
    var thumbId = BP_CONST.ZOOM_SLIDER_THUMB_ID, thumbElement = helper.byId(thumbId), panelSliderWidth = BP_CONST.TRANSFORMS.PANEL[thumbId].translateX, badgeSliderWidth = BP_CONST.TRANSFORMS.BADGE[thumbId].translateX, isPanel = state.isPanel(), MIN_ZOOM = 1, ZOOM_RANGE = 2, // Use a fake zoom amount the first time sitecues loads for badge view
    // It just looks better -- making the slider look more interactive.
    percent = (currZoom - MIN_ZOOM) / ZOOM_RANGE, sliderWidth = isPanel ? BP_CONST.LARGE_SLIDER_WIDTH : BP_CONST.SMALL_SLIDER_WIDTH, offset = percent * sliderWidth + (isPanel ? panelSliderWidth : badgeSliderWidth);
    thumbElement.setAttribute("transform", "translate(" + offset + ")");
  }
  // Update the slider thumb position on bp view updates because the entire slider changes size
  // (it scales more horizontally than vertically)
  function render(zoomLevel) {
    updateThumbPosition(zoomLevel);
    updateZoomValue(zoomLevel);
  }
  /*
    Display new zoom value.
   */
  function updateZoomValue(currZoom) {
    // 1. Set aria-valuenow for screen readers
    // We do this when zoom is finished so that the screen reader is not trying to read every
    // new value during an animation which would be way too verbose
    var sliderElement = helper.byId(BP_CONST.ZOOM_SLIDER_BAR_ID), roundedZoom = currZoom ? Math.floor(10 * (currZoom + .0999)) / 10 : 1, zoomText = getLocalizedZoomValue(roundedZoom);
    sliderElement.setAttribute("aria-valuenow", roundedZoom ? roundedZoom.toString() : 1);
    sliderElement.setAttribute("aria-valuetext", zoomText);
    // 2. Update the zoom label, which follows pattern "1.3x" (or just "Zoom off" for 1x)
    function setZoomLabel(text) {
      helper.byId(BP_CONST.ZOOM_VALUE_ID).firstChild.data = text;
    }
    setZoomLabel(zoomText);
  }
  /*
   *** Private functions ***
   */
  function getLocalizedZoomValue(currZoom) {
    if (1 === currZoom) {
      // Zoom off
      return locale.translate(BP_CONST.ZOOM_STATE_LABELS.ZOOM_OFF);
    }
    // 1.3x, etc.
    var preZoomText = locale.translate(BP_CONST.ZOOM_STATE_LABELS.PRE_ZOOM), postZoomText = locale.translate(BP_CONST.ZOOM_STATE_LABELS.POST_ZOOM);
    return preZoomText + locale.translateNumber(currZoom, 2) + postZoomText;
  }
  return {
    updateThumbPosition: updateThumbPosition,
    render: render,
    updateZoomValue: updateZoomValue
  };
});

/*
 Slider Controller
 */
sitecues.define("bp-expanded/controller/slider-controller", [ "run/bp/constants", "page/zoom/constants", "run/bp/helper", "run/platform", "run/bp/model/state", "bp-expanded/view/slider", "page/zoom/zoom", "page/zoom/animation", "run/events", "run/dom-events" ], function(BP_CONST, ZOOM_CONST, helper, platform, state, sliderView, zoomMod, animation, events, domEvents) {
  var isListeningToWindowMouseMoveEvents, isListeningToWindowMouseUpEvents, isInitialized;
  /**
   * Mouse is been pressed down on the slider:
   * If the slider is ready for input, begin sending zoom new values for every mouse move.
   */
  function initialMouseDown(evt) {
    if (!state.isPanel()) {
      return;
    }
    moveThumb(evt);
    addWindowMouseMoveListener();
    addWindowMouseUpListener();
  }
  function addWindowMouseMoveListener() {
    if (!isListeningToWindowMouseMoveEvents) {
      isListeningToWindowMouseMoveEvents = true;
      // Be a capturing listener so that we get events before any especially "creative" page scripts
      domEvents.on(window, "mousemove", moveThumb, {
        passive: false
      });
    }
  }
  function addWindowMouseUpListener() {
    if (!isListeningToWindowMouseUpEvents) {
      isListeningToWindowMouseUpEvents = true;
      domEvents.on(window, "mouseup", finishZoomChanges, {
        passive: false
      });
    }
  }
  function removeWindowMouseListeners() {
    if (isListeningToWindowMouseMoveEvents) {
      domEvents.off(window, "mousemove", moveThumb, {
        passive: false
      });
      isListeningToWindowMouseMoveEvents = false;
    }
    if (isListeningToWindowMouseMoveEvents) {
      domEvents.off(window, "mouseup", finishZoomChanges, {
        passive: false
      });
      isListeningToWindowMouseUpEvents = false;
    }
  }
  // Mouse button was pressed down over slider and mouse cursor has moved
  function moveThumb(evt) {
    var sliderThumbRect = helper.getRectById(BP_CONST.ZOOM_SLIDER_THUMB_ID), sliderRect = helper.getRectById(BP_CONST.ZOOM_SLIDER_BAR_ID), panelLeft = helper.getRectById(BP_CONST.BP_CONTAINER_ID).left, // TODO Need comments what the browser differences are
    sliderLeft = platform.browser.isWebKit ? sliderRect.left + sliderThumbRect.width / 2 : panelLeft + BP_CONST.FIREFOX_SLIDER_OFFSET, sliderWidth = sliderRect.width - sliderThumbRect.width, newPercent = (evt.clientX - sliderLeft) / sliderWidth;
    var newValue = newPercent * ZOOM_CONST.ZOOM_RANGE + ZOOM_CONST.MIN_ZOOM;
    zoomMod.jumpTo(newValue, {
      isFirstBadgeUse: isFirstBadgeUse()
    });
    evt.preventDefault();
  }
  function isFirstBadgeUse() {
    return state.get("isFirstBadgeUse");
  }
  /**
   * Handler when click on small or large A.
   */
  function handleAButtonsPress(evt) {
    var target = helper.getEventTarget(evt), isDecrease = target.id === BP_CONST.SMALL_A_ID;
    addWindowMouseUpListener();
    var changeFn = isDecrease ? zoomMod.beginZoomDecrease : zoomMod.beginZoomIncrease;
    changeFn(evt, {
      isFirstBadgeUse: isFirstBadgeUse()
    });
  }
  function finishZoomChanges() {
    zoomMod.zoomStopRequested();
    removeWindowMouseListeners();
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    // Init zoom, add permanent listeners
    zoomMod.init();
    sliderView.render(zoomMod.getCompletedZoom());
    animation.setThumbChangeListener(sliderView.updateThumbPosition);
    // Zoom controls
    var sliderTarget = helper.byId(BP_CONST.ZOOM_SLIDER_ID), sliderThumb = helper.byId(BP_CONST.ZOOM_SLIDER_THUMB_ID), smallA = helper.byId(BP_CONST.SMALL_A_ID), largeA = helper.byId(BP_CONST.LARGE_A_ID), zoomLabel = helper.byId(BP_CONST.ZOOM_LABEL_ID);
    domEvents.on(sliderTarget, "mousedown", initialMouseDown, {
      passive: false
    });
    domEvents.on(sliderThumb, "mousedown", initialMouseDown, {
      passive: false
    });
    domEvents.on(smallA, "mousedown", handleAButtonsPress);
    domEvents.on(largeA, "mousedown", handleAButtonsPress);
    domEvents.on(zoomLabel, "mousedown", handleAButtonsPress);
    events.on("bp/will-shrink", finishZoomChanges);
    // A zoom operation has been completed
    // (We don't move the thumb here ... we do via setThumbChangeListener, because we get mid-animation changes that way)
    events.on("zoom", sliderView.updateZoomValue);
  }
  return {
    init: init
  };
});

/*
 Panel Controller
 */
sitecues.define("bp-expanded/controller/shrink-controller", [ "run/bp/constants", "run/bp/model/state", "run/bp/helper", "run/metric/metric", "run/bp/view/view", "run/events", "run/dom-events", "mini-core/native-global" ], function(BP_CONST, state, helper, metric, view, events, domEvents, nativeGlobal) {
  var // Min distance before shrink
  mouseLeaveShrinkTimer, // How long we wait before shrinking BP from any mouseout (even only just barely outside panel)
  isListening, isZooming, // First time, we will already be expanded
  isInitialized, MIN_DISTANCE = 75, isExpandingOrExpanded = true, byId = helper.byId;
  function isSticky() {
    return state.get("isStickyPanel");
  }
  function cancelMouseLeaveShrinkTimer() {
    clearTimeout(mouseLeaveShrinkTimer);
    mouseLeaveShrinkTimer = 0;
  }
  // Return truthy value if a button is pressed on a mouse event.
  // There are three properties for mouse buttons, and they all work differently -- both
  // in terms of browsers and on mousemove events in particular.
  function isButtonDown(mouseEvent) {
    return "undefined" === typeof mouseEvent.buttons ? mouseEvent.which : mouseEvent.buttons;
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
    return state.get("wasMouseInPanel");
  }
  function winMouseMove(evt) {
    if (isButtonDown(evt)) {
      return;
    }
    if (isMouseOutsidePanel(evt, MIN_DISTANCE)) {
      if (true && isSticky()) {
        return;
      }
      if (canShrinkFromMouseout()) {
        shrinkPanel();
      }
    } else {
      state.set("wasMouseInPanel", true);
      cancelMouseLeaveShrinkTimer();
    }
  }
  function fireClickMetric(evt) {
    var role, id, ancestor = helper.getEventTarget(evt);
    // default name if we don't find a metric target
    while (ancestor) {
      role = helper.getAriaOrNativeRole(ancestor);
      if ("presentation" !== role) {
        // Do not fire metrics for items only included to help presentation, e.g. a shadow
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
    return state.get("isFirstBadgeUse");
  }
  function winMouseDown(evt) {
    if (true && isSticky()) {
      return;
    }
    if (isMouseOutsidePanel(evt, 0)) {
      if (!state.get("isOpenedWithScreenReader")) {
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
    if (true && isSticky()) {
      return;
    }
    shrinkPanel(true);
  }
  // @param isFromKeyboard -- optional, if truthy, then the shrink command is from the keyboard (e.g. escape key)
  // bpc.processKeyDown, buttonPress, winMouseMove, winMouseDown call this function...
  function shrinkPanel(isFromKeyboard) {
    if (state.isShrinking()) {
      return;
    }
    /*
       bp/will-shrink sets and removes attributes used for screen readers.
       bp/will-shrink removes mousedown, mousemove, and keydown event listeners bound to the window.
       bp/will-shrink cancels badge->panel animation
       bp/will-shrink removes click handler for toggling speech
       */
    events.emit("bp/will-shrink");
    state.set("transitionTo", BP_CONST.BADGE_MODE);
    state.set("isShrinkingFromKeyboard", isFromKeyboard);
    state.set("isSecondaryPanel", false);
    state.set("secondaryPanelTransitionTo", 0);
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
    moreToggle.setAttribute("aria-label", "View more options");
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
    var secondaryOutlineHeight, mainOutline = byId(BP_CONST.MAIN_OUTLINE_ID), rect = helper.getRect(mainOutline);
    if (state.isSecondaryFeaturePanel()) {
      secondaryOutlineHeight = byId(BP_CONST.MORE_OUTLINE_ID).getBoundingClientRect().height;
      rect.height = secondaryOutlineHeight;
      rect.bottom = rect.top + rect.height;
    }
    return rect;
  }
  function isMouseOutsideRect(evt, rect, minDistance) {
    return evt.clientY > rect.bottom + minDistance || evt.clientY < rect.top - minDistance || evt.clientX > rect.right + minDistance || evt.clientX < rect.left - minDistance;
  }
  function isMouseOutsidePanel(evt, distance) {
    var target = helper.getEventTarget(evt), targetId = target.id;
    if (targetId !== BP_CONST.BP_CONTAINER_ID && targetId !== BP_CONST.BADGE_ID && !isWithinContainer(target, BP_CONST.MORE_BUTTON_CONTAINER_ID)) {
      return isMouseOutsideRect(evt, getVisiblePanelRect(), distance);
    }
  }
  // These listeners are temporary – only bound when the panel is open.
  // Good for performance – it prevents extra code from being run on every mouse move/click when we don't need it
  function toggleListeners(doTurnOn) {
    var addOrRemoveFn = doTurnOn ? domEvents.on : domEvents.off;
    addOrRemoveFn(window, "mousedown", winMouseDown);
    if (!state.get("isOpenedWithScreenReader")) {
      // Mousemove can close panel after mouseout, unless opened with a screen reader
      addOrRemoveFn(window, "mousemove", winMouseMove);
    }
    addOrRemoveFn(window, "mouseout", winMouseLeave);
    addOrRemoveFn(window, "blur", onBlur);
    addOrRemoveFn(window, "resize", maybeShrinkPanel);
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
    state.set("isShrinkingFromKeyboard", false);
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    events.on("info/did-show", shrinkPanel);
    events.on("bp/will-expand", willExpand);
    events.on("bp/will-shrink", willShrink);
    events.on("bp/did-shrink", didShrink);
    events.on("zoom/begin", willZoom);
    events.on("zoom", didZoom);
    toggleListeners(true);
  }
  return {
    init: init,
    shrinkPanel: shrinkPanel
  };
});

/* Focus Controller */
sitecues.define("bp-expanded/controller/focus-controller", [ "run/bp/constants", "run/bp/model/state", "run/bp/helper", "run/metric/metric", "run/bp/view/view", "run/events", "run/constants", "mini-core/native-global", "run/inline-style/inline-style" ], function(BP_CONST, state, helper, metric, view, events, CORE_CONST, nativeGlobal, inlineStyle) {
  var savedDocumentFocus, tabbedElement, isInitialized, isListeningToClicks, byId = helper.byId, keyCode = CORE_CONST.KEY_CODE, TAB = keyCode.TAB, ENTER = keyCode.ENTER, ESCAPE = keyCode.ESCAPE, SPACE = keyCode.SPACE, LEFT = keyCode.LEFT, UP = keyCode.UP, RIGHT = keyCode.RIGHT, DOWN = keyCode.DOWN, arrows = [ UP, DOWN, LEFT, RIGHT ], triggerKeys = [ ENTER, SPACE ], TABBABLE = {
    // IMPORTANT: remove 'scp-' prefix -- it gets added in by the code
    main: [ "zoom-slider-bar", "speech", "more-button-group" ],
    "button-menu": [ "tips-button", "settings-button", "feedback-button", "about-button", "more-button-group" ],
    tips: [ "$", // Current card contents
    "settings-label", "feedback-label", "about-label", "more-button-group" ],
    settings: [ "$", // Current card contents
    "tips-label", "feedback-label", "about-label", "more-button-group" ],
    feedback: [ "feedback-textarea", "stars-1", "stars-2", "stars-3", "stars-4", "stars-5", "feedback-send-link", "feedback-thanks", "tips-label", "settings-label", "about-label", "more-button-group" ],
    about: [ "about-sitecues-link", "about-rate-button", "tips-label", "settings-label", "feedback-label", "more-button-group" ]
  }, DELTA_KEYS = {};
  DELTA_KEYS[LEFT] = -1;
  DELTA_KEYS[UP] = 1;
  DELTA_KEYS[RIGHT] = 1;
  DELTA_KEYS[DOWN] = -1;
  function getPanelContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }
  // Clear the visual focus rectangle and current focus state
  function clearPanelFocus() {
    if (tabbedElement) {
      tabbedElement.removeAttribute("data-show-focus");
      tabbedElement.removeAttribute("tabindex");
    }
    hideFocus();
    tabbedElement = null;
    getPanelContainer().removeAttribute("aria-activedescendant");
  }
  // Hide focus but keep focus state
  function hideFocus() {
    var focusShownOn = getElementToShowFocusOn();
    if (focusShownOn) {
      focusShownOn.removeAttribute("data-show-focus");
    }
    byId(BP_CONST.OUTLINE_ID).removeAttribute("data-show");
  }
  function updateDOMFocusState() {
    if (!tabbedElement) {
      return;
    }
    var panelContainer = getPanelContainer();
    panelContainer.setAttribute("aria-activedescendant", tabbedElement.id);
    tabbedElement.setAttribute("focusable", true);
    tabbedElement.setAttribute("tabindex", 0);
    try {
      // Allow real focus if item/browser allows it:
      // - In Firefox, for now this will only work on HTML elements
      // - In other browsers, anything with focusable/tabindex can be focused
      tabbedElement.focus();
    } catch (ex) {
      panelContainer.focus();
    }
  }
  function showFocus() {
    updateDOMFocusState();
    if (!tabbedElement || !isKeyboardMode()) {
      // No focus to show or not in keyboard mode
      hideFocus();
    } else {
      // Show focus
      if (tabbedElement.id === BP_CONST.MORE_BUTTON_GROUP_ID) {
        events.emit("bp/did-focus-more-button");
      }
      renderFocusOutline();
    }
  }
  function listenToClicks() {
    if (!isListeningToClicks) {
      isListeningToClicks = true;
      var mainSVG = byId(BP_CONST.SVG_ID), bpContainer = byId(BP_CONST.BP_CONTAINER_ID);
      mainSVG.addEventListener("mousedown", clickToFocus);
      bpContainer.addEventListener("mousedown", clickToFocus);
    }
  }
  function isKeyboardMode() {
    return state.get("isKeyboardMode");
  }
  function focusCard(cardId, tabElement, isFromLink) {
    if (isKeyboardMode() && tabElement) {
      clearPanelFocus();
      tabbedElement = tabElement;
      if (isFromLink) {
        // When jumping directly to tab, navigate to the first content inside the tab
        while (tabbedElement && "tab" === tabbedElement.getAttribute("role")) {
          navigateInDirection(1);
        }
      }
      showFocus();
    }
  }
  function focusFirstItem() {
    if (isKeyboardMode()) {
      nativeGlobal.setTimeout(function() {
        navigateInDirection(1, true);
      }, 0);
    }
  }
  /*
   If the badge was focused, the panel will go into focus mode when it's entered.
   In focus mode, we show the following:
   - A keyboard focus outline so the user knows where they are tabbing
   - A close button in case the user doesn't realize Escape key will close
   - The "more button" is shown immediately rather than on a timer, so that the tabbing cycle doesn't suddenly change in the middle of tabbing
   We also save the last focus so that we can restore it when the panel closes.
   */
  function beginKeyHandling() {
    // Save the last focus so that we can restore it when panel closes
    savedDocumentFocus = document.activeElement;
    // If the badge is focused we will turn keyboard mode on for the panel
    var isBadgeFocused = savedDocumentFocus && savedDocumentFocus.id === BP_CONST.BADGE_ID;
    clearPanelFocus();
    if (isBadgeFocused) {
      // TODO can we remove this ? It's set elsewhere. Try with a screen reader.
      //badgeElement.setAttribute('aria-expanded', 'true');
      // Turn keyboard mode on for the panel, and start focus on the first item
      tabbedElement = getElementForFocusIndex(0);
      turnOnKeyboardMode();
      showFocus();
    }
    // Take the focus whether or not we're in focus mode,
    // in case the user presses tab or Escape to turn on keyboard mode after expansion
    getPanelContainer().focus();
    window.addEventListener("keydown", processKeyDown, true);
  }
  function endKeyHandling() {
    // If the BP_CONTAINER has focus AND the document.body was the previous
    // focused element, blur the BP_CONTAINER focus.
    //
    // If the BP_CONTAINER has focus AND the document.body was NOT the previous
    // focused element, focus the previously focused element.
    clearPanelFocus();
    if ((!savedDocumentFocus || savedDocumentFocus === document.body) && "blur" in document.activeElement) {
      document.activeElement.blur();
    } else {
      var focusable = savedDocumentFocus || ("focus" in document ? document : document.body);
      //TODO: Focusing is broken in Edge, figure out the root cause of this
      if ("function" === typeof focusable.focus) {
        focusable.focus();
      }
    }
    window.removeEventListener("keydown", processKeyDown, true);
  }
  function turnOnKeyboardMode() {
    state.set("isKeyboardMode", true);
    listenToClicks();
    view.update();
  }
  function getFocusedItem() {
    // User has tabbed: we're in keyboard, mode, so the focused item is tabbedElement.
    // User has NOT tabbed: the focused item is where they last clicked -- document.activeElement
    return tabbedElement || document.activeElement;
  }
  function getElementToShowFocusOn() {
    if (tabbedElement) {
      var focusForwarder = tabbedElement.getAttribute("data-visible-focus-on");
      return focusForwarder ? byId(focusForwarder) : tabbedElement;
    }
  }
  function renderFocusOutline() {
    // @data-visible-focus-on = id of element to show focus on
    // @data-show-focus = focus to be shown on this element
    // @data-own-focus-ring = element will show it's own focus ring
    var showFocusOn = getElementToShowFocusOn(), scale = state.get("scale");
    function getFinalCoordinate(coord) {
      return coord / scale + "px";
    }
    showFocusOn.setAttribute("data-show-focus", "");
    if (!showFocusOn.hasAttribute("data-own-focus-ring")) {
      // Show focus outline
      var EXTRA_FOCUS_PADDING = 1, clientPanelRect = helper.getRect(getPanelContainer()), // Focus rect is positioned relative to this
      clientFocusRect = helper.getRect(showFocusOn), focusOutline = byId(BP_CONST.OUTLINE_ID);
      focusOutline.setAttribute("data-show", true);
      inlineStyle.set(focusOutline, {
        width: getFinalCoordinate(clientFocusRect.width + 2 * EXTRA_FOCUS_PADDING),
        height: getFinalCoordinate(clientFocusRect.height + 2 * EXTRA_FOCUS_PADDING),
        top: getFinalCoordinate(clientFocusRect.top - EXTRA_FOCUS_PADDING - clientPanelRect.top),
        left: getFinalCoordinate(clientFocusRect.left - EXTRA_FOCUS_PADDING - clientPanelRect.left)
      });
    }
  }
  function getAllTabbableItemsInActiveCard() {
    function getItems(itemsSelector) {
      var panelSelector = "#scp-" + state.getPanelName() + ">", nodeList = document.querySelectorAll(panelSelector + itemsSelector);
      return Array.prototype.slice.call(nodeList);
    }
    var cardTabs = getItems(".scp-card-chooser>sc-link"), cardContentItems = getItems('.scp-active .scp-tabbable:not([data-show="false"])');
    return cardTabs.concat(cardContentItems);
  }
  function getAdjacentTabbableItem(all, current, direction) {
    for (var i = 0, l = all.length; i < l; i++) {
      if (all[i] === current) {
        return all[i + direction];
      }
    }
  }
  function getFirstOrLastTabbableItem(all, direction) {
    // First or last dynamic tabbable item.
    return all[direction > 0 ? 0 : all.length - 1];
  }
  function navigateInCard(direction, isFirstTimeInCard, currentItem) {
    // All items in the active card.
    var tabbableItemsInActiveCard = getAllTabbableItemsInActiveCard();
    // If there are none, skip to the next item.
    // The item adjacent to the current focused item, depending on what direction user tabs.
    return isFirstTimeInCard ? getFirstOrLastTabbableItem(tabbableItemsInActiveCard, direction) : getAdjacentTabbableItem(tabbableItemsInActiveCard, currentItem, direction);
  }
  function isFocusable(elem) {
    return elem && "true" !== elem.getAttribute("aria-disabled") && parseFloat(getComputedStyle(elem).opacity) > .1;
  }
  function navigateInDirection(direction, doStartFromTop) {
    if (!state.isPanel()) {
      return;
    }
    hideFocus();
    var nextItem, tabbable = getTabbableItems(), focusIndex = doStartFromTop ? -1 : getFocusIndexForElement(getFocusedItem()), isFirstTimeInCard = "$" !== tabbable[focusIndex], numItems = tabbable.length;
    while (true) {
      nextItem = null;
      if ("$" === tabbable[focusIndex]) {
        nextItem = navigateInCard(direction, isFirstTimeInCard, tabbedElement);
        isFirstTimeInCard = false;
      }
      if (!nextItem) {
        focusIndex += direction;
        if (focusIndex < 0) {
          // If shift+tab from the first item, go to the last
          focusIndex = numItems - 1;
        } else {
          if (focusIndex >= numItems) {
            // If tab past the last item, go to the first
            focusIndex = 0;
          }
        }
        nextItem = getElementForFocusIndex(focusIndex);
      }
      tabbedElement = nextItem;
      // Skip disabled items such as the prev arrow which is turned off at first
      if (isFocusable(nextItem)) {
        break;
      }
    }
    showFocus();
  }
  function getTabbableItems() {
    return TABBABLE[state.getPanelName()];
  }
  function getElementForFocusIndex(focusIndex) {
    return byId("scp-" + getTabbableItems()[focusIndex]);
  }
  function isTabbableCardItem(elem) {
    var className = elem.getAttribute("class");
    return className && className.indexOf("scp-tabbable") >= 0;
  }
  function getFocusIndexForElement(elem) {
    // Remove scp- from id and find new index
    if (elem) {
      var tabbable = getTabbableItems(), focusIndex = tabbable.indexOf(elem.id.substr(4));
      // If can't find the element in the tabbable items, it means it's in card content
      if (focusIndex < 0 && isTabbableCardItem(elem)) {
        // Not one of the main focused items listed in TABBABLE, try to see if it's a focusable card item
        focusIndex = tabbable.indexOf("$");
      }
      return focusIndex;
    }
    return -1;
  }
  function clickToFocus(event) {
    var target = state.isPanel() && helper.getEventTarget(event);
    clearPanelFocus();
    while (target && target.id !== BP_CONST.BADGE_ID && target.id !== BP_CONST.BP_CONTAINER_ID) {
      var forwardClickFocus = target.getAttribute("aria-controls");
      if (forwardClickFocus) {
        // Clicking slider thumb should focus slider bar
        target = byId(forwardClickFocus);
      }
      if (getFocusIndexForElement(target) >= 0) {
        tabbedElement = target;
        break;
      }
      target = target.parentNode;
    }
    if (tabbedElement) {
      showFocus();
    } else {
      // Clicked in whitespace, on collapsed badge or somewhere that can't take focus
      // Prevent default handling and thus prevent focus
      // User may think they need to click in badge
      // We don't want to take focus that way -- only via tabbing or from screen reader use
      return helper.cancelEvent(event);
    }
  }
  // If it was always HTML we could just use elem.click()
  function simulateClick(element) {
    var event = document.createEvent("MouseEvents");
    // If you need clientX, clientY, etc., you can call
    // initMouseEvent instead of initEvent
    event.initEvent("click", true, true);
    element.dispatchEvent(event);
    new metric.PanelClick({
      target: element.id,
      role: helper.getAriaOrNativeRole(element)
    }).send();
  }
  function onZoomKeyUp() {
    sitecues.require([ "page/zoom/zoom" ], function(zoomMod) {
      zoomMod.zoomStopRequested();
    });
  }
  function performZoomSliderCommand(keyCode, evt) {
    var deltaSliderCommand = DELTA_KEYS[keyCode];
    if (deltaSliderCommand) {
      sitecues.require([ "page/zoom/zoom" ], function(zoomMod) {
        window.removeEventListener("keyup", onZoomKeyUp);
        // Zoom module will listen from here
        zoomMod.init();
        if (deltaSliderCommand > 0) {
          zoomMod.beginZoomIncrease(evt);
        } else {
          zoomMod.beginZoomDecrease(evt);
        }
      });
      window.addEventListener("keyup", onZoomKeyUp);
    }
  }
  // Process key down and return true if key should be allowed to perform default behavior
  function processKey(evt) {
    var keyCode = evt.keyCode;
    // Escape = close
    if (keyCode === ESCAPE) {
      if (state.isSecondaryPanelRequested()) {
        simulateClick(byId(BP_CONST.MORE_BUTTON_GROUP_ID));
      } else {
        sitecues.require([ "bp-expanded/controller/shrink-controller" ], function(shrinkController) {
          shrinkController.shrinkPanel(true);
        });
      }
      return;
    }
    // Tab navigation
    if (keyCode === TAB) {
      turnOnKeyboardMode();
      navigateInDirection(evt.shiftKey ? -1 : 1);
      new metric.PanelFocusMove().send();
      return;
    }
    // Perform widget-specific command
    // Can't use evt.target because in the case of SVG it sometimes only has fake focus (some browsers can't focus SVG elements)
    var item = getFocusedItem();
    if (item) {
      if ("textarea" === item.localName || "input" === item.localName) {
        return true;
      }
      if (item.id === BP_CONST.ZOOM_SLIDER_BAR_ID) {
        performZoomSliderCommand(keyCode, evt);
      } else {
        if (triggerKeys.indexOf(keyCode) > -1) {
          simulateClick(item);
        }
      }
    }
    if (triggerKeys.indexOf(keyCode) > -1) {
      //Don't allow default behavior for enter and space keys while the panel is open
      return;
    }
    if (arrows.indexOf(keyCode) > -1) {
      //Prevent window from scrolling on arrow keys
      return;
    }
    // else fall through to native processing of keystroke
    return true;
  }
  function isModifiedKey(evt) {
    return evt.altKey || evt.metaKey || evt.ctrlKey;
  }
  function processKeyDown(evt) {
    if (isModifiedKey(evt) || !state.isPanel()) {
      return;
    }
    if (!processKey(evt)) {
      evt.preventDefault();
      return false;
    }
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    events.on("bp/will-toggle-feature", hideFocus);
    events.on("bp/did-open-subpanel", focusFirstItem);
    events.on("bp/did-show-card", focusCard);
    beginKeyHandling();
    // First time badge expands
    events.on("bp/will-expand", beginKeyHandling);
    events.on("bp/will-shrink", endKeyHandling);
    events.on("bp/did-expand", showFocus);
  }
  return {
    init: init,
    getFocusedItem: getFocusedItem,
    navigateInDirection: navigateInDirection,
    processKey: processKey
  };
});

// We do not want the mouse wheel to scroll the document when it's over the BP
sitecues.define("bp-expanded/controller/scroll-prevention", [ "run/events", "run/bp/helper", "run/bp/constants" ], function(events, helper, BP_CONST) {
  var isInitialized;
  // Return truthy if document will be scrolled
  // This occurs if the current element is already scrolled all the way in this direction
  function isFinishedScrollingElement(elem, event) {
    var deltaY = parseInt(event.deltaY || -event.wheelDeltaY), // parseInt() sanitizes by converting strange -0 value to 0
    scrollHeight = elem.scrollHeight, // The total height of the scrollable area
    scrollTop = elem.scrollTop, // Pixel height of invisible area above element (what has been scrolled)
    clientHeight = elem.clientHeight, // The height of the element in the window
    scrollBottom = scrollHeight - scrollTop - clientHeight, // The pixels height invisible area below element (what is left to scroll)
    scrollingDown = deltaY > 0, // If the user is scrolling downwards
    scrollingUp = deltaY < 0;
    // If the user is scrolling upwards
    // Already at bottom
    // Already at top
    return scrollingDown && deltaY > scrollBottom || scrollingUp && -deltaY > scrollTop || !deltaY;
  }
  function shouldCancelScrollEvent(evt) {
    var target = helper.getEventTarget(evt);
    if (!target.hasAttribute("data-allow-scroll")) {
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
    getBpContainer().addEventListener("wheel", preventDocumentScroll);
  }
  function willShrink() {
    getBpContainer().removeEventListener("wheel", preventDocumentScroll);
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    willExpand();
    // First time
    events.on("bp/will-expand", willExpand);
    events.on("bp/will-shrink", willShrink);
  }
  return {
    init: init
  };
});

sitecues.define("bp-expanded/view/tts-button", [ "run/bp/constants", "run/bp/helper", "run/bp/model/state", "run/locale", "run/conf/preferences", "run/events", "run/platform", "mini-core/native-global", "run/inline-style/inline-style" ], function(BP_CONST, helper, state, locale, pref, events, platform, nativeGlobal, inlineStyle) {
  var waveAnimationTimer, waveAnimationStepNum, localizedSpeechString, isInitialized, isListeningToEvents, isSpeechEnabled = pref.get("ttsOn");
  function toggleSpeech() {
    sitecues.require([ "audio/audio" ], function(audio) {
      // We do a timeout here so that this occurs after any key handlers that stop speech
      // Otherwise, the same Enter/space press that starts speaking the cue could immediately silence the same cue
      nativeGlobal.setTimeout(audio.toggleSpeech, 0);
    });
  }
  function getTTSButtonElement() {
    return helper.byId(BP_CONST.SPEECH_ID);
  }
  function getTTSLabelElement() {
    return helper.byId(BP_CONST.SPEECH_LABEL_ID);
  }
  function ensureLabelFitsInPanel() {
    var ttsLabelElement = getTTSLabelElement(), speechLabelWidth = ttsLabelElement.getBoundingClientRect().width;
    function setAlignment(alignment) {
      // alignment is 'start' for left justification, and 'end' for right justification
      ttsLabelElement.setAttribute("text-anchor", alignment);
      ttsLabelElement.setAttribute("x", ttsLabelElement.getAttribute("data-x-" + alignment));
    }
    function getMaxLabelWidth() {
      // The right side of the speech target, which is almost at the panel's edge
      // minus the visible left side of the speech button
      return helper.byId(BP_CONST.SPEECH_TARGET_ID).getBoundingClientRect().right - helper.byId(BP_CONST.HEAD_ID).getBoundingClientRect().left;
    }
    // Use right justification if label is too large to fit
    setAlignment(speechLabelWidth > getMaxLabelWidth() ? "end" : "start");
    if (platform.browser.isEdge) {
      helper.fixTextAnchors(ttsLabelElement);
    }
  }
  function setTTSLabel(state) {
    var speechStateLabel = getTTSLabelElement(), localizedState = locale.translate(state), text = localizedSpeechString + " " + localizedState, node = document.createTextNode(text);
    speechStateLabel.removeChild(speechStateLabel.firstChild);
    speechStateLabel.appendChild(node);
    ensureLabelFitsInPanel();
  }
  /*
   Show TTS is enabled or disabled.
    */
  function updateTTSStateView(isEnabled) {
    isSpeechEnabled = isEnabled;
    var ttsButton = getTTSButtonElement();
    endWaveAnimation();
    // Don't keep animating the wave hover effect after a click
    enableDimmingHover(false);
    // Don't use hover effects after a click
    // Set aria-checked so that screen readers speak the new state
    ttsButton.setAttribute("aria-checked", !!isEnabled);
    // Update the label for the TTS button
    setTTSLabel(isEnabled ? BP_CONST.SPEECH_STATE_LABELS.ON : BP_CONST.SPEECH_STATE_LABELS.OFF);
  }
  function getWaves() {
    return [ helper.byId(BP_CONST.WAVE_1_ID), helper.byId(BP_CONST.WAVE_2_ID), helper.byId(BP_CONST.WAVE_3_ID) ];
  }
  function nextWaveAnimationStep() {
    var waves = getWaves(), opacityData = BP_CONST.ANIMATE_WAVES_OPACITY;
    for (var waveNum = 0; waveNum < waves.length; waveNum++) {
      inlineStyle(waves[waveNum]).opacity = opacityData[waveNum][waveAnimationStepNum];
    }
    if (++waveAnimationStepNum < opacityData[0].length) {
      // Not finished with animation, do it again
      waveAnimationTimer = nativeGlobal.setTimeout(nextWaveAnimationStep, BP_CONST.ANIMATE_WAVES_STEP_DURATION);
    } else {
      endWaveAnimation();
    }
  }
  function endWaveAnimation() {
    var waves = getWaves();
    clearTimeout(waveAnimationTimer);
    waveAnimationStepNum = 0;
    for (var waveNum = 0; waveNum < waves.length; waveNum++) {
      inlineStyle(waves[waveNum]).opacity = "";
    }
  }
  // Animate waves if user hovers over TTS button, speech is off and animation is not already playing
  function beginHoverEffects() {
    if (!state.isPanel()) {
      return;
    }
    enableDimmingHover(true);
    if (!isSpeechEnabled && !waveAnimationStepNum) {
      nextWaveAnimationStep();
    }
  }
  function endHoverEffects() {
    endWaveAnimation();
    enableDimmingHover(false);
  }
  function enableDimmingHover(doEnable) {
    getTTSButtonElement().setAttribute("class", doEnable ? "scp-dim-waves" : "");
  }
  function toggleListeners(isOn) {
    if (isOn === isListeningToEvents) {
      return;
    }
    isListeningToEvents = isOn;
    var fn = isOn ? "addEventListener" : "removeEventListener", mouseTarget1 = getTTSButtonElement(), mouseTarget2 = helper.byId(BP_CONST.SPEECH_LABEL_ID);
    // Do not use click listeners when the panel is shrunk because it confused the Window-Eyes browse mode
    // (when Enter key was pressed on badge, it toggled speech)
    mouseTarget1[fn]("click", toggleSpeech);
    mouseTarget2[fn]("click", toggleSpeech);
    mouseTarget1[fn]("mouseover", beginHoverEffects);
    mouseTarget1[fn]("mouseout", endHoverEffects);
    mouseTarget1[fn]("mouseover", beginHoverEffects);
    mouseTarget1[fn]("mouseout", endHoverEffects);
  }
  /*
   Set up speech toggle.
    */
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    localizedSpeechString = locale.translate("speech");
    toggleListeners(true);
    events.on("bp/did-expand", function() {
      toggleListeners(true);
    });
    events.on("bp/will-shrink", function() {
      toggleListeners(false);
    });
    updateTTSStateView(isSpeechEnabled);
    waveAnimationStepNum = 0;
  }
  return {
    init: init,
    updateTTSStateView: updateTTSStateView
  };
});

/**
 * This file contains helper methods for dealing with the string that is returned
 * when using Element#style.transform or Element.getAttribute('transform')
 * This module supports translateX, translateY, scale, scaleY and rotate.
 * In the case of scaleY it is get/set as a scale(1,y) value with a paired property scaleType = 'scaleY'
 */
sitecues.define("bp-expanded/view/transform-util", [ "run/inline-style/inline-style", "run/platform" ], function(inlineStyle, platform) {
  var SHOULD_USE_CSS_TRANSFORM_IN_SVG = !platform.browser.isMS && // MS does not support CSS in SVG
  !platform.browser.isSafari && // Safari CSS animations are actually slower
  !platform.browser.isFirefox;
  // FF breaks getBoundingClientRect() when CSS transform is used
  // Skips past non-numeric characters and get the next number as type 'number'
  // It will include a negative sign and decimal point if it exists in the string
  function getNumberFromString(str) {
    return "number" === typeof str ? str : +str.match(/[0-9\.\-]+/);
  }
  function shouldUseCss(elem) {
    return SHOULD_USE_CSS_TRANSFORM_IN_SVG || !(elem instanceof SVGElement);
  }
  // Set @transform or CSS transform as appropriate
  // transformMap: {     // optional fields
  //   translateX: number
  //   translateY: number
  //   scale: number,
  //   scaleType: 'scaleX' || 'scaleY'
  //   rotate: number
  // }
  // scaleType can be 'scaleX' or 'scaleY'
  function setElemTransform(elem, transformMap) {
    var useCss = shouldUseCss(elem), transformString = getTransformString(transformMap, useCss);
    if (useCss) {
      // Always use CSS, even in SVG
      inlineStyle(elem).transform = transformString;
    } else {
      if (transformString) {
        elem.setAttribute("transform", transformString);
      } else {
        elem.removeAttribute("transform");
      }
    }
  }
  // Always get style transform
  function getStyleTransformMap(elem) {
    return getTransformMap(inlineStyle(elem).transform);
  }
  function getElemTransformMap(elem) {
    return shouldUseCss(elem) ? getStyleTransformMap(elem) : getAttrTransformMap(elem);
  }
  function getAttrTransformMap(elem) {
    return getTransformMap(elem.getAttribute("transform"));
  }
  function getTransformMap(transformString) {
    var // We use String.prototype.split to extract the values we want, and we need a
    // variable to store the intermediary result.  I'm not a huge fan of this.
    rotateValues, transformValues, hasTranslate = transformString && transformString.indexOf("translate") !== -1, hasScale = transformString && transformString.indexOf("scale") !== -1, hasScaleY = hasScale && transformString.indexOf("scale(1,") !== -1, // Only vertical scaling used (scaleY)
    hasRotate = transformString && transformString.indexOf("rotate") !== -1, translateY = 0, translateX = 0, scale = 1, rotate = 0;
    if (hasTranslate) {
      // translate is always first
      var separator = transformString.indexOf(",") > 0 ? "," : " ";
      // Attributes split by space, CSS by comma
      transformValues = transformString.split(separator);
      translateX = transformValues[0] || 0;
      translateY = hasScale ? transformValues[1].split("scale")[0] : transformValues[1] || 0;
    }
    if (hasScale) {
      if (hasScaleY) {
        // Only vertical scaling used (scaleY)
        transformValues = transformString.split("scale(1,");
      } else {
        transformValues = transformString.split("scale");
      }
      scale = hasRotate ? transformValues[1].split("rotate")[0] : transformValues[1];
    }
    if (hasRotate) {
      rotate = transformString.split("rotate")[1];
      if (rotate.indexOf(",") !== -1) {
        rotateValues = rotate.split(",");
        rotate = rotateValues[0];
      }
    }
    return {
      translateX: getNumberFromString(translateX),
      translateY: getNumberFromString(translateY),
      scale: getNumberFromString(scale),
      scaleType: hasScaleY ? "scaleY" : "scale",
      rotate: getNumberFromString(rotate)
    };
  }
  function getTransformString(transformMap, useCss) {
    var translateUnits = useCss ? "px" : "", hasTranslate = transformMap.translateX || transformMap.translateY, translateCSS = hasTranslate ? "translate(" + (transformMap.translateX || 0) + translateUnits + ", " + (transformMap.translateY || 0) + translateUnits + ") " : "", scale = transformMap.scale, hasScale = scale && 1 !== scale, scaleType = "scaleY" === transformMap.scaleType ? "scale(1," : "scale(", scaleCSS = hasScale ? scaleType + scale + ") " : "", rotate = transformMap.rotate, rotateUnits = useCss ? "deg" : "", rotateCSS = rotate ? " rotate(" + rotate + rotateUnits + ") " : "";
    return translateCSS + scaleCSS + rotateCSS;
  }
  return {
    getTransformMap: getTransformMap,
    getElemTransformMap: getElemTransformMap,
    getStyleTransformMap: getStyleTransformMap,
    setElemTransform: setElemTransform,
    shouldUseCss: shouldUseCss
  };
});

/**
 *
 * This file exposes an API for creating javascript animations.
 */
sitecues.define("bp-expanded/view/transform-animate", [ "run/util/object-utility", "run/inline-style/inline-style", "bp-expanded/view/transform-util", "run/platform" ], function(objectUtil, inlineStyle, transformUtil, platform) {
  var requestFrameFn = window.requestAnimationFrame, cancelFrameFn = window.cancelAnimationFrame, // https://gist.github.com/gre/1650294
  timingFunctions = {
    "ease-out": function(t) {
      return --t * t * t + 1;
    },
    linear: function(t) {
      return t;
    }
  };
  function getFinalTransforms(toTransforms, fromTransforms) {
    var fromTransform, toTransform, finalTransforms = [], index = toTransforms.length;
    while (index--) {
      fromTransform = fromTransforms[index] || {};
      toTransform = toTransforms[index] || {};
      finalTransforms[index] = {
        translateX: "number" === typeof toTransform.translateX ? toTransform.translateX : fromTransform.translateX || 0,
        translateY: "number" === typeof toTransform.translateY ? toTransform.translateY : fromTransforms.translateY || 0,
        scale: "number" === typeof toTransform.scale ? toTransform.scale : fromTransform.scale || 1,
        scaleType: toTransform.scaleType,
        rotate: "number" === typeof toTransform.rotate ? toTransform.rotate : fromTransform.rotate || 0
      };
    }
    return finalTransforms;
  }
  function getOrigTransforms(elements) {
    var index = elements.length, origTransforms = [];
    // Get the original transforms for each element
    while (index--) {
      if (elements[index]) {
        origTransforms[index] = transformUtil.getElemTransformMap(elements[index]);
      }
    }
    return origTransforms;
  }
  function JsAnimation(elements, fromTransforms, toTransforms, duration, onFinish, timingFunctionName) {
    var animationStartTime = Date.now(), timingFn = timingFunctions[timingFunctionName], currAnimation = this;
    this.onFinish = onFinish;
    this.isRunning = true;
    this.onTick = tick;
    this.setDuration = setDuration;
    this.animationId = tick();
    // Start the animation automatically.
    function setDuration(newDuration) {
      duration = newDuration;
    }
    function tick() {
      var from, to, interim, time = duration > 0 ? timingFn(Math.min(1, (Date.now() - animationStartTime) / duration)) : 1, index = elements.length;
      while (index--) {
        if (elements[index]) {
          from = fromTransforms[index];
          to = toTransforms[index];
          interim = {
            translateX: from.translateX + (to.translateX - from.translateX) * time,
            translateY: from.translateY + (to.translateY - from.translateY) * time,
            scale: from.scale + (to.scale - from.scale) * time,
            scaleType: to.scaleType,
            rotate: from.rotate + (to.rotate - from.rotate) * time
          };
          transformUtil.setElemTransform(elements[index], interim);
        }
      }
      if (time < 1) {
        currAnimation.animationId = requestFrameFn(tick);
      } else {
        currAnimation.isRunning = false;
        if (onFinish) {
          onFinish();
        }
      }
    }
  }
  JsAnimation.prototype.finishNow = function() {
    if (this.isRunning) {
      if (this.onTick) {
        this.setDuration(0);
        this.onTick();
      }
      if (this.onFinish) {
        this.onFinish();
      }
      cancelFrameFn(this.animationId);
      this.isRunning = false;
    }
  };
  function CssAnimation(elements, fromTransforms, toTransforms, duration, onCustomFinish, timingFunctionName) {
    var isRunning = true;
    function initTransitionStyles(transition) {
      elements.forEach(function(elem) {
        if (elem) {
          var css = {
            transition: transition
          };
          if (transition) {
            css.transitionTimingFunction = timingFunctionName;
          }
          inlineStyle.set(elem, css);
        }
      });
    }
    // doTweak is used when we need to make sure to set a different value after a transition was removed
    function initTransforms(doTweak) {
      var toTransform, index = elements.length;
      while (index--) {
        if (elements[index]) {
          toTransform = toTransforms[index];
          if (doTweak) {
            toTransform = objectUtil.assign({}, toTransform);
            toTransform.translateY = (toTransform.translateY || 0) + .001;
          }
          transformUtil.setElemTransform(elements[index], toTransform);
        }
      }
    }
    function addTransitionEndListener() {
      elements[0].addEventListener(platform.transitionEndEvent, onFinish);
    }
    function removeTransitionEndListener() {
      elements[0].removeEventListener(platform.transitionEndEvent, onFinish);
    }
    function onFinish(evt) {
      // Don't bubble to a parent animation (e.g the secondary panel may still need to animate while a hover finishes animating)
      if (evt.target === evt.currentTarget) {
        evt.stopPropagation();
        finishNow();
      }
    }
    function finishNow() {
      if (isRunning) {
        // Don't finish twice
        isRunning = false;
        removeTransitionEndListener();
        initTransitionStyles("");
        // Disable the element transition by setting the style to ''
        initTransforms(true);
        if (onCustomFinish) {
          onCustomFinish();
        }
      }
    }
    function beginTransition() {
      addTransitionEndListener();
      initTransitionStyles("transform " + duration + "ms");
      getComputedStyle(elements[0]);
      // Force layout update
      requestAnimationFrame(initTransforms);
    }
    beginTransition();
    return {
      finishNow: finishNow
    };
  }
  function animateTransformLinear(element, value, duration) {
    return animateTransforms([ element ], [ value ], duration, null, "linear");
  }
  // Optimized transform animation that works via @transform on IE, CSS transition on other browsers
  // Currently only works with CSS transform, on element at a time
  function animateTransforms(elements, requestedTransforms, duration, onCustomFinish, timingFunctionName) {
    timingFunctionName = timingFunctionName || "ease-out";
    var animationType = transformUtil.shouldUseCss(elements[0]) ? CssAnimation : JsAnimation, fromTransforms = getOrigTransforms(elements), toTransforms = getFinalTransforms(requestedTransforms, fromTransforms);
    return new animationType(elements, fromTransforms, toTransforms, duration, onCustomFinish, timingFunctionName);
  }
  return {
    animateTransformLinear: animateTransformLinear,
    animateTransforms: animateTransforms
  };
});

/**
 * IE cannot handle SVG transforms via CSS, so we do them in script
 * Currently this module implements data-hover="[transform attributes]"
 */
sitecues.define("bp-expanded/view/transform-hovers", [ "run/bp/helper", "run/bp/constants", "bp-expanded/view/transform-util", "bp-expanded/view/transform-animate", "run/events" ], function(helper, BP_CONST, transformUtil, animate, events) {
  var isActivePanel = false, byId = helper.byId, HOVER_ANIMATION_MS = 500, savedHoverElems = [], uniqueId = 0, origTransforms = [], animations = [], hoverState = [];
  function getContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }
  function toggleHover(target, isActiveHover) {
    if ("true" === target.getAttribute("aria-disabled") || !target.hasAttribute("data-hover")) {
      return;
    }
    var id = +target.getAttribute("data-id"), origTransform = origTransforms[id] || "", transformValue = origTransform + " " + (isActiveHover ? target.getAttribute("data-hover") : "");
    if (hoverState[id] === isActiveHover) {
      return;
    }
    if (animations[id]) {
      animations[id].finishNow();
    }
    animations[id] = animate.animateTransformLinear(target, transformUtil.getTransformMap(transformValue), HOVER_ANIMATION_MS);
    hoverState[id] = isActiveHover;
  }
  function onMouseOver(evt) {
    toggleHover(helper.getEventTarget(evt), true);
  }
  function onMouseMove(evt) {
    var index = savedHoverElems.length, x = evt.clientX, y = evt.clientY;
    while (index--) {
      if (hoverState[index] && evt.target !== savedHoverElems[index] && evt.target.parentNode !== savedHoverElems[index]) {
        var rect = savedHoverElems[index].getBoundingClientRect();
        if (x < rect.left - 1 || x > rect.right + 1 || y < rect.top - 1 || y > rect.bottom + 1) {
          toggleHover(savedHoverElems[index], false);
        }
      }
    }
  }
  function toggleMouseListeners(willBeActive) {
    if (isActivePanel === willBeActive) {
      return;
    }
    storeAllHoverElements();
    isActivePanel = willBeActive;
    var addOrRemoveFn = isActivePanel ? "addEventListener" : "removeEventListener", index = savedHoverElems.length;
    function addOrRemoveHovers(elem) {
      elem[addOrRemoveFn]("mouseenter", onMouseOver);
    }
    while (index--) {
      addOrRemoveHovers(savedHoverElems[index]);
    }
    window[addOrRemoveFn]("mousemove", onMouseMove);
  }
  function storeAllHoverElements() {
    var elem, allHoverElems = getContainer().querySelectorAll("[data-hover]"), index = allHoverElems.length;
    while (index--) {
      elem = allHoverElems[index];
      if (savedHoverElems.indexOf(elem) < 0) {
        // If not already saved
        savedHoverElems[uniqueId] = elem;
        elem.setAttribute("data-id", uniqueId);
        origTransforms[uniqueId] = elem.getAttribute("transform");
        ++uniqueId;
      }
    }
  }
  function cancelHovers() {
    var index = savedHoverElems.length;
    while (index--) {
      toggleHover(savedHoverElems[index], false);
    }
  }
  function hoversOn() {
    toggleMouseListeners(true);
  }
  function hoversOff() {
    toggleMouseListeners(false);
  }
  function refreshHovers() {
    // Ensure listeners are added for new content
    hoversOff();
    storeAllHoverElements();
    hoversOn();
  }
  function init() {
    refreshHovers();
    // Current expansion
    events.on("bp/did-expand zoom", hoversOn);
    // Future expansions
    events.on("bp/will-shrink zoom/begin", hoversOff);
    events.on("bp/did-init-secondary bp/content-loaded", refreshHovers);
    events.on("bp/will-show-secondary-feature", cancelHovers);
  }
  return {
    init: init
  };
});

/**
 *  This file contains logic for the "?" button placement and functionality that opens up the
 *  help / info page to provide sitecues users with a document to learn how to use the tool, including
 *  keyboard commands.
 */
sitecues.define("bp-expanded/view/more-button", [ "run/bp/constants", "run/bp/helper", "bp-expanded/view/transform-util", "bp-expanded/view/transform-animate", "bp-expanded/view/transform-hovers", "run/bp/model/state", "run/events", "run/inline-style/inline-style", "run/ab-test/ab-test", "mini-core/native-global" ], function(BP_CONST, helper, transformUtil, animate, hovers, state, events, inlineStyle, abTest, nativeGlobal) {
  var userInputTimeoutId, doAlwaysShowButton, isAfterUserInput, moreButtonContainer, moreOpacityElem, isInitialized, BUTTON_ENTER_ANIMATION_DURATION = 500, // Milliseconds
  BUTTON_ENTER_ANIMATION_DURATION_INSTANT = 0, NO_INPUT_TIMEOUT_DEFAULT = 3e3, // Oft-used functions. Putting it in a variable helps minifier, convenience, brevity
  byId = helper.byId;
  function getHelpOrSecondaryPanel(doToggle) {
    if (state.get("isClassicMode")) {
      sitecues.require([ "info/info" ], function(info) {
        if (doToggle) {
          info.showHelp();
        }
      });
      return;
    }
    // Open secondary panel (not in classic mode)
    sitecues.require([ "bp-secondary/bp-secondary" ], function(secondary) {
      // Show or hide the secondary panel.
      secondary.init();
      if (doToggle) {
        secondary.toggleSecondaryPanel();
      }
    });
  }
  function onMouseClick() {
    getHelpOrSecondaryPanel(true);
  }
  function addMouseListeners() {
    moreButtonContainer.addEventListener("click", onMouseClick);
  }
  function setSize(size) {
    transformUtil.setElemTransform(moreButtonContainer, {
      scale: size
    });
  }
  function showMoreButton(useInstantTransition) {
    byId(BP_CONST.BOTTOM_MOUSETARGET_ID).removeEventListener("mousemove", showMoreButtonSlowly);
    clearTimeout(userInputTimeoutId);
    moreOpacityElem.setAttribute("class", useInstantTransition ? "" : "scp-transition-opacity-fast");
    inlineStyle(moreOpacityElem).opacity = 1;
    // Scale the button to 0.5 and then animate it to a scale of 1
    if (!useInstantTransition) {
      setSize(.5);
      // Delay to fix Chrome animation bug
      // TODO WTF? We need to wait 30 ms? Tried requestAnimationFrame() and only 50% success rate
      nativeGlobal.setTimeout(function() {
        getComputedStyle(moreButtonContainer);
        // Force layout update
        animate.animateTransformLinear(moreButtonContainer, {
          scale: 1
        }, useInstantTransition ? BUTTON_ENTER_ANIMATION_DURATION_INSTANT : BUTTON_ENTER_ANIMATION_DURATION);
      }, 30);
    }
    // Once we show the button, always show it.
    doAlwaysShowButton = true;
    getHelpOrSecondaryPanel();
    // Preload
    // Add mouse listeners once BP is ready
    addMouseListeners();
  }
  function showMoreButtonSlowly() {
    showMoreButton(false);
  }
  function showMoreButtonInstantly() {
    showMoreButton(true);
  }
  function hideHelpButton() {
    moreOpacityElem.setAttribute("class", "");
    moreOpacityElem.style.opacity = 0;
    byId(BP_CONST.BOTTOM_MOUSETARGET_ID).removeEventListener("mousemove", showMoreButtonSlowly);
    clearTimeout(userInputTimeoutId);
  }
  function captureUserInput() {
    isAfterUserInput = true;
    byId(BP_CONST.SVG_ID).removeEventListener("mousedown", captureUserInput);
  }
  function showButtonIfNoUserInput() {
    if (!isAfterUserInput) {
      showMoreButton();
    }
  }
  // Three things may happen when the panel is expanded:
  // 1) Show the button immediately.
  // 2) Wait for the user to mouse over the bottom of the panel. If so, show the button.
  // 3) Wait and see if the user makes any actions in the panel. If not, show the button.
  function initButtonBehavior() {
    // If the user has already been presented with the button (during this page load),
    // there is no reason to not show it immediately whenever the panel is expanded.
    if (doAlwaysShowButton) {
      showMoreButtonSlowly();
      // Or use showMoreButton() to go back to showing the button instantly in this case
      return;
    }
    // Add event listener for mousing over the bottom of the panel
    byId(BP_CONST.BOTTOM_MOUSETARGET_ID).addEventListener("mousemove", showMoreButtonSlowly);
    // Add event listener for mouse down anywhere on the panel
    byId(BP_CONST.SVG_ID).addEventListener("mousedown", captureUserInput);
    // After NO_INPUT_TIMEOUT, we will be able to determine if the user has
    // pressed their mouse button.  If they have not, show the additional button.
    var noInputTimeoutMs = abTest.get("moreButtonTimerV2", NO_INPUT_TIMEOUT_DEFAULT);
    userInputTimeoutId = nativeGlobal.setTimeout(showButtonIfNoUserInput, noInputTimeoutMs);
  }
  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    // Get elements
    moreButtonContainer = byId(BP_CONST.MORE_BUTTON_CONTAINER_ID);
    moreOpacityElem = byId("scp-more-button-opacity");
    // Show immediately?
    doAlwaysShowButton = !state.get("isFirstBadgeUse");
    // After a complete expansion of the badge, determine if and when we will show
    // the "more" button.
    events.on("bp/did-expand", initButtonBehavior);
    // Future expansions
    initButtonBehavior();
    // First expansion is now
    // Allows other modules to show the more button.  For example, pressing the
    // tab key to navigate and operate the panel.
    events.on("bp/did-focus-more-button", showMoreButtonInstantly);
    // Always hide the more button when the panel is about to collapse.
    events.on("bp/will-shrink", hideHelpButton);
    //TODO: Once Edge gets itself together (see SC-3434) we should attach the button mouse listener here instead of after revealing it
    hovers.init();
  }
  return {
    init: init
  };
});

sitecues.define("bp-expanded/bp-expanded", [ "bp-expanded/controller/slider-controller", "bp-expanded/controller/shrink-controller", "bp-expanded/controller/focus-controller", "bp-expanded/controller/scroll-prevention", "bp-expanded/view/tts-button", "bp-expanded/view/more-button", "bp-expanded/view/transform-util", "run/bp/helper", "run/bp/constants", "run/bp/model/state" ], function(sliderController, shrinkController, focusController, scrollPrevention, ttsButton, moreButton, transform, helper, BP_CONST, state) {
  var isInitialized;
  function getFocusController() {
    return focusController;
  }
  function init() {
    if (!isInitialized) {
      state.set("scale", transform.getStyleTransformMap(helper.byId(BP_CONST.BP_CONTAINER_ID)).scale);
      sliderController.init();
      shrinkController.init();
      focusController.init();
      ttsButton.init();
      moreButton.init();
      scrollPrevention.init();
      sitecues.require([ "page/cursor/cursor" ], function(cursor) {
        cursor.init();
      });
    }
    isInitialized = true;
  }
  return {
    init: init,
    getFocusController: getFocusController
  };
});

sitecues.define("bp-expanded", function() {});
//# sourceMappingURL=bp-expanded.js.map