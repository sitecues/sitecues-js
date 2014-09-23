sitecues.def('metrics/zoom-changed', function (zoomChanged, callback) {

  var DEFAULT_STATE = {
    "name": "zoom-changed",
    "is_slider":false,
    "is_slider_drag":false,
    "is_key":false,
    "is_browser_zoom_key_override":false,
    "is_button_press":false,
    "is_long_glide":false,
    "from_zoom":1,
    "to_zoom":1
  };

  sitecues.use('metrics/util', 'jquery', 'ui', function (metricsUtil, $) {

    // ============= Objects methods ======================
    zoomChanged = {
      init: initZoomChanged,
      update: function (data) {
        metricsUtil.update(zoomChanged, data);
      },
      send: function () {
        metricsUtil.send(zoomChanged);
      }
    };

    function initZoomChanged() {
      zoomChanged.data = $.extend({}, DEFAULT_STATE);
    }

    // ============= Events Handlers ======================

    // Create an instance on zoom changed event.
    sitecues.on('zoom', function() {
      if (!zoomChanged['data']) {
        zoomChanged.init();
      };
    });

    sitecues.on('metrics/update', function(metrics) {
      zoomChanged['data'] && zoomChanged.update(metrics.data);
    });

    sitecues.on('zoom/metric', function (data) {
      zoomChanged['data'] && zoomChanged.update(data);
      zoomChanged.send();
    });

    // Done.
    callback();
  });
});