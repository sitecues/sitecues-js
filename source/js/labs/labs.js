/**
 * This is the "labs" experimental featurs module
 * It manages and provides settings for experimental features.
 * Turn turn on/off experimental features visit sitecues.com/html/labs.html
 *
 * NOTE: currently we are not using/building this
 */

define(
  [
    'core/conf/user/manager',
    '$',
    'core/events'
  ],
  function (
    conf,
    $,
    events
  ) {
  'use strict';

  var labSettings = $.extend({}, conf.get('labs'));

  function isEnabled(labName) {
    return labSettings[labName];
  }

  events.on('labs/get', function(labInfo) {
    $.extend(labInfo, labSettings);
  });

  events.on('labs/set', function(labInfo) {
    labSettings = $.extend({}, labInfo);
    conf.set('labs', labSettings);
  });

  return {
    isEnabled: isEnabled
  };
});
