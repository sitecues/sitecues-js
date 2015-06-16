sitecues.def('bp/view/elements/tips', function (tips, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    tips.getGeometryTargets = function(cssValues) {
      return cssValues;
    };

    callback();

  });
});
