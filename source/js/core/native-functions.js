define(['iframeFactory'], function (iframeFactory) {
  'use strict';

  var nativeWindow,
    // In order to make a regex to lint for direct access to certain functions, we suffix certain functions with 'Fn' so that we can distinguish correct uses
    // from potentially breaking direct references to fn.bind
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
    return SC_EXTENSION ? window : iframeFactory('sitecues-context').contentWindow;
    return nativeWindow;
  }

  // The difference between this iframe and the `native window` frame is that the native window iframe needs to be persistent beyond the scope of this module's
  // initialization, whereas this iframe is removed from the DOM at the end of the init method
  function getVerificationWindow() {
    var iframe = document.createElement('iframe');
    // This iframe should never be rendered, but just to be defensive this styling will hide the element
    iframe.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;visibility:hidden;';
    iframe.id = verificationId;
    document.documentElement.appendChild(iframe);
    return iframe.contentWindow;
  }

  function removeVerificationFrame() {
    var iframe = document.getElementById(verificationId);
    iframe.parentElement.removeChild(iframe);
  }

  function init() {
    // Extension always uses window
    // In-page library uses native iframe context if available
    var verificationWindow = getVerificationWindow(),
        functionToString   = verificationWindow.Function.prototype.toString,
        objectToString     = verificationWindow.Object.prototype.toString;

    /*
    * isSignatureVerified compares the toString value of two objects or functions, and returns true if they are identical
    *
    * @param top : the value of a given field on a top level native object
    * @param verification : the value of the same field on the `verification` iframe's content window
    * */
    function isSignatureVerified(top, verification) {
      var toString;

      if (SC_EXTENSION) {
        // The extension is running as a content script, so there is no chance that a top level field has been overridden by another script
        return true;
      }

      // toString isn't a generic method, so we need to pick the correct one
      switch (typeof top) {
        case 'object':
          toString = objectToString;
          break;

        case 'function':
          toString = functionToString;
          break;

        default:
          // If the top value isn't an object or function, we know that it's been overridden
          return false;
      }

      // compares the toString value of the top window function/object the value of the same field on the verification window
      // If they're the same, we know that the top field hasn't been overridden by another script
      return toString.call(top) === toString.call(verification);
    }

    function addFunctionProperty(name) {
      var
        exportName        = suffixedFields.indexOf(name) >= 0 ? name + 'Fn' : name,
        topValue          = window.Function.prototype[name],
        verificationValue = verificationWindow.Function.prototype[name];

      exports[exportName] = isSignatureVerified(topValue, verificationValue) ? topValue : getNativeWindow().Function.prototype[name];
    }

    function addWindowProperty(name) {
      var
        topValue          = window[name],
        verificationValue = verificationWindow[name],
        nativeValue       = isSignatureVerified(topValue, verificationValue) ? topValue : getNativeWindow()[name];

      // It's especially important to bind setTimeout to the top window
      exports[name] = typeof nativeValue === 'function' ? nativeValue.bind(window) : topValue;
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
