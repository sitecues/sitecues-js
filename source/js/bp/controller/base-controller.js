/* Front Controller */
sitecues.def('bp/controller/base-controller', function (main, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'platform',
    function (BP_CONST, state, helper, platform) {

    main.TABBABLE = {
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
        'more-button-group'
      ],
      'about':[
        'about-button',
        'more-button-group'
      ]
    };

    main.getTab = function () {
      if (state.isPanel() && state.isSecondaryPanelRequested()) {
        return state.getSecondaryPanelName();
      }
      return BP_CONST.PANEL_TYPES[+state.isSecondaryPanel()];
    };

    // Clear the visual focus rectangle and current focus state
    main.clearPanelFocus = function() {

      var focusedItem = main.getFocusedItem(),
          outlineStyle = helper.byId(BP_CONST.OUTLINE_ID).style;

      if (focusedItem) {
        focusedItem.removeAttribute('data-hasfocus');
      }

      outlineStyle.display   = 'none';
      outlineStyle[platform.transformProperty] = '';

      state.set('focusIndex', -1);
    };

    main.getFocusedItem = function() {
      var focusId = main.getFocusedItemName();
      if (focusId === '$') {
        var item = document.querySelectorAll('#scp-' + main.getTab() + ' > .scp-active .scp-tabbable[data-focused="true"]');
        if (item.length) {
          return item[0];
        }
      }
      if (focusId) {
        return helper.byId('scp-' + focusId);
      }
    };

    main.getFocusedItemName = function() {
      if (state.get('focusIndex') < 0) {
        return null;
      }
      var currentPanel = main.getTab();
      return main.TABBABLE[currentPanel][state.get('focusIndex')];
    };

    function renderFocusOutline(focusedItem, panelContainer) {

      // Show focus outline
      var EXTRA_FOCUS_PADDING = 1,
          clientFocusRect     = helper.getRect(focusedItem),
          clientPanelRect     = helper.getRect(panelContainer),  // Focus rect is positioned relative to this
          focusOutlineStyle   = helper.byId(BP_CONST.OUTLINE_ID).style;

      focusOutlineStyle.display = 'block';
      focusOutlineStyle.width  = (clientFocusRect.width + 2 * EXTRA_FOCUS_PADDING) + 'px';
      focusOutlineStyle.height = (clientFocusRect.height + 2 * EXTRA_FOCUS_PADDING) + 'px';

      focusOutlineStyle.top  = (clientFocusRect.top  - EXTRA_FOCUS_PADDING - clientPanelRect.top)  + 'px';
      focusOutlineStyle.left = (clientFocusRect.left - EXTRA_FOCUS_PADDING - clientPanelRect.left) + 'px';
    }

    main.showFocus = function (item) {

      var focusedItem    = item || main.getFocusedItem(),
          panelContainer = helper.byId(BP_CONST.BP_CONTAINER_ID);

      if (!focusedItem) {
        main.clearPanelFocus();
        panelContainer.removeAttribute('aria-activedescendant');
        return;
      }

      if (focusedItem.id === BP_CONST.MORE_BUTTON_GROUP_ID) {
        sitecues.emit('bp/do-show-help-button', true);
      }

      panelContainer.setAttribute('aria-activedescendant', focusedItem.id);
      focusedItem.setAttribute('data-hasfocus', 'true');     // Has focus now
      focusedItem.setAttribute('data-hadfocusonce', 'true'); // Has been focused before

      renderFocusOutline(focusedItem, panelContainer);
    };

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});