/**
 * Toolbar menu
 */

define([
    'bp-toolbar-menu/bp-toolbar-features',
    'bp-toolbar-menu/bp-toolbar-view',
    'core/locale',
    'core/conf/urls',
    'core/util/xhr',
    'core/constants',
    'core/metric',
    'core/events',
    'core/dom-events',
    'core/conf/user/manager',
    'core/native-functions'
  ],
  function(bpToolbarFeatures,
           bpToolbarView,
           locale,
           urls,
           xhr,
           CORE_CONST,
           metric,
           events,
           domEvents,
           conf,
           nativeFn) {

    var menuButtonElement,
      menuElement,
      KEY_CODES = CORE_CONST.KEY_CODE,
      origViewClasses;

    function requestOpen(doOpen) {
      if (isOpen() !== doOpen) {
        events.emit('bp/did-toggle-menu', doOpen);
        if (doOpen) {
          bpToolbarView.reset();
          if (!conf.isSitecuesUser()) {
            bpToolbarView.showHideOption();
          }
          new metric.OptionMenuOpen().send();
        }
        var doFocusMenuItem = doOpen && isMenuButtonFocused();
        if (doFocusMenuItem) {
          nativeFn.setTimeout(focusMenuItem, 0);
        }
        bpToolbarView.enableFocus(doFocusMenuItem);
        requestAnimationFrame(function() {
          menuElement.setAttribute('aria-hidden', !doOpen);
        });
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
      var menuItem = event.target,
        featureId = menuItem.id;
      bpToolbarFeatures.activateFeatureById(featureId);
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

    // Remove elements unless required by the site config
    function removeAllElements(panelElement, elementsToRemoveSelector) {
      function hide(elements) {
        var index = elements.length,
          element;
        while (index--) {
          element = elements[index];
          element.parentNode.removeChild(element);
        }
      }

      var elementsToRemove = panelElement.querySelectorAll(elementsToRemoveSelector);

      hide(elementsToRemove);
    }

    function removeUnsupportedContent(menuElement) {
      var whatToRemove = SC_EXTENSION ? 'page' : 'extension';
      removeAllElements(menuElement, '[data-sitecues-type="' + whatToRemove + '"]');
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
          bpToolbarView.init(menuElement);
          removeUnsupportedContent(menuElement);
          initInteractions();
          origViewClasses = menuElement.className;
          requestAnimationFrame(callback); // Animations can't be synchronous after insertion
        }
      });
    }

    return {
      init: init,
      requestOpen: requestOpen,
      hasFocus: hasFocus
    };

  });
