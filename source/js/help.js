// The 'help' module manages the display that shows the help. The help display is populated using external
// content obtained via the user preferences server.

// TODO: Most if not all of the HLB state tracking in this module should be handled by the HLB itself,
// but best not go messing around too much with the internals of the HLB right before a release and
// with another developer trying to fix other issues in the HLB.

sitecues.def('help', function(help, callback, log) {
  // The URL of the help contents.
  var HELP_CONTENTS_ENDPOINT = '//' + sitecues.coreConfig.hosts.up + '/helpContents';

  // Initial inset of the help HLB once it is added to the page.
  var HELP_FRAME_INIT_INSET = 50;

  // Help states.
  var STATES = help.STATES = {

    // The help HLB is closed.
    CLOSED: {
      id : 1,
      name : 'closed'
    },

    // The help HLB is in the process of opening.
    OPENING: {
      id : 2,
      name : 'opening'
    },

    // The help HLB is open.
    OPEN: {
      id : 4,
      name : 'open'
    },

    // The help HLB is closing.
    CLOSING: {
      id : 8,
      name : 'closing'
    },

    // The help HLB is waiting for the deflating HLB to close so that it can open.
    WAITING_FOR_CLOSE: {
      id : 16,
      name : 'waitingForClose'
    },

    // The help HLB is waiting for the inflating HLB to open so that it can close that HLB and open itself.
    // A VERY UNLIKELY STATE, BUT WE MUST ACCOUNT FOR IT.
    WAITING_FOR_OPEN: {
      id : 32,
      name : 'waitingForOpen'
    }
  };

  // Initially, help are closed.
  var state = STATES.CLOSED;

  // Assemble the help contents
  sitecues.use('jquery', 'highlight-box', 'util/positioning', 'conf', 'load', function(jq, hlb, pos, conf, load) {
    jq.ajax({
      type: 'GET',
      url:  HELP_CONTENTS_ENDPOINT,
      success: function(data) {
        var helpConfig = jq.extend(true, {}, data);

        // Load the help styles.
        if (helpConfig.cssFiles) {
          for (var i = 0; i < helpConfig.cssFiles.length; i++) {
            load.style(helpConfig.cssFiles[i]);
          }
        }

        // Create the help container
        var helpFrame = jq(helpConfig.content).css({
          position: 'absolute'
        }).hide().prependTo('body');

        // Used to track if HLB close events relate to help.
        var hlbHelpTarget = helpFrame.get(0);

        // Set the initial CSS of the help element before it is added to the DOM.
        var setInitialCss = function(jqObj) {
          var zoom = conf.get('zoom');
          var viewport = pos.getViewportDimensions(0, zoom);
          var insetViewport = pos.getViewportDimensions(HELP_FRAME_INIT_INSET, zoom);
          var width = helpConfig.width || insetViewport.width;
          var left = (viewport.width - width) / 2;
          jqObj.css({
            width: width,
            height: helpConfig.height || insetViewport.height,
            left: left,
            top: HELP_FRAME_INIT_INSET * zoom * 1.75
          });
        };

        // We need to swap out to transform rather than zoom so that iframe scrolling works.
        sitecues.on('help/open', function() {
          var totalZoom = pos.getTotalZoom(helpFrame);
          helpFrame.find('iframe').style('zoom', '' + (1.0 / totalZoom), 'important').css({
            transform: 'scale(' + totalZoom + ')',
            transformOrigin: '0 0'
          });
        });

        // Swap back to zoom so that the deflate works.
        sitecues.on('help/closing', function() {
          var totalZoom = pos.getTotalZoom(helpFrame);
          helpFrame.find('iframe').css({
            zoom: totalZoom,
            transform: ''
          });
        });

        // Opens a target in the HLB.
        var openHlb = function(target, options) {
          var event = {
            hlb_options: options || {},
            dom: {
              hlb_target: target
            }
          };
          sitecues.emit('highlight/animate', event);
        };

        // Closes the current HLB.
        var closeHlb = function(target, force) {
          var event = {};
          sitecues.emit('highlight/animate', event);
        };

        // Opens the help HLB.
        var openHelpHlb = function() {
          state = STATES.OPENING;
          setInitialCss(helpFrame);
          helpFrame.show();
          sitecues.emit('help/opening', help);
          openHlb(hlbHelpTarget, {
            force: true,
            suppress_tts: true,
            suppress_mouse_out: true,
            close_button: true
          });
        };

        // Finalize the closing of the help display.
        var finalizeOpen = function() {
          state = STATES.OPEN;
          sitecues.emit('help/open');
        };

        // Close the existing HLB, and remember it, so that we can reopen it when done.
        var previousHlbTarget = null;
        var closeExistingHlb = function() {
          previousHlbTarget = hlb.getCurrentTarget();
          state = STATES.WAITING_FOR_CLOSE;
          sitecues.emit('highlight/animate', {});
        };

        // Finalize the closing of the help display.
        var finalizeClose = function() {
          state = STATES.CLOSED;
          helpFrame.hide();
          sitecues.emit('help/closed');
          // If there was a previous HLB, reinstate it.
          if (previousHlbTarget) {
            var tmp = previousHlbTarget;
            previousHlbTarget = null;
            openHlb(previousHlbTarget);
          }
        };

        // Helper bit-masks to use in HLB state comparisons.
        var HLB_ON_OFF_CLOSED_IDS = (hlb.STATES.ON.id | hlb.STATES.OFF.id | hlb.STATES.CLOSED.id);
        var HLB_CREATE_INFLATING_IDS = (hlb.STATES.CREATE.id | hlb.STATES.INFLATING.id);

        // Given the internal workings of this module, it needs to listen on all HLB events.
        var onHlbEvent = function(event) {
          var hlbState = hlb.getState();

          if (state === STATES.CLOSED) {
            // Nothing to do in this state.
          } else if (state == STATES.CLOSING) {
            // See if the help HLB has finished closing.
            if ((hlbState.id & HLB_ON_OFF_CLOSED_IDS) != 0) {
              finalizeClose();
            }
          } else if (state == STATES.OPENING) {
            // If the HLB is ready, we are now in the open state.
            if (hlbState === hlb.STATES.READY) {
              finalizeOpen();
            }
          } else if (state === STATES.OPEN) {
            // If the HLB is deflating, the help HLB is entering the closing state
            if (hlbState === hlb.STATES.DEFLATING) {
              state = STATES.CLOSING;
              sitecues.emit('help/closing', help);
            }
          } else if (state === STATES.WAITING_FOR_OPEN) {
            // If the HLB is ready, we must close it and enter the "waiting to close" state.
            if (hlbState === hlb.STATES.READY) {
              // Close the
              state = STATES.OPEN;
              sitecues.emit('help/open', help);
            }
          } else if (state === STATES.WAITING_FOR_CLOSE) {
            // If there is now no HLB, open the help HLB.
            if ((hlbState.id & HLB_ON_OFF_CLOSED_IDS) != 0) {
              openHelpHlb();
            }
          }
        };
        // It would be nice to have an 'hlb/*' listener, but, again, not adding that RIGHT before a release.
        sitecues.on('hlb/create',    onHlbEvent);
        sitecues.on('hlb/inflating', onHlbEvent);
        sitecues.on('hlb/ready',     onHlbEvent);
        sitecues.on('hlb/deflating', onHlbEvent);
        sitecues.on('hlb/closed',    onHlbEvent);

        // Tie into the event for displaying the help.
        var onShow = function() {
          // We only start the 'show' process when the help is closed.
          if (state === STATES.CLOSED) {
            // We can enter 3 states, depending on the state of the HLB.
            var hlbState = hlb.getState();
            if ((hlbState.id & HLB_ON_OFF_CLOSED_IDS) != 0) {
              // There is no HLB, start opening the help HLB.
              openHelpHlb();
            } else if (hlbState === hlb.STATES.DEFLATING) {
              // An HLB is closing, so open help when it is done.
              state = STATES.WAITING_FOR_CLOSE;
            } else if (hlbState === hlb.STATES.READY) {
              closeExistingHlb();
            } else if ((hlbState.id & HLB_CREATE_INFLATING_IDS) != 0) {
              // VERY UNLIKELY STATE, BUT WE MUST ACCOUNT FOR IT: The HLB is in the process of opening.
              // Wait for it to complete, then close it and open the help.
              state = STATES.WAITING_FOR_OPEN;
            }

            // For all intents and purposes, as far as other modules are concerned, the help HLB is opening.
            sitecues.emit('help/opening', help);
          }
        };
        sitecues.on('help/show', onShow);

        // Tie into the event for hiding the help.
        var onHide = function() {
          if (state === STATES.OPEN) {
            state = STATES.CLOSING;
            sitecues.emit('help/closing');
            close();
          }
        };
        sitecues.on('help/hide', onHide);

        // Done defining the help module.
        console.log("HELP DEFINED.");
        callback();
      }
    });
  });
});
