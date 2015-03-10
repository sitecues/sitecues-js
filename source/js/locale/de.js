/*
Temporary file for German wording.
todo: remove it when we use API.
 */
sitecues.def('locale/de', function(german, callback) {
  'use strict';

  // All
  // - lower case
  // - use underscore to concatenate words
  german.dictionary = {
    // ARIA labels
    'sitecues_main_panel': 'sitecues Hauptpanel',
    'badge_label': 'sitecues Zoom und Sprache Stoff',
    'zoom_in': 'auszoomen',
    'zoom_out': 'einzoomen',

    // Visible labels
    'zoom': '',  // In German, there is nothing before the zoom number, everything after via 'x' label
    'zoomoff': 'Zoom Aus',
    'x': ' fach Zoom',
    'speech': 'Sprache',
    'on' : 'Ein',
    'off': 'Aus'
  };

  callback();

});