sitecues.def('bp/view/elements/feedback', function (feedback, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    var byId = helper.byId;

    function onToggle(isActive) {
      var feedbackTextarea = byId(BP_CONST.FEEDBACK_TEXTAREA),
        feedbackTextareaElement = byId(BP_CONST.FEEDBACK_TEXTAREA_ID),
        feedbackButton = byId(BP_CONST.FEEDBACK_BUTTON_ID);
      sitecues.emit('bp/do-toggle-button', feedbackButton, isActive);
      if (isActive) {
        feedbackTextarea.addEventListener('click', function () {
          feedbackTextareaElement.focus();
        });
      }
      else {
        // TODO
      }
    }

    feedback.extendCssValues = function(baseCssValues) {
      return baseCssValues;
    };


    sitecues.on('bp/did-toggle-feedback', onToggle);

    callback();

  });
});
