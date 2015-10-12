define(['bp/constants', 'bp/helper', 'bp/model/state', 'core/platform', 'core/metric'],
  function (BP_CONST, helper, state, platform, metric) {
  var byId = helper.byId,
    isActive = false,
    isInitialized,
    isAutoSized,
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
    // Hide scrollbar in IE
    if (platform.browser.isIE) {
      feedbackTextareaStyle.clip = 'rect(0,' + (width - 20) + 'px,' + height + ',0)';
    }
  }

  function onPanelUpdate() {
    var willBeActive = state.getSecondaryPanelName() === 'feedback',
      addOrRemoveFn = willBeActive ? 'addEventListener' : 'removeEventListener';

    if (isActive !== willBeActive) {
      getFeedbackArea()[addOrRemoveFn]('keyup', enableSendIfText);
      getRating()[addOrRemoveFn]('click', onRatingClick);
      getFeedbackSend()[addOrRemoveFn]('click', onSendFeedbackClick);

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
    // TODO breaking in IE9!! Object doesn't support getAttribute()
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
      metric('feedback-sent', {
        feedbackText: getFeedbackText(),
        rating: currRating  // 0 = no rating, otherwise 1-5 stars
      });
      toggleSendEnabled(false); // Disable feedback button after sent, so that feedback isn't accidentally clicked twice
      state.set('isFeedbackSent', true);
      sitecues.emit('bp/did-change', false, true);
    }
  }

  function getGeometryTargets(cssValues) {

    return cssValues;
  }

  function init() {
    if (!isInitialized) {
      isInitialized = true;
      sitecues.on('bp/did-change', onPanelUpdate);
    }
  }

  return {
    getGeometryTargets: getGeometryTargets,
    init: init
  };

});
