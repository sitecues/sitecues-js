sitecues.def('metrics/zoom-changed', function (zoomChanged, callback) {

  var DEFAULT_STATE = {
    "name": "zoom-changed",
    "isSlider":false,
    "isSliderDrag":false,
    "isKey":false,
    "isBrowserZoomKeyOverride":false,
    "isAButtonPress":false,
    "isLongGlide":false,
    "fromZoom":1,
    "toZoom":1
  };

  sitecues.use('metrics/util', 'jquery', 'ui', function (metricsUtil) {

    // ============= Objects methods ======================
    zoomChanged = {
      init: function () {
        zoomChanged.data = DEFAULT_STATE;
      },
      update: function (data) {
        metricsUtil.update(zoomChanged, data);
      },
      send: function () {
        metricsUtil.send(zoomChanged);
      }
    };

    // ============= Events Handlers ======================

    // Create an instance on zoom changed event.
    sitecues.on('zoom', function() {
      if (!zoomChanged['data']) {
        zoomChanged.init();
      };
    })

    sitecues.on('zoom/metric', function (data) {
      zoomChanged['data'] && zoomChanged.update(data);
      zoomChanged.send();
    });

    sitecues.on('metrics/update', function(metrics) {
      zoomChanged['data'] && zoomChanged.update(metrics.data);
    });

    // Done.
    callback();
  });
});