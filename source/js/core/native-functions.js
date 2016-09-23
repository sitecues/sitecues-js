define(['iframeFactory'], function (iframeFactory) {
  'use strict';

  var exports = {};

  // Recover potentially overridden window methods from a nested browsing context
  function getNativeWindow() {
    return SC_EXTENSION ? window : iframeFactory('sitecues-context').contentWindow;
  }

  function init() {
    // Extension always uses window
    // In-page library uses native iframe context if available
    var nativeWindow = getNativeWindow();

    exports.bindFn = nativeWindow.Function.prototype.bind;

    function addWindowProperty(name) {
      var value = nativeWindow[name];
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