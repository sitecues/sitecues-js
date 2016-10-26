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
          new metric.OptionMenuOpen().send();
        }
        var doFocusMenuItem = doOpen && isMenuButtonFocused();
        if (doFocusMenuItem) {
          nativeFn.setTimeout(function() {
            menuElement.firstElementChild.focus();
          }, 0);
        }
        bpToolbarView.enableFocus(doFocusMenuItem);
        // jshint -W030
        menuElement.offsetHeight;  // Browser: wke up from your slumber!
        // jshint +W030
        menuElement.setAttribute('aria-hidden', !doOpen);
      }
    }

    // Specify menu item element to focus.
    // If none specified, first menu item will receive focus
    function focusAdjacentVisibleItem(startElement, direction) {
      var nextProp = direction === 1 ? 'nextElementSibling' : 'previousElementSibling',
        wrapAroundProp = direction === 1 ? 'firstElementChild' : 'lastElementChild',
        element = startElement;

      function getVisibleItemInDirection() {
        while (true) {
          element = element[nextProp] || element.parentElement[wrapAroundProp];
          if (getComputedStyle(element).display !== 'none') {
            return element;
          }
          if (element === startElement) {
            return element;
          }
        }
      }

      getVisibleItemInDirection().focus();
    }

    function hasFocus() {
      var focusedElem = document.activeElement;
      return focusedElem.parentElement === menuElement; // Focus may be on menu item child, but not on menu itself
    }

    function isOpen() {
      return menuElement.getAttribute('aria-hidden') === 'false';
    }

    function addSemanticSugar(html) {
      return html.replace(/<sc-toolbar-menuitem/g, '<sc-toolbar-menuitem role="menuitem" class="scp-hand-cursor scp-tabbable"');
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
      if (!isFocusable(menuItem)) {
        menuItem = menuItem.parentElement; // Use the selectable menu item parent (in the case of the hide menu item)
      }
      bpToolbarFeatures.activateFeatureById(menuItem.id, hasFocus());
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
          focusAdjacentVisibleItem(event.target, 1);
          break;
        case KEY_CODES.UP:
          focusAdjacentVisibleItem(event.target, -1);
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
