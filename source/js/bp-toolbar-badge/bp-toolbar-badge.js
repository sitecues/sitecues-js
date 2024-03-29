/**
 * Toolbar -- a type of badge that stretches across the page and is fixed position
 * This is created when the page did not supply a #sitecues-badge or isToolbarMode was set to true in the config.
 */
// TODO add a close button

define(
  [
    'Promise',
    'run/conf/site',
    'run/bp/constants',
    'run/bp/model/state',
    'run/bp/helper',
    'run/bp/view/palette',
    'run/bp/view/view'
  ],
  function (
    Promise,
    site,
    BP_CONST,
    state,
    helper,
    palette,
    baseView
  ) {
  'use strict';

  var TOOLBAR_HEIGHT = 38;

  function adjustFixedElementsBelowToolbar() {
    return new Promise(function (resolve) {
      require(['page/positioner/positioner', 'page/viewport/scrollbars'], function (positioner, scrollbars) {
        // In the case of the toolbar, we must always move fixed position elements
        // down, so that they are not obscured by our toolbar.
        scrollbars.init();
        positioner.initFromToolbar(resolve, TOOLBAR_HEIGHT);
      });
    });
  }

  function init() {
    var toolbarElement = document.createElement('sc'),
      docElem = document.documentElement;

    function insertOptionsMenu() {
      if (site.get('hasOptionsMenu')) {
        // Can do this async -- no need to hold up the rest of our initialization
        require(['bp-toolbar-menu-button/bp-toolbar-menu-button'], function (bpToolbarMenuButton) {
          bpToolbarMenuButton.init(toolbarElement);
        });
      }
    }

    docElem.setAttribute('data-sitecues-toolbar', ''); // Enable default.css rules
    docElem.appendChild(toolbarElement);

    helper.setAttributes(toolbarElement, BP_CONST.DEFAULT_TOOLBAR_ATTRS);

    state.set('isPageBadge', false);
    state.set('isToolbarBadge', true);

    return palette.init(null)
      .then(function() {
        baseView.init(toolbarElement);
      })
      .then(adjustFixedElementsBelowToolbar)
      .then(insertOptionsMenu);
  }

  return {
    init: init
  };

});
