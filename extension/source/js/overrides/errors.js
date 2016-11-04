/**
 * Overrides run/errors implementation with noop
 */
"use strict";

define('run/errors', [], function() {
  function report(error) {
    console.log('%cSitecues Error %s', 'color: orange', error);
  }

  return {
    report: report
  };
});

