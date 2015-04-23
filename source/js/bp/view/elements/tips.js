sitecues.def('bp/view/elements/tips', function (tips, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/model/state', 'bp/helper', 'animate', 'util/transform', function (BP_CONST, state, helper, animate, transform) {

    function toggleTips () {
      console.log('Toggle tips');
    }

    sitecues.on('bp/toggle-tips', toggleTips);

    callback();
  });
});
