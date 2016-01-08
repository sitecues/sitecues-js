define(['bp-toolbar/close-button'], function(closeButton) {
  var isInitialized;

  /**
   * Basic structure of badge:
   * TODO: Need to update this
   * Create a new badge element outside of the body to use it for panel state.
   This occurs when the page did not supply a #sitecues-badge page
   Create and insert a new one as a sibling to body for later usage.
   * <span #sitecues-badge>
   *    <svg>
   * </span>
   * @returns {Object}
   */
  function createToolbar() {

    var toolbarElement = document.createElement('sc'),
      docElem = document.documentElement;

    docElem.setAttribute('data-sitecues-toolbar', ''); // Enable default.css rules
    docElem.insertBefore(toolbarElement, docElem.childNodes[0]);

    helper.setAttributes(toolbarElement, BP_CONST.DEFAULT_TOOLBAR_ATTRS);
    ensureBodyBelowToolbar();

    state.set('isPageBadge', false);
    state.set('isToolbarBadge', true);

    if (!isToolbarUIRequested()) {
      console.log('No element with #sitecues-badge provided by page. Backup badge inserted. Contact support@sitecues.com for support.');
    }

    adjustFixedElementsBelowToolbar(toolbarElement);

    return toolbarElement;
  }

  // TODO Aaron hates this:
  // - it doesn't work that well across sites
  // - it's heavy in the page
  // - it causes us to load the page-features module just because we have a toolbar
  function adjustFixedElementsBelowToolbar(toolbarElement) {
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

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    closeButton.init();
  }

  return {
    init: init
  };
});
