/**
 * The function of this module is to contain the logic around which UI is shown,
 * if any, so we don't have to split and duplicate that logic across the
 * choices.
 */
sitecues.def( 'ui-manager', function (uiManager, callback, log) {
  sitecues.use(
    'jquery',
    'conf',
    'toolbar',
    'badge',
    function (
        $,
      conf,
      toolbar,
      badge
    ) {

    uiManager.STATES = {
      AUTO:  {
        id:   0,
        name: 'auto'
      },
      BADGE:  {
        id:   1,
        name: 'badge'
      },
      TOOLBAR: {
        id:   2,
        name: 'toolbar'
      }
    };

    // The toggling state.  If true an active toggle is underway and calls to 
    // toggle() will be ignored.
    uiManager.toggling = false;

    uiManager.currentState = uiManager.STATES.AUTO;

    /**
     * Determines which UI should be used based on defaults and settings.
     *
     * @return uiManager.STATES The UI which should currently be used.
     */
    uiManager.getDefault = function () {
        // This is the global default setting for the UI.
        var defaultUI = conf.get('defaultUI');
        // This is the site-specific setting for the UI.
        var siteUI = conf.get('siteUI');

        if (siteUI) {
            // This site has a UI setting
            return uiManager.toState(siteUI);
        } else if (defaultUI) {
            // This site does not have a UI setting, but there is a global
            // default.
            return uiManager.toState(siteUI);
        }
        // Nothing is set.
        return uiManager.STATES.AUTO;
    };

    /**
     * Converts a string to an enum.
     */
    uiManager.toState = function (stateName) {
        switch (stateName) {
            case "badge":
                return uiManager.STATES.BADGE;
            case "toolbar":
                return uiManager.STATES.TOOLBAR;
            default:
                return uiManager.STATES.AUTO;
        }
    };

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
        // Safety mechanism to revert if something above failes to execute
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
        var state = uiManager.currentState;
        log.info("Toggling UI from " + state.name);
        switch (state) {
            case uiManager.STATES.BADGE:
                uiManager.currentState = uiManager.STATES.TOOLBAR;
                conf.set('siteUI', uiManager.STATES.TOOLBAR.name);
                badge.disable(function() {
                    toolbar.enable(true);
                    callback();
                });
                break;
            case uiManager.STATES.TOOLBAR:
                uiManager.currentState = uiManager.STATES.BADGE;
                conf.set('siteUI', uiManager.STATES.BADGE.name);
                toolbar.disable(function() {
                    badge.enable(true);
                    callback();
                });
                break;
            default:
                // AKA uiManager.STATES.AUTO This probably shouldn't happen if
                // the init part happened properly, but we'll handle it anyways.
                uiManager.currentState = uiManager.STATES.BADGE;
                conf.set('siteUI', uiManager.STATES.BADGE.name);
                toolbar.disable(function() {
                    badge.enable(true);
                    callback();
                });
        }
        log.info("UI set to " + uiManager.currentState.name);
    }

    // FIXME: We shouldn't have to run `toolbar.show()` in `setTimeout()`.
    // #EQ-622 might be the solution.
    $(document).ready(function () {
        log.info("Initializing UI");
        var state = uiManager.getDefault();
        switch (state) {
            case uiManager.STATES.BADGE:
                log.info("Initial UI State: " + uiManager.STATES.BADGE.name);
                // Note that we update the current state first, to deal with
                // button mashing, since the disabling/enabling are most likely
                // going to involve async behavior.
                uiManager.currentState = uiManager.STATES.BADGE;
                toolbar.disable(function() {
                    badge.enable(true);
                });
                break;
            case uiManager.STATES.TOOLBAR:
                log.info("Initial UI State: " + uiManager.STATES.TOOLBAR.name);
                uiManager.currentState = uiManager.STATES.TOOLBAR;
                badge.disable(function() {
                    toolbar.enable(true);
                });
                break;
            default:
                // AKA uiManager.STATES.AUTO
                log.info("Initial UI State: " + uiManager.STATES.BADGE.name + " (Auto)");
                uiManager.currentState = uiManager.STATES.BADGE;
                toolbar.disable(function() {
                    badge.enable(true);
                });
        }
    });

    sitecues.on('ui/toggle', uiManager.toggle);

    callback();

  });
});
