/*
 Temporary file for Polish language wording.
 todo: remove it when we use API.
 todo: we need to check the translations
 */
sitecues.def('locale/pl', function(locale_pl, callback) {
  'use strict';

  locale_pl.dictionary = {
    // ARIA labels
    // - Main
    'sitecues_main_panel': 'główny panel sitecues',
    'badge_label': 'narzędzia powiększania i mowy sitecues',
    'zoom_in': 'powiększ',
    'zoom_out': 'pomniejsz',
    // - Secondary
    'more_features': '-',
    'previous': '-',
    'next': '-',
    // - Feedback
    'rating_none': '-',
    'rating_1': '-',
    'rating_2': '-',
    'rating_3': '-',
    'rating_4': '-',
    'rating_5': '-',

    // Visible labels
    // - Main
    'pre_zoom': 'Powiększenie ',
    'post_zoom': 'x',
    'zoom_off': 'Powiększenie Wył',
    'speech': 'Głos',
    'on' : 'Wł.',
    'off': 'Wył',
    // - Secondary
    'tips': '-',
    'settings': '-',
    'rate_us': '-',
    'about': '-',
    // - Feedback
    'send': '-',
    'tell_us_something': '-',
    'thank_you': '-',
    // - About
    'zoom_and_speech': '-'
  };

  callback();

});
