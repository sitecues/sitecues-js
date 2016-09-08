/**
 * Overrides core/errors implementation with noop
 */
define('core/errors', [], function() {
  function noop() {
  }

  return {
    report: noop
  };
});

