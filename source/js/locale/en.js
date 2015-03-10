/*
Temporary file for English wording.
todo: remove it when we use API.
 */
sitecues.def('locale/en', function(english, callback) {
  'use strict';

  // All
  // - lower case
  // - use underscore to concatenate words
  english.dictionary = {
    // ARIA labels
    'sitecues_main_panel': 'sitecues main panel',
    'badge_label': 'sitecues zoom and speech tools',
    'zoom_in': 'zoom in',
    'zoom_out': 'zoom out',

    // Visible labels
    'pre_zoom': 'Zoom ',
    'post_zoom': 'x',
    'zoom_off': 'Zoom Off',
    'speech': 'Speech',
    'on' : 'On',
    'off': 'Off',
    'help': 'Help'
  };

  callback();

});