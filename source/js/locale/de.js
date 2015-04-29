/*
Temporary file for German wording.
todo: remove it when we use API.
 */
sitecues.def('locale/de', function(locale_de, callback) {
  'use strict';

  // All
  // - lower case
  // - use underscore to concatenate words
  locale_de.dictionary = {
    // ARIA labels
    'sitecues_main_panel': 'sitecues dialog',
    'badge_label': 'sitecues Vergrößerungs und Sprachausgabe Steuerung',
    'zoom_in': 'Grösser',
    'zoom_out': 'Kleiner',
    'help': 'Hilfe',

    // Visible labels
    'pre_zoom': '',  // Nothing before number, everything after via 'x' label
    'post_zoom': ' fach Zoom',
    'zoom_off': 'Zoom Aus',
    'speech': 'Sprache',
    'on' : 'Ein',
    'off': 'Aus'
  };

  callback();

});
