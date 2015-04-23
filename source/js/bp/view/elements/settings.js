sitecues.def('bp/view/elements/settings', function (settings, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', function (BP_CONST, state, helper, animate, transform) {

    function toggleSettings () {
      console.log('toggleSettings');
    }

    sitecues.on('bp/toggle-settings', toggleSettings);

    callback();
  });
});
