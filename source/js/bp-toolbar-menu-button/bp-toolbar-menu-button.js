/**
 * Optional menu button for the toolbar, created if sitecues.config.hasOptionsMenu is truthy
 */

define([
  'core/conf/urls',
  'core/dom-events',
  'core/locale',
  'core/native-functions'
  ],
  function(urls,
           domEvents,
           locale,
           nativeFn) {

  var menuButtonElement,
    wasEverOpen,
    hideTimeout,
    ENTER_KEY = 13,
    WAIT_BEFORE_CLOSE_MS = 300;

  function insertSheet(name) {
    var cssLink = document.createElement('link'),
      cssUrl = urls.resolveResourceUrl('css/' + name + '.css');
    cssLink.setAttribute('rel', 'stylesheet');
    cssLink.setAttribute('href', cssUrl);
    cssLink.id = 'sitecues-js-' + name;
    document.querySelector('head').appendChild(cssLink);
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
      toggle();
    }
  }

  function toggle() {
    var willOpen = !isExpanded();
    if (willOpen && !wasEverOpen) {
      // Styles for both button and menu
      insertSheet('bp-toolbar-menu');
      wasEverOpen = true;
    }
    require(['bp-toolbar-menu/bp-toolbar-menu'], function(bpToolbarMenu) {
      bpToolbarMenu.init(menuButtonElement, function() {
        setOpen(willOpen);
        bpToolbarMenu.setOpen(willOpen);
      });
    });
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
    domEvents.on(menuButtonElement, 'click', toggle);
    domEvents.on(menuButtonElement, 'mouseenter', function() {
      clearTimeout(hideTimeout);
      requestOpen(true);
    });
    domEvents.on(toolbarElement, 'mouseleave', function(event) {
      if (event.target === toolbarElement) {
        // You have to leave the toolbar itself in order to close the menu
        // (We tried just putting mouseleave on the button, but the menu would close too easily while moving from the button to the menu)
        clearTimeout(hideTimeout);
        hideTimeout = nativeFn.setTimeout(function () {
          requestOpen(false);
        }, WAIT_BEFORE_CLOSE_MS);
      }
    });
    domEvents.on(menuButtonElement, 'keydown', function(event) {
      if (event.keyCode === ENTER_KEY) {
        toggle();
      }
    });

    // Append to document
    toolbarElement.appendChild(menuButtonElement);
  }

  return {
    init: init
  };

});
