define(
[],
function () {
  'use strict';

  var handlers = new WeakMap();

  function getElementHandlers(element) {
    var elementHandlers = handlers.get(element);
    if (!elementHandlers) {
      elementHandlers = {};
      handlers.set(element, elementHandlers);
    }
    return elementHandlers;
  }

  function getPropertyHandlers(element, property) {
    var elementHandlers  = getElementHandlers(element),
        propertyHandlers = elementHandlers[property];
    if (!propertyHandlers) {
      propertyHandlers = new Set();
      elementHandlers[property] = propertyHandlers;
    }
    return propertyHandlers;
  }

  function bindHandler(opts) {
    var element  = opts.element,
        property = opts.property,
        handler  = opts.handler,
        propertyHandlers = getPropertyHandlers(element, property);
    propertyHandlers.add(handler);
  }

  function unbind(opts) {
    var element  = opts.element,
        property = opts.property,
        handler  = opts.handler,
        propertyHandlers = getPropertyHandlers(element, property);

    propertyHandlers.delete(handler);

    if (propertyHandlers.size === 0) {
      var elementHandlers = getElementHandlers(element);
      delete elementHandlers[property];
    }
  }

  function getHandledProperties(element) {
    return Object.keys(getElementHandlers(element));
  }

  function isHandled(opts) {
    return getPropertyHandlers(opts.element, opts.property).size > 0;
  }

  function run(opts) {
    var element  = opts.element,
        property = opts.property;
    getPropertyHandlers(element, property).forEach(function (handler) {
      handler.call(element, opts);
    });
  }

  return {
    run                  : run,
    bindHandler          : bindHandler,
    unbind               : unbind,
    getHandledProperties : getHandledProperties,
    isHandled            : isHandled
  };
});
