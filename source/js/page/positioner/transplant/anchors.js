define(
  [

  ],
  function (

  ) {
  'use strict';

  var
    addHandlers    = [],
    removeHandlers = [],
    anchorElements = [];

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

  return {
    forEach                      : forEach,
    get                          : get,
    add                          : add,
    remove                       : remove,
    registerNewAnchorHandler     : registerNewAnchorHandler,
    registerRemovedAnchorHandler : registerRemovedAnchorHandler
  };
});