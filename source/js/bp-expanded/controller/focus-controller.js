/* Focus Controller */
define(
  [
    'core/bp/constants',
    'core/bp/model/state',
    'core/bp/helper',
    'core/metric/metric',
    'core/bp/view/view',
    'core/events',
    'core/constants',
    'mini-core/native-functions',
    'core/inline-style/inline-style'
  ],
  function (
    BP_CONST,
    state,
    helper,
    metric,
    view,
    events,
    CORE_CONST,
    nativeFn,
    inlineStyle
  ) {
  'use strict';

  var savedDocumentFocus,
    tabbedElement,
    isInitialized,
    isListeningToClicks,
    byId   = helper.byId,
    keyCode = CORE_CONST.KEY_CODE,
    TAB    = keyCode.TAB,
    ENTER  = keyCode.ENTER,
    ESCAPE = keyCode.ESCAPE,
    SPACE  = keyCode.SPACE,
    LEFT   = keyCode.LEFT,
    UP     = keyCode.UP,
    RIGHT  = keyCode.RIGHT,
    DOWN   = keyCode.DOWN,
    arrows = [
      UP,
      DOWN,
      LEFT,
      RIGHT
    ],
    triggerKeys = [
      ENTER,
      SPACE
    ],

    TABBABLE = {    // IMPORTANT: remove 'scp-' prefix -- it gets added in by the code
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
        '$',   // Current card contents
        'settings-label',
        'feedback-label',
        'about-label',
        'more-button-group'
      ],
      'settings':[
        '$',   // Current card contents
        'tips-label',
        'feedback-label',
        'about-label',
        'more-button-group'
      ],
      'feedback':[
        'feedback-textarea',
        'stars-1',
        'stars-2',
        'stars-3',
        'stars-4',
        'stars-5',
        'feedback-send-link',
        'feedback-thanks',
        'tips-label',
        'settings-label',
        'about-label',
        'more-button-group'
      ],
      'about':[
        'about-sitecues-link',
        'about-rate-button',
        'tips-label',
        'settings-label',
        'feedback-label',
        'more-button-group'
      ]
    },
    DELTA_KEYS = {};

  DELTA_KEYS[LEFT]  = -1;
  DELTA_KEYS[UP]    = 1;
  DELTA_KEYS[RIGHT] = 1;
  DELTA_KEYS[DOWN]  = -1;

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
    byId(BP_CONST.OUTLINE_ID).removeAttribute('data-show');
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

    updateDOMFocusState();

    if (!tabbedElement || !isKeyboardMode()) {
      // No focus to show or not in keyboard mode
      hideFocus();
    }
    else {
      // Show focus
      if (tabbedElement.id === BP_CONST.MORE_BUTTON_GROUP_ID) {
        events.emit('bp/did-focus-more-button');
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

  function isKeyboardMode() {
    return state.get('isKeyboardMode');
  }

  function focusCard(cardId, tabElement, isFromLink) {
    if (isKeyboardMode() && tabElement) {
      clearPanelFocus();
      tabbedElement = tabElement;
      if (isFromLink) {
        // When jumping directly to tab, navigate to the first content inside the tab
        while (tabbedElement && tabbedElement.getAttribute('role') === 'tab') {
          navigateInDirection(1);
        }
      }
      showFocus();
    }
  }

  function focusFirstItem() {
    if (isKeyboardMode()) {
      nativeFn.setTimeout(function() {
        navigateInDirection(1, true);
      }, 0);
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
  function beginKeyHandling() {

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

    window.addEventListener('keydown', processKeyDown, true);
  }

  function endKeyHandling() {
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
      //TODO: Focusing is broken in Edge, figure out the root cause of this
      if (typeof focusable.focus === 'function') {
        focusable.focus();
      }
    }

    window.removeEventListener('keydown', processKeyDown, true);
  }

  function turnOnKeyboardMode() {
    state.set('isKeyboardMode', true);
    listenToClicks();
    view.update();
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

    var showFocusOn = getElementToShowFocusOn(),
      scale = state.get('scale');

    function getFinalCoordinate(coord) {
      return (coord / scale) + 'px';
    }

    showFocusOn.setAttribute('data-show-focus', '');
    if (!showFocusOn.hasAttribute('data-own-focus-ring')) {
      // Show focus outline
      var EXTRA_FOCUS_PADDING = 1,
        clientPanelRect = helper.getRect(getPanelContainer()),  // Focus rect is positioned relative to this
        clientFocusRect = helper.getRect(showFocusOn),
        focusOutline = byId(BP_CONST.OUTLINE_ID);

      focusOutline.setAttribute('data-show', true);
      inlineStyle.set(focusOutline, {
        width  : getFinalCoordinate(clientFocusRect.width + 2 * EXTRA_FOCUS_PADDING),
        height : getFinalCoordinate(clientFocusRect.height + 2 * EXTRA_FOCUS_PADDING),
        top    : getFinalCoordinate(clientFocusRect.top - EXTRA_FOCUS_PADDING - clientPanelRect.top),
        left   : getFinalCoordinate(clientFocusRect.left - EXTRA_FOCUS_PADDING - clientPanelRect.left)
      });
    }
  }

  function getAllTabbableItemsInActiveCard() {
    function getItems(itemsSelector) {
      var panelSelector = '#scp-' + state.getPanelName() + '>',
        nodeList = document.querySelectorAll(panelSelector + itemsSelector);
      return Array.prototype.slice.call(nodeList);  // Convert to array
    }
    var cardTabs = getItems('.scp-card-chooser>sc-link'),
      cardContentItems = getItems('.scp-active .scp-tabbable:not([data-show="false"])');

    return cardTabs.concat(cardContentItems);
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
      parseFloat(getComputedStyle(elem).opacity) > 0.1;
  }

  function navigateInDirection(direction, doStartFromTop) {

    if (!state.isPanel()) {
      return;
    }

    hideFocus();

    var tabbable = getTabbableItems(),
      focusIndex = doStartFromTop ? -1 : getFocusIndexForElement(getFocusedItem()),
      isFirstTimeInCard = tabbable[focusIndex] !== '$',
      numItems = tabbable.length,
      nextItem;

    while (true) {
      nextItem = null;
      if (tabbable[focusIndex] === '$') {
        nextItem = navigateInCard(direction, isFirstTimeInCard, tabbedElement);
        isFirstTimeInCard = false;
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
      var forwardClickFocus = target.getAttribute('aria-controls');
      if (forwardClickFocus) {
        // Clicking slider thumb should focus slider bar
        target = byId(forwardClickFocus);
      }
      if (getFocusIndexForElement(target) >= 0) {
        tabbedElement = target;
        break;
      }
      target = target.parentNode;
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

    new metric.PanelClick({ target: element.id, role: helper.getAriaOrNativeRole(element) }).send();
  }

  function onZoomKeyUp() {
    require(['page/zoom/zoom'], function(zoomMod) {
      zoomMod.zoomStopRequested();
    });
  }

  function performZoomSliderCommand(keyCode, evt) {
    var deltaSliderCommand = DELTA_KEYS[keyCode];
    if (deltaSliderCommand) {
      require(['page/zoom/zoom'], function(zoomMod) {
        window.removeEventListener('keyup', onZoomKeyUp); // Zoom module will listen from here
        zoomMod.init();
        if (deltaSliderCommand > 0) {
          zoomMod.beginZoomIncrease(evt);
        }
        else {
          zoomMod.beginZoomDecrease(evt);
        }
      });

      window.addEventListener('keyup', onZoomKeyUp);  // Capture key up that may happen while waiting for zoom module
    }
  }

  // Process key down and return true if key should be allowed to perform default behavior
  function processKey(evt) {
    var keyCode = evt.keyCode;

    // Escape = close
    if (keyCode === ESCAPE) {
      if (state.isSecondaryPanelRequested()) {
        simulateClick(byId(BP_CONST.MORE_BUTTON_GROUP_ID));
      }
      else {
        require(['bp-expanded/controller/shrink-controller'], function (shrinkController) {
          shrinkController.shrinkPanel(true);
        });
      }
      return;
    }

    // Tab navigation
    if (keyCode === TAB) {
      turnOnKeyboardMode();
      navigateInDirection(evt.shiftKey ? -1 : 1);
      new metric.PanelFocusMove().send();
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
        if (triggerKeys.indexOf(keyCode) > -1) {
          simulateClick(item);
        }
      }
    }

    if (triggerKeys.indexOf(keyCode) > -1) {
      //Don't allow default behavior for enter and space keys while the panel is open
      return;
    }

    if (arrows.indexOf(keyCode) > -1) {
      //Prevent window from scrolling on arrow keys
      return;
    }

    // else fall through to native processing of keystroke
    return true;
  }

  function isModifiedKey(evt) {
    return evt.altKey || evt.metaKey || evt.ctrlKey;
  }

  function processKeyDown(evt) {
    if (isModifiedKey(evt) || !state.isPanel()) {
      return;
    }

    if (!processKey(evt)) {
      evt.preventDefault();
      return false;
    }
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    events.on('bp/will-toggle-feature', hideFocus);
    events.on('bp/did-open-subpanel', focusFirstItem);
    events.on('bp/did-show-card', focusCard);
    beginKeyHandling(); // First time badge expands
    events.on('bp/will-expand', beginKeyHandling);
    events.on('bp/will-shrink', endKeyHandling);
    events.on('bp/did-expand', showFocus);

  }

  return {
    init: init,
    getFocusedItem: getFocusedItem,
    navigateInDirection: navigateInDirection,
    processKey: processKey
  };

});
