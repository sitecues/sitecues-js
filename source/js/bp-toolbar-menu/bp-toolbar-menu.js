/**
 * Toolbar menu
 */

define([
    'core/locale',
    'core/conf/urls',
    'core/util/xhr',
    'core/constants',
    'core/events',
    'core/dom-events',
    'core/native-functions'
  ],
  function(locale,
           urls,
           xhr,
           CORE_CONST,
           events,
           domEvents,
           nativeFn) {

    var menuButtonElement,
      menuElement,
      KEY_CODES = CORE_CONST.KEY_CODE;

    function requestOpen(doOpen) {
      if (isOpen() !== doOpen) {
        menuElement.setAttribute('aria-hidden', !doOpen);
        events.emit('bp/did-toggle-menu', doOpen);
        var doFocusMenuItem = doOpen && isMenuButtonFocused();
        toggleClass('scp-has-focus', doFocusMenuItem);
        toggleClass('scp-no-focus', !doFocusMenuItem);
        if (doFocusMenuItem) {
          nativeFn.setTimeout(focusMenuItem, 0);
        }
      }
    }

    function toggleClass(name, doForce) {
      var classList = menuElement.classList;
      if (doForce) {
        classList.add(name);
      }
      else {
        classList.remove(name);
      }
    }

    // Specify menu item element to focus.
    // If none specified, first menu item will receive focus
    function focusMenuItem(element) {
      element = element || menuElement.firstElementChild;
      element.focus();
    }

    function hasFocus() {
      var focusedElem = document.activeElement;
      return focusedElem.parentElement === menuElement; // Focus may be on menu item child, but not on menu itself
    }

    function isOpen() {
      return menuElement.getAttribute('aria-hidden') === 'false';
    }

    function addSemanticSugar(html) {
      return html.replace(/<sc-toolbar-menuitem/g, '<sc-toolbar-menuitem role="menuitem" class="scp-hand-cursor scp-tabbable" tabindex="-1"');
    }

    function isMenuButtonFocused() {
      return document.activeElement === menuButtonElement;
    }

    function isFocusable(element) {
      return element.hasAttribute('tabindex');
    }

    function onHover(event) {
      if (hasFocus()) {
        // We don't want a separate focus from hover -- too confusing
        // If a menuitem is focused and we hover over a different one, just focus it
        if (isFocusable(event.target)) {
          event.target.focus();
        }
      }
    }

    function activateMenuItem(event) {
      var menuItem = event.target;
      console.log(menuItem.innerText + ' activated');
    }

    function onKeyDown(event) {
      switch (event.keyCode) {
        case KEY_CODES.SPACE:
        case KEY_CODES.ENTER:
          activateMenuItem(event);
          break;
        case KEY_CODES.ESCAPE:
          requestOpen(false);
          document.activeElement.blur();
          break;
        case KEY_CODES.DOWN:
          focusMenuItem(event.target.nextElementSibling);
          break;
        case KEY_CODES.UP:
          focusMenuItem(event.target.previousElementSibling || menuElement.lastElementChild);
          break;
      }
    }

    function initInteractions() {
      domEvents.on(menuElement, 'mouseenter', onHover);
      domEvents.on(menuElement, 'keydown', onKeyDown);
      domEvents.on(menuElement, 'click', activateMenuItem);
    }

    function init(_menuButtonElement, callback) {
      if (menuButtonElement) {
        callback();
        return;
      }
      menuButtonElement = _menuButtonElement;

      var localizedPanelName = 'toolbar-menu-' + locale.getUiLocale(),
        panelUrl = urls.resolveResourceUrl('html/toolbar-menu/' + localizedPanelName + '.html');

      xhr.get({
        url: panelUrl,
        success: function(html) {
          var finalHTML = addSemanticSugar(html);
          menuButtonElement.innerHTML = finalHTML;
          menuElement = menuButtonElement.firstElementChild;
          initInteractions();
          callback();
        }
      });
    }

    return {
      init: init,
      requestOpen: requestOpen,
      hasFocus: hasFocus
    };

  });
