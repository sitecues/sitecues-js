/**
 * Badge, toolbar and panel base view
 */
define([
  'core/bp/constants',
  'core/bp/model/state'
], function(BP_CONST,
            state) {

  /**
   *** Public ***
   */

  function getViewClasses() {

    var classBuilder = BP_CONST.WANT_BADGE;

    if (state.isBadge()) {
      classBuilder += ' ' + BP_CONST.IS_BADGE;
    }

    if (!SC_EXTENSION) {
      if (state.get('isRealSettings')) {
        // *** scp-realsettings ***
        // Show the real settings for the badge (not the fake ones)
        // Why it's used:
        // The initial badge is easier-to-see, more attractive and more inviting when speech is on and zoom is
        // somewhere in the middle. Therefore the initial badge uses fake settings.
        // However, once the user has ever expanded the badge or used sitecues we show the real settings.
        classBuilder += ' scp-realsettings';
      }
    }

    classBuilder += ' scp-palette' + state.get('paletteKey');

    return classBuilder;
  }

  return {
    getViewClasses: getViewClasses
  };

});
