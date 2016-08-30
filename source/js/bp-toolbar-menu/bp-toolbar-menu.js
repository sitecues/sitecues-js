/**
 * Toolbar menu
 */

define([
  'core/locale',
  'core/conf/urls',
  'core/util/xhr'
  ],
  function(locale,
           urls,
           xhr) {

  var menuButtonElement,
    menuElement;

  function setOpen(doOpen) {
    menuElement.setAttribute('aria-hidden', !doOpen);
  }

  function addSemanticSugar(html) {
    return html;
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
        callback();
      }
    });
  }

  return {
    init: init,
    setOpen: setOpen
  };

});
