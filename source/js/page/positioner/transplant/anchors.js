define(
  [
    'exports',
    'page/positioner/constants'
  ],
  function (
    exports,
    constants
  ) {
  'use strict';

  var
    addHandlers    = [],
    removeHandlers = [],
    anchorElements = [],
    ANCHOR_STYLESHEET_ID = 'sitecues-js-anchors',
    ANCHOR_ATTR = constants.ANCHOR_ATTR,
    VISIBLE = constants.VISIBLE,
    HIDDEN_ANCHOR_SELECTOR  = constants.HIDDEN_ANCHOR_SELECTOR,
    VISIBLE_ANCHOR_SELECTOR = constants.VISIBLE_ANCHOR_SELECTOR;

  function get() {
    return anchorElements;
  }

  function forEach(fn) {
    anchorElements.forEach(fn);
  }

  function add(element) {
    if (anchorElements.indexOf(element) === -1) {
      anchorElements.push(element);
      callHandlers(element, addHandlers);
    }
  }

  function remove(element) {
    var index = anchorElements.indexOf(element);
    if (index >= 0) {
      anchorElements.splice(index, 1);
      callHandlers(element, removeHandlers);
    }
  }

  function callHandlers(element, handlers) {
    handlers.forEach(function (handler) {
      handler.call(element);
    });
  }

  function registerNewAnchorHandler(fn) {
    addHandlers.push(fn);
  }

  function registerRemovedAnchorHandler(fn) {
    removeHandlers.push(fn);
  }

  function insertStylesheet() {
    var visibleDeclarationBlock = ' { visibility: visible; }\n',
        hiddenDeclarationBlock  = ' { visibility: hidden; }\n',
        styleText =
          HIDDEN_ANCHOR_SELECTOR  + hiddenDeclarationBlock +
          VISIBLE_ANCHOR_SELECTOR + visibleDeclarationBlock;

    var sheet = document.createElement('style');
    sheet.id = ANCHOR_STYLESHEET_ID;
    sheet.innerText = styleText;
    document.head.insertBefore(sheet, document.head.firstChild);
  }

  // The anchor attribute is responsible for making it and its subtree visible, if its intended styling makes it visible
  function applyAnchorAttribute(element) {
    element.setAttribute(ANCHOR_ATTR, VISIBLE);
  }

  function onAddedAnchor() {
    /*jshint validthis: true */
    applyAnchorAttribute(this);
    /*jshint validthis: false */
  }

  function onRemovedAnchor() {
    /*jshint validthis: true */
    this.removeAttribute(ANCHOR_ATTR);
    /*jshint validthis: false */
  }

  function init() {
    insertStylesheet();
    registerNewAnchorHandler(onAddedAnchor);
    registerRemovedAnchorHandler(onRemovedAnchor);
  }

  exports.forEach = forEach;
  exports.get = get;
  exports.add = add;
  exports.remove = remove;
  exports.registerNewAnchorHandler = registerNewAnchorHandler;
  exports.registerRemovedAnchorHandler =  registerRemovedAnchorHandler;
  exports.init = init;
});
