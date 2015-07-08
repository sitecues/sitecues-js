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
        getFeedbackArea()[addOrRemoveFn]('keyup', enableSendIfText);
        getRating()[addOrRemoveFn]('click', onRatingClick);
        getFeedbackSend()[addOrRemoveFn]('click', onSendFeedbackClick);
      }

      isActive = willBeActive;
    }

    function onRatingClick(evt) {
      var ratingElem = getRating(),
        stars = ratingElem.children,
        index = stars.length,
        targetStar = evt.target,
        star;

      currRating = 0;

      while (index --) {
        star = stars[index];
        if (star === targetStar) {
          currRating = index + 1;
        }

        star.setAttribute('aria-pressed', currRating > 0);
      }

      // Copy current rating to group
      // TODO need to test usability of ratings with screen reader
      ratingElem.setAttribute('aria-label', targetStar.getAttribute('aria-label'));

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
        sitecues.emit('bp/do-send-feedback', getFeedbackText(), currRating);
        toggleSendEnabled(false); // Disable feedback button after sent, so that feedback isn't accidentally clicked twice
        var bpContainer = byId(BP_CONST.BP_CONTAINER_ID);
        bpContainer.className += bpContainer.className + ' scp-feedback-sent';
      }
    }

    feedback.getGeometryTargets = function(cssValues) {

      cssValues[true].menuBtnTranslateX = 674; // The feedback icon goes to the top right
      return cssValues;
    };

    sitecues.on('bp/did-expand', autoSizeTextarea);

    sitecues.on('bp/do-update', onPanelUpdate);

    callback();

  });
});
