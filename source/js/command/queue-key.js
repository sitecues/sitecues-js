define([], function() {
  return function() {
    require(['mouse-highlight/move-keys'], function(moveKeys) {
      moveKeys.queueKey();
    });
  };
});
