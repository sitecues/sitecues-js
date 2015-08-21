define(['bp/bp', 'bp/constants', 'bp/model/state'], function(bp, BP_CONST, state) {

  'use strict';

  /**
   *** Getters ***
   */

  // These classes add styles based on the current state of the panel.
  panel.getViewClasses = function() {

    var classBuilder = '';  // Allow animations for growing or shrinking panel

    // Choose the 'settings' icon look (we can probably remove this choice after we settle one)
    classBuilder += ' scp-btn-choice-settings' + state.get('settingsIconVersion');

    // Choose the 'about' icon look (we can probably remove this choice after we settle one)
    classBuilder += ' scp-btn-choice-about' + state.get('aboutIconVersion');

    // In enlarged view we always show the real settings.
    // See badge.js for more about real vs fake settings.
    classBuilder += ' scp-realsettings';

    if (state.isPanel()) {
      // *** scp-panel ***
      // The panel is fully enlarged and ready to accept mouse input
      classBuilder += ' ' + BP_CONST.IS_PANEL;
    }

    // *** scp-want-panel ***
    // Sets larger panel sizes on everything.
    // It can take time to take effect because of the animation properties.
    classBuilder += ' ' + BP_CONST.WANT_PANEL + (state.isSecondaryPanelRequested() ? ' ' + BP_CONST.MORE_ID : ' ' + BP_CONST.MAIN_ID);

    if (state.get('isKeyboardMode')) {
      // *** scp-keyboard ***
      // Keyboard mode is enabled and therefore current focus outline must be visible
      classBuilder += ' scp-keyboard';
    }

    return classBuilder + getSecondaryPanelClasses();
  };

  /*
   A feature panel is a special panel that is triggered from the secondary panel. It can be one of four things right now:
   Settings
   Tips
   Feedback
   About

   These can only be shown when the panel is large.
   */

  function getSecondaryPanelClasses() {
    var panelName = state.getSecondaryPanelName(),
      className =' scp-panel-' + panelName;
    if (state.isSecondaryPanelRequested()) {
      className += ' scp-is-secondary';
    }
    if (state.get('isSecondaryExpanding')) {
      className += ' scp-secondary-expanding';  // Growing in visual height
    }

    return className;
  }

});