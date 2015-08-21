/**
 * This is the "labs" experimental featurs module
 * It manages and provides settings for experimental features.
 * Turn turn on/off experimental features visit sitecues.com/html/labs.html
 *
 * NOTE: currently we are not using/building this
 */

define(['conf/user/manager', 'jquery'], function(conf, $) {
  
  'use strict';
  

  var labSettings = $.extend({}, conf.get('labs'));

  function isEnabled(labName) {
    return labSettings[labName];
  }

  sitecues.on('labs/get', function(labInfo) {
    $.extend(labInfo, labSettings);
  });

  sitecues.on('labs/set', function(labInfo) {
    labSettings = $.extend({}, labInfo);
    conf.set('labs', labSettings);
  });
  var publics = {
    isEnabled: isEnabled
  };

  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});
