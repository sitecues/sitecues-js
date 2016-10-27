define([
  'run/bp/constants',
  'bp-secondary/tips',
  'bp-secondary/settings',
  'bp-secondary/feedback',
  'bp-secondary/about',
  'bp-secondary/cards'
], function(BP_CONST,
              tips,
              settings,
              feedback,
              about,
              cards) {

  var featureDefs = {
    tips: {
      module: tips,
        menuButtonId: BP_CONST.TIPS_BUTTON_ID,
        labelId: BP_CONST.TIPS_LABEL_ID,
        panelId: BP_CONST.TIPS_CONTENT_ID
    },
    settings: {
      module: settings,
        menuButtonId: BP_CONST.SETTINGS_BUTTON_ID,
        labelId: BP_CONST.SETTINGS_LABEL_ID,
        panelId: BP_CONST.SETTINGS_CONTENT_ID
    },
    feedback: {
      module: feedback,
        menuButtonId: BP_CONST.FEEDBACK_BUTTON_ID,
        labelId: BP_CONST.FEEDBACK_LABEL_ID,
        panelId: BP_CONST.FEEDBACK_CONTENT_ID
    },
    about: {
      module: about,
        menuButtonId: BP_CONST.ABOUT_BUTTON_ID,
        menuButtonHelperId: BP_CONST.ABOUT_ROTATE_HELPER_ID,
        animatedImageId: BP_CONST.ABOUT_CONTENT_IMAGE_ID,
        labelId: BP_CONST.ABOUT_LABEL_ID,
        panelId: BP_CONST.ABOUT_CONTENT_ID,
        heightAnimationDelay: 1200
    }
  };

  function init() {
    about.init();
    feedback.init();
    settings.init();
    tips.init();
    cards.init();
  }

  return {
    featureDefs: featureDefs,
    init: init
  };
});
