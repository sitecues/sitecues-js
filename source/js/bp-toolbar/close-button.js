define([], function() {
  var isInitialized;

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
  }

  return {
    init: init
  };
});
