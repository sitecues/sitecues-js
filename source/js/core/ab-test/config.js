/**
 * Global configuration for A/B testing for this version of Sitecues
 * Wiki: https://equinox.atlassian.net/wiki/display/EN/AB+Testing
 * Provided in layers, weight in one layer are separate from other layers and implicitly add to 100%
 * If the weight field is not provided it is assumed to be 1
 * If an array is provided for layer, then all values get weight of 1, e.g. timer values [0, 1000, 2000]
 */
define([], function () {
  'use strict';

  // Maximum layer depth is 5 (because of 5 sections of user id)
  // TODO this is just an example of what's possible, let's actually use it

  var globalAbOptions = {
    NONE: {  // Special value meaning no A/B test is occurring
      weight: 4
    },
    // Commented but kept in source as an example of what's possible
    // 'iconTest': {
    //   weight: 10,
    //   layerOptions: {
    //     'settingsIconTest': {
    //       layerOptions: [
    //         'gear',
    //         'sliders'
    //       ]
    //     },
    //     'tipsIconTest': {
    //       layerOptions: [
    //         'question',
    //         'lightbulb'
    //       ]
    //     }
    //   }
    // },
    'moreButtonTimer': {
      weight: 1,
      layerOptions: [
        0,
        1000,
        2000,
        3000,
        4000,
        5000,
        6000,
        7000
      ]
    }
  };

  return globalAbOptions;
});

