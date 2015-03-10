/*
 Temporary file for Polish language wording.
 todo: remove it when we use API.
 todo: we need to check the translations
 */
sitecues.def('locale/pl', function(polish, callback) {
  'use strict';

  polish.dictionary = {
    'pre_zoom': 'Powiększenie ',
    'post_zoom': 'x',
    'zoom_off': 'Powiększenie Wył',
    'speech': 'Głos',
    'on' : 'Wł.',
    'off': 'Wył'
  };

  callback();

});