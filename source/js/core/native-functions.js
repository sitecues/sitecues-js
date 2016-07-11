define([], function () {
  'use strict';

  var exports = {};

  function init() {
    var frame = document.querySelector('#sitecues-native-context');

    exports.bindFn = frame.contentWindow.Function.prototype.bind;

    function addWindowMethod(name) {
      exports[name] = frame.contentWindow[name].bind(window);
    }

    addWindowMethod('Map');
    addWindowMethod('setTimeout');
  }

  exports.init = init;
  return exports;
});