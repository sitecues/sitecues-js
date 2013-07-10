/**
 * The function of this module is to contain the logic around which UI is shown,
 * if any, so we don't have to split and duplicate that logic across the
 * choices.
 */
sitecues.def( 'ui-manager', function (uiManager, callback, log) {
  sitecues.use( 'jquery', 'conf', 'toolbar', 'badge', function ($, conf, toolbar, badge) {

    // The toggling state.  If true an active toggle is underway and calls to
    // toggle() will be ignored.
    uiManager.toggling = false;

    uiManager.STATES = {
      //AUTO:  {
      //  id:   0,
      //  name: 'auto'
      //},

      // Display the badge.
      BADGE:  {
        id:   1,
        name: 'badge'
      },

      // Display the toolbar.
      TOOLBAR: {
        id:   2,
        name: 'toolbar'
      }
    };

    /**
     * Converts a string to an enum.
     */
    uiManager.toState = function (stateName) {
      switch (stateName) {
        case "badge":
          return uiManager.STATES.BADGE;
        default: //case "toolbar":
          return uiManager.STATES.TOOLBAR;
        //default:
        //  return uiManager.STATES.AUTO;
      }
    };

    // Determine the initial state.
    var determineInitialState = function() {
      // This is the user-specified setting for the UI.
      var userUI = conf.get('userUI');
      log.info("User UI: " + userUI);

      // This is the site-provided setting for the UI.
      var siteUI = conf.get('ui') || conf.get('defaultUI'); // 'defaultUI' is included for backwards compatibility
      log.info("Site UI: " + siteUI);

      if (userUI) {
        // This site does not have a UI setting, but the user has a preference.
        return uiManager.toState(userUI);
      } else if (siteUI) {
        // The site is providing the UI to use.
        return uiManager.toState(siteUI);
      }
      // Default is toolbar.
      return uiManager.STATES.TOOLBAR;
    };
    var currentState = determineInitialState();

    log.info("Initial UI: " + currentState.name);

    /**
     * Switches UI. Right now there are only two, so it just alternates, but if
     * there are more than two this should iterate through them.
     */
    uiManager.toggle = function () {
        if(uiManager.toggling) {
            log.info('Toggle call ignored');
            return;
        }
        uiManager.toggling = true;
        uiManager.innerToggle(function() {
            uiManager.toggling = false;
        });
        // Safety mechanism to revert if something above fails to execute
        // the callback.
        setTimeout(function() {
           uiManager.toggling = false; 
       }, 2000);
    };
    /**
     * Switches UI. Right now there are only two, so it just alternates, but if
     * there are more than two this should iterate through them.
     */
    uiManager.innerToggle = function (callback) {
        uiManager.toggling = true;
        log.info("Toggling UI from " + currentState.name);
        switch (currentState) {
            case uiManager.STATES.BADGE:
                currentState = uiManager.STATES.TOOLBAR;
                conf.set('userUI', currentState.name);
                badge.disable(function() {
                    toolbar.enable(true);
                    callback();
                });
                break;
          default: // case uiManager.STATES.TOOLBAR:
                currentState = uiManager.STATES.BADGE;
                conf.set('userUI', currentState.name);
                toolbar.disable(function() {
                    badge.enable(true);
                    callback();
                });
                break;
            //default:
                // AKA uiManager.STATES.AUTO This probably shouldn't happen if
                // the init part happened properly, but we'll handle it anyways.
            //    currentState = uiManager.STATES.BADGE;
            //    conf.set('siteUI', uiManager.STATES.BADGE.name);
            //    toolbar.disable(function() {
            //        badge.enable(true);
            //        callback();
            //    });
        }
        log.info("UI set to " + currentState.name);
        // In case the user is using the extension, inform the preferences server that the user has chosen a UI.
        $.post('//' + sitecues.getCoreConfig().hosts.up + '/preferences', { ui: "user" });
    };

    // FIXME: We shouldn't have to run `toolbar.show()` in `setTimeout()`.
    // #EQ-622 might be the solution.
    $(document).ready(function () {
        log.info("Initializing UI");
        switch (currentState) {
            case uiManager.STATES.BADGE:
                log.info("Initial UI State: " + uiManager.STATES.BADGE.name);
                // Note that we update the current state first, to deal with
                // button mashing, since the disabling/enabling are most likely
                // going to involve async behavior.
                toolbar.disable(function() {
                    badge.enable(true);
                });
                break;
            default: // case uiManager.STATES.TOOLBAR:
                log.info("Initial UI State: " + uiManager.STATES.TOOLBAR.name);
                badge.disable(function() {
                    toolbar.enable(true);
                });
                break;
            //default:
                // AKA uiManager.STATES.AUTO
            //    log.info("Initial UI State: " + uiManager.STATES.BADGE.name + " (Auto)");
            //    toolbar.disable(function() {
            //        badge.enable(true);
            //    });
        }
    });

    sitecues.on('ui/toggle', uiManager.toggle);

    callback();
  });
});
