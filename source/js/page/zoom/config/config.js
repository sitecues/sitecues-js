define(['$', 'core/conf/site'], function ($, site) {

  'use strict';

  var
    // Default zoom configuration
    config = { // Can be customized via provideCustomConfig()
      // Should smooth zoom animations be enabled?
      provideCustomZoomConfig: provideCustomZoomConfig,
      init: init
    };

  Object.defineProperties(config, {
    shouldRestrictWidth: {
      enumerable: true,
      get: function () {
        return config.isFluid;
      }
    }
  });


  // Allow customization of zoom configuration on a per-website basis
  function provideCustomZoomConfig(customZoomConfig) {
    $.extend(config, customZoomConfig);
  }

  function init() {
    $.extend(config, {
      // Does the web page use a fluid layout, where content wraps to the width?
      isFluid: site.get('isFluid'), // Can override in site preferences

      // Should the width of the page be restricted as zoom increases?
      // This is helpful for pages that try to word-wrap or use a fluid layout.
      // Eventually use fast page health calculation to automatically determine this
      // Assumes window width of 1440 (maximized screen on macbook)
      maxZoomToRestrictWidthIfFluid: site.get('maxRewrapZoom') || 1.5,

      // Set to 5 on sites where the words get too close to the left window's edge
      leftMarginOffset: site.get('leftMarginOffset') || 2,

      // Visible content containers for understanding left margin of page, or undefined to auto-detect,
      // The first one found will be used to determine the body's geometry.
      // e.g. '#pageWrapper, body>table'
      visibleRoots: site.get('visibleRoots')
    });
  }

  return config;

});