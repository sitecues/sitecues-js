"use strict";

/**
 * This is the "labs" experimental featurs module
 * It manages and provides settings for experimental features.
 * Turn turn on/off experimental features visit sitecues.com/html/labs.html
 *
 * NOTE: currently we are not using/building this
 */
sitecues.define("labs/labs", [ "run/conf/preferences", "$", "run/events" ], function(pref, $, events) {
  var labSettings = $.extend({}, pref.get("labs"));
  function isEnabled(labName) {
    return labSettings[labName];
  }
  events.on("labs/get", function(labInfo) {
    $.extend(labInfo, labSettings);
  });
  events.on("labs/set", function(labInfo) {
    labSettings = $.extend({}, labInfo);
    pref.set("labs", labSettings);
  });
  return {
    isEnabled: isEnabled
  };
});

sitecues.define("labs", function() {});
//# sourceMappingURL=labs.js.map