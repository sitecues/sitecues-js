/*
 * Create and send a metric event when the user opens an HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */
define(['metrics/util'], function (metricsUtil) {

  'use strict';

  var DEFAULT_STATE = {'name': 'hlb-opened'};

  // ============= Objects methods ======================
  var hlbOpened = {
    init: function() {
      hlbOpened.data = DEFAULT_STATE;
    },
    update: function(data) {
      metricsUtil.update(hlbOpened, data);
    },
    send: function() {
      metricsUtil.send(hlbOpened);
    },
    reset: function() {
      hlbOpened.update(DEFAULT_STATE);
    }
  };


  // ============= Events Handlers ======================
  // Create an instance on hlb create event.
  sitecues.on('hlb/create', function() {
    if (!hlbOpened.data) {
      hlbOpened.init();
    }
    sitecues.emit('metrics/hlb-opened/create');
  });

  sitecues.on('metrics/update', function(metrics) {
    hlbOpened.data && hlbOpened.update(metrics.data);
  });

  // Clear an instance data on hlb opened(ready) event.
  sitecues.on('hlb/ready', function() {
    hlbOpened.send();
    hlbOpened.reset();
  });
  // no publics
});
