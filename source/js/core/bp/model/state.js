// TODO we can save a lot of bytes by setting these directly on the state object (instead of inside .data)
define([], function() {
  var data = {
    currentMode             : 0,     // 0 - 1, 0 is badge, 1 is panel, anything in between means its currently transitioning
    transitionTo            : 0,     // 0 or 1, 0 is badge, 1 is panel, it cannot be anything in between (doesn't seem to make sense to transition to anything other than the badge or panel state)
    isSecondaryPanel        : false,  // Are we currently in the secondary panel
    secondaryPanelTransitionTo: 0,
    scale                   : 1, // How much transform scale used on expanded BP
    isRealSettings          : true, // Are we currently showing the actual settings or fake settings?
    isFirstBadgeUse         : true, // Is this a first time user?
    secondaryPanelName      : 'button-menu', // 'button-menu', 'tips', 'settings', 'feedback', 'about'
    isSecondaryExpanding    : false, // Is secondary panel currently expanding to accommodate new contents?
    isSecondaryExpanded     : false, // Is secondary panel fully expanded?
    isStickyPanel           : false, // Sticky panel is for debugging -- mouseout doesn't close the panel
    isClassicMode           : false, // Use question mark if browser support is weak or site is incompatible with themes
    doSuppressHovers        : false, // Suppress mouse hovers until next mousemove, because browser won't recompute them until then (useful for animations)
    isKeyboardMode          : false, // Show focus in this mode, support tab navigation
    isOpenedWithScreenReader: false, // If opened with screen reader, be careful of spurious click events outside panel
    isMoreButtonVisible     : false, // Should the more button be shown?
    isPageBadge             : true,  // Is set to false if default badge is inserted
    isToolbarBadge          : false, // Set to true if using a badge toolbar. This may eventually become redundant with isPageBadge (the opposite of it) if we only use toolbar default badges.
    wasMouseInPanel         : false, // Was the mouse inside the panel since last expansion
    paletteKey              : '',    // Current palette See BP_CONST.PALETTE_NAME_MAP for possible keys.
    defaultPaletteKey       : '',    // Palette to use if sitecues theme determines that default palette should be used based on the background behind the badge.
    isAdaptivePalette       : false, // Is an adaptive palette name
    isShrinkingFromKeyboard : false, // Is the panel shrinking because of a keyboard command?
    isFeedbackSent          : false, // Is the feedback sent?
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
  function get(propName) {
    if (data.hasOwnProperty(propName)) {
      return data[propName];
    }
    if (SC_DEV) { console.log('ERROR: Cannot get property with name ' + propName + '.'); }
  }

  /**
   * Set state model value specified by the property name given
   * @param propName String
   * @param propValue String or Number
   */
  function set(propName, propValue) {
    if (data.hasOwnProperty(propName)) {
      data[propName] = propValue;
    } else {
      if (SC_DEV) { console.log('ERROR: Cannot set property with name ' + propName + '.'); }
    }
  }

  /*
  Some of the most popular getters are listed below.
   */
  function isPanel() {
    return data.currentMode === 1;
  }

  function isBadge() {
    return data.currentMode === 0;
  }

  function isPanelRequested() {
    return data.transitionTo === 1;
  }

  function isExpanding() {
    return data.transitionTo === 1 && data.currentMode !== 1;
  }

  function isSecondaryPanelRequested() {
    return data.secondaryPanelTransitionTo === 1;
  }

  function isSecondaryFeaturePanel() {
    var panelName = getSecondaryPanelName();
    return panelName && panelName !== 'button-menu';
  }

  function isShrinking() {
    return data.transitionTo === 0 && data.currentMode !== 0;
  }

  /**
   * Returns 'button-menu' or name of secondary panel
   * @returns {string}
   */
  function getSecondaryPanelName() {
    return data.secondaryPanelName;
  }

  function getPanelName() {
    if (isPanel() && isSecondaryPanelRequested()) {
      return data.secondaryPanelName;
    }
    return 'main';
  }

  function isButtonMenu() {
    return isPanel() && data.secondaryPanelName === 'button-menu';
  }

  function turnOnRealSettings() {
    set('isRealSettings', true);    // Always use real settings once expanded
  }

  return {
    get: get,
    set: set,
    isPanel: isPanel,
    isBadge: isBadge,
    isPanelRequested: isPanelRequested,
    isExpanding: isExpanding,
    isSecondaryPanelRequested: isSecondaryPanelRequested,
    isSecondaryFeaturePanel: isSecondaryFeaturePanel,
    isShrinking: isShrinking,
    getSecondaryPanelName: getSecondaryPanelName,
    isButtonMenu: isButtonMenu,
    turnOnRealSettings: turnOnRealSettings,
    getPanelName: getPanelName
  };

});
