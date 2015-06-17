sitecues.def('bp/view/elements/tips', function (tips, callback) {
  'use strict';
//  sitecues.use('bp/constants', function (BP_CONST) {

    tips.getGeometryTargets = function(cssValues) {
      return cssValues;
    };

    callback();
//  });
});
