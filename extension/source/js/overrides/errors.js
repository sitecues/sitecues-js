/**
 * Overrides core/errors implementation with noop
 */
define('run/errors', [], function() {
  function noop() {
  }

  return {
    report: noop
  };
});

