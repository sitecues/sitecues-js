sitecues.def('bp/view/elements/feedback', function (feedback, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    var byId = helper.byId;

    function onToggle(isActive) {
      var feedbackTextarea = byId(BP_CONST.FEEDBACK_TEXTAREA),
        feedbackTextareaElement = byId(BP_CONST.FEEDBACK_TEXTAREA_ID),
        feedbackButton = byId(BP_CONST.FEEDBACK_BUTTON_ID);
      if (isActive) {
        feedbackTextarea.addEventListener('click', function () {
          feedbackTextareaElement.focus();
        });
      }
      else {
        // TODO
      }
    }

    feedback.getGeometryTargets = function(cssValues) {

      cssValues[true].menuBtnTranslateX = 674; // The feedback icon goes to the top right

      return cssValues;
    };

    sitecues.on('bp/did-toggle-feedback', onToggle);

    callback();

  });
});
