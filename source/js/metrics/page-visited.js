/*
 * Create and send a metric event when the library loads on the page.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 * (Send it only once when the user goes to a new page)
 */
define(['metrics/util', 'zoom/zoom'], function(metricsUtil, zoom) {

  'use strict';

  // ============= Objects methods ======================
  var pageVisited = {
    init: function() {
      pageVisited.data = {
        'name': 'page-visited',
        'native_zoom': zoom.getNativeZoom(),
        'is_retina'  : zoom.isRetina()
      };
    },
    update: function(data) {
      metricsUtil.update(pageVisited, data);
    },
    send: function() {
      metricsUtil.send(pageVisited);
    },
    clear: function() {
      pageVisited = null;
    }
  };

  // ============= Body =================================
  pageVisited.init();

  // ============= Events Handlers ======================
  sitecues.on('metrics/ready', function(metrics) {
    pageVisited.update(metrics.data);
    pageVisited.send();
    //  We already sent the metrics for this event, no need to keep the intance.
    pageVisited.clear();
  });
  // no publics
});
