/**
 * Toolbar -- a type of badge that stretches across the page and is fixed position
 * This is created when the page did not supply a #sitecues-badge or isToolbarMode was set to true in the config.
 */
// TODO add a close button

define(['core/bp/constants', 'core/bp/model/state', 'core/bp/helper', 'core/bp/view/view'], function(BP_CONST, state, helper, baseView) {
  var isInitialized;

  function getPalette(callbackFn) {
    callbackFn(BP_CONST.PALETTE_NAME_MAP.normal);
  }

  function adjustFixedElementsBelowToolbar(toolbarElement) {
    // TODO Make this work better:
    // - it doesn't work that well across sites
    // - it's heavy in the page
    // - it causes us to load the page-features module just because we have a toolbar
    require(['page/zoom/fixed-position-fixer'], function(fixer) {
      // However, in the case of the toolbar, we must always move fixed position elements
      // down. As this process requires the style-service, when the toolbar is inserted,
      // we will initialize the style service immediately.
      document.body.style.position = 'relative';
      fixer.init(toolbarElement.offsetHeight);
    });
  }

  // In some cases body may be positioned absolutely above the toolbar
  function ensureBodyBelowToolbar() {
    var body = document.body;
    if (body) {
      if (getComputedStyle(body).position !== 'static' &&
        body.getBoundingClientRect().top < 41) {
        body.setAttribute('data-sc-extra-toolbar-bump', '');
      }
    }
    else {
      // Wait for body. There will always be one after DOMContentLoaded,
      // because the browser inserts one if the markup didn't provide it.
      document.addEventListener('DOMContentLoaded', ensureBodyBelowToolbar);
    }
  }

  function init(onComplete) {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    var toolbarElement = document.createElement('sc'),
      docElem = document.documentElement;

    docElem.setAttribute('data-sitecues-toolbar', ''); // Enable default.css rules
    docElem.insertBefore(toolbarElement, docElem.childNodes[0]);

    helper.setAttributes(toolbarElement, BP_CONST.DEFAULT_TOOLBAR_ATTRS);

    ensureBodyBelowToolbar();

    state.set('isPageBadge', false);
    state.set('isToolbarBadge', true);

    adjustFixedElementsBelowToolbar(toolbarElement);

    baseView.init(toolbarElement, onComplete);
  }

  return {
    init: init,
    getPalette: getPalette
  };
});
