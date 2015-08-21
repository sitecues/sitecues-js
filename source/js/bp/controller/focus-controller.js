/* Focus Controller */
define(['bp/constants', 'bp/model/state', 'bp/helper'],
  function (BP_CONST, state, helper) {

  'use strict';
  var savedDocumentFocus,
    focusElement,
    isInitialized,
    byId = helper.byId,
    TABBABLE = {
      'main': [
        'zoom-slider-bar',
        'speech',
        'more-button-group'
      ],
      'button-menu': [
        'tips-button',
        'settings-button',
        'feedback-button',
        'about-button',
        'more-button-group'
      ],
      'tips':[
        'tips-button',
        '$',   // Current card contents
        'prev-card',
        'next-card',
        'more-button-group'
      ],
      'settings':[
        'settings-button',
        '$',   // Current card contents
        'prev-card',
        'next-card',
        'more-button-group'
      ],
      'feedback':[
        'feedback-button',
        'feedback-textarea',
        'stars-1',
        'stars-2',
        'stars-3',
        'stars-4',
        'stars-5',
        'feedback-send',
        'more-button-group'
      ],
      'about':[
        'about-button',
        'about-1',
        'about-2',
        'about-3',
        'more-button-group'
      ]
    };

  function getPanelContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }

  // Clear the visual focus rectangle and current focus state
  function clearPanelFocus() {

    if (focusElement) {
      focusElement.removeAttribute('data-show-focus');
      focusElement.removeAttribute('tabindex');
    }

    hideFocus();

    focusElement = null;

    getPanelContainer().removeAttribute('aria-activedescendant');

  }

  // Hide focus but keep focus state
  function hideFocus() {
    var focusShownOn = getElementToShowFocusOn();
    if (focusShownOn) {
      focusShownOn.removeAttribute('data-show-focus');
    }
    var outlineStyle = byId(BP_CONST.OUTLINE_ID).style;
    outlineStyle.display = 'none';
  }

  function updateDOMFocusState() {
    if (!focusElement) {
      return;
    }
    var panelContainer = getPanelContainer();
    panelContainer.setAttribute('aria-activedescendant', focusElement.id);
    focusElement.setAttribute('focusable', true);
    focusElement.setAttribute('tabindex', 0);

    try {
      // Allow real focus if item/browser allows it:
      // - In Firefox, for now this will only work on HTML elements
      // - In other browsers, anything with focusable/tabindex can be focused
      focusElement.focus();
    }
    catch (ex) {
      panelContainer.focus();
    }
  }

  function showFocus() {

    updateDOMFocusState();

    if (!focusElement || !state.get('isKeyboardMode')) {
      // No focus to show or not in keyboard mode
      hideFocus();
    }
    else {
      // Show focus
      if (focusElement.id === BP_CONST.MORE_BUTTON_GROUP_ID) {
        sitecues.emit('bp/did-focus-more-button');
      }

      renderFocusOutline();
    }
  }

  function init() {

    if (!isInitialized) {
      isInitialized = true;
      var mainSVG = byId(BP_CONST.SVG_ID),
        bpContainer = byId(BP_CONST.BP_CONTAINER_ID);
      mainSVG.addEventListener('mousedown', clickToFocus);
      bpContainer.addEventListener('mousedown', clickToFocus);
    }
  }

  /*
   If the badge was focused, the panel will go into focus mode when it's entered.
   In focus mode, we show the following:
   - A keyboard focus outline so the user knows where they are tabbing
   - A close button in case the user doesn't realize Escape key will close
   - The "more button" is shown immediately rather than on a timer, so that the tabbing cycle doesn't suddenly change in the middle of tabbing
   We also save the last focus so that we can restore it when the panel closes.
   */
  function beginKeyboardFocus() {

    init();

    // Save the last focus so that we can restore it when panel closes
    savedDocumentFocus = document.activeElement;

    // If the badge is focused we will turn keyboard mode on for the panel
    var isBadgeFocused = savedDocumentFocus && savedDocumentFocus.id === BP_CONST.BADGE_ID;

    clearPanelFocus();

    if (isBadgeFocused) {

      // TODO can we remove this ? It's set elsewhere. Try with a screen reader.
      //badgeElement.setAttribute('aria-expanded', 'true');

      // Turn keyboard mode on for the panel, and start focus on the first item
      state.set('isKeyboardMode', true);
      focusElement = getElementForFocusIndex(0);
    }

    // Take the focus whether or not we're in focus mode,
    // in case the user presses tab or Escape to turn on keyboard mode after expansion
    getPanelContainer().focus();
  }

  function restoreDocumentFocus() {
    // If the BP_CONTAINER has focus AND the document.body was the previous
    // focused element, blur the BP_CONTAINER focus.
    //
    // If the BP_CONTAINER has focus AND the document.body was NOT the previous
    // focused element, focus the previously focused element.
    clearPanelFocus();
    if ((!savedDocumentFocus || savedDocumentFocus === document.body) && 'blur' in document.activeElement) {
      document.activeElement.blur();
    } else {
      savedDocumentFocus.focus();
    }
  }

  focusController.getFocusedItem = function() {
    return focusElement;
  };

  function getElementToShowFocusOn() {
    if (focusElement) {
      var focusForwarder = focusElement.getAttribute('data-visible-focus-on');
      return focusForwarder ? byId(focusForwarder) : focusElement;
    }
  }

  function renderFocusOutline() {
    // @data-visible-focus-on = id of element to show focus on
    // @data-show-focus = focus to be shown on this element
    // @data-own-focus-ring = element will show it's own focus ring

    var showFocusOn = getElementToShowFocusOn(focusElement);

    showFocusOn.setAttribute('data-show-focus', '');
    if (!showFocusOn.hasAttribute('data-own-focus-ring')) {
      // Show focus outline
      var EXTRA_FOCUS_PADDING = 1,
        clientFocusRect = helper.getRect(showFocusOn),
        clientPanelRect = helper.getRect(getPanelContainer()),  // Focus rect is positioned relative to this
        focusOutlineStyle = byId(BP_CONST.OUTLINE_ID).style;

      focusOutlineStyle.display = 'block';
      focusOutlineStyle.width = (clientFocusRect.width + 2 * EXTRA_FOCUS_PADDING) + 'px';
      focusOutlineStyle.height = (clientFocusRect.height + 2 * EXTRA_FOCUS_PADDING) + 'px';

      focusOutlineStyle.top = (clientFocusRect.top - EXTRA_FOCUS_PADDING - clientPanelRect.top) + 'px';
      focusOutlineStyle.left = (clientFocusRect.left - EXTRA_FOCUS_PADDING - clientPanelRect.left) + 'px';
    }
  }

  function getAllTabbableItemsInActiveCard () {
    return document.querySelectorAll('#scp-' + state.getPanelName() + ' > .scp-active .scp-tabbable:not([data-show="false"])');
  }

  function getAdjacentTabbableItem (all, current, direction) {
    for (var i = 0, l = all.length; i < l; i++) {
      if (all[i] === current) {
        return all[i + direction];
      }
    }
  }

  function getFirstOrLastTabbableItem(all, direction) {
    // First or last dynamic tabbable item.
    return all[direction > 0 ? 0 : all.length - 1];
  }

  function navigateInCard(direction, isFirstTimeInCard, currentItem) {
    // All items in the active card.
    var tabbableItemsInActiveCard = getAllTabbableItemsInActiveCard();

    // If there are none, skip to the next item.
    // The item adjacent to the current focused item, depending on what direction user tabs.
    return isFirstTimeInCard ?
      getFirstOrLastTabbableItem(tabbableItemsInActiveCard, direction) :
      getAdjacentTabbableItem(tabbableItemsInActiveCard, currentItem, direction);
  }

  function isFocusable(elem) {
    return elem &&
      elem.getAttribute('aria-disabled') !== 'true' &&
      parseFloat(getComputedStyle(elem).opacity) > 0;
  }

  focusController.navigateInDirection = function(direction) {

    if (!state.isPanel()) {
      return;
    }

    hideFocus();

    var tabbable = getTabbableItems(),
      focusIndex = getFocusIndexForElement(focusElement),
      isFirstTimeInCard = tabbable[focusIndex] !== '$',
      numItems = tabbable.length,
      nextItem;

    while (true) {
      nextItem = null;
      if (tabbable[focusIndex] === '$') {
        nextItem = navigateInCard(direction, isFirstTimeInCard, focusElement);
      }
      if (!nextItem) {
        focusIndex = focusIndex + direction;
        if (focusIndex < 0) {
          // If shift+tab from the first item, go to the last
          focusIndex = numItems - 1;
        } else if (focusIndex >= numItems) {
          // If tab past the last item, go to the first
          focusIndex = 0;
        }

        nextItem = getElementForFocusIndex(focusIndex);
      }

      focusElement = nextItem;

      // Skip disabled items such as the prev arrow which is turned off at first
      if (isFocusable(nextItem)) {
        break;
      }
    }

    showFocus();
  };

  function getTabbableItems() {
    return TABBABLE[state.getPanelName()];
  }

  function getElementForFocusIndex(focusIndex) {
    return byId('scp-' + getTabbableItems()[focusIndex]);
  }

  function isTabbableCardItem(elem) {
    var className = elem.getAttribute('class');
    return className && className.indexOf('scp-tabbable') >= 0;
  }

  function getFocusIndexForElement(elem) {
    // Remove scp- from id and find new index
    if (elem) {
      var tabbable = getTabbableItems(),
        focusIndex = tabbable.indexOf(elem.id.substr(4));
      // If can't find the element in the tabbable items, it means it's in card content
      if (focusIndex < 0 && isTabbableCardItem(elem)) {
        // Not one of the main focused items listed in TABBABLE, try to see if it's a focusable card item
        focusIndex = tabbable.indexOf('$');
      }
      return focusIndex;
    }

    return -1;
  }

  function clickToFocus(event) {
    var target = state.isPanel() && helper.getEventTarget(event);
    clearPanelFocus();
    while (target && target.id !== BP_CONST.BADGE_ID && target.id !== BP_CONST.BP_CONTAINER_ID) {
      var ariaControls = target.getAttribute('aria-controls');
      if (ariaControls) {
        // Clicking slider thumb should focus slider bar
        target = byId(ariaControls);
      }
      if (getFocusIndexForElement(target) >= 0) {
        focusElement = target;
        break;
      }
      target = target.parentElement;
    }

    if (focusElement) {
      showFocus();
    }
    else {
      // Clicked in whitespace, on collapsed badge or somewhere that can't take focus
      // Prevent default handling and thus prevent focus
      // User may think they need to click in badge
      // We don't want to take focus that way -- only via tabbing or from screen reader use
      return helper.cancelEvent(event);
    }
  }

  sitecues.on('bp/will-toggle-feature bp/did-activate-link bp/do-send-feedback', hideFocus);
  sitecues.on('bp/will-expand', beginKeyboardFocus);
  sitecues.on('bp/will-shrink', restoreDocumentFocus);
  sitecues.on('bp/did-expand', showFocus);

});