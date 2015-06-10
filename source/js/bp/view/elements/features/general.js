/**
 * General code for features panels.
 * We need to put more stuff in here.
 */

sitecues.def('bp/view/elements/general-features', function (generalFeatures, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {
    var ALL_PANELS = [
      BP_CONST.FEEDBACK_TEXTAREA,
      BP_CONST.ABOUT_CONTENT_ID,
      BP_CONST.SETTINGS_CARDS_ID,
      BP_CONST.TIPS_CARDS_ID
    ];

    generalFeatures.clearCurrentPanel = function() {
      ALL_PANELS.forEach(function(id) { helper.byId(id).removeAttribute('data-current'); });
    };

    generalFeatures.setCurrentPanel = function(id) {
      generalFeatures.clearCurrentPanel();
      var panel = helper.byId(id);

      panel.setAttribute('data-current', '');
    };

    callback();

  });
});
