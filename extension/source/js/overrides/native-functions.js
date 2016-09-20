/**
 * Normally page scripts may break native functionality, but in the extension contentscript they can't.
 * Therefore we just pass the window's native functions back.
 */
define('core/native-functions', [], function() {
  return {
    Map: Map,
    setTimeout: setTimeout,
    JSON: JSON,
    bindFn: window.Function.prototype.bind
  };
});

