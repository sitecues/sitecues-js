/* Front Controller */
sitecues.def('bp/controller/base-controller', function (main, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper',
    function (BP_CONST, state, helper) {

    var noInputTimerId = 0;

    main.tabbable = {
      'main': [
        'zoom-slider-bar',
        'speech'
        //'more-button-group',
        //'close-button-group'
      ],
      'more': [
        'tips-button',
        'settings-button',
        'feedback-button',
        'about-button',
        'more-button-group',
        'close-button-group'
      ]
    };

    /*
     Timers
     */
    main.resetNoInputTimer = function(restart) {

      // If no input for a period of time, the more button appears. On mousedown we reset the timer for this.
      clearTimeout(noInputTimerId);

      if (!state.get('isMoreButtonVisible') && restart) {
        noInputTimerId = setTimeout(noInputOccurred, BP_CONST.NO_INPUT_TIMEOUT);
      }

    };

    main.showMoreButton = function() {
      if (state.isPanel()) {
        // helper.byId(MORE_BUTTON_GROUP_ID).setAttribute('class', SHOW_ID);
        state.set('isMoreButtonVisible', true);
      }
    };

    // Clear the visual focus rectangle and current focus state
    main.clearPanelFocus = function() {

      var focusedItem = main.getFocusedItem();

      if (focusedItem) {
        focusedItem.removeAttribute('data-hasfocus');
      }

      state.set('focusIndex', -1);
    };

    main.getFocusedItem = function() {
      if (state.get('focusIndex') < 0) {
        return null;
      }
      var currentPanel = BP_CONST.PANEL_TYPES[+state.isMorePanel()];
      var focusId = main.tabbable[currentPanel][state.get('focusIndex')];
      return helper.byId('scp-' + focusId);
    };

    function renderFocusOutline(focusedItem, panelContainer) {

      // Show focus outline
      var EXTRA_FOCUS_PADDING = 5,
          clientFocusRect     = focusedItem.getBoundingClientRect(),
          clientPanelRect     = panelContainer.getBoundingClientRect(),  // Focus rect is positioned relative to this
          focusOutlineStyle   = document.getElementById(BP_CONST.OUTLINE_ID).style;

      focusOutlineStyle.width  = (clientFocusRect.width  + EXTRA_FOCUS_PADDING) + 'px';
      focusOutlineStyle.height = (clientFocusRect.height + EXTRA_FOCUS_PADDING) + 'px';

      focusOutlineStyle.top  = (clientFocusRect.top  - EXTRA_FOCUS_PADDING - clientPanelRect.top)  + 'px';
      focusOutlineStyle.left = (clientFocusRect.left - EXTRA_FOCUS_PADDING - clientPanelRect.left) + 'px';
    }

    main.showFocus = function () {

      var focusedItem    = main.getFocusedItem(),
          panelContainer = helper.byId(BP_CONST.BP_CONTAINER_ID);

      if (!focusedItem) {
        main.clearPanelFocus();
        panelContainer.removeAttribute('aria-activedescendant');
        return;
      }

      panelContainer.setAttribute('aria-activedescendant', focusedItem.id);
      focusedItem.setAttribute('data-hasfocus', 'true');     // Has focus now
      focusedItem.setAttribute('data-hadfocusonce', 'true'); // Has been focused before

      renderFocusOutline(focusedItem, panelContainer);
    };

      /*
      Private methods
       */

    function noInputOccurred() {
      clearTimeout(noInputTimerId);
      helper.byId(BP_CONST.SVG_ID).removeEventListener('mousedown', main.resetNoInputTimer); // No longer needed
      main.showMoreButton();
    }


    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});