/**
 * Overrides run/ab-test/ab-test implementation with noop
 */
define('run/ab-test/ab-test', [], function() {
  function noop() {
  }

  return {
    init: noop,
    get: noop
  };
});

