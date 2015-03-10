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
    'pre_zoom': '',  // Nothing before number, everything after via 'x' label
    'post_zoom': ' fach Zoom',
    'zoom_off': 'Zoom Aus',
    'speech': 'Sprache',
    'on' : 'Ein',
    'off': 'Aus'
  };

  callback();

});
