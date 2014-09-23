sitecues.def('metrics/zoom-changed', function (zoomChanged, callback) {

  var DEFAULT_STATE = {'name': 'zoom-changed'};

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
    // Create an instance on panel show event.
    sitecues.on('zoom/metric', function (data) {
      if (!zoomChanged['data']) {
        zoomChanged.init();
      }
      zoomChanged['data'] && zoomChanged.update(data);
      zoomChanged.send();
    });

    // Done.
    callback();
  });
});