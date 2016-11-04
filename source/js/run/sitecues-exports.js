define(
  [
    'run/constants',
    'run/events'
  ],
  function (
    constants,
    events
  ) {
  'use strict';

  // Enums for sitecues loading state
  var state = constants.READY_STATE;

  // This function is called when we are sure that no other library already exists in the page. Otherwise,
  // we risk overwriting the methods of the live library.
  function init(isOn) {
    // Events
    //Currently used on Chicago Lighthouse, we should discourage customer use of public event API
    //in preparation for changing it in the future
    sitecues.on   = events.on;     // Start listening for an event.
    sitecues.emit = events.emit;   // Tell listeners about an event.
    sitecues.off  = events.off;    // Stop listening for an event.

    // Get info about the currently running sitecues client
    sitecues.status = getStatus;
    sitecues.getVersion = getVersion;
    sitecues.isOn = isOn;

    // Control BP expansion
    sitecues.expandPanel = expandPanel;
    sitecues.shrinkPanel = shrinkPanel;

    // Sitecues reset
    sitecues.reset = function() {};  // noop unless page module is loaded (if not loaded, there is nothing to reset)

    //Loading state enumerations
    sitecues.readyStates = state;

    // 'Plant our flag' on this page.
    sitecues.exists = true;
  }

  function expandPanel() {
    require(['run/bp/controller/expand-controller'], function(expandController) {
      expandController.expandPanel();
    });
  }

  function shrinkPanel() {
    require(['bp-expanded/controller/shrink-controller'], function(shrinkController) {
      shrinkController.shrinkPanel();
    });
  }

  function getVersion() {
    return sitecues.version;
  }

  function getStatus() {
    var args = arguments;
    require(['status/status'], function(statusFn) {
      statusFn.apply(this, args);
    });
  }

  return {
    init: init
  };
});
