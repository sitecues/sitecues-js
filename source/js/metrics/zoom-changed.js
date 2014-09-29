sitecues.def('metrics/zoom-changed', function (zoomChanged, callback) {

  var DEFAULT_STATE = {
    "name": "zoom-changed",
    "is_slider_click": 0,                // Slider in panel
    "is_slider_drag": 0,                 // True if the user drags the slider (as opposed to clicking in it)
    "is_key": 0,                         // + or - key (or with modifier)
    "is_browser_zoom_key_override": 0,   // User is pressing the browser's zoom key command -
    "is_button_press": 0,                // Small or large A in panel
    "is_long_glide": 0,                  // Key or A button held down to glide extra        -
    "to_zoom": 1                       // Old zoom value
  };

  sitecues.use('metrics/util', 'jquery', 'conf', 'zoom', function (metricsUtil, $, conf, zoom) {

    // ============= Objects methods ======================
    zoomChanged = {
      init: initZoomChanged,
      update: function (data) {
        metricsUtil.update(zoomChanged,data);
      },
      send: function () {
        metricsUtil.send(zoomChanged);
      },
      reset: function() {
        zoomChanged.update(DEFAULT_STATE);
      }
    };

    function initZoomChanged() {
      zoomChanged.data = $.extend({}, DEFAULT_STATE);

      var $slider = $('#sitecues-track, #sitecues-trackBack, #sitecues-thumb'),
          $buttons = $('#sitecues-letterBig, #sitecues-letterBigBack, #sitecues-letterSml, #sitecues-letterSmlBack');

      $slider.each(sliderMouseDown);
      $buttons.each(buttonsMouseDown);
      $('body').keypress(bodyKeyPress);
    }

    /**
     * Window Events Handlers.
     */

    function sliderMouseDown(e) {
      this.onmousedown = function() {
        zoomChanged.data.is_slider_click = 1;
        document.onmousemove = function (e) {
          zoomChanged.data.is_slider_drag = 1;
          zoomChanged.data.is_slider_click = 0;
        };
      };
    };

    function buttonsMouseDown() {
      $(this).mousedown(function() {
        zoomChanged.data.is_button_press = 1;
      });
    };

    function bodyKeyPress(event) {
      var code = event.keyCode || event.which;
      var plus  = code === 187 || code === 61  || code === 107 || code === 43;
      var minus = code === 189 || code === 109 || code === 173 || code === 45;

      if (plus || minus) {
        zoomChanged.data.is_key = 1;
        zoomChanged.data.is_browser_zoom_key_override = (event.ctrlKey || event.metaKey);
      }
    }

    function readyForMetrics() {
      return !zoom.getIsInitialZoom();
    }

    // ============= sitecues Events Handlers ======================

    // Create an instance on zoom changed event and add event listeners.
    zoomChanged.init();

    sitecues.on('zoom/stop-button', function () {
      zoomChanged.data.is_long_glide = 1;
    })

    sitecues.on('zoom', function() {
      if (readyForMetrics()) {
        zoomChanged.data.to_zoom = conf.get('zoom');
        zoomChanged.send();
        zoomChanged.reset();
      }
    });

    sitecues.on('metrics/update', function(metrics) {
      zoomChanged['data'] && zoomChanged.update(metrics.data);
    });

    // Done.
    callback();
  });
});