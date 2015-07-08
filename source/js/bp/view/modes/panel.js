sitecues.def('bp/view/modes/panel', function(panel, callback) {
  'use strict';
  sitecues.use('bp', 'bp/constants', 'bp/controller/panel-controller', 'bp/controller/bp-controller', 'bp/model/state', 'bp/helper',
    function(bp, BP_CONST, panelController, bpController, state, helper) {

      /*
       Show panel according to settings.
       */
      function expandPanel() {

        if (state.isPanel()) {
          return; // Already expanded or in the middle of shrinking
        }

        sitecues.emit('bp/will-expand');

        toggleTemporaryHandlers(true);
        setPanelExpandedState();

        sitecues.emit('bp/do-update');
      }

      function getPanelContainer() {
        return helper.byId(BP_CONST.BP_CONTAINER_ID);
      }

      // Window mouse listeners are temporary – only bound when the panel is open.
      // Good for performance – it prevents extra code from being run on every mouse move/click when we don't need it
      function toggleTemporaryHandlers(isActive) {
        var addOrRemoveFn = isActive ? 'addEventListener' : 'removeEventListener';
        // Pressing tab or shift tab when panel is open switches it to keyboard mode
        window[addOrRemoveFn]('keydown',   bpController.processKeyDown, true);
        window[addOrRemoveFn]('mousedown', panelController.winMouseDown);
        window[addOrRemoveFn]('mousemove', panelController.winMouseMove);
        window[addOrRemoveFn]('blur', panelController.winBlur);
        window[addOrRemoveFn]('mouseout', panelController.winMouseLeave);
//        getPanelContainer()[addOrRemoveFn]('mousedown', bpController.processMouseDown);
      }

      function setPanelExpandedState() {
        state.set('wasMouseInPanel', false);
        state.set('transitionTo', BP_CONST.PANEL_MODE);
        state.set('isRealSettings', true);    // Always use real settings once expanded
        state.set('featurePanelName', null);  // We're not in a feature panel
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
          // *** scp-panel ***
          // The panel is fully enlarged and ready to accept mouse input
          classBuilder += ' ' + BP_CONST.IS_PANEL;
        }

        // *** scp-want-panel ***
        // Sets larger panel sizes on everything.
        // It can take time to take effect because of the animation properties.
        classBuilder += ' ' + BP_CONST.WANT_PANEL + (state.isSecondaryPanel() ? ' ' + BP_CONST.MORE_ID : ' ' + BP_CONST.MAIN_ID);

        if (state.get('isKeyboardMode')) {
          // *** scp-keyboard ***
          // Keyboard mode is enabled and therefore current focus outline must be visible
          classBuilder += ' scp-keyboard';
        }

        return classBuilder + getSecondaryPanelClasses();
      };

      /*
       A feature panel is a special panel that is triggered from the secondary panel. It can be one of four things right now:
       Settings
       Tips
       Feedback
       About

       These can only be shown when the panel is large.
       */

      function getSecondaryPanelClasses() {
        var panelName = state.getSecondaryPanelName(),
          className =' scp-panel-' + panelName;
        if (state.get('currentSecondaryPanelMode')) {
          className += ' scp-is-secondary';
        }
        if (state.get('isSecondaryExpanding')) {
          className += ' scp-secondary-expanding';  // Growing in visual height
        }

        return className;
      }

      sitecues.on('bp/do-expand', expandPanel);

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
        toggleTemporaryHandlers(false);
      });

      // Unless callback() is queued, the module is not registered in global var modules{}
      // See: https://fecru.ai2.at/cru/EQJS-39#c187
      //      https://equinox.atlassian.net/browse/EQ-355
      callback();
    });

});