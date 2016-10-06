// This module serves as an interface for the document's fixed elements.
define(
  [
    'page/positioner/constants',
    'page/positioner/style-lock/style-listener/style-listener',
    'core/util/array-utility',
    'mini-core/native-global'
  ],
  function (
    constants,
    styleListener,
    arrayUtil,
    nativeGlobal
  ) {
  'use strict';

  var docElem, fixedElements,
    doDisable        = false,
    POINTER_SHEET_ID = 'sitecues-js-disable-pointer-events',
    POINTER_ATTR     = constants.POINTER_ATTR;

  function enableMouseEventsForElement(element) {
    element.removeAttribute(POINTER_ATTR);
  }

  function enableMouseEventsForAll() {
    doDisable = false;
    fixedElements.forEach(enableMouseEventsForElement);
  }

  function disableMouseEventsForElement(element) {
    element.setAttribute(POINTER_ATTR, '');
  }

  function disableMouseEventsForAll() {
    doDisable = true;
    fixedElements.forEach(disableMouseEventsForElement);
  }

  function get() {
    return arrayUtil.fromSet(fixedElements);
  }

  function has(element) {
    return fixedElements.has(element);
  }

  function add() {
    /*jshint validthis: true */
    var elements = Array.isArray(this) ? this : [this];
    elements.forEach(function (element) {
      fixedElements.add(element);
      if (doDisable) {
        disableMouseEventsForElement(element);
      }
    });
    /*jshint validthis: false */
  }

  function remove() {
    /*jshint validthis: true */
    fixedElements.delete(this);
    if (doDisable) {
      enableMouseEventsForElement(this);
    }
    /*jshint validthis: false */
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
      nativeGlobal.setTimeout(function () {
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
