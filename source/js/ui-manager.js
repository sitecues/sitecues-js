/**
 * The function of this module is to contain the logic around which UI is shown,
 * if any, so we don't have to split and duplicate that logic across the
 * choices.
 */
sitecues.def( 'ui-manager', function (uiManager, callback, log) {
  sitecues.use( 'jquery', 'conf', 'toolbar', 'badge', function ($, conf, toolbar, badge) {

    // The toggling state.  If true an active toggle is underway and calls to
    // toggle() will be ignored.
    var toggling = false;

    // Tracks whether or not the user has interacted with the panel this badge session.
    var panelInteractionDetected = false;
    
    // The UI states.
    var STATES = {
      // The badge is displayed.
      BADGE:  {
        id:   1,
        name: 'badge'
      },
      // The toolbar is displayed.
      TOOLBAR: {
        id:   2,
        name: 'toolbar'
      }
    };
    var DEFAULT_STATE = STATES.TOOLBAR;

    // The UI modes.
    var MODES = {
      // Always display the badge first.
      BADGE:  {
        id:   101,
        name: 'badge'
      },
      // Always display the toolbar first.
      TOOLBAR: {
        id:   102,
        name: 'toolbar'
      },
      // Display the badge, then transfer to the toolbar on interaction. Remember the user's choice if a toggle occurs.
      AUTO:  {
        id:   103,
        name: 'auto'
      }
    };
    var DEFAULT_MODE = MODES.AUTO;

    // Converts a name into the instance property of the provided object with the same name.
    // Returns the default if there is no match.
    var nameToInstance = function(name, instances, defaultInstance) {
      for (var k in instances) {
        var i = instances[k];
        if (i.name && (i.name == name)) {
          return i;
        }
      }
      return defaultInstance;
    };

    /**
     * Converts a string to a STATE instance.
     */
    var toState = function (name) {
      return nameToInstance(name, STATES, DEFAULT_STATE);
    };

    /**
     * Converts a string to a MODE instance.
     */
    var toMode = function (name) {
      return nameToInstance(name, MODES, DEFAULT_MODE);
    };

    // Determine the UI mode.
    var MODE = toMode(conf.get('ui_mode'));

    // Determine the initial state.
    var determineInitialState = function() {
      if (MODE === MODES.AUTO) {
        // In auto mode, use the users selected UI, or 'badge' if a selection does not exist.
        var userUISelection = conf.get('userUISelection');
        log.info("User UI selection: " + userUISelection);
        return nameToInstance(userUISelection, STATES, STATES.BADGE);
      }
      // Convert the mode to the initial state.
      return toState(MODE.name);
    };
    var currentState = determineInitialState();
    log.info("Initial UI: " + currentState.name);

    /**
     * Switches UI. Right now there are only two, so it just alternates, but if
     * there are more than two this should iterate through them.
     */
    var toggle = function () {
      if(toggling) {
        log.info('Toggle call ignored');
        return;
      }
      toggling = true;
      innerToggle(function() {
        toggling = false;
      });
      // Safety mechanism to revert if something above fails to execute
      // the callback.
      setTimeout(function() {
        toggling = false;
      }, 2000);
    };

    /**
     * Switches UI. Right now there are only two, so it just alternates, but if
     * there are more than two this should iterate through them.
     */
    var innerToggle = function (callback) {
      log.info("Toggling UI from " + currentState.name);
      panelInteractionDetected = false;
      switch (currentState) {
        case STATES.BADGE:
          currentState = STATES.TOOLBAR;
          conf.set('userUISelection', currentState.name);
          badge.disable(function() {
              toolbar.enable(true);
              callback();
          });
          break;
        default: // case STATES.TOOLBAR:
          currentState = STATES.BADGE;
          conf.set('userUISelection', currentState.name);
          toolbar.disable(function() {
              badge.enable(true);
              callback();
          });
          break;
      }
      log.info("UI set to " + currentState.name);
    };

    $(document).ready(function () {
      log.info("Initializing UI");
      // console.log('doc ready');

      switch (currentState) {
        case STATES.BADGE:
          log.info("Initial UI State: " + STATES.BADGE.name);
          // Note that we update the current state first, to deal with
          // button mashing, since the disabling/enabling are most likely
          // going to involve async behavior.
          toolbar.disable(function(s) {
              badge.enable(true);
          });
          break;
        default: // case STATES.TOOLBAR:
          log.info("Initial UI State: " + STATES.TOOLBAR.name);
          badge.disable(function() {
          
          sitecues.on('core/allModulesLoaded', function(){
            toolbar.enable(true);
          });


          });
          break;
      }
    });

    // Toggle when requested.
    sitecues.on('ui/toggle', toggle);

    // Set up some listeners specific to AUTO mode.
    if (MODE === MODES.AUTO) {
      // Track if the user interacts with the panel.
      sitecues.on('panel/interaction', function() {
        panelInteractionDetected = true;
      });

      // If the user interacts with the panel, transfer to the toolbar on panel close.
      sitecues.on('panel/hide', function() {
        if (panelInteractionDetected) {
          toggle();
        }
      });
    }

    callback();
  });
});
