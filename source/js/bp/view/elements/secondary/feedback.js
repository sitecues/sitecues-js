define(['bp/constants', 'bp/helper', 'bp/model/state', 'util/platform'], function (BP_CONST, helper, state, platform) {
  var byId = helper.byId,
    isActive = false,
    isInitialized,
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
      feedbackInputRect = getFeedbackInputRect().getBoundingClientRect();

    feedbackTextareaStyle.width = feedbackInputRect.width + 'px';
    feedbackTextareaStyle.height = feedbackInputRect.height + 'px';
    // Hide scrollbar in IE
    if (platform.browser.isIE) {
      feedbackTextareaStyle.clip = 'rect(0,' + (feedbackInputRect.width - 20) + 'px,' + feedbackTextareaStyle.height + ',0)';
    }
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
      sitecues.emit('bp/do-send-feedback', getFeedbackText(), currRating);
      toggleSendEnabled(false); // Disable feedback button after sent, so that feedback isn't accidentally clicked twice
      var bpContainer = getBPContainer();
      bpContainer.className += bpContainer.className + ' scp-feedback-sent';
    }
  }

  function getGeometryTargets(cssValues) {

    cssValues[true].menuBtnTranslateX = 674; // The feedback icon goes to the top right
    return cssValues;
  }

  function init() {
    if (!isInitialized) {
      isInitialized = true;
      autoSizeTextarea();
      sitecues.on('bp/did-change', onPanelUpdate);
    }
  }

  var publics = {
    getGeometryTargets: getGeometryTargets,
    init: init
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
