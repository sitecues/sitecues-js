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
<<<<<<< HEAD
    // ARIA labels
    'sitecues_main_panel': 'sitecues main panel',
    'badge_label': 'sitecues zoom and speech tools',
    'zoom_in': 'zoom out',
    'zoom_out': 'zoom in',

    // Visible labels
    'zoom': 'Zoom',
    'zoomoff': 'Zoom Off',
    'x': 'x',
=======
    'pre_zoom': 'Zoom ',
    'zoom_off': 'Zoom Off',
    'post_zoom': 'x',
>>>>>>> fix-en-zoom-l10n
    'speech': 'Speech',
    'on' : 'On',
    'off': 'Off'
  };

  callback();

});