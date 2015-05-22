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
    'sitecues_main_panel': 'Panel principal de sitecues',
    'badge_label': 'Herramientas de acercamiento y de voz de sitecues',
    'zoom_in': 'aumentar acercamiento',
    'zoom_out': 'aisminuir acercamiento',
    'help': 'ayuda',

    // Visible labels
    'pre_zoom': 'Acercamiento ',
    'post_zoom': 'x',
    'zoom_off': 'Sin acercamiento',
    'speech': 'Voz',
    'on' : 'Alta',
    'off': 'Baja'
  };

  callback();

});