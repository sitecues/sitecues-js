/**
 * Optional menu button for the toolbar, created if sitecues.config.hasOptionsMenu is truthy
 */

define([
  'run/conf/urls',
  'run/dom-events',
  'run/locale',
  'run/constants',
  'Promise',
  'mini-core/native-global'
  ],
  function(urls,
           domEvents,
           locale,
           CORE_CONST,
           Promise,
           nativeGlobal) {

  var menuButtonElement,
    hideTimeout,
    bpToolbarMenu,
    KEY_CODES = CORE_CONST.KEY_CODE,
    WAIT_BEFORE_CLOSE_MS = 300,
    lastOpenTime;

  function insertSheet(name) {
    return new Promise(function(resolve, reject) {
      var cssLink = document.createElement('link'),
        cssUrl = urls.resolveResourceUrl('css/' + name + '.css');
      cssLink.setAttribute('rel', 'stylesheet');
      cssLink.setAttribute('href', cssUrl);
      cssLink.id = 'sitecues-js-' + name;
      domEvents.on(cssLink, 'load', resolve);
      domEvents.on(cssLink, 'error', reject);
      document.querySelector('head').appendChild(cssLink);
    });
  }

  function setOpen(doExpand) {
    menuButtonElement.setAttribute('aria-expanded', doExpand);
  }

  function isExpanded() {
    return menuButtonElement.getAttribute('aria-expanded') === 'true';
  }

  function requestOpen(willOpen) {
    var isOpen = isExpanded();
    if (willOpen !== isOpen) {
      if (!bpToolbarMenu || !bpToolbarMenu.hasFocus()) {
        // Don't close while interacting with keyboard
        toggle();
      }
      if (willOpen) {
        lastOpenTime = getCurrentTime();
      }
    }
  }

  function getCurrentTime() {
    return new Date().getTime();
  }

  function toggle() {
    var willOpen = !isExpanded(),
      ready = Promise.resolve();

    function doToggle() {
      setOpen(willOpen);
      bpToolbarMenu.requestOpen(willOpen);
    }

    if (willOpen && !bpToolbarMenu) {
      // Styles for menu
      var sheetLoaded = insertSheet('bp-toolbar-menu'),
        toolbarInitialized = new Promise(function(resolve) {
          require(['bp-toolbar-menu/bp-toolbar-menu'], function (_bpToolbarMenu) {
            bpToolbarMenu = _bpToolbarMenu;
            bpToolbarMenu.init(menuButtonElement, resolve);
          });
        });
      ready = Promise.all([sheetLoaded, toolbarInitialized]);
    }

    ready.then(doToggle);
  }

  function onBlur() {
    clearTimeout(hideTimeout);
    requestOpen(false);
  }

  function init(toolbarElement) {
    // Styles for menu button
    insertSheet('bp-toolbar-menu-button');

    // Create element
    menuButtonElement = document.createElement('sc');
    menuButtonElement.id = 'scp-toolbar-menu-button';

    // Hide until stylesheet loaded
    menuButtonElement.style.display = 'none';

    // Accessibility
    menuButtonElement.setAttribute('role', 'button');
    menuButtonElement.setAttribute('aria-label', locale.translate('options_menu'));
    menuButtonElement.setAttribute('aria-haspopup', true);
    menuButtonElement.setAttribute('tabindex', 0);
    setOpen(false);

    // Mouse cursor
    menuButtonElement.className = 'scp-hand-cursor';

    // Interactions
    domEvents.on(menuButtonElement, 'click', function(event) {
      if (event.target !== menuButtonElement) {
        return;
      }
      if (!isExpanded() || getCurrentTime() - lastOpenTime > 1000) {
        toggle();
      }
    });
    domEvents.on(menuButtonElement, 'mouseenter', function() {
        clearTimeout(hideTimeout);
      requestOpen(true);
    });
    domEvents.on(toolbarElement, 'mouseleave', function(event) {
      if (event.target === toolbarElement) {
        // You have to leave the toolbar itself in order to close the menu
        // (We tried just putting mouseleave on the button, but the menu would close too easily while moving from the button to the menu)
        clearTimeout(hideTimeout);
        hideTimeout = nativeGlobal.setTimeout(function () {
          requestOpen(false);
        }, WAIT_BEFORE_CLOSE_MS);
      }
    });
    domEvents.on(menuButtonElement, 'blur', function() {
      nativeGlobal.setTimeout(onBlur, 0);  // Wait so that document.activeElement is properly updated
    });
    domEvents.on(menuButtonElement, 'keydown', function(event) {
      if (event.target === menuButtonElement) {
        var keyCode = event.keyCode;
        if (keyCode === KEY_CODES.ENTER || keyCode === KEY_CODES.SPACE_KEY || keyCode === KEY_CODES.DOWN) {
          requestOpen(true);
        }
      }
    });
    // Append to document
    toolbarElement.appendChild(menuButtonElement);
  }

  return {
    toggle: toggle,
    init: init
  };

});
