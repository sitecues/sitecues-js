/**
 * Toolbar -- a type of badge that stretches across the page and is fixed position
 * This is created when the page did not supply a #sitecues-badge or isToolbarMode was set to true in the config.
 */
// TODO add a close button

define([
  'core/bp/constants',
  'core/bp/model/state',
  'core/bp/helper',
  'core/bp/view/palette',
  'core/bp/view/view'
],
  function(BP_CONST,
           state,
           helper,
           palette,
           baseView) {
  var TOOLBAR_HEIGHT = 38;

  function adjustFixedElementsBelowToolbar() {
    require(['page/zoom/util/body-geometry', 'page/positioner/positioner'], function (bodyGeo, positioner) {
      // In the case of the toolbar, we must always move fixed position elements
      // down, so that they are not obscured by our toolbar.
      bodyGeo.init(function () {
        positioner.init(TOOLBAR_HEIGHT);
      });
    });
  }

  function init() {
    var toolbarElement = document.createElement('sc'),
      docElem = document.documentElement;

    docElem.setAttribute('data-sitecues-toolbar', ''); // Enable default.css rules
    docElem.appendChild(toolbarElement);

    helper.setAttributes(toolbarElement, BP_CONST.DEFAULT_TOOLBAR_ATTRS);

    state.set('isPageBadge', false);
    state.set('isToolbarBadge', true);

    adjustFixedElementsBelowToolbar();

    return palette.init(null)
      .then(function() {
        baseView.init(toolbarElement);
      });
  }

  return {
    init: init
  };

});
