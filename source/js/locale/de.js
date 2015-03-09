/*
Temporary file for English wording.
todo: remove it when we use API.
 */
sitecues.def('locale/de', function(german, callback) {
  'use strict';

  // All
  // - lower case
  // - use underscore to concatenate words
  german.dictionary = {
    'zoom': '',  // Nothing before number, everything after via 'x' label
    'zoomoff': 'Zoom Aus',
    'x': ' fach Zoom',
    'speech': 'Sprache',
    'on' : 'Ein',
    'off': 'Aus'
  };

  callback();

});