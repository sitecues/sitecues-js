/*
 * Create and send a metric event when the user opens an HLB.
 * This event creation should wait until the user preferences are loaded, and the UI is initialized.
 */
define(['metrics/util', 'jquery'], function(metricsUtil, $) {

  'use strict';

  var DEFAULT_STATE = {
    'name': 'panel-closed',
    'slider_interacted': 0,
    'large_a_clicked': 0,
    'small_a_clicked': 0,
    'tts_clicked': 0
  };

  // ============= Objects methods ======================
  var panelClosed = {
    init: initPanelClosed,
    update: function(data) {
      metricsUtil.update(panelClosed, data);
    },
    send: function() {
      metricsUtil.send(panelClosed);
    },
    reset: function() {
      panelClosed.update(DEFAULT_STATE);
    }
  };


  function initPanelClosed() {
    panelClosed.data = $.extend({}, DEFAULT_STATE);
    var $slider = $('#scp-zoom-slider-bar, #scp-zoom-slider-thumb'),
      $letterBig = $('#scp-large-A'),
      $letterSmall = $('#scp-small-A'),
      $ttsButton = $('#scp-speech');

    // todo: delegate
    // better to add event listener for a wrapper and then use event target to get the element that fired it
    $slider.mousedown(function() {
      panelClosed.data.slider_interacted = 1;
    });

    $letterBig.mousedown(function() {
      panelClosed.data.large_a_clicked = 1;
    });

    $letterSmall.mousedown(function() {
      panelClosed.data.small_a_clicked = 1;
    });

    $ttsButton.mousedown(function() {
      panelClosed.data.tts_clicked = 1;
    });
    return false;
  }

  // ============= Events Handlers ======================
  // Create an instance on panel show event.
  sitecues.on('bp/will-expand', function() {
    if (!panelClosed.data) {
      panelClosed.init();
    }
    sitecues.emit('metrics/panel-closed/create');
  });

  sitecues.on('metrics/update', function(metrics) {
    panelClosed.data && panelClosed.update(metrics.data);
  });

  // Clear an instance data on panel hide event.
  sitecues.on('bp/did-shrink', function() {
    panelClosed.send();
    panelClosed.reset();
  });
  // no publics
});
