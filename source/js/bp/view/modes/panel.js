sitecues.def('bp/view/modes/panel', function(panel, callback) {
  'use strict';
  sitecues.use('bp', 'bp/view/elements/slider', 'bp/constants', 'bp/controller/base-controller',
    'bp/controller/panel-controller', 'bp/controller/bp-controller', 'bp/model/state', 'bp/helper',
    'cursor/custom', 'zoom',
    function(bp, slider, BP_CONST, baseController, panelController, bpController, state, helper, customCursor, zoomMod) {

      var minPageZoomXLCursor = customCursor.getCursorZoom(BP_CONST.MIN_CURSOR_SIZE);

      /*
       Show panel according to settings.
       */
      function expandPanel() {

        if (state.isPanel()) {
          return; // Already expanded or in the middle of shrinking
        }

        // switchToHtmlParent()
        sitecues.emit('bp/will-expand');

        prepareKeyboardFocus();
        bindTemporaryHandlers();
        setPanelExpandedState();
        resetUITimers();

        // Adds event listener for toggling speech
        sitecues.emit('bp/did-expand');

        sitecues.emit('bp/do-update');
      }

      /*
       If the badge was focused, the panel will go into focus mode when it's entered.
       In focus mode, we show the following:
       - A keyboard focus outline so the user knows where they are tabbing
       - A close button in case the user doesn't realize Escape key will close
       - The "more button" is shown immediately rather than on a timer, so that the tabbing cycle doesn't suddenly change in the middle of tabbing
       We also save the last focus so that we can restore it when the panel closes.
       */
      function prepareKeyboardFocus() {

        // Save the last focus so that we can restore it when panel closes
        var lastFocus = document.activeElement,

            // If the badge is focused we will turn keyboard mode on for the panel
            isFocused      = lastFocus && lastFocus.id === BP_CONST.BADGE_ID,
            badgeElement   = helper.byId(BP_CONST.BADGE_ID),
            panelContainer = helper.byId(BP_CONST.BP_CONTAINER_ID);

        panelController.lastFocus = lastFocus;

        baseController.clearPanelFocus();

        if (isFocused) {

          badgeElement.setAttribute('aria-expanded', 'true');

          // Turn keyboard mode on for the panel, and start focus on the first item
          state.set('isKeyboardMode', true);
          state.set('focusIndex', 0);

          // Always show hidden controls when opened in keyboard mode
          baseController.showMoreButton();
        }

        // Take the focus whether or not we're in focus mode,
        // in case the user presses tab or Escape to turn on keyboard mode after expansion
        panelContainer.focus();
      }

      // Window mouse listeners are temporary – only bound when the panel is open.
      // Good for performance – it prevents extra code from being run on every mouse move/click when we don't need it
      function bindTemporaryHandlers() {
        // Pressing tab or shift tab when panel is open switches it to keyboard mode
        window.addEventListener('keydown',   bpController.processKeydown);
        window.addEventListener('mousemove', panelController.winMouseMove);
        window.addEventListener('mousedown', panelController.winMouseDown);
      }

      function unbindTemporaryMouseHandlers() {
        window.removeEventListener('keydown',   bpController.processKeydown);
        window.removeEventListener('mousemove', panelController.winMouseMove);
        window.removeEventListener('mousedown', panelController.winMouseDown);
      }

      function setPanelExpandedState() {
        state.set('transitionTo', BP_CONST.PANEL_MODE);
        state.set('isRealSettings', true);    // Always use real settings once expanded
        state.set('featurePanelName', null);  // We're not in a feature panel
      }

      function resetUITimers() {
        // Timer used to show "more" button after period of no input
        baseController.resetNoInputTimer(true);

      }

      /**
       *** Getters ***
       */

      // These classes add styles based on the current state of the panel.
      panel.getViewClasses = function() {

        var classBuilder = '';  // Allow animations for growing or shrinking panel

        // Choose the 'settings' icon look (we can probably remove this choice after we settle one)
        classBuilder += ' scp-btn-choice-settings' + state.get('settingsIconVersion');

        // Choose the 'about' icon look (we can probably remove this choice after we settle one)
        classBuilder += ' scp-btn-choice-about' + state.get('aboutIconVersion');

        // In enlarged view we always show the real settings.
        // See badge.js for more about real vs fake settings.
        classBuilder += ' scp-realsettings';

        if (state.isPanel()) {
          // *** scp-ready ***
          // The panel is fully enlarged and ready to accept mouse input
          classBuilder += ' scp-ready';
        }

        // *** scp-large ***
        // Sets larger panel sizes on everything.
        // It can take time to take effect because of the animation properties.
        classBuilder += ' scp-large' + (state.isMorePanel() ? ' ' + BP_CONST.MORE_ID : ' ' + BP_CONST.MAIN_ID);

        if (state.get('isKeyboardMode')) {
          // *** scp-keyboard ***
          // Keyboard mode is enabled and therefore current focus outline must be visible
          classBuilder += ' scp-keyboard';
        }

        if (zoomMod.getCompletedZoom() < minPageZoomXLCursor) {
          classBuilder += ' scp-xl-cursor'; // Enable panel's extra large cursor if cursor isn't already larger
        }

        return classBuilder + ' ' + getFeatureClass();
      };

      /*
       A feature panel is a special panel that is triggered from the secondary panel. It can be one of four things right now:
       Settings
       Tips
       Feedback
       About

       These can only be shown when the panel is large.
       */

      // TODO all of the feature panels
      function getFeatureClass() {
        return '';
//        var featureClassBuilder = '';
//
//        // Feature panels are only displayed when the panel is large.
//        if (state.data.featurePanelName) {
//          featureClassBuilder += ' scp-feature ' + 'scp-' + state.data.featurePanelName + '-feature';
//          var feature = BP_CONST.FEATURES[state.data.featurePanelName];
//          doExtraHeight(feature);
//          if (state.data.numCards[state.data.featurePanelName]) {
//            displayActiveCard();
//          } else {
//            baseController.hideActiveCard();
//          }
//        }
//        return featureClassBuilder;
      }

      // Bind the mouse handlers that we don't need to add/remove each time
      // No sense in binding/unbinding event listeners on the slider etc. all the time.
      // The unbinding code would cost bytes for nothing useful. It won't help with general
      // window/document performance as these are just for mouse actions over the elements in the panel.
      function bindPermanentMouseHandlers() {

        var mainSVG = helper.byId(BP_CONST.SVG_ID);

        mainSVG.addEventListener('mousedown', panelController.panelMouseDown);
      }

      sitecues.on('bp/do-expand', expandPanel);

      sitecues.on('bp/did-complete', bindPermanentMouseHandlers);

      // When a mousemove happens outside the panel, shrink the panel.
      // Unbind the window event listeners specifically created for shrinking the panel.
      sitecues.on('bp/will-shrink', function() {

        var badgeElement   = helper.byId(BP_CONST.BADGE_ID),
            panelContainer = helper.byId(BP_CONST.BP_CONTAINER_ID);

        // Tell screen reader explicitly that sitecues button’s state is no longer expanded.
        badgeElement.setAttribute('aria-expanded', 'false');

        // Remove the focus for SVG child elements.
        panelContainer.removeAttribute('aria-activedescendant');

        // Don't listen to events on the window when the BP is collapsing
        unbindTemporaryMouseHandlers();
      });

      // Unless callback() is queued, the module is not registered in global var modules{}
      // See: https://fecru.ai2.at/cru/EQJS-39#c187
      //      https://equinox.atlassian.net/browse/EQ-355
      callback();
    });

});