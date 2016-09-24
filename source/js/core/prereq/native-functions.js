// We need to hard code the module name here for amdclean
define(
  'nativeFn',
  [
    'exports',
    'iframeFactory'
  ],
  function (
    exports,
    iframeFactory
  ) {
  'use strict';

  var cleanFrame,
    isInitialized,
    // In order to make a regex to lint for direct access to certain functions, we suffix certain functions with 'Fn' so that we can distinguish correct uses
    // from potentially breaking direct references to fn.bind
    suffixedFields = {
      bind : 'bindFn'
    };

  // Recover potentially overridden window methods from a nested browsing context
  function getCleanFrame() {
    if (!cleanFrame) {
      cleanFrame = SC_EXTENSION ? window : iframeFactory('sitecues-clean-frame');
    }
    return cleanFrame;
  }

  function removeCleanFrame() {
    cleanFrame.parentElement.removeChild(cleanFrame);
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    // Extension always uses window
    // In-page library uses clean iframe context if available
    var didRetrieveValue,
        cleanWindow      = getCleanFrame().contentWindow,
        functionToString = cleanWindow.Function.prototype.toString,
        objectToString   = cleanWindow.Object.prototype.toString;
    /*
     * isVerified compares the toString value of two objects or functions, and returns true if they are identical
     *
     * @param top : the value of a given field on a top level native object
     * @param verification : the value of the same field on the `clean` iframe's content window
     * */
    function isSignatureVerified(top, clean) {
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
      return toString.call(top) === toString.call(clean);
    }

    function getNativeValue(top, clean) {
      if (isSignatureVerified(top, clean)) {
        return top;
      }
      didRetrieveValue = true;
      return clean;
    }

    function addFunctionProperty(name) {
      var
        exportName = suffixedFields[name] || name,
        topValue   = window.Function.prototype[name],
        cleanValue = cleanWindow.Function.prototype[name];

      exports[exportName] = getNativeValue(topValue, cleanValue);
    }

    function addWindowProperty(name) {
      var
        topValue    = window[name],
        cleanValue  = cleanWindow[name],
        nativeValue = getNativeValue(topValue, cleanValue);

      // It's especially important to bind setTimeout to the top window
      exports[name] = typeof nativeValue === 'function' ? nativeValue.bind(window) : nativeValue;
    }

    addFunctionProperty('bind');
    addWindowProperty('Map');
    addWindowProperty('setTimeout');
    // Necessary on http://www.mgmresorts.com/
    addWindowProperty('JSON');

    if (!didRetrieveValue) {
      removeCleanFrame();
    }
  }

  exports.init = init;
  return exports;
});