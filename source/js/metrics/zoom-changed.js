define(['metrics/util', 'jquery', 'conf/user/manager', 'zoom/zoom'], function (metricsUtil, $, conf, zoom) {

  'use strict';

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

  // ============= Objects methods ======================
  var zoomChanged = {
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

    $slider.on('mousedown',  sliderMouseDown);
    $buttons.on('mousedown', buttonsMouseDown);
    $(window).on('keydown',  anyKeyDown);

    sitecues.emit('metrics/zoom-changed/create');
  }

  function setDataPropertyValue(prop, value) {
      zoomChanged.data[prop] = value;
  }

  /**
   * Window Events Handlers.
   */

  function sliderMouseDown() {
    setDataPropertyValue('is_slider_click', 1);
  };

  function buttonsMouseDown() {
    setDataPropertyValue('is_button_press', 1);
  };

  function anyKeyDown(event) {
    // Handle keypress events(for ex., +/-)
    if (event && event.type === 'keydown') {
      var code = event.keyCode;
      var plus  = code === 187 || code === 61  || code === 107 || code === 43;
      var minus = code === 189 || code === 109 || code === 173 || code === 45;

      if (plus || minus) {
        setDataPropertyValue('is_key', 1);
        // + is a simple way to convert boolean to a number: true becomes 1 and false is 0. I'll add a comment to it.
        setDataPropertyValue('is_browser_zoom_key_override', +(event.ctrlKey || event.metaKey));
      }
    };
  }

  function readyForMetrics() {
    return !zoom.getIsInitialZoom();
  }

  function run(zoom) {
    if (readyForMetrics()) {
      // Create an instance on zoom changed event and add event listeners.
      zoomChanged.init();

      // Remember the initial zoom value('from_zoom')
      setDataPropertyValue('from_zoom', conf.get('zoom'));

      bindSitecuesEvents();

      // Clear interval, we don't need it anymore.
      sitecues.off('zoom/begin', run);
    }
  }

  // Listen to necessary sitecues event and bind the handlers for them.
  function bindSitecuesEvents() {
    sitecues.on('zoom/begin', function() {
      // Update the initial zoom value('from_zoom')
      setDataPropertyValue('from_zoom', conf.get('zoom'));
    })

    // Is it a long glide?
    sitecues.on('zoom/long-glide', function () {
      setDataPropertyValue('is_long_glide', 1);
    });

    sitecues.on('zoom/slider-drag', function () {
      setDataPropertyValue('is_slider_drag', 1);
      setDataPropertyValue('is_slider_click', 0);
    });

    // We are ready to send the metrics to backend.
    sitecues.on('zoom', function() {
      zoomChanged.send();
      zoomChanged.reset();
    });
  }

  // ============= sitecues Events Handlers ======================

  sitecues.on('zoom/begin', run);

  // Update data from the other modules.
  sitecues.on('metrics/update', function(metrics) {
    zoomChanged['data'] && zoomChanged.update(metrics.data);
  });

});