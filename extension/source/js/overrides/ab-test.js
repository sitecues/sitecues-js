/**
 * Overrides core/errors implementation with noop
 */
define('core/ab-test/ab-test', [], function() {
  function noop() {
  }

  return {
    init: noop,
    get: noop
  };
});

