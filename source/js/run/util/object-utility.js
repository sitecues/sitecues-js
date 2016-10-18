define(
  [],
  function () {
  'use strict';

  // Using the MDN polyfill for IE11
  var assign = typeof Object.assign === 'function' ? Object.assign : function assign(target) {
    if (target === undefined || target === null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    target = Object(target);
    Array.prototype.slice.call(arguments, 1).forEach(function (source) {
      if (source !== undefined && source !== null) {
        Object.keys(source).forEach(function (key) {
          target[key] = source[key];
        });
      }
    });

    return target;
  };

  return {
    assign : assign
  };
});