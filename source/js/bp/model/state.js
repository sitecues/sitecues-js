// TODO we can save a lot of bytes by setting these directly on the state object (instead of inside .data)
sitecues.def('bp/model/state', function (state, callback) {
  'use strict';

  var data = {
    currentMode             : 0,     // 0 - 1, 0 is badge, 1 is panel, anything in between means its currently transitioning
    transitionTo            : 0,     // 0 - 1, 0 is badge, 1 is panel, it cannot be anything in between (doesnt seem to make sense to transition to anything other than the badge or panel state)
    currentSecondaryPanelMode : 0,
    secondaryPanelTransitionTo: 0,
    isRealSettings          : false, // Are we currently showing the actual settings or fake settings?
    secondaryPanelName      : 'button-menu', // 'button-menu', 'tips', 'settings', 'feedback', 'about'
    isSecondaryExpanding    : false, // Is secondary panel currently expanding to accommodate new contents?
    doSuppressHovers        : false, // Suppress mouse hovers until next mousemove, because browser won't recompute them until then (useful for animations)
    isKeyboardMode          : false, // Show focus in this mode, support tab navigation
    isMoreButtonVisible     : false, // Should the more button be shown?
    isPageBadge             : true,  // Is set to false if default badge is inserted
    isToolbarBadge          : false, // Set to true if using a badge toolbar. This may eventually become redundant with isPageBadge (the opposite of it) if we only use toolbar default badges.
    wasMouseInPanel         : false, // Was the mouse inside the panel since last expansion
    featurePanelName        : null,  // Either null, or 'settings' | 'about' | 'tips' | 'feedback'
    paletteName             : 'b',   // Currently either 'b' for basic or 'r' for red
    isAdaptivePalette       : false, // Is an adaptive palette name
    settingsIconVersion     : 1,     // Which settings icon to use?
    aboutIconVersion        : 1,     // Which about icon to use?
    isShrinkingFromKeyboard : false, // Is the panel shrinking because of a keyboard command?
    ratioOfSVGToVisibleBadgeSize: undefined // ratio of svg to visible badge size
  };

  /*
  Public accessors.
   */

  /**
   * Get state model value specified by the property name given.
   * @param propName String
   * @returns {*}
   */
  state.get = function(propName) {
    if (data.hasOwnProperty(propName)) {
      return data[propName];
    }
    SC_DEV && console.log('ERROR: Cannot get property with name ' + propName + '.');
  };

  /**
   * Set state model value specified by the property name given
   * @param propName String
   * @param propValue String or Number
   */
  state.set = function(propName, propValue) {
    if (data.hasOwnProperty(propName)) {
      data[propName] = propValue;
    } else {
      SC_DEV && console.log('ERROR: Cannot set property with name ' + propName + '.');
    }
  };

  /*
  Some of the most popular getters are listed below.
   */
  state.isPanel = function() {
    return data.currentMode === 1;
  };

  state.isBadge = function() {
    return data.currentMode === 0;
  };

  state.isPanelRequested = function() {
    return data.transitionTo === 1;
  };

  state.isExpanding = function () {
    return data.transitionTo === 1 && data.currentMode !== 1;
  };

  state.isSecondaryPanel = function() {
    return data.currentSecondaryPanelMode === 1 && data.secondaryPanelTransitionTo === 1;
  };

  state.isSecondaryPanelRequested = function () {
    return data.secondaryPanelTransitionTo === 1;
  };

  state.isShrinking = function() {
    return data.transitionTo === 0 && data.currentMode !== 0;
  };

  /**
   * Returns 'button-menu' or name of secondary panel
   * @returns {string}
   */
  state.getSecondaryPanelName = function () {
    return data.secondaryPanelName;
  };

  state.getPanelName = function () {
    if (state.isPanel() && state.isSecondaryPanelRequested()) {
      return data.secondaryPanelName;
    }
    return 'main';
  };

  callback();

});
