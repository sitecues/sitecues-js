/*
BP Controller
 */
sitecues.def('bp/controller/bp-controller', function (bpc, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/controller/focus-controller', 'bp/controller/slider-controller',
    'bp/controller/panel-controller', 'bp/model/state', 'bp/view/elements/slider', 'bp/helper',
    function (BP_CONST, focusController, sliderController, panelController, state, slider, helper) {

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

      // TODO remove if unneeded
//    bpc.processMouseDown = function(evt) {
//      sitecues.emit('bp/click', evt);
//    };

    // If it was always HTML we could just use elem.click()
    function simulateClick(element) {
      var dispatchMouseEvent = function(target) {
        var e = document.createEvent('MouseEvents');
        // If you need clientX, clientY, etc., you can call
        // initMouseEvent instead of initEvent
        e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
        target.dispatchEvent(e);
      };
      console.log(element);
      dispatchMouseEvent(element, 'click', true, true);
    }

    bpc.processKeyDown = function (evt) {

      // Escape = close
      if (evt.keyCode === BP_CONST.KEY_CODES.ESCAPE) {
        panelController.shrinkPanel(true);
        evt.preventDefault();
        return;
      }

      // Tab navigation
      if (evt.keyCode === BP_CONST.KEY_CODES.TAB) {
        if (isModifiedKey(evt) || !state.isPanel()) {
          return;
        }

        state.set('isKeyboardMode', true);
        sitecues.emit('bp/do-update');
        focusController.navigateInDirection(evt.shiftKey ? -1 : 1);
        evt.preventDefault();
        return;
      }

      // Perform widget-specific commands
      var item = focusController.getFocusedItem();

      if (item) {
        if (item.id === BP_CONST.ZOOM_SLIDER_BAR_ID) {
          performZoomSliderCommand(evt);
        }
        else if (item.localName !== 'textarea') {
          if (evt.keyCode === BP_CONST.KEY_CODES.ENTER || evt.keyCode === BP_CONST.KEY_CODES.SPACE) {
            simulateClick(item);
            evt.preventDefault();
          }
        }
        // else fall through to native processing of keystroke
      }
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

    function performZoomSliderCommand(evt) {
      var deltaSliderCommand = DELTA_KEYS[evt.keyCode];
      if (deltaSliderCommand) {
        sitecues.emit(deltaSliderCommand > 0 ? 'zoom/increase' : 'zoom/decrease');
        evt.preventDefault();
      }
    }

    window.addEventListener('focus', onWindowFocus);

    // Unless callback() is queued, the module is not registered in global var modules{}
    // See: https://fecru.ai2.at/cru/EQJS-39#c187
    //      https://equinox.atlassian.net/browse/EQ-355
    callback();
  });

});