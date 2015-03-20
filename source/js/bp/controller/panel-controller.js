/*
 Panel Controller
 */
sitecues.def('bp/controller/panel-controller', function (pc, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/controller/base-controller', 'bp/controller/slider-controller', 'bp/model/state', 'bp/view/elements/slider', 'bp/helper',
    function (BP_CONST, baseController, sliderController, state, slider, helper) {

      var MIN_DISTANCE = 75; // Min distance before shrink

      // Feature panels are larger, need to know this so that mouseout doesn't exit accidentally after we close feature panel
      pc.wasInFeaturePanel  = false;
      pc.lastFocus = null;

    // TODO: rename
    pc.panelMouseDown = function() {
      baseController.clearPanelFocus();
      state.set('isKeyboardMode', false);
      sitecues.emit('bp/do-update');
    };

    // TODO: rename
    pc.winMouseMove = function(evt) {


      // Firefox/IE:
      //          evt.buttons is 0 when no mousebutton is held down.
      //          evt.which is always 1.
      // Chrome:
      //          evt.buttons is always undefined.
      //          evt.which is 0 if no mouse button is held down.  1 if left mouse button is held down.
      if (evt.buttons > 0 || (evt.buttons !== 0 && evt.which)) {
        return;
      }

      if (pc.wasInFeaturePanel) {
        // Don't treat as mouse out if mouse just clicked on more button and panel shrunk
        // Only once back in the panel, reenable mouseout exit feature
        pc.wasInFeaturePanel = isMouseOutsidePanel(evt, 0);
        return;
      }

      if (isMouseOutsidePanel(evt, MIN_DISTANCE)) {
        pc.shrinkPanel();
      }
    };

    // TODO: rename
    pc.winMouseDown = function(evt) {

      // Once mouse used, no longer need this protection against accidental closure
      pc.wasInFeaturePanel = false;

      if (isMouseOutsidePanel(evt, MIN_DISTANCE)) {
        pc.shrinkPanel();
      }
    };

    // @param isFromKeyboard -- optional, if truthy, then the shrink command is from the keyboard (e.g. escape key)
    // bpc.processKeydown, buttonPress, pc.winMouseMove, pc.winMouseDown call this function...
    pc.shrinkPanel = function(isFromKeyboard) {

      var activeElement = document.activeElement;

      // Clears the focus attribute from the element that has focus. Sets the focusIndex to -1
      // If the morePanel is already active, then we deactivate it and set the focusIndex to 0.
      baseController.clearPanelFocus();

      /*
        bp/will-shrink sets and removes attributes used for screen readers.
        bp/will-shrink removes mousedown, mousemove, and keydown event listeners bound to the window.
        bp/will-shrink cancels badge->panel animation
        bp/will-shrink removes click handler for toggling speech
       */
      sitecues.emit('bp/will-shrink');

      state.set('transitionTo', BP_CONST.BADGE_MODE);
      state.set('featurePanelName', '');
      state.set('isShrinkingFromKeyboard', isFromKeyboard);

      // If the secondary panel is active, deactivate it.
      if (state.isMorePanel()) {
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

      state.set('isMorePanel', false);

      if (state.get('isKeyboardMode')) {
        state.set('focusIndex', 0);
        baseController.showFocus();
      }

      moreToggle.setAttribute('aria-label', 'View more options');
    }

    function isMouseOutsideRect(evt, elem, minDistance) {
      var rect = helper.getRect(elem);
      return evt.clientX > rect.right + minDistance || evt.clientX < rect.left - minDistance ||
        evt.clientY > rect.bottom + minDistance || evt.clientY < rect.top - minDistance;
    }

    function isMouseOutsidePanel(evt, distance) {
      var elem = helper.byId(state.isMorePanel() ? BP_CONST.MORE_OUTLINE_ID : BP_CONST.MAIN_OUTLINE_ID);
//      var moreButtonRect = helper.getRectById(MORE_BUTTON_CONTAINER_ID); // More button hanging off
      return isMouseOutsideRect(evt, elem, distance) /* && isMouseOutsideRect(evt, moreButtonRect, 0) */;
    }

    sitecues.on('bp/do-shrink', pc.shrinkPanel);

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});