sitecues.def('bp/view/elements/about', function (about, callback) {
  'use strict';
  sitecues.use('bp/constants', 'bp/helper', function (BP_CONST, helper) {

    var byId = helper.byId;

    function onToggle(isActive) {
    }

    about.getCssValues = function(baseCssValues) {
      return baseCssValues;
    };


    sitecues.on('bp/did-toggle-about', onToggle);

    callback();

  });
});
