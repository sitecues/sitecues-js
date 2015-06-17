sitecues.def('bp/view/elements/tips', function (tips, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', 'bp/model/state', 'bp/view/elements/cards',
    function (BP_CONST, helper, state, cards) {

    tips.getGeometryTargets = function(cssValues) {
      return cssValues;
    };

    function onPanelUpdate() {
      var isActive = state.getSecondaryPanelName() === 'tips';

      cards.toggleActive(isActive, 'tips');
    }

    sitecues.on('bp/do-update', onPanelUpdate);

    callback();

  });
});
