/*
BP Controller
 */
sitecues.def('bp/controller/bp-controller', function (bpc, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/controller/base-controller', 'bp/controller/slider-controller', 'bp/controller/panel-controller', 'bp/model/state', 'bp/view/elements/slider',
    function (BP_CONST, baseController, sliderController, panelController, state, slider) {

    var TAB_DIRECTION = {
      'left': -1,
      'right': 1
    };

    var ROLES = {
      'CHECKBOX': 'checkbox',
      'SLIDER':   'slider',
      'BUTTON':   'button'
    };

    var DELTA_KEYS = {};
    DELTA_KEYS[BP_CONST.KEY_CODES.HOME]  = -9999;
    DELTA_KEYS[BP_CONST.KEY_CODES.END]   = 9999;
    DELTA_KEYS[BP_CONST.KEY_CODES.LEFT]  = -1;
    DELTA_KEYS[BP_CONST.KEY_CODES.UP]    = -1;
    DELTA_KEYS[BP_CONST.KEY_CODES.RIGHT] = 1;
    DELTA_KEYS[BP_CONST.KEY_CODES.DOWN]  = 1;

    // TODO: rename
    bpc.processKeydown = function (evt) {

      var item = baseController.getFocusedItem(),
          role;

      //if (!getIsMorePanelState()) {
      //  return;
      //}

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
        setTabCycles(evt);
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

      processSliderCommands(evt);
    };

    bpc.changeModeToPanel = function() {
      if (!state.get('isShrinkingFromKeyboard')) {
        sitecues.emit('bp/do-expand');
      }
    };

    bpc.processBadgeActivationKeys = function(evt) {
      if (state.isBadge() &&
        (evt.keyCode === BP_CONST.KEY_CODES.ENTER || evt.keyCode === BP_CONST.KEY_CODES.SPACE)) {
        sitecues.emit('info/help'); // SC-2329 -- just show help for now
        evt.preventDefault();
        // TODO Return to using the following:
        // bpc.changeModeToPanel();
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
          currentPanel  = BP_CONST.PANEL_TYPES[+state.isMorePanel()],
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

    function processFocusedItem(evt) {

      var item = baseController.getFocusedItem();

      if(!item) {
        return;
      }

      // todo: clarify what does this piece of code do?
      if (item.id === BP_CONST.MORE_BUTTON_GROUP_ID) {
        baseController.showMoreButton();
      }

      baseController.showFocus();

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

    function processSliderCommands(evt) {
      var deltaSliderCommand = DELTA_KEYS[evt.keyCode];
      if (deltaSliderCommand) {
        slider.changeZoomBy(deltaSliderCommand * BP_CONST.ZOOM_KEY_INCREMENT);
        evt.preventDefault();
        return;
      }
    }

    // todo: use constants.js for IDS
    function buttonPress(evt, item) {

      item = item || evt.currentTarget;

      if (item.getAttribute('aria-disabled') === 'true') {
        return;
      }

      var feature = item.getAttribute('data-feature');

      if (feature) {  /* Feature button has data-feature attribute */
        baseController.clearPanelFocus();
        if (state.get('featurePanelName') === feature) {
          state.set('featurePanelName', null); // Already on this feature, toggle it off (back to more panel)
        }
        else {
          state.set('featurePanelName', feature);
        }
      }
      // else if (item.id === 'scp-prev-card') {
      //   switchCard(-1);
      // }
      // else if (item.id === 'scp-next-card') {
      //   switchCard(1);
      // }
      // else if (item.id === 'scp-close-button-group') {
      //   panelController.shrinkPanel();
      // }
      // else if (item.id === "scp-more-button-group") {
      //   onMoreButton();
      // }

      sitecues.emit('bp/do-update');
    }

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});