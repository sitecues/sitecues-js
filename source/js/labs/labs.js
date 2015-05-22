/**
 * This is the "labs" experimental featurs module
 * It manages and provides settings for experimental features.
 * Turn turn on/off experimental features visit sitecues.com/html/labs.html
 *
 * NOTE: currently we are not using/building this
 */

sitecues.def('labs', function (labs, callback) {
  
  'use strict';
  
  sitecues.use('conf', 'jquery', function(conf, $) {

    var labSettings = $.extend({}, conf.get('labs'));

    labs.isEnabled = function(labName) {
      return labSettings[labName];
    };

    sitecues.on('labs/get', function(labInfo) {
      $.extend(labInfo, labSettings);
    });

    sitecues.on('labs/set', function(labInfo) {
      labSettings = $.extend({}, labInfo);
      conf.set('labs', labSettings);
    });

    callback();
  });
});
