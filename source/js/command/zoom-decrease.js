define([], function() {
  return function() {
    require(['zoom/zoom'], function(zoomMod) {
      zoomMod.beginZoomDecrease();
    });
  };
});
