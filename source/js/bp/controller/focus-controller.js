/* Front Controller */
sitecues.def('bp/controller/focus-controller', function (focusController, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'platform',
    function (BP_CONST, state, helper, platform) {

    focusController.TABBABLE = {
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
        '$',
        'prev-card',
        'next-card',
        'more-button-group'
      ],
      'settings':[
        'settings-button',
        '$',
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

    focusController.getTab = function () {
      if (state.isPanel() && state.isSecondaryPanelRequested()) {
        return state.getSecondaryPanelName();
      }
      return BP_CONST.PANEL_TYPES[+state.isSecondaryPanel()];
    };

    // Clear the visual focus rectangle and current focus state
    focusController.clearPanelFocus = function() {

      debugger;
      var outlineStyle = helper.byId(BP_CONST.OUTLINE_ID).style,
        focusedItems = document.querySelectorAll('#scp-bp-container [tabindex]'),
        index = focusedItems.length,
        currItem;

      while (index --) {
        currItem = focusedItems[index];
        currItem.removeAttribute('data-show-focus');
        currItem.removeAttribute('tabindex');
      }

      outlineStyle.display = 'none';
      outlineStyle[platform.transformProperty] = '';

      state.set('focusIndex', -1);
    };

    focusController.getFocusedItem = function() {
      var focusId = focusController.getFocusedItemName();
      if (focusId === '$') {
        var item = document.querySelector('#scp-' + focusController.getTab() + ' > .scp-active .scp-tabbable[data-show-focus]');
        if (item) {
          return item;
        }
      }
      if (focusId) {
        return helper.byId('scp-' + focusId);
      }
    };

    focusController.getFocusedItemName = function() {
      if (state.get('focusIndex') < 0) {
        return null;
      }
      var currentPanel = focusController.getTab();
      return focusController.TABBABLE[currentPanel][state.get('focusIndex')];
    };

    function renderFocusOutline(focusedItem, panelContainer) {
      // @data-visible-focus-on = id of element to show focus on
      // @data-show-focus = focus to be shown on this element
      // @data-own-focus-ring = element will show it's own focus ring

      var focusForwarder = focusedItem.getAttribute('data-visible-focus-on'),
        showFocusOn = focusForwarder ? helper.byId(focusForwarder) : focusedItem;

      showFocusOn.setAttribute('data-show-focus', '');
      if (!showFocusOn.hasAttribute('data-own-focus-ring')) {
        // Show focus outline
        var EXTRA_FOCUS_PADDING = 1,
          clientFocusRect = helper.getRect(focusedItem),
          clientPanelRect = helper.getRect(panelContainer),  // Focus rect is positioned relative to this
          focusOutlineStyle = helper.byId(BP_CONST.OUTLINE_ID).style;

        focusOutlineStyle.display = 'block';
        focusOutlineStyle.width = (clientFocusRect.width + 2 * EXTRA_FOCUS_PADDING) + 'px';
        focusOutlineStyle.height = (clientFocusRect.height + 2 * EXTRA_FOCUS_PADDING) + 'px';

        focusOutlineStyle.top = (clientFocusRect.top - EXTRA_FOCUS_PADDING - clientPanelRect.top) + 'px';
        focusOutlineStyle.left = (clientFocusRect.left - EXTRA_FOCUS_PADDING - clientPanelRect.left) + 'px';
      }
    }

    focusController.showFocus = function (item) {

      var focusedItem    = item || focusController.getFocusedItem(),
          panelContainer = helper.byId(BP_CONST.BP_CONTAINER_ID);

      if (!focusedItem) {
        focusController.clearPanelFocus();
        panelContainer.removeAttribute('aria-activedescendant');
        return;
      }

      if (focusedItem.id === BP_CONST.MORE_BUTTON_GROUP_ID) {
        sitecues.emit('bp/do-show-help-button', true);
      }

      panelContainer.setAttribute('aria-activedescendant', focusedItem.id);
      focusedItem.setAttribute('focusable', true);
      focusedItem.setAttribute('tabindex', 0);
      try {
        // Allow real focus if item/browser allows it:
        // - In Firefox, for now this will only work on HTML elements
        // - In other browsers, anything with focusable/tabindex can be focused
        focusedItem.focus();
      }
      catch (ex) {}

      renderFocusOutline(focusedItem, panelContainer);
    };

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});