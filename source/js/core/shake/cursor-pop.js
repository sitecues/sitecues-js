/**
 * Cursor pop feature
 * - Badge grows based on mouse shake
 */
define([
  'core/events'
], function(events) {

  var didInitCursor;

  function onShakePassedThreshold() {
    if (!didInitCursor) {
      require(['page/cursor/cursor'], function (cursor) {
        cursor.init();
      });
      didInitCursor = true;
    }
  }

  function init() {
    events.on('shake/did-pass-threshold', onShakePassedThreshold);
  }

  return {
    init: init
  };
});

