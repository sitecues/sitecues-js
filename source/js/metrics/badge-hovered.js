/*
 * Create and send a metric event when the user opens an HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */
define(['metrics/util'], function (metricsUtil) {

  'use strict';

  var DEFAULT_STATE = {'name': 'badge-hovered'};

  // ============= Objects methods ======================
  var badgeHovered = {
    init: function() {
      badgeHovered.data = DEFAULT_STATE;
    },
    update: function(data) {
      metricsUtil.update(badgeHovered, data);
    },
    send: function() {
      metricsUtil.send(badgeHovered);
    },
    reset: function() {
      badgeHovered.update(DEFAULT_STATE);
    }
  };

  // ============= Events Handlers ======================
  // Create an instance on panel show event.
  sitecues.on('bp/will-expand', function() {
    if (!badgeHovered['data']) {
      badgeHovered.init();
    }
    sitecues.emit('metrics/badge-hovered/create');
    badgeHovered.send();
  });

  sitecues.on('metrics/ready metrics/update', function(metrics) {
    badgeHovered['data'] && badgeHovered.update(metrics.data);
  });

  // Clear an instance data on panel hide event.
  sitecues.on('bp/did-shrink', function() {
    badgeHovered.reset();
  });

  // Done.
  callback();
});