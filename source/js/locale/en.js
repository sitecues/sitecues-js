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
    "zoom": "Zoom ",
    "speech": "Speech ",
    "on" : "On",
    "off": "Off"
  };

  callback();

});