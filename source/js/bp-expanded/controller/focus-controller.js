/* Focus Controller */
define(['bp/constants', 'bp/model/state', 'bp/helper', 'core/metric' ],
  function (BP_CONST, state, helper, metric) {

  var savedDocumentFocus,
    tabbedElement,
    isInitialized,
    isListeningToClicks,
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
    },
    DELTA_KEYS = {};

  DELTA_KEYS[BP_CONST.KEY_CODES.LEFT]  = -1;
  DELTA_KEYS[BP_CONST.KEY_CODES.UP]    = 1;
  DELTA_KEYS[BP_CONST.KEY_CODES.RIGHT] = 1;
  DELTA_KEYS[BP_CONST.KEY_CODES.DOWN]  = -1;

  function getPanelContainer() {
    return byId(BP_CONST.BP_CONTAINER_ID);
  }

  // Clear the visual focus rectangle and current focus state
  function clearPanelFocus() {

    if (tabbedElement) {
      tabbedElement.removeAttribute('data-show-focus');
      tabbedElement.removeAttribute('tabindex');
    }

    hideFocus();

    tabbedElement = null;

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
    if (!tabbedElement) {
      return;
    }
    var panelContainer = getPanelContainer();
    panelContainer.setAttribute('aria-activedescendant', tabbedElement.id);
    tabbedElement.setAttribute('focusable', true);
    tabbedElement.setAttribute('tabindex', 0);

    try {
      // Allow real focus if item/browser allows it:
      // - In Firefox, for now this will only work on HTML elements
      // - In other browsers, anything with focusable/tabindex can be focused
      tabbedElement.focus();
    }
    catch (ex) {
      panelContainer.focus();
    }
  }

  function showFocus() {

    metric('panel-focus-moved'); // Keyboard focus moved in the panel

    updateDOMFocusState();

    if (!tabbedElement || !state.get('isKeyboardMode')) {
      // No focus to show or not in keyboard mode
      hideFocus();
    }
    else {
      // Show focus
      if (tabbedElement.id === BP_CONST.MORE_BUTTON_GROUP_ID) {
        sitecues.emit('bp/did-focus-more-button');
      }

      renderFocusOutline();
    }
  }

  function listenToClicks() {

    if (!isListeningToClicks) {
      isListeningToClicks = true;
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

    // Save the last focus so that we can restore it when panel closes
    savedDocumentFocus = document.activeElement;

    // If the badge is focused we will turn keyboard mode on for the panel
    var isBadgeFocused = savedDocumentFocus && savedDocumentFocus.id === BP_CONST.BADGE_ID;

    clearPanelFocus();

    if (isBadgeFocused) {

      // TODO can we remove this ? It's set elsewhere. Try with a screen reader.
      //badgeElement.setAttribute('aria-expanded', 'true');

      // Turn keyboard mode on for the panel, and start focus on the first item
      tabbedElement = getElementForFocusIndex(0);
      turnOnKeyboardMode();
      showFocus();
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
      var focusable = savedDocumentFocus || ('focus' in document ? document : document.body);
      focusable.focus();
    }
  }

  function turnOnKeyboardMode() {
    state.set('isKeyboardMode', true);
    listenToClicks();
    sitecues.emit('bp/did-change');
  }

  function getFocusedItem() {
    // User has tabbed: we're in keyboard, mode, so the focused item is tabbedElement.
    // User has NOT tabbed: the focused item is where they last clicked -- document.activeElement
    return tabbedElement || document.activeElement;
  }

  function getElementToShowFocusOn() {
    if (tabbedElement) {
      var focusForwarder = tabbedElement.getAttribute('data-visible-focus-on');
      return focusForwarder ? byId(focusForwarder) : tabbedElement;
    }
  }

  function renderFocusOutline() {
    // @data-visible-focus-on = id of element to show focus on
    // @data-show-focus = focus to be shown on this element
    // @data-own-focus-ring = element will show it's own focus ring

    var showFocusOn = getElementToShowFocusOn(tabbedElement);

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

  function navigateInDirection(direction) {

    if (!state.isPanel()) {
      return;
    }

    hideFocus();

    var tabbable = getTabbableItems(),
      focusIndex = getFocusIndexForElement(getFocusedItem()),
      isFirstTimeInCard = tabbable[focusIndex] !== '$',
      numItems = tabbable.length,
      nextItem;

    while (true) {
      nextItem = null;
      if (tabbable[focusIndex] === '$') {
        nextItem = navigateInCard(direction, isFirstTimeInCard, tabbedElement);
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

      tabbedElement = nextItem;

      // Skip disabled items such as the prev arrow which is turned off at first
      if (isFocusable(nextItem)) {
        break;
      }
    }

    showFocus();
  }

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
        tabbedElement = target;
        break;
      }
      target = target.parentElement;
    }

    if (tabbedElement) {
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

  // If it was always HTML we could just use elem.click()
  function simulateClick(element) {
    var event = document.createEvent('MouseEvents');
    // If you need clientX, clientY, etc., you can call
    // initMouseEvent instead of initEvent
    event.initEvent('click', true, true);
    element.dispatchEvent(event);
  }

  function performZoomSliderCommand(keyCode, evt) {
    var deltaSliderCommand = DELTA_KEYS[keyCode];
    if (deltaSliderCommand) {
      require(['zoom/zoom'], function(zoomMod) {
        zoomMod.init();
        deltaSliderCommand > 0 ? zoomMod.beginZoomIncrease(evt) : zoomMod.beginZoomDecrease(evt);
      });
    }
  }

  // Process key down and return true if key should be allowed to perform default behavior
  function processKey(evt) {
    var keyCode = evt.keyCode;

    // Escape = close
    if (keyCode === BP_CONST.KEY_CODES.ESCAPE) {
      require(['bp-expanded/controller/shrink-controller'], function(shrinkController) {
        shrinkController.shrinkPanel(true);
      });
      return;
    }

    // Tab navigation
    if (keyCode === BP_CONST.KEY_CODES.TAB) {
      turnOnKeyboardMode();
      navigateInDirection(evt.shiftKey ? -1 : 1);
      return;
    }

    // Perform widget-specific command
    // Can't use evt.target because in the case of SVG it sometimes only has fake focus (some browsers can't focus SVG elements)
    var item = getFocusedItem();

    if (item) {
      if (item.localName === 'textarea' || item.localName === 'input') {
        return true;
      }
      if (item.id === BP_CONST.ZOOM_SLIDER_BAR_ID) {
        performZoomSliderCommand(keyCode, evt);
      }
      else {
        if (keyCode === BP_CONST.KEY_CODES.ENTER || keyCode === BP_CONST.KEY_CODES.SPACE) {
          simulateClick(item);
        }
      }
      // else fall through to native processing of keystroke
    }
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    sitecues.on('bp/will-toggle-feature bp/did-activate-link bp/do-send-feedback', hideFocus);
    beginKeyboardFocus(); // First time badge expands
    sitecues.on('bp/will-expand', beginKeyboardFocus);
    sitecues.on('bp/will-shrink', restoreDocumentFocus);
    sitecues.on('bp/did-expand', showFocus);
  }

  var publics = {
    init: init,
    getFocusedItem: getFocusedItem,
    navigateInDirection: navigateInDirection,
    processKey: processKey
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
