/**
 * Badge glow feature
 * - Badge glows based on mouse shake
 */
define([
  'core/events'
], function(events) {

  function init() {
    events.on('shake/did-pass-threshold', sitecues.expandPanel);
  }

  return {
    init: init
  };
});

