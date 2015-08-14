/*
Temporary file for English wording.
todo: remove it when we use API.
 */
sitecues.def('locale/es', function(locale_es, callback) {
  'use strict';

  // All
  // - lower case
  // - use underscore to concatenate words
  locale_es.dictionary = {
    // ARIA labels
    // - Main
    'sitecues_main_panel': 'Panel principal de sitecues',
    'badge_label': 'Herramientas de acercamiento y de voz de sitecues',
    'zoom_in': 'aumentar acercamiento',
    'zoom_out': 'aisminuir acercamiento',
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
    'pre_zoom': 'Acercamiento ',
    'post_zoom': 'x',
    'zoom_off': 'Sin acercamiento',
    'speech': 'Voz',
    'on' : 'Alta',
    'off': 'Baja',
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