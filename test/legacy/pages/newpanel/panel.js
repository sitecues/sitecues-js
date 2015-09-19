// TODO
// * Visuals:
//     * Better close panel animation from bp-secondary panel (try Seth's ideas)
//     * JavaScript panel height increase for feature panels is slow.
//       Use browser-based animation rather than JS value increments. Easing, smoothness would be nice.
//     * Can we make animations even faster by rotating 1 degree
//     * Intelligent positioning of textarea and close button
// * Hook up
//     * Actually zoom (via event queue so it's not filled up with commands?)
//     * Make sure it collapses back to appropriate place after zoom. Needs to zip to new badge location.
//     * Does page initially load with a png or with svg image?
//     * If we use png, how do we perfectly position new panel object over old svg
//     * If we use png, should we use this file to produce the png? For example, using canvg library.
// * Code cleanup / naming:
//     * Possibly, cleaner palette implementation, easy to understand for site owner, add all colors to it including bg colors
// * Feature panels
//     * Fill out features a bit more
//     * Add keyboard accessibility and ARIA
// * Add to docs: accessibility explanation, palettes, etc.

var LOAD_TIMEOUT = 200; // Simulate loading
var PANEL_READY_TIMEOUT = 1500;  // Time it takes to expand from badge to panel -- no hovers during this time
var PANEL_SHRINK_TIMEOUT = 1500;  // Time it takes to shrink panel to badge -- no hovers during this time
var NO_INPUT_TIMEOUT = 7000;  // Show more button if no activity for this amount of time
var panelReadyTimerId = 0;
var panelShrinkTimerId = 0;
var noInputTimerId = 0;
var refreshZoomSliderTimerId = 0;
var zoomButtonTimerId = 0;
var extraHeightDelayTimerId = 0;
var heightAnimationTimerId = 0;

var state = {
  isRealSettings: false,        // Are we currently showing the actual settings or fake settings?
  isLarge: false,               // Panel mode (vs badge)
  isReady: false,               // Is the panel finished expanding?
  isShrinking: false,           // Is the panel still shrinking?
  isMorePanel: false,           // Second panel
  isKeyboardMode: false,        // Show focus in this mode, support tab navigation
  isMoreButtonVisible: false,   // Should the more button be shown?
  featurePanelName: null,       // Either null, or 'settings' | 'about' | 'tips' | 'feedback'
  extraHeight: 0,               // Current extra height of panel, used to accomodate tall feature panels
  targetExtraHeight: 0,         // Extra height we are growing toward via animation
  wasInFeaturePanel: false,     // Feature panels are larger, need to know this so that mouseout doesn't exit accidentally after we close feature panel
  numCards: { tips: undefined, settings: undefined}, // Needs to be initialized
  tabIndex: 0,                  // When tabbing, where in the cycle are we?
  paletteName: 'b',             // Currently either 'b' for basic or 'r' for red
  settingsIconVersion: 1,       // Which settings icon to use?
  aboutIconVersion: 1           // Which about icon to use?
};

var settings = {
  isSpeechOn: false,
  zoomLevel: 1,
  cardNumber: {tips: 0, settings: 0 }, 
  hasEverCycledCards: { tips: false, settings: false },
};

var FEATURES = {
  about: { extraHeight: 150, waitBeforeExpand: 1600 }, 
  settings: { extraHeight: 195, waitBeforeExpand: 0 }, 
  feedback: { extraHeight: 195, waitBeforeExpand: 0 }, 
  tips: { extraHeight: 195, waitBeforeExpand: 0 }, 
};

function refreshPanelView() {
  // First position badge/panel appropriately
  var svg = getSVG();
  var badge = getBadge();
  if (!badge) {
    console.log("No sitecues badge!");
  }
  else {
    var rect = badge.firstChild.getBoundingClientRect(); // From child image
    svg.style.left = rect.left + 'px';
    svg.style.top = rect.top + 'px';

    var fudgeFactor = getFudgeFactor(); // This is how much wider the badge-panel is with everything vs without -- need something more exact
    svg.style.width = (rect.width  * fudgeFactor) + 'px';
    svg.style.height = (rect.width * .244 * fudgeFactor) + 'px';

    var newWidth = rect.width * fudgeFactor;
    var closeButton = document.getElementById('scp-close-button');
    closeButton.style.left = (rect.left + newWidth + 82) + 'px';
    closeButton.style.top = '-58px';
  }

  // Next, render badge/panel with appropriate state by adding classes
  var classBuilder = 'scp-animate scp-palette' + state.paletteName + 
     ' scp-btn-choice-settings' + state.settingsIconVersion + ' scp-btn-choice-about' + state.aboutIconVersion;
  var featureClassBuilder = '';
  if (state.isKeyboardMode) {
    featureClassBuilder += ' scp-keyboard';
  }
  if (state.isRealSettings) {
    classBuilder += ' scp-realsettings';
  }
  if (settings.isSpeechOn || settings.zoomLevel > 1 || state.isLarge) {
    classBuilder += ' scp-brighten'; // When sitecues is enabled or large
  }
  if (state.isLarge) {
    classBuilder += ' scp-large' + (state.isMorePanel ? ' scp-more' : ' scp-main');
    if (state.isReady) {
      featureClassBuilder += ' scp-ready';
    }
    if (state.featurePanelName) {
      featureClassBuilder += ' scp-feature ' + 'scp-' + state.featurePanelName + '-feature';
      var feature = FEATURES[state.featurePanelName];
      doExtraHeight(feature);
      if (state.numCards[state.featurePanelName]) {
        displayActiveCard();
      }
    }
    else {
      animateExtraHeight(0);
      hideActiveCard();
    }
  }
  else {
    animateExtraHeight(0);
    classBuilder += ' scp-small';
    if (state.isShrinking) {
      classBuilder += ' scp-shrinking';
    }
  }

  getPanelContainer().setAttribute('class', classBuilder + ' ' + featureClassBuilder);

  refreshZoomSlider();    // Zoom slider is different size in small vs large
}

// type = 'tips' or 'setting'
function displayActiveCard(type) {
  hideActiveCard();
  setTimeout(function() { 
    var type = state.featurePanelName;
    var cardNumber = settings.cardNumber[type];
    if (typeof cardNumber === 'number') {
      var newCard = document.querySelector('.scp-' + type + '-content .scp-card:nth-child(' + ( cardNumber + 1 )+ ')');
      newCard.setAttribute("data-active", "true");
    }
  }, 400);  // No overlap
}

function hideActiveCard() {
  var activeCard = document.querySelector('.scp-card[data-active]');
  if (activeCard) {
    activeCard.removeAttribute('data-active'); // Hide active card
  }
}

function switchCard(delta) {
  // Card number needs to persist between sessions, so stored in settings.settingCardNumber
  var type = state.featurePanelName;

  settings.cardNumber[type] = settings.cardNumber[type] + delta;
  var firstCard = settings.hasEverCycledCards[type] ? 1 : 0; // Skip welcome card second time around
  if (settings.cardNumber[type] < firstCard) {
    settings.cardNumber[type] = state.numCards[type] - 1;
  }
  if (settings.cardNumber[type] >= state.numCards[type]) {
    settings.hasEverCycledCards[type] = true;
    settings.cardNumber[type] = 1; // Now skip welcome card when cycling back
  }

  displayActiveCard()

  // Can't go from welcome card backwards (however, reverse cycling is eventually enabled without welcome card)
  var isPrevButtonDisabled = settings.cardNumber[type] === 0 ;
  document.getElementById('scp-prev-card').setAttribute('aria-disabled', isPrevButtonDisabled.toString());
}

function toggleSpeech() {
  settings.isSpeechOn = !settings.isSpeechOn;
  var speechToggle = document.getElementById('scp-speech');
  speechToggle.setAttribute('aria-checked', settings.isSpeechOn ? 'true' : 'false');
  speechToggle.setAttribute('class', 'scp-speech-recently-toggled');
  document.getElementById('scp-speech-state').firstChild.data = settings.isSpeechOn ? 'On' : 'Off';
}

function onMoreButton() {
  if (state.featurePanelName) {
    // FEATURE -> MORE
    state.featurePanelName = null;
  }
  else if (state.isMorePanel) {
    // MORE -> MAIN
    state.isMorePanel = false;
    state.featurePanelName = null;
  }
  else {
    // MAIN -> MORE
    state.isMorePanel = !state.isMorePanel;
    state.featurePanelName = null;
  }
  newPanelContents();
}

function newPanelContents() {
  clearFocus();
  refreshPanelView();
  resetPanelReadyTimer();
  if (state.isKeyboardMode) {
    state.tabIndex = 0;
    showFocus();
  }

  var moreToggle = document.getElementById('scp-more-button-group');
  moreToggle.setAttribute('aria-label', (state.isMorePanel && !state.featurePanelName) ? "Back to main panel" : "View more options" );
}

function showMoreButton() {
  if (state.isReady) {
    document.getElementById('scp-more-button-group').setAttribute('class', 'scp-show');
    state.isMoreButtonVisible = true;
  }
}

function showPanel() {
  state.lastFocus = document.activeElement;
  var isBadgeFocused = document.activeElement === getBadge();
  clearFocus();
  if (isBadgeFocused) {
    state.isKeyboardMode = true;
    state.tabIndex = 0;
    showMoreButton(); // Always show hidden controls when opened in keyboard mode
  }
  else {
    window.addEventListener('mousemove', winMouseMove, false);    // Avoid closing panel on accidental mouse bump for kbd users
  }
  window.addEventListener('mousedown', winMouseDown, false);    
  getPanelContainer().focus(); /* We get the focus either way, in case the user presses tab or Escape */

  state.isLarge = true;
  state.isShrinking = false;
  state.isRealSettings = true;
  state.featurePanelName = null;
  resetNoInputTimer(true);
  resetPanelReadyTimer(true);
  resetPanelShrinkTimer(false);
  refreshPanelView();
}

function isWebkit() {
  return 'WebkitAppearance' in document.documentElement.style;
}
// Hack
function getFudgeFactor() {
  // Not sure why we need this at all, we need to do something smarter
  return 2.95;
}

function panelShrunk() {
  state.isReady = false;
  state.isShrinking = false;
  refreshPanelView();
  if (document.activeElement === getPanelContainer()) {
    if (state.lastFocus === document.body) {
      document.activeElement.blur();
    }
    else {
      state.lastFocus.focus();
    }
  }
  clearFocus();
}

function panelReady() {
  state.isReady = true;
  state.isShrinking = false;
  refreshPanelView();
  if (state.isKeyboardMode) {
    showFocus();
  }
}

function hidePanel() {
  window.removeEventListener('mouseover', winMouseMove);
  window.removeEventListener('mousedown', winMouseDown);
  resetNoInputTimer(false);
  resetPanelShrinkTimer(true);
  resetPanelReadyTimer(false);
  if (state.isMorePanel) {
    state.isMorePanel = false;
    state.featurePanelName = null;
    newPanelContents();
  }
  state.isLarge = false;
  state.featurePanelName = '';
  state.isReady = false;
  state.isShrinking = true;

  refreshPanelView();
  clearSliderMouseCapture();
  clearFocus();
}

function resetPanelReadyTimer(restart) {
  clearTimeout(panelReadyTimerId);
  if (!state.isReady && restart) {
    panelReadyTimerId = setTimeout(panelReady, PANEL_READY_TIMEOUT);
  }
}

function resetPanelShrinkTimer(restart) {
  clearTimeout(panelShrinkTimerId);
  if (!state.isShrinking && restart) {
    panelShrinkTimerId = setTimeout(panelShrunk, PANEL_SHRINK_TIMEOUT);
  }
}

// Hacked
var LARGE_SLIDER_WIDTH = 256;
var SMALL_SLIDER_WIDTH = 170;

function getSVG() {
  return document.getElementById('scp-svg');
}

function getPanelContainer() {
  return document.getElementById('scp-container'); 
}

function getBadge() {
  return document.getElementById('sitecues-badge');
}

function doExtraHeight(feature) {
  clearTimeout(extraHeightDelayTimerId);
  extraHeightDelayTimerId = setTimeout(function() { animateExtraHeight(feature.extraHeight); }, feature.waitBeforeExpand);
}

function animateExtraHeight(targetExtraHeight) {
  clearTimeout(extraHeightDelayTimerId);
  clearTimeout(heightAnimationTimerId);
  if (state.extraHeight === targetExtraHeight) {
    return;
  }

  if (state.extraHeight > targetExtraHeight) {
    state.wasInFeaturePanel = true; // Need to mouse back in before auto close on mouseout, otherwise can happen on any mousemove
  }
  var timeout = Math.abs(targetExtraHeight - state.extraHeight) * 2;
  state.targetExtraHeight = targetExtraHeight;
  var MS_PER_STEP = 10;
  var steps = Math.round(timeout / MS_PER_STEP);
  var delta = (targetExtraHeight - state.extraHeight) / steps;
  if (steps < 1) {
    delta *= 1/steps;
    steps = 1/steps;
  }
  function stepHeight() {
    setExtraHeight(state.extraHeight + delta);
    if (--steps > 0) {
      heightAnimationTimerId = setTimeout(stepHeight, MS_PER_STEP);
    }
  }

  stepHeight();
}

