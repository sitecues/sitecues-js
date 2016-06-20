// This module serves as an interface for the document's fixed elements.
define(
  [
    'page/positioner/constants',
    'page/positioner/style-lock/style-listener/style-listener'
  ],
  function (
    constants,
    styleListener
  ) {
  var docElem, fixedElements,
    doDisable        = false,
    POINTER_SHEET_ID = 'sitecues-js-disable-pointer-events',
    POINTER_ATTR     = constants.POINTER_ATTR;

  function enableMouseEvents(element) {
    element.removeAttribute(POINTER_ATTR);
  }

  function enableMouseEventsForAll() {
    doDisable = false;
    fixedElements.forEach(enableMouseEvents);
  }

  function disableMouseEvents(element) {
    element.setAttribute(POINTER_ATTR);
  }

  function disableMouseEventsForAll() {
    doDisable = true;
    fixedElements.forEach(disableMouseEvents);
  }

  function get() {
    return fixedElements;
  }

  function has(element) {
    return fixedElements.has(element);
  }

  function add() {
    var elements = Array.isArray(this) ? this : [this];
    elements.forEach(function (element) {
      fixedElements.add(element);
      if (doDisable) {
        disableMouseEvents(element);
      }
    });
  }

  function remove() {
    fixedElements.delete(this);
    if (doDisable) {
      enableMouseEvents(this);
    }
  }

  function insertStylesheet() {
    var
      pointerSelector         = '[' + POINTER_ATTR + ']',
      pointerDeclarationBlock = ' { pointer-events: none; }',
      style                   = document.createElement('style');

    style.innerHTML = pointerSelector + pointerDeclarationBlock;
    style.id        = POINTER_SHEET_ID;
    document.head.appendChild(style);
  }

  function init() {
    var declaration = { property: 'position', value: 'fixed' };
    docElem = document.documentElement;
    fixedElements = new Set();
    insertStylesheet();
    styleListener.init(function () {
      styleListener.registerToResolvedValueHandler(declaration, add);
      styleListener.registerFromResolvedValueHandler(declaration, remove);
      setTimeout(function () {
        add.call(styleListener.getElementsWithResolvedValue(declaration));
      }, 0);
    });
  }

  return {
    enableMouseEvents: enableMouseEventsForAll,
    disableMouseEvents: disableMouseEventsForAll,
    get: get,
    has: has,
    add: add,
    remove: remove,
    init: init
  };
});