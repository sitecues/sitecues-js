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
    // TODO Make this work better:
    // - it doesn't work that well across sites
    // - it's heavy in the page
    // - it causes us to load the page-features module just because we have a toolbar
    require(['page/zoom/fixed-position-fixer'], function(fixer) {
      // However, in the case of the toolbar, we must always move fixed position elements
      // down. As this process requires the style-service, when the toolbar is inserted,
      // we will initialize the style service immediately.
      document.body.style.position = 'relative';
      fixer.init(TOOLBAR_HEIGHT);
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
