// Return the extended font charset name, e.g. 'latin-ext'

define(['core/locale'], function(locale) {
  /**
   * Return 'latin-ext' if latin-ext font needed, etc.
   * @returns {*}
   */
  return function() {
    var lang = locale.getLang(),
      EXTENDED_LANGS = {
        'latin-ext': [
          'hr', // Croatian
          'cs', // Czech
          'et', // Estonian
          'hu', // Hungarian
          'lv', // Latvian
          'lt', // Lithuanian
          'pl', // Polish
          'ro', // Romanian
          'sr', // Serbian
          'sk', // Slovak
          'sl', // Slovenian
          'tr' // Turkish
        ]
      },
      allExtensions = Object.keys(EXTENDED_LANGS),
      index = allExtensions.length,
      currExtension,
      currLangs;

    while (index --) {
      currExtension = allExtensions[index];
      currLangs = EXTENDED_LANGS[currExtension];
      if (currLangs.indexOf(lang) >= 0) {
        return currExtension;
      }
    }
  };
});
