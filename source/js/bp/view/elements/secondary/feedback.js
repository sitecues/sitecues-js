sitecues.def('bp/view/elements/feedback', function (feedback, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', 'bp/model/state', function (BP_CONST, helper, state) {

    var byId = helper.byId,
      isActive = false,
      currRating = 0;  // Zero = no rating defined

    function getFeedbackArea() {
      return byId(BP_CONST.FEEDBACK_TEXTAREA);
    }

    function getFeedbackInputRect() {
      return byId(BP_CONST.FEEDBACK_INPUT_RECT);
    }

    function getRating() {
      return byId(BP_CONST.RATING);
    }

    function getFeedbackSend() {
      return byId(BP_CONST.FEEDBACK_SEND);
    }

    function autoSizeTextarea() {
      var feedbackTextareaStyle = getFeedbackArea().style,
        feedbackInputRect = getFeedbackInputRect().getBoundingClientRect();

      feedbackTextareaStyle.width = feedbackInputRect.width + 'px';
      feedbackTextareaStyle.height = feedbackInputRect.height + 'px';
    }

    function onPanelUpdate() {
      var willBeActive = state.getSecondaryPanelName() === 'feedback',
        addOrRemoveFn = willBeActive ? 'addEventListener' : 'removeEventListener';

      if (isActive !== willBeActive) {
        getFeedbackArea()[addOrRemoveFn]('focus', onFocus);
        getFeedbackArea()[addOrRemoveFn]('blur', onBlur);
        getFeedbackArea()[addOrRemoveFn]('keyup', enableSendIfText);
        getRating()[addOrRemoveFn]('click', onRatingClick);
        getFeedbackSend()[addOrRemoveFn]('click', onSendFeedbackClick);
      }

      isActive = willBeActive;
    }

    function onRatingClick(evt) {
      var stars = getRating().children,
        index = stars.length,
        targetStar = evt.target,
        star;

      while (index --) {
        star = stars[index];
        if (star === targetStar) {
          currRating = index + 1;
        }

        star.setAttribute('data-selected', currRating > 0);
      }

      toggleSendEnabled(true);
    }

    function getFeedbackText() {
      return getFeedbackArea().value;
    }

    function enableSendIfText() {
      if (getFeedbackText().length) {
        toggleSendEnabled(true);
      }
    }

    function toggleSendEnabled(doEnable) {
      getFeedbackSend().setAttribute('aria-disabled', !doEnable);
    }

    function isSendEnabled() {
      return getFeedbackSend().getAttribute('aria-disabled') !== 'true';
    }

    function onSendFeedbackClick() {
      if (isSendEnabled()) {
        sitecues.emit('feedback/do-send', getFeedbackText(), currRating);
        toggleSendEnabled(false); // Disable feedback button after sent, so that feedback isn't accidentally clicked twice
        var bpContainer = byId(BP_CONST.BP_CONTAINER_ID);
        bpContainer.className += bpContainer.className + ' scp-feedback-sent';
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
      cssValues[true].focusOutlineTranslateX = 130;
      cssValues[false].focusOutlineTranslateX = -136;
      return cssValues;
    };

    sitecues.on('bp/did-expand', autoSizeTextarea);

    sitecues.on('bp/do-update', onPanelUpdate);

    callback();

  });
});
