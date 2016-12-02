/*
* Declaration Listener
*
* This module is responsible for running handlers when the document mutates such that an element's resolve style
* value changes to or from specified declarations.
* */
define(
[],
function () {
  'use strict';

  var handlers = {};

  function bindHandlers(declaration, handlers) {
    var property      = declaration.property,
        value         = declaration.value,
        toHandler     = handlers.toHandler,
        fromHandler   = handlers.fromHandler,
        valueHandlers = getValueHandlers(property, value);

    if (toHandler) {
      valueHandlers.to.add(toHandler);
    }

    if (fromHandler) {
      valueHandlers.from.add(fromHandler);
    }
  }

  function getValueHandlers(property, value) {
    var propertyHandlers = getPropertyHandlers(property),
        valueHandlers    = propertyHandlers[value];
    if (!valueHandlers) {
      valueHandlers      = {};
      valueHandlers.to   = new Set();
      valueHandlers.from = new Set();
      propertyHandlers[value] = valueHandlers;
    }
    return valueHandlers;
  }

  function getPropertyHandlers(property) {
    var propertyHandlers = handlers[property];
    if (!propertyHandlers) {
      propertyHandlers = {};
      handlers[property] = propertyHandlers;
    }
    return propertyHandlers;
  }

  function getHandledProperties() {
    return Object.keys(handlers);
  }

  function getHandledValues(property) {
    return Object.keys(handlers[property] || {});
  }
  
  function getDirectionalHandlers(property, value, direction) {
    var propertyHandlers    = handlers[property] || {},
        valueHandlers       = propertyHandlers[value] || {},
        directionalHandlers = valueHandlers[direction] || new Set();
    return directionalHandlers;
  }

  function runHandlers(handlers, opts) {
    handlers.forEach(function (handler) {
      handler.call(opts.element, opts);
    });
  }

  function isHandled(opts) {
    var property     = opts.property,
        toHandlers   = getDirectionalHandlers(property, opts.toValue, 'to'),
        fromHandlers = getDirectionalHandlers(property, opts.fromValue, 'from');
    return toHandlers.size + fromHandlers.size > 0;
  }

  function run(opts) {
    var toValue          = opts.toValue,
        fromValue        = opts.fromValue,
        property         = opts.property,
        toHandlers       = getDirectionalHandlers(property, toValue, 'to'),
        fromHandlers     = getDirectionalHandlers(property, fromValue, 'from');
    runHandlers(fromHandlers, opts);
    runHandlers(toHandlers, opts);
  }

  return {
    run                  : run,
    bindHandlers         : bindHandlers,
    getHandledProperties : getHandledProperties,
    getHandledValues     : getHandledValues,
    isHandled            : isHandled
  };
});
