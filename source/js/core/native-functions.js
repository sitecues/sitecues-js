define([], function () {
  'use strict';

  var exports = {};

  function init() {
    var frame = document.querySelector('#sitecues-native-context');

    exports.bindFn = frame.contentWindow.Function.prototype.bind;

    function addWindowProperty(name) {
      var value = frame.contentWindow[name];
      // if `value` is a function, bind it to the top window
      exports[name] = value.bind ? value.bind(window) : value;
    }

    addWindowProperty('Map');
    addWindowProperty('setTimeout');
    // Necessary on http://www.mgmresorts.com/
    addWindowProperty('JSON');
  }

  exports.init = init;
  return exports;
});