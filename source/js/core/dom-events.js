/*
 * Replacement for addEventListener that by default
 * - uses passive events
 * - uses capturing events
 * Supports options object, with the following options:
 * {
 *   passive: boolean,   (default is true, in contrast to addEventListener)
 *   capture: boolean    (default is true, in contrast to addEventListener)
 * }
 */

define([], function () {
  var isPassiveSupported = false;

  function getThirdParam(opts) {
    opts = opts || {};

    var isCapturing = opts.capture !== false,
      isPassive = opts.passive !== false;

    if (isPassiveSupported) {
      return {
        capture: isCapturing,
        passive: isPassive // Default to true of not defined
      };
    }

    return isCapturing;
  }

  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, getThirdParam(opts));
  }

  function off(target, type, fn, opts) {
    target.addEventListener(type, fn, getThirdParam(opts));
  }

  function init() {
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function() {
          isPassiveSupported = true;
        }
      });
      window.addEventListener('test', null, opts);
    } catch (e) {}
  }

  return {
    on   : on,   // Note: use { passive: false } if you ever need to cancel the event!
    off  : off,
    init: init
  };

});