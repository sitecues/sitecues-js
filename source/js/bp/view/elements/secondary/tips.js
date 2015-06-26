sitecues.def('bp/view/elements/tips', function (tips, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    var byId = helper.byId;

    tips.getGeometryTargets = function(cssValues) {
      return cssValues;
    };

    function doAnimation() {

    }

    callback();
  });
});
