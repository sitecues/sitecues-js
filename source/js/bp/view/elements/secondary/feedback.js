sitecues.def('bp/view/elements/feedback', function (feedback, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    var byId = helper.byId,
      isFocusInitialized;

    function getFeedbackArea() {
      return byId(BP_CONST.FEEDBACK_TEXTAREA);
    }

    function getFeedbackInputRect() {
      return byId(BP_CONST.FEEDBACK_INPUT_RECT);
    }

    function onBadgeExpand() {
      autoSizeTextarea();
      initFocus();
    }

    function autoSizeTextarea() {
      var feedbackTextareaStyle = getFeedbackArea().style,
        feedbackInputRect = getFeedbackInputRect().getBoundingClientRect();

      feedbackTextareaStyle.width = feedbackInputRect.width + 'px';
      feedbackTextareaStyle.height = feedbackInputRect.height + 'px';
    }

    function initFocus() {
      if (!isFocusInitialized) {
        isFocusInitialized = true;
        getFeedbackArea().addEventListener('focus', onFocus);
        getFeedbackArea().addEventListener('blur', onBlur);
      }
    }

    function onFocus() {
      getFeedbackInputRect().setAttribute('class', 'scp-focus');
    }

    function onBlur() {
      getFeedbackInputRect().removeAttribute('class');
    }

    feedback.getGeometryTargets = function(cssValues) {

      cssValues[true].menuBtnTranslateX = 674; // The feedback icon goes to the top right

      return cssValues;
    };

    sitecues.on('bp/did-expand', onBadgeExpand);

    callback();

  });
});
