/*
 * Functions for dealing with user input 
 */
 
function isOutsideRect(evt, rect, minDistance) {
  return evt.clientX > rect.right + minDistance || evt.clientX < rect.left - minDistance ||
      evt.clientY > rect.bottom + minDistance || evt.clientY < rect.top - minDistance;
}

function isOutsidePanel(evt, distance) {
  var panelRect = document.getElementById(state.isMorePanel ? 'scp-more-outline' : 'scp-main-outline').getBoundingClientRect();
  var moreButtonRect = document.getElementById('scp-more-button-container').getBoundingClientRect(); // More button hanging off
  return isOutsideRect(evt, panelRect, distance) && isOutsideRect(evt, moreButtonRect, 0);
}

function winMouseMove(evt) {
  if (!state.isLarge) {
    return;  // If not expanded, should not get here
  }
  if (state.wasInFeaturePanel) {
    // Don't treat as mouse out if mouse just clicked on more button and panel shrunk
    state.wasInFeaturePanel = isOutsidePanel(evt, 0); // Only once back in the panel, reenable mouseout exit feature
    return;
  }

  var MIN_DISTANCE = 75; // Min distance before shrink
  if (isOutsidePanel(evt, MIN_DISTANCE)) {
    hidePanel();
  }
}

function winMouseDown(evt) {
  if (!state.isLarge) {
    return;  // If not expanded, should not get here
  }
  state.wasInFeaturePanel = false; // Once mouse used, no longer need this protection against accidental closure

  if (isOutsidePanel(evt, 0)) {
    hidePanel();
  }
}

function winKeyPress(evt) {
  var charTyped = String.fromCharCode(evt.charCode);
  
  if (charTyped === '+' || charTyped === '=' ) {
    moveSlider(1);
  }
  else if (charTyped === '-') {
    moveSlider(-1);
  }
  else if (charTyped === 's') {
    state.settingsIconVersion = state.settingsIconVersion === 2 ? 1 : state.settingsIconVersion + 1;
  }
  else if (charTyped === 'a') {
    state.aboutIconVersion = state.aboutIconVersion === 2 ? 1 : state.aboutIconVersion + 1;
  }
  else if (evt.charCode > 32 && !evt.shiftKey && !evt.controlKey && !evt.metaKey && !evt.altKey) {
    // Switch palette
    state.paletteName = charTyped; 
  }
  refreshPanelView();
}

var tabbable = {
  "main": [ "zoom-slider-bar", "speech", "more-button-group", "close-button-group" ],
  "more": [ "tips-button", "settings-button", "feedback-button", "about-button", "more-button-group", "close-button-group" ]
};

function getFocusedItem() {
  if (state.tabIndex < 0) {
    return null;
  }
  var currentPanel = state.isMorePanel ?  "more" : "main";
  var focusId = tabbable[currentPanel][state.tabIndex];
  return document.getElementById('scp-' + focusId);
}

function clearFocus() {
  var focusedItem = getFocusedItem();
  if (focusedItem) {
    focusedItem.removeAttribute('data-hasfocus');
  }
  state.tabIndex = -1;
}

function showFocus() {
  var focusedItem = getFocusedItem();
  var panel = getPanelContainer();
  if (!focusedItem) {
    clearFocus();
    panel.removeAttribute('aria-activedescendant', state.isMorePanel ? 'scp-more' : 'scp-main');
    return;
  }
  panel.setAttribute("aria-activedescendant", focusedItem.id);
  focusedItem.setAttribute("data-hasfocus", "true");     // Has focus now
  focusedItem.setAttribute("data-hadfocusonce", "true"); // Has been focused before
}

function panelKeyDown(evt) {
  if (!state.isLarge) {
    return;
  }
  if (evt.keyCode === 27) {  // Escape
    hidePanel();
    evt.preventDefault();
    return;
  }
  if (evt.keyCode === 9) {   // Tab
    if (evt.altKey || evt.metaKey || evt.controlKey) {
      return;
    }
    state.isKeyboardMode = true;
    refreshPanelView();
    var direction = evt.shiftKey ? -1 : 1;
    var currentPanel = state.isMorePanel ?  "more" : "main";
    var numItems = tabbable[currentPanel].length;
    var newTabIndex = state.tabIndex + direction;
    // Tab cycles
    if (newTabIndex < 0) {
      newTabIndex = numItems - 1;
    }
    else if (newTabIndex >= numItems) {
      newTabIndex = 0;
    }
    clearFocus();
    state.tabIndex = newTabIndex;
    if (getFocusedItem().id === 'scp-more-button-group') {
      showMoreButton();
    }
    showFocus();
    evt.preventDefault();
  }

  var item = getFocusedItem();
  if (!item) {
    return;  // Return early -- the remaining commands are specific to each control
  }

  var role = item.getAttribute('role');

  if (evt.keyCode === 13 || evt.keyCode === 32) { // Enter or space
    if (role === 'checkbox') {
      if (item.id === "scp-speech") {
        toggleSpeech();
      }
    }
    else if (role === 'button') {
      buttonPress(evt, item);
    }
    evt.preventDefault();
    return;
  }

  // Remaining commands are for sliders only
  if (role !== 'slider') {
    return;
  }

  var delta = 0;
  switch (evt.keyCode) {
    case 36: delta = -9999; break; // Home
    case 35: delta = 9999; break; // End
    case 37: case 38: delta = -1; break; // Left, up
    case 39: case 40: delta = 1; break;  // Right, down
  }
  if (delta) {   // Slider command
    moveSlider(delta);
    evt.preventDefault();
    return;
  }
}

function buttonPress(evt, item) {
  var item = item || evt.currentTarget;
  if (item.getAttribute('aria-disabled') === 'true') {
    return;
  }
  var feature = item.getAttribute('data-feature');
  if (feature) {  /* Feature button has data-feature attribute */
    clearFocus();
    if (state.featurePanelName === feature) {
      state.featurePanelName = null; // Already on this feature, toggle it off (back to more panel)
    }
    else {
      state.featurePanelName = feature;
    }
  }
  else if (item.id === 'scp-prev-card') {
    switchCard(-1);
  }
  else if (item.id === 'scp-next-card') {
    switchCard(1);
  }
  else if (item.id === 'scp-close-button-group') {
    hidePanel();
  }
  else if (item.id === "scp-more-button-group") {
    onMoreButton();
  }

  refreshPanelView();
}


function noInputOccurred() {
  clearTimeout(noInputTimerId);
  getSVG().removeEventListener('mousedown', resetNoInputTimer); // No longer needed
  showMoreButton();
}

function resetNoInputTimer(restart) {  
  // If no input for a period of time, the more button appears. On mousedown we reset the timer for this.
  clearTimeout(noInputTimerId);
  if (!state.isMoreButtonVisible && restart) {
    noInputTimerId = setTimeout(noInputOccurred, NO_INPUT_TIMEOUT);
  }
}

function panelMouseDown() {
  resetNoInputTimer();
  clearFocus();
  refreshPanelView();
}

function mainMouseOver() {
  if (!state.isLarge) {
    showPanel();
  }
}

