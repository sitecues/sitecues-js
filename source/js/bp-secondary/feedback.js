define(['core/bp/constants', 'core/bp/helper', 'core/bp/model/state', 'core/platform', 'core/metric', 'core/bp/view/view' ],
  function (BP_CONST, helper, state, platform, metric, view) {
  var byId = helper.byId,
    isActive = false,
    isInitialized,
    isAutoSized,
    currentRating = 0,  // Zero = no rating defined
    currentStatus;

  function getFeedbackArea() {
    return byId(BP_CONST.FEEDBACK_TEXTAREA);
  }

  function getFeedbackInputRect() {
    return byId(BP_CONST.FEEDBACK_INPUT_RECT);
  }

  function getRating() {
    return byId(BP_CONST.RATING);
  }

  function getFeedbackSendButton() {
    return byId(BP_CONST.FEEDBACK_SEND);
  }

  function getBPContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }

  function autoSizeTextarea() {
    var feedbackTextareaStyle = getFeedbackArea().style,
      feedbackInputRect = getFeedbackInputRect().getBoundingClientRect(),
      scale = state.get('scale'),
      ROOM_FOR_ROUNDED_OUTLINE = 22,
      width = (feedbackInputRect.width - ROOM_FOR_ROUNDED_OUTLINE) / scale,
      height = (feedbackInputRect.height - ROOM_FOR_ROUNDED_OUTLINE) / scale;

    feedbackTextareaStyle.width = width + 'px';
    feedbackTextareaStyle.height = height + 'px';
    // Hide scrollbar by clipping horizontally - don't clip vertically (just large height of 999px for that)
    feedbackTextareaStyle.clip = 'rect(0,' + (width - 20) + 'px,999px,0)';
  }

  function onPanelUpdate() {
    var willBeActive = state.getSecondaryPanelName() === 'feedback',
      addOrRemoveFn = willBeActive ? 'addEventListener' : 'removeEventListener';

    if (isActive !== willBeActive) {
      getFeedbackArea()[addOrRemoveFn]('keyup', updateSendButton);
      getRating()[addOrRemoveFn]('click', onRatingClick);

      if (!SC_LOCAL) {
        getFeedbackSendButton()[addOrRemoveFn]('click', onSendFeedbackClick);
      }

      if (willBeActive) {
        require(['status/status'], function(status) {
          status(function(statusObj) {
            currentStatus = statusObj;
          });
        });
      }
      else {
        currentStatus = null;
      }

      if (willBeActive && !isAutoSized) {
        autoSizeTextarea();
        isAutoSized = true;
      }
    }

    if (!willBeActive) {
      state.set('isFeedbackSent', false);
    }

    isActive = willBeActive;
  }

  function onRatingClick(evt) {
    var ratingElem = getRating(),
      stars = getBPContainer().getElementsByClassName(BP_CONST.RATING_STAR_CLASS), // svgElem.children not supported in IE
      index = stars.length,
      targetStar = helper.getEventTarget(evt),
      star;

    currentRating = 0;

    while (index --) {
      star = stars[index];
      if (star === targetStar) {
        currentRating = index + 1;
      }

      star.setAttribute('aria-pressed', currentRating > 0);
    }

    // Copy current rating to group
    // TODO need to test usability of ratings with screen reader
    // TODO breaking in IE9!! Object doesn't support getAttribute()
    ratingElem.setAttribute('aria-label', targetStar.getAttribute('aria-label'));

    updateMailtoLink();
    toggleSendEnabled(true);
  }

  function getFeedbackText() {
    return getFeedbackArea().value;
  }

  // User's feedback text + status text
  function getFeedbackTextToSend() {
    if (!SC_LOCAL || !currentStatus) {
      return getFeedbackText();
    }

    // Add status text to mail messages because we don't have a metrics details field in that case.
    // Prepend blank lines so that status is on next screen of mail message in order not to confuse the user.
    var NUM_NEWLINES = 99,
      STATUS_PREFIX = Array(NUM_NEWLINES).join('\n') + '---- User configuration: ----\n\n',
      currentStatusText = JSON.stringify(currentStatus, null, '    ');
    return getFeedbackText() + STATUS_PREFIX + currentStatusText;
  }

  function getCurrentRatingText() {
    var ratingElem = getRating();
    return ratingElem.getAttribute('aria-label');
  }

  // Need to use mailto link instead of xhr in local (e.g. extension) mode
  function updateMailtoLink() {
    if (SC_LOCAL) {
      var sendButton = getFeedbackSendButton(),
        mailto = sendButton.getAttribute('data-mailto') +
          '?subject=' + encodeURIComponent(getCurrentRatingText()) +
          '&body=' + encodeURIComponent(getFeedbackTextToSend());

      sendButton.setAttribute('href', mailto);
    }
  }

  function updateSendButton() {
    updateMailtoLink();
    if (getFeedbackText().length) {
      toggleSendEnabled(true);
    }
  }

  function toggleSendEnabled(doEnable) {
    getFeedbackSendButton().setAttribute('aria-disabled', !doEnable);
  }

  function isSendEnabled() {
    return getFeedbackSendButton().getAttribute('aria-disabled') !== 'true';
  }

  function onSendFeedbackClick() {
    if (isSendEnabled()) {
      var details = {
        feedbackText: getFeedbackTextToSend(),
        rating: currentRating,  // 0 = no rating, otherwise 1-5 stars
        status: currentStatus
      };
      metric('feedback-sent', details);
      toggleSendEnabled(false); // Disable feedback button after sent, so that feedback isn't accidentally clicked twice
      state.set('isFeedbackSent', true);
      view.update(true);
    }
  }

  function getGeometryTargets(cssValues) {

    return cssValues;
  }

  function init() {
    if (!isInitialized) {
      isInitialized = true;
      sitecues.on('bp/did-open-subpanel', onPanelUpdate);
    }
  }

  return {
    getGeometryTargets: getGeometryTargets,
    init: init
  };

});
