define(
  [
    'run/bp/constants',
    'run/bp/helper',
    'run/bp/model/state',
    'run/metric/metric',
    'run/bp/view/view',
    'run/events',
    'mini-core/native-global',
    'run/inline-style/inline-style'
  ],
  function (
    BP_CONST,
    helper,
    state,
    metric,
    view,
    events,
    nativeGlobal,
    inlineStyle
  ) {
  'use strict';

  var byId = helper.byId,
    isActive = false,
    isInitialized,
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
    return byId(BP_CONST.FEEDBACK_SEND_BUTTON);
  }

  // Child of button: handles clicks
  function getFeedbackSendLink() {
    return byId(BP_CONST.FEEDBACK_SEND_LINK);
  }

  function getBPContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }

  function autoSizeTextarea() {
    var feedbackTextarea = getFeedbackArea(),
      feedbackInputRect = getFeedbackInputRect().getBoundingClientRect(),
      scale = state.get('scale'),
      ROOM_FOR_ROUNDED_OUTLINE = 22,
      ROOM_FOR_SCROLLBAR = 20,  // Scrollbar will be hidden via css clip
      width = (feedbackInputRect.width - ROOM_FOR_ROUNDED_OUTLINE) / scale,
      height = (feedbackInputRect.height - ROOM_FOR_ROUNDED_OUTLINE) / scale;

    inlineStyle.set(feedbackTextarea, {
      width  : width + 'px',
      height : height + 'px',
      // Hide scrollbar by clipping horizontally - don't clip vertically (just large height of 999px for that)
      clip   : 'rect(0,' + (width - ROOM_FOR_SCROLLBAR) + 'px,999px,0)'
    });
  }

  function onPanelUpdate() {
    var willBeActive = state.getSecondaryPanelName() === 'feedback',
      addOrRemoveFn = willBeActive ? 'addEventListener' : 'removeEventListener';

    if (isActive !== willBeActive) {
      getFeedbackArea()[addOrRemoveFn]('keyup', updateSendButton);
      getRating()[addOrRemoveFn]('click', onRatingClick);

      if (!SC_LOCAL) {
        getFeedbackSendLink()[addOrRemoveFn]('click', onSendFeedbackClick);
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
        state.set('isFeedbackSent', false);
      }
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
      currentStatusText = nativeGlobal.JSON.stringify(currentStatus, null, '    ');
    return getFeedbackText() + STATUS_PREFIX + currentStatusText;
  }

  function getCurrentRatingText() {
    var ratingElem = getRating();
    return ratingElem.getAttribute('aria-label');
  }

  // Need to use mailto link instead of xhr in local (e.g. extension) mode
  function updateMailtoLink() {
    if (SC_LOCAL) {
      var sendButton = getFeedbackSendLink(),
        mailto = sendButton.getAttribute('data-mailto') +
          '?subject=' + encodeURIComponent(getCurrentRatingText()) +
          '&body=' + encodeURIComponent(getFeedbackTextToSend());

      sendButton.setAttribute('href', mailto);
    }
  }

  function updateSendButton() {
    updateMailtoLink();
    var isEnabled = getFeedbackText().length > 0 || currentRating > 0;
    toggleSendEnabled(isEnabled);
  }

  function toggleSendEnabled(doEnable) {
    // We do both a fake button and a link child -- the link is for the mailto: we do in the extension
    getFeedbackSendButton().setAttribute('aria-disabled', !doEnable);
    getFeedbackSendLink().setAttribute('aria-disabled', !doEnable);
  }

  function isSendEnabled() {
    return getFeedbackSendButton().getAttribute('aria-disabled') !== 'true';
  }

  function onSendFeedbackClick() {
    if (isSendEnabled()) {
      var details = {
        feedbackText: getFeedbackTextToSend(),
        rating: currentRating,  // 0 = no rating, otherwise 1-5 stars
        statusText: nativeGlobal.JSON.stringify(currentStatus)
      };

      if (SC_DEV) {
        console.log('Sending feedback: %o', details);
      }
      new metric.Feedback(details).send();

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
      events.on('bp/did-open-subpanel', onPanelUpdate);

      events.on('bp/will-show-secondary-feature', function(name) {
        if (name === 'feedback') {
          autoSizeTextarea();
        }
      });

    }
  }

  return {
    getGeometryTargets: getGeometryTargets,
    init: init
  };

});