function setExtraHeight(extraHeight) {
  var height = 187 + extraHeight;
  var outlinePath = "M808 " + height + "c0 6-5 11-11 11H11 c-6 0-11-5-11-11V0c0 0 5 0 11 0h786c6 0 11 0 11 0V" + height;
  document.getElementById("scp-outline-def").setAttribute("d", outlinePath);

  var vertTransform = "translate(0," + extraHeight + ")";
  document.getElementById("scp-bottom").setAttribute("transform", vertTransform);
  document.getElementById("scp-bottom-more").setAttribute("transform", vertTransform);
  document.getElementById("scp-more-button-container").setAttribute("transform", vertTransform);

  var panelMore = document.getElementById("scp-more");
  panelMore.style.transform = panelMore.style.webkitTransform = panelMore.style.msTransform = "translateY(-" + (198 + extraHeight) + "px)";

  state.extraHeight = extraHeight;
}

function initializeButtons() {
  var clickables = document.querySelectorAll("#scp-container [role='button'], #scp-container [role='link']");
  for (var count = 0; count < clickables.length; count ++) {
    clickables[count].addEventListener('click', buttonPress, false);
  }

  // Set up more button
  var bottom = document.getElementById('scp-bottom');
  bottom.addEventListener('mouseover', showMoreButton, false);
  var bottomMore = document.getElementById('scp-bottom-more');
  bottomMore.addEventListener('mouseover', showMoreButton, false);
  var moreButtonGroup = document.getElementById('scp-more-button-group');
  moreButtonGroup.addEventListener('mouseover', showMoreButton, false);
}

function initializeMainPanel() {
  // Zoom controls
  var sliderTarget = document.getElementById('scp-zoom-slider-target');
  sliderTarget.addEventListener('mousedown', sliderMouseDown, false);
  var sliderThumb = document.getElementById('scp-zoom-slider-thumb');
  sliderThumb.addEventListener('mousedown', sliderMouseDown, false);
  var smallA = document.getElementById('scp-small-A');
  var largeA = document.getElementById('scp-large-A');
  smallA.addEventListener('mousedown', zoomButtonMouseDown, false);
  largeA.addEventListener('mousedown', zoomButtonMouseDown, false);
  smallA.addEventListener('mouseout', zoomButtonMouseOut, false);
  largeA.addEventListener('mouseout', zoomButtonMouseOut, false);
  smallA.addEventListener('mouseup', zoomButtonMouseUp, false);
  largeA.addEventListener('mouseup', zoomButtonMouseUp, false);

  // Set up speech toggle
  var speechToggle = document.getElementById('scp-speech');
  speechToggle.addEventListener('click', toggleSpeech, false);
  speechToggle.addEventListener('mouseout', function() { speechToggle.setAttribute('class',''); }, false); /* Clear hover */

  // We need to know when the user is clicking, 
  // as it affects when we show the more button, and whether to clear the visible focus
  getSVG().addEventListener('mousedown', panelMouseDown, false);
}

function initializeBadge() {
  var badge = getBadge();
  badge.addEventListener('keydown', function(evt) { 
    if (evt.keyCode === 13 || evt.keyCode === 32) showPanel(); 
  });
  badge.setAttribute('aria-label', 'sitecues zoom and speech tools'); // No longer 'loading'

  var panel = getPanelContainer();
  panel.addEventListener('keydown', panelKeyDown, false);
  panel.addEventListener('blur', clearFocus, false);
  panel.setAttribute('aria-busy', "false"); // Indicate loaded

  // Set up expand-on-hover
  var main = document.getElementById('scp-main');
  main.addEventListener('mouseover', mainMouseOver, false);
}

// sitecues is ready, ungrey the badge (show ready state)
function initialize() {
  setExtraHeight(0);

  initializeBadge();
  initializeMainPanel();
  initializeButtons();

  // Temporary: used for changing palettes, icons
  window.addEventListener('keypress', winKeyPress, false);

  state.numCards['tips'] = document.querySelectorAll(".scp-tips-content .scp-card").length;
  state.numCards['settings'] = document.querySelectorAll(".scp-settings-content .scp-card").length;

  refreshPanelView();
}

window.addEventListener('load', function() {
  setTimeout(initialize, LOAD_TIMEOUT);  // Simulate loading
});

