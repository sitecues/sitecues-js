sitecues.def('metrics/zoom-changed', function (zoomChanged, callback) {

  var DEFAULT_STATE = {
    "name": "zoom-changed",
    "is_slider_click": 0,                // Slider in panel
    "is_slider_drag": 0,                 // True if the user drags the slider (as opposed to clicking in it)
    "is_key": 0,                         // + or - key (or with modifier)
    "is_browser_zoom_key_override": 0,   // User is pressing the browser's zoom key command -
    "is_button_press": 0,                // Small or large A in panel
    "is_long_glide": 0,                  // Key or A button held down to glide extra        -
    "from_zoom": 1                       // Old zoom value
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

      var $slider  = $('#sitecues-track, #sitecues-trackBack, #sitecues-thumb'),
          $buttons = $('#sitecues-letterBig, #sitecues-letterBigBack, #sitecues-letterSml, #sitecues-letterSmlBack');

      $slider.each(sliderMouseDown);
      $buttons.each(buttonsMouseDown);
      $(window).on('keydown', bodyKeyDown);

      sitecues.emit('metrics/zoom-changed/create');
    }

    function setDataPropertyValue(prop, value) {
      if (zoomChanged.data.hasOwnProperty(prop)) {
        zoomChanged.data[prop] = value;
      }
    }

    /**
     * Window Events Handlers.
     */

    function sliderMouseDown(e) {
      this.onmousedown = function() {
        setDataPropertyValue('is_slider_click', 1);
        document.onmousemove = function (e) {
          setDataPropertyValue('is_slider_drag', 1);
          setDataPropertyValue('is_slider_click', 0);
        };
      };
    };

    function buttonsMouseDown() {
      $(this).mousedown(function() {
        setDataPropertyValue('is_button_press', 1);
      });
    };

    function bodyKeyDown(event) {
      // Handle keypress events(for ex., +/-)
      if (event && event.type === 'keydown') {
        var code = event.keyCode || event.which;
        var plus  = code === 187 || code === 61  || code === 107 || code === 43;
        var minus = code === 189 || code === 109 || code === 173 || code === 45;

        if (plus || minus) {
          setDataPropertyValue('is_key', 1);
          setDataPropertyValue('is_browser_zoom_key_override', event.ctrlKey || event.metaKey);
        }
      };
    }

    function readyForMetrics() {
      return !zoom.getIsInitialZoom();
    }

    function run() {
      if (readyForMetrics()) {
        // Create an instance on zoom changed event and add event listeners.
        zoomChanged.init();

        bindSitecuesEvents();

        // Clear interval, we don't need it anymore.
        clearInterval(intervalID);
      }
    }

    // Listen to necessary sitecues event and bind the handlers for them.
    function bindSitecuesEvents() {
      // Remember the initial zoom value('from_zoom')
      sitecues.on('zoom/begin', function(zoom) {
        setDataPropertyValue('from_zoom', conf.get('zoom'));
      });

      // Is it a long glide?
      sitecues.on('zoom/stop-button', function () {
        setDataPropertyValue('is_long_glide', 1);
      });

      // We are ready to send the metrics to backend.
      sitecues.on('zoom', function() {
        zoomChanged.send();
        zoomChanged.reset();
      });

    }

    // ============= sitecues Events Handlers ======================

    var intervalID = setInterval(run, 100);

    // Update data from the other modules.
    sitecues.on('metrics/update', function(metrics) {
      zoomChanged['data'] && zoomChanged.update(metrics.data);
    });

    // Done.
    callback();
  });
});