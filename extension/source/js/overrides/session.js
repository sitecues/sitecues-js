define('run/session', [], function() {
  "use strict";

  return {
    getId: function () {
      return 'session-123';  // Session ids not currently relevant in the extension (no metrics)
    }
  };

});

