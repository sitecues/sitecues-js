"use strict";

/**
 * Toolbar -- a type of badge that stretches across the page and is fixed position
 * This is created when the page did not supply a #sitecues-badge or isToolbarMode was set to true in the config.
 */
// TODO add a close button
sitecues.define("bp-toolbar-badge/bp-toolbar-badge", [ "Promise", "run/bp/constants", "run/bp/model/state", "run/bp/helper", "run/bp/view/palette", "run/bp/view/view" ], function(Promise, BP_CONST, state, helper, palette, baseView) {
  var TOOLBAR_HEIGHT = 38;
  function adjustFixedElementsBelowToolbar() {
    return new Promise(function(resolve) {
      sitecues.require([ "page/positioner/positioner", "page/viewport/scrollbars" ], function(positioner, scrollbars) {
        // In the case of the toolbar, we must always move fixed position elements
        // down, so that they are not obscured by our toolbar.
        scrollbars.init();
        positioner.initFromToolbar(resolve, TOOLBAR_HEIGHT);
      });
    });
  }
  function init() {
    var toolbarElement = document.createElement("sc"), docElem = document.documentElement;
    docElem.setAttribute("data-sitecues-toolbar", "");
    // Enable default.css rules
    docElem.appendChild(toolbarElement);
    helper.setAttributes(toolbarElement, BP_CONST.DEFAULT_TOOLBAR_ATTRS);
    state.set("isPageBadge", false);
    state.set("isToolbarBadge", true);
    return palette.init(null).then(function() {
      baseView.init(toolbarElement);
    }).then(adjustFixedElementsBelowToolbar);
  }
  return {
    init: init
  };
});

sitecues.define("bp-toolbar-badge", function() {});
//# sourceMappingURL=bp-toolbar-badge.js.map