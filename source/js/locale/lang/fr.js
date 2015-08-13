/*
Temporary file for English wording.
todo: remove it when we use API.
 */
sitecues.def('locale/fr', function(locale_fr, callback) {
  'use strict';

  // All
  // - lower case
  // - use underscore to concatenate words
  locale_fr.dictionary = {
    // ARIA labels
    'sitecues_main_panel': 'Console d\'administration sitecues',
    'badge_label': 'Outils de zoom et diction sitecues',
    'zoom_in': 'agrandir',
    'zoom_out': 'réduire',

    // Visible labels
    'pre_zoom': 'Zoom ',
    'post_zoom': 'x',
    'zoom_off': 'Zoom desactivé',
    'speech': 'Diction',
    'on' : 'activée',
    'off': 'desactivée'
  };

  callback();

});