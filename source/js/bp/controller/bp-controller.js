/*
BP Controller
 */
sitecues.def('bp/controller/bp-controller', function (bpc, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/controller/base-controller', 'bp/controller/slider-controller',
    'bp/controller/panel-controller', 'bp/model/state', 'bp/view/elements/slider', 'bp/helper', 'conf',
    function (BP_CONST, baseController, sliderController, panelController, state, slider, helper, conf) {

    var TAB_DIRECTION = {
      'left': -1,
      'right': 1
    };

    var ROLES = {
      'CHECKBOX': 'checkbox',
      'SLIDER':   'slider',
      'BUTTON':   'button'
    };

    // How long we wait before expanding BP
    var hoverDelayTimer;

    // We ignore the first mouse move when a window becomes active, otherwise badge opens
    // if the mouse happens to be over the badge/toolbar
    var doIgnoreNextMouseMove = true;

    var DELTA_KEYS = {};
    DELTA_KEYS[BP_CONST.KEY_CODES.LEFT]  = -1;
    DELTA_KEYS[BP_CONST.KEY_CODES.UP]    = 1;
    DELTA_KEYS[BP_CONST.KEY_CODES.RIGHT] = 1;
    DELTA_KEYS[BP_CONST.KEY_CODES.DOWN]  = -1;

    // TODO: rename
    bpc.processKeydown = function (evt) {

      var item = baseController.getFocusedItem(),
          role;

      if (evt.keyCode === BP_CONST.KEY_CODES.ESCAPE) {
        panelController.shrinkPanel(true);
        evt.preventDefault();
        return;
      }

      if (evt.keyCode === BP_CONST.KEY_CODES.TAB) {
        if (isModifiedKey(evt) || !state.isPanel()) {
          return;
        }

        state.set('isKeyboardMode', true);
        sitecues.emit('bp/do-update');
        if (baseController.getFocusedItemName() !== '$') {
          setTabCycles(evt);
        }
        processFocusedItem(evt);
      }

      if (!item) {
        // Return early -- the remaining commands are specific to each control
        return;
      }

      role = item.getAttribute('role');

      processRoles(evt, item, role);

      if (evt.keyCode === BP_CONST.KEY_CODES.ENTER ||
          evt.keyCode === BP_CONST.KEY_CODES.SPACE ||
          role !== ROLES.SLIDER) { // Remaining commands are for sliders only
          return;
      }

      item.focus();

      processSliderCommands(evt, item);
    };

    function isInActiveToolbarArea(evt, badgeRect) {
      var middleOfBadge = badgeRect.left + badgeRect.width / 2,
        allowedDistance = BP_CONST.ACTIVE_TOOLBAR_WIDTH / 2;

      return evt.clientX > middleOfBadge - allowedDistance &&
        evt.clientX < middleOfBadge + allowedDistance;
    }

    function isInHorizontalBadgeArea(evt, badgeRect) {
      return evt.clientX >= badgeRect.left && evt.clientX <= badgeRect.right;
    }

    function isInVerticalBadgeArea(evt, badgeRect) {
      return evt.clientY >= badgeRect.top && evt.clientY<= badgeRect.bottom;
    }

    function getVisibleBadgeRect() {
      return helper.byId(BP_CONST.MOUSEOVER_TARGET).getBoundingClientRect();
    }

    // When window is newly activated, ignore the automatic first mousemove that is generated
    // that may happen to be over the badge/toolbar. Require that the user intentionally moves to the toolbar.
    function onWindowFocus() {
      doIgnoreNextMouseMove = true;
    }

    // Logic to determine whether we should begin to expand panel
    bpc.onMouseMove = function(evt) {
      cancelHoverDelayTimer();

      if (doIgnoreNextMouseMove) {
        doIgnoreNextMouseMove = false;
        return;
      }

      if (state.isExpanding()) {
        return;  // Already expanding -> do nothing
      }

      // Is the event related to the visible contents of the badge?
      // (as opposed to the hidden areas around the badge)
      var badgeRect = getVisibleBadgeRect(),
        isInBadge = isInHorizontalBadgeArea(evt, badgeRect),
        isInToolbar = state.get('isToolbarBadge') && isInActiveToolbarArea(evt, badgeRect);

      if (!isInVerticalBadgeArea(evt, badgeRect)) {
        return;
      }

      // Check if shrinking and need to reopen
      if (state.isShrinking()) {
        if (isInBadge) {
          bpc.changeModeToPanel();  // User changed their mind -- reverse course and reopen
        }
        return;
      }

      // Use the event
      if (isInToolbar || isInBadge) {
        hoverDelayTimer = setTimeout(bpc.changeModeToPanel,
          isInBadge ? BP_CONST.HOVER_DELAY_BADGE : BP_CONST.HOVER_DELAY_TOOLBAR);
      }
    };

    bpc.changeModeToPanel = function() {
      cancelHoverDelayTimer();
      if (!state.get('isShrinkingFromKeyboard')) {
        sitecues.emit('bp/do-expand');
      }
    };

    function cancelHoverDelayTimer() {
      clearTimeout(hoverDelayTimer);
      hoverDelayTimer = 0;
    }

    bpc.onMouseOut = function(evt) {
      if (evt.target.id === BP_CONST.BADGE_ID) {
        cancelHoverDelayTimer();
      }
    };

    // User may think they need to click in badge
    // We don't want to take focus that way -- only via tabbing or from screen reader use
    bpc.suppressBadgeFocusOnClick = function(event) {
      var targetType = event.target.localName;
      if (targetType === 'textarea' || targetType === 'input') {
        return;
      }
      // Prevent default handling and thus prevent focus
      event.returnValue = false;
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      return false;
    };

    // When a click happens on the badge, it can be from one of two things:
    // - A fake click event pushed by a screen reader when the user presses Enter -- in this case we should expand the panel
    // - An actual click in the whitespace around the panel (before they moused over the visible area) -- we should ignore these
    //   so that clicks around the panel don't accidentally open it.
    bpc.clickToOpenPanel = function() {
      var badgeElem = helper.byId(BP_CONST.BADGE_ID);
      if (document.activeElement === badgeElem) {
        // Click is in visible area and badge has focus -- go ahead and open the panel
        bpc.changeModeToPanel();
      }
    };

    bpc.processBadgeActivationKeys = function(evt) {
      if (state.isBadge() &&
        (evt.keyCode === BP_CONST.KEY_CODES.ENTER || evt.keyCode === BP_CONST.KEY_CODES.SPACE)) {

        evt.preventDefault();
        // TODO Return to using the following:
        bpc.changeModeToPanel();
      }
    };

    /*
     Private functions.
     */

    function isModifiedKey(evt) {
      return evt.altKey || evt.metaKey || evt.ctrlKey;
    }

    // Tab cycles
    // Tab cycles means that if you tab past the last tabbable item in the
    // current view, it goes back to the first. Also the reverse:
    // if you shift+tab from the first item, it goes to the last.
    function setTabCycles(evt) {

      if (!state.isPanel()) {
        // Skip if bp in badge state
        return;
      }

      var direction     = evt.shiftKey ? TAB_DIRECTION.left : TAB_DIRECTION.right,
          currentPanel  = baseController.getTab(),
          numItems      = baseController.tabbable[currentPanel].length,
          newFocusIndex = state.get('focusIndex') + direction;

      if (newFocusIndex < 0) {

        newFocusIndex = numItems - 1;

      } else if (newFocusIndex >= numItems) {

        newFocusIndex = 0;

      }

      baseController.clearPanelFocus();

      state.set('focusIndex', newFocusIndex);

    }

    function getAllTabbableItemsInActiveCard () {
      return document.querySelectorAll('#scp-' + baseController.getTab() + ' > .scp-active .scp-tabbable:not([data-show="false"])');
    }

    function getFocusedItemInActiveCard (tabbableItems) {
      for (var i = 0, l = tabbableItems.length; i < l; i++) {
        if (tabbableItems[i].getAttribute('data-focused')) {
          return tabbableItems[i];
        }
      }
    }

    function setFocusedItemInActiveCard (tabbableItems, tabbableItem) {
      clearAllFocusedItemsInActiveCard(tabbableItems);
      tabbableItem.setAttribute('data-focused', true);
    }

    function clearAllFocusedItemsInActiveCard (tabbableItems) {
      for (var i = 0, l = tabbableItems.length; i < l; i++) {
        tabbableItems[i].removeAttribute('data-focused');
      }
    }

    function getAdjacentTabbableItem (all, current, dir) {
      if (!current) {
        return;
      }
      for (var i = 0, l = all.length; i < l; i++) {
        if (all[i] === current) {
          return all[i + dir];
        }
      }
    }

    function skipItem (evt) {
      setTabCycles(evt);
      processFocusedItem(evt);
    }

    function processFocusedItem(evt) {

      var item      = baseController.getFocusedItem(),
          itemName  = baseController.getFocusedItemName(),
          direction = evt.shiftKey ? TAB_DIRECTION.left : TAB_DIRECTION.right,
          isRight   = direction === TAB_DIRECTION.right,
          tabbableItemsInActiveCard,
          focusedTabbableItem,
          adjacentTabbableItem,
          nextItem,
          nextItemIndex;

      // Process the dynamic content for the possibility of tabbable items.
      if (itemName === '$') {

        // All items in the active card.
        tabbableItemsInActiveCard = getAllTabbableItemsInActiveCard();

        // If there are none, skip to the next item.
        if (!tabbableItemsInActiveCard.length) {
          skipItem(evt);
          return;
        }

        // The current focused item.  Might not exist.
        focusedTabbableItem = getFocusedItemInActiveCard(tabbableItemsInActiveCard);

        // The item adjacent to the current focused item, depending on what direction user tabs.
        adjacentTabbableItem = getAdjacentTabbableItem(tabbableItemsInActiveCard, focusedTabbableItem, direction);

        // There is a current focused item, but the adjacent item is not within the dynamic content
        // within the active card.  Meaning, the adjacent item is really outside the dynamic content.
        // Just skip.
        if (focusedTabbableItem && !adjacentTabbableItem) {
          clearAllFocusedItemsInActiveCard(tabbableItemsInActiveCard);
          skipItem(evt);
          return;
        }

        // First or last dynamic tabbable item.
        nextItemIndex = isRight ? 0 : tabbableItemsInActiveCard.length - 1;

        // If a focused item exists, use the adjacent item.  Otherwise, its either the first or last item.
        nextItem = focusedTabbableItem ? adjacentTabbableItem : tabbableItemsInActiveCard[nextItemIndex];

        setFocusedItemInActiveCard(tabbableItemsInActiveCard, nextItem);

        item = adjacentTabbableItem || tabbableItemsInActiveCard[nextItemIndex];

      }

      if(!item) {
        return;
      }

      // The prev arrow is turned off when on the first card when
      // going to the settings panel
      if (item.getAttribute('aria-disabled') === 'true') {
        skipItem(evt);
        return;
      }

      baseController.showFocus(item);

      evt.preventDefault();
    }

    function processRoles(evt, item, role) {
      if (evt.keyCode === BP_CONST.KEY_CODES.ENTER || evt.keyCode === BP_CONST.KEY_CODES.SPACE) {
        if (role === ROLES.CHECKBOX) {
          if (item.id === BP_CONST.SPEECH_ID) {
            sitecues.emit('speech/do-toggle');
          }
        } else if (role === ROLES.BUTTON) {
          buttonPress(evt, item);
        }
        evt.preventDefault();
        return;
      }
    }

    function processSliderCommands(evt, item) {
      var deltaSliderCommand = DELTA_KEYS[evt.keyCode];
      if (deltaSliderCommand && !item.hasAttribute('data-setting-name')) {
        sitecues.emit(deltaSliderCommand > 0 ? 'zoom/increase' : 'zoom/decrease');
        evt.preventDefault();
        return;
      }
    }

    // todo: use constants.js for IDS
    function buttonPress(evt, item) {

      item = item || evt.currentTarget;

      var feature     = item.getAttribute('data-feature'),
          currentMode = baseController.getTab(),
          settingName = item.getAttribute('data-setting-name'),
          isTheme     = settingName === 'themeName';

      if (feature) {  /* Feature button has data-feature attribute */
        sitecues.emit('bp/do-toggle-secondary-panel', feature);
        syncFocusIndex(currentMode);
      }
      if (item.id === BP_CONST.MORE_BUTTON_GROUP_ID) {
        sitecues.emit('bp/do-toggle-secondary-panel');
        syncFocusIndex(currentMode);
      }
      if (item.id === BP_CONST.NEXT_ID) {
        sitecues.emit('bp/do-next-card');
      }
      if (item.id === BP_CONST.PREV_ID) {
        sitecues.emit('bp/do-prev-card');
      }
      if (isTheme) {
        conf.set(settingName, item.getAttribute('data-setting-value'));
      }

      sitecues.emit('bp/do-update');
    }

    function syncFocusIndex (synchWith) {
      var currentMode = state.isSecondaryPanelRequested() ? state.getSecondaryPanelName() : BP_CONST.PANEL_TYPES[+state.isSecondaryPanel()],
          tabbable        = baseController.tabbable,
          previousMode    = tabbable[synchWith];

      state.set('focusIndex', tabbable[currentMode].indexOf(previousMode[state.get('focusIndex')]));
    }

    window.addEventListener('focus', onWindowFocus);

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});