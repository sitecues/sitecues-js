define(['run/bp/constants', 'run/bp/model/state'], function(BP_CONST, state) {

  /**
   *** Getters ***
   */

  // These classes add styles based on the current state of the panel
  function getViewClasses() {

    var classBuilder = '',
      isSecondary = state.isSecondaryPanelRequested(); // Is or will be secondary panel

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
    classBuilder += ' ' + BP_CONST.WANT_PANEL + (isSecondary ? ' scp-want-secondary' : ' ' + BP_CONST.MAIN_ID);

    if (state.get('isKeyboardMode')) {
      // *** scp-keyboard ***
      // Keyboard mode is enabled and therefore current focus outline must be visible
      classBuilder += ' scp-keyboard';
    }

    classBuilder += ' scp-classic-' + state.get('isClassicMode');

    return classBuilder + getSecondaryPanelClasses();
  }

  /*
   A feature panel is a special panel that is triggered from the secondary panel. It can be one of four things right now:
   Settings
   Tips
   Feedback
   About

   These can only be shown when the panel is large.
   */

  // TODO Ideally this belongs in the bp-secondary/ folder only if isSecondaryPanel, but since require() is async it wouldn't really be worth it
  function getSecondaryPanelClasses() {
    var panelName = state.getSecondaryPanelName(),
      className =' scp-panel-' + panelName;
    if (state.get('isSecondaryPanel')) {
      className += ' scp-is-secondary';
      if (state.get('isFeedbackSent')) {
        className += ' scp-feedback-sent';
      }
    }
    if (state.get('isSecondaryExpanding')) {
      className  += ' scp-secondary-expanding';  // Growing in visual height
    }

    return className;
  }

  return {
    getViewClasses: getViewClasses
  };

});
