/*
 Temporary file for Polish language wording.
 todo: remove it when we use API.
 todo: we need to check the translations
 */
sitecues.def('locale/pl', function(polish, callback) {
  'use strict';

  polish.dictionary = {
    // ARIA labels
    'sitecues_main_panel': 'główny panel sitecues',
    'badge_label': 'narzędzia powiększania i mowy sitecues',
    'zoom_in': 'powiększ',
    'zoom_out': 'pomniejsz',

    // Visible labels
    'pre_zoom': 'Powiększenie ',
    'post_zoom': 'x',
    'zoom_off': 'Powiększenie Wył',
    'speech': 'Głos',
    'on' : 'Wł.',
    'off': 'Wył'
  };

  callback();

});