define([], function () {
  'use strict';

  var nativeWindow,
    // In order to make a regex to lint for direct access to certain functions, we suffix certain functions with 'Fn' so that we can distinguish correct uses
    suffixedFields = [
      'bind'
    ],
    verificationId = 'sitecues-verification',
    exports = {};

  // Recover potentially overridden window methods from a nested browsing context
  function getNativeWindow() {
    if (nativeWindow) {
      return nativeWindow;
    }
    nativeWindow = SC_EXTENSION ? window : sitecues._getHelperFrame('sitecues-context').contentWindow;
    return nativeWindow;
  }

  // The difference between this iframe and the `native window` frame is that the native window iframe needs to be persistent beyond the scope of this module's
  // initialization, whereas this iframe is removed from the DOM at the end of the init method
  function getVerificationWindow() {
    // We don't need to care about the styling of this iframe because it will never be rendered
    var iframe = document.createElement('iframe');
    iframe.id = verificationId;
    document.documentElement.appendChild(iframe);
    return iframe.contentWindow;
  }

  function removeVerificationFrame() {
    document.getElementById(verificationId).remove();
  }



  function init() {
    // Extension always uses window
    // In-page library uses native iframe context if available
    var verificationWindow = getVerificationWindow(),
        functionToString   = verificationWindow.Function.prototype.toString,
        objectToString     = verificationWindow.Object.prototype.toString;

    function isSignatureVerified(top, verification) {
      var type = typeof top;
      if (type === 'object') {
        return objectToString.call(top) === objectToString.call(verification);
      }
      else if (type === 'function') {
        return functionToString.call(top) === functionToString.call(verification);
      }
    }

    function addFunctionProperty(name) {
      var
        exportName        = suffixedFields.indexOf(name) >= 0 ? name + 'Fn' : name,
        topValue          = window.Function.prototype[name],
        verificationValue = verificationWindow.Function.prototype[name];

      if (isSignatureVerified(topValue, verificationValue)) {
        exports[exportName] = topValue;
      }
      else {
        exports[exportName] = getNativeWindow().Function.prototype[name];
      }
    }

    function addWindowProperty(name) {
      var
        topValue          = window[name],
        verificationValue = verificationWindow[name];

      if (isSignatureVerified(topValue, verificationValue)) {
        exports[name] = typeof topValue === 'function' ? topValue.bind(window) : topValue;
      }
      else {
        var nativeValue = getNativeWindow().Function.prototype[name];
        exports[name] = typeof nativeValue === 'function' ? nativeValue.bind(window) : nativeValue;
      }
    }

    addFunctionProperty('bind');
    addWindowProperty('Map');
    addWindowProperty('setTimeout');
    // Necessary on http://www.mgmresorts.com/
    addWindowProperty('JSON');

    removeVerificationFrame();
  }

  exports.init = init;
  return exports;
});