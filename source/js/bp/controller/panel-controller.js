/*
 Panel Controller
 */
sitecues.def('bp/controller/panel-controller', function (pc, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/controller/base-controller', 'bp/controller/slider-controller', 'bp/model/state', 'bp/view/elements/slider', 'bp/helper',
    function (BP_CONST, baseController, sliderController, state, slider, helper) {

      var MIN_DISTANCE = 75, // Min distance before shrink
        mouseLeaveShrinkTimer,  // How long we wait before shrinking BP from any mouseout (even only just barely outside panel)
        isSticky;

      // Feature panels are larger, need to know this so that mouseout doesn't exit accidentally after we close feature panel
      pc.wasInFeaturePanel  = false;
      pc.lastFocus = null;

    // TODO: rename
    pc.panelMouseDown = function() {
      baseController.clearPanelFocus();
      state.set('isKeyboardMode', false);
      sitecues.emit('bp/do-update');
    };

    function cancelMouseLeaveShrinkTimer() {
      clearTimeout(mouseLeaveShrinkTimer);
      mouseLeaveShrinkTimer = 0;
    }

    // Don't close panel too quickly when the mouse leaves the window, because the panel
    // may be near the window's edge and users with shaky hands may accidentally move mouse outside the window.
    // We don't know anything about the mouse other than the fact that it left the window
    pc.winMouseLeave = function(evt) {
      if (evt.target.id === BP_CONST.BADGE_ID) {
        mouseLeaveShrinkTimer = setTimeout(pc.shrinkPanel, BP_CONST.MOUSELEAVE_DELAY_SHRINK_BP);
      }
    };

    // TODO: rename
    pc.winMouseMove = function(evt) {

      if (sliderController.isSliderActive()) {
        return;  // Dragging slider, so don't close panel
      }

      if (pc.wasInFeaturePanel) {
        // Don't treat as mouse out if mouse just clicked on more button and panel shrunk
        // Only once back in the panel, reenable mouseout exit feature
        pc.wasInFeaturePanel = isMouseOutsidePanel(evt, 0);
        return;
      }

      if (isMouseOutsidePanel(evt, MIN_DISTANCE)) {
        if (SC_DEV && isSticky) {
          return;
        }
        if (state.get('wasMouseInPanel')) {
          pc.shrinkPanel();
        }
      }
      else {
        state.set('wasMouseInPanel', true);
        cancelMouseLeaveShrinkTimer();
      }
    };

    pc.winMouseDown = function(evt) {
      if (SC_DEV && isSticky) {
        return;
      }
      // Once mouse used, no longer need this protection against accidental closure
      pc.wasInFeaturePanel = false;

      if (isMouseOutsidePanel(evt, 0)) { // Any click anywhere outside of visible contents, no safe-zone needed
        pc.shrinkPanel();
      }
    };

    pc.winBlur = function() {
      if (SC_DEV && isSticky) {
        return;
      }
      pc.shrinkPanel(true);
    };

    // @param isFromKeyboard -- optional, if truthy, then the shrink command is from the keyboard (e.g. escape key)
    // bpc.processKeydown, buttonPress, pc.winMouseMove, pc.winMouseDown call this function...
    pc.shrinkPanel = function(isFromKeyboard) {
      if (state.isShrinking()) {
        return; // Not a panel or is already shrinking -- nothing to do
      }

      var activeElement = document.activeElement;

      // Clears the focus attribute from the element that has focus. Sets the focusIndex to -1
      // If the morePanel is already active, then we deactivate it and set the focusIndex to 0.
      baseController.clearPanelFocus();


      state.set('transitionTo', BP_CONST.BADGE_MODE);
      state.set('featurePanelName', '');
      state.set('isShrinkingFromKeyboard', isFromKeyboard);

      /*
        bp/will-shrink sets and removes attributes used for screen readers.
        bp/will-shrink removes mousedown, mousemove, and keydown event listeners bound to the window.
        bp/will-shrink cancels badge->panel animation
        bp/will-shrink removes click handler for toggling speech
       */
      sitecues.emit('bp/will-shrink');

      // If the secondary panel is active, deactivate it.
      if (state.isSecondaryPanelRequested()) {
        disableSecondaryPanel();
      }

      // TODO: Why is this necessary?  It emits 'zoom/stop' and removes the
      // mousemove handler from the thumb element.  My guess is that
      // we only need to remove the mousemove handler and not emit the
      // event, in which case I would prefer to be more explicit to what
      // we need to happen, instead of relying upon whatever finishZoomChanges
      // does now or in the future.
      sliderController.finishZoomChanges();

      // If the BP_CONTAINER has focus AND the document.body was the previous
      // focused element, blur the BP_CONTAINER focus.
      //
      // If the BP_CONTAINER has focus AND the document.body was NOT the previous
      // focused element, focus the previously focused element.
      if (pc.lastFocus && activeElement && activeElement.id === BP_CONST.BP_CONTAINER_ID) {
        if (pc.lastFocus === document.body) {
          activeElement.blur();
        } else {
          pc.lastFocus.focus();
        }
      }

      // Finally, begin the shrinking animation.
      sitecues.emit('bp/do-update');
    };

    // TODO: Maybe move to panel-controller?
    pc.panelShrunk = function() {
      state.set('currentMode', BP_CONST.BADGE_MODE);
      state.set('isShrinkingFromKeyboard', false);
      sitecues.emit('bp/did-shrink');
    };

    pc.panelReady = function() {

      state.set('currentMode', BP_CONST.PANEL_MODE);

      if (state.get('isKeyboardMode')) {
        baseController.showFocus();
      }

      sitecues.emit('bp/did-expand');
      sitecues.emit('bp/do-update');
    };

    /*
    Private functions.
     */

    /**
     * disableSecondaryPanel is called when the panel is about to shrink.
     * It is responsible for deactivating the secondary panel.
     */
    function disableSecondaryPanel() {

      var moreToggle = helper.byId(BP_CONST.MORE_BUTTON_GROUP_ID);

      if (state.get('isKeyboardMode')) {
        state.set('focusIndex', 0);
        baseController.showFocus();
      }

      moreToggle.setAttribute('aria-label', 'View more options');
    }

    function isWithinContainer(elem, id) {
      while (elem) {
        if (elem.id === id) {
          return true;
        }
        elem = elem.parentElement;
      }
    }

    function isMouseOutsideRect(evt, elem, minDistance) {
      var rect = helper.getRect(elem);
      return evt.clientY > rect.bottom + minDistance || evt.clientY < rect.top - minDistance ||
        evt.clientX > rect.right + minDistance || evt.clientX < rect.left - minDistance;
    }

    function isMouseOutsidePanel(evt, distance) {
      var targetId = evt.target.id;
      if (targetId !== BP_CONST.BP_CONTAINER_ID && targetId !== BP_CONST.BADGE_ID &&
        !isWithinContainer(evt.target, BP_CONST.MORE_BUTTON_CONTAINER_ID)) {
        var visiblePanelContainer = helper.byId(state.isSecondaryPanel() ? BP_CONST.MORE_OUTLINE_ID : BP_CONST.MAIN_OUTLINE_ID);
        return isMouseOutsideRect(evt, visiblePanelContainer, distance);
      }
    }

    sitecues.on('bp/do-shrink', pc.shrinkPanel);

//      if (SC_DEV) {
        sitecues.toggleStickyPanel = function() {
          isSticky = !isSticky;
          return isSticky;
        };
//      }

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});