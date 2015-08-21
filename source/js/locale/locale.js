// TODO make it simpler to add new locales
// TODO Locales should probably be loaded dynamically
// TODO sub-locales should provide things like 'colour' vs 'color'

/**
 * Localization / language functons, such as:
 * - Get the current language for the document or an element
 * - Provide localized strings for current language
 * - Translate text with {{keys}} in it
 * - Localize a number string
 */
define([], function() {
  'use strict';

  var translations,
    DEFAULT_LANG = 'en',
    LANG_FOLDER = 'locale/lang/';

  // Get the language but not the regional differences
  // For example, return just 'en' but not 'en-US'.
  function getBaseLanguage(lang) {
    return lang.split('-')[0];
  }

  function getWebsiteLang() {
    var docElem = document.documentElement;
    var lang = docElem.lang;
    if (!lang) {
      lang = docElem.getAttribute('xml:lang');
    }

    return lang;
  }

  /**
   * Represents website language.
   * @returns String Example: 'en-US'
   */
  function getShortWebsiteLang() {
    var websiteLanguage = getWebsiteLang();
    return websiteLanguage ? getBaseLanguage(websiteLanguage) : DEFAULT_LANG;
  }

  function getFullWebsiteLang() {
    var browserLang = navigator.language,
      websiteLang = getWebsiteLang() || DEFAULT_LANG;
    if (websiteLang && browserLang && browserLang.indexOf('-') > 0) {
      if (getBaseLanguage(websiteLang) === getBaseLanguage(browserLang)) {
        // If document is in the same language as the browser, then
        // we should prefer to use the browser's locale.
        // This helps make sure UK users get a UK accent on all English sites, for example.
        return browserLang;
      }
    }

    return websiteLang;
  }

  // Get language that applies to element (optional param)
  // Fallback on document and then browser default language
  function getElementLang(element) {
    while (element) {
      var lang = element.getAttribute('lang') || element.getAttribute('xml:lang');
      if (lang) {
        return lang;
      }
      element = element.parentElement;
    }

    return getFullWebsiteLang();
  }

  locale.getDocumentLang = function() {
    return locale.getElementLang(document.body);
  };

  /**
   * Represents browser language.
   * @returns String Example: 'en_US'
   */
  function getBrowserLangStringName() {
     return (navigator && navigator.language) || DEFAULT_LANG;
  }

  function translate(key) {
    var lang = getShortWebsiteLang(),
      text = translations[key];

    if (typeof text === 'undefined') {
      // todo: fallback to default?
      SC_DEV && console.log('Unable to get translation for text code: "'+ key + '" and language: "' + lang + '".');
      return '-';
    }

    return text;
  }

  // Replace each {{keyname}} with the translation using that key
  // Key names can container lower case letters, numbers and underscores
  function localizeStrings(text) {
    var MATCH_KEY = /\{\{([a-z0-9\_]+)\}\}/g;
    return text.replace(MATCH_KEY, function (match, capture) { return translate(capture); });
  }

  /**
   * Return 'latin-ext' if latin-ext font needed, etc.
   * @returns {*}
   */
  function getExtendedFontCharsetName() {
    var lang = getShortWebsiteLang(),
      EXTENDED_LANGS = {
        'latin-ext': [
          'hr', // Croatian
          'cs', // Czech
          'et', // Estonian
          'hu', // Hungarian
          'lv', // Latvian
          'lt', // Lithuanian
          'pl',  // Polish
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
  }

  /**
   * Translate a number
   * @param number  Number to translate
   * @param numDigits (optional)
   */
  function translateNumber(number, numDigits) {
    var lang = getShortWebsiteLang();
    var translated = number.toLocaleString(lang);
    return numDigits ? translated.slice(0, numDigits + 1) : translated;
  }

  function getLanguageModuleName(lang) {
    return 'locale/' + lang;
  }

  // todo: fetch from the server via CORS Ajax
  function getTranslationFile() {
    var lang = getShortWebsiteLang();

    // use ajax for polish
    require([ LANG_FOLDER + getLanguageModuleName(lang) ], function(langModule) {
      if (langModule) {
        translations = langModule.dictionary;
      }
      else {
        require([ LANG_FOLDER + getLanguageModuleName(DEFAULT_LANG) ], function(defaultLangModule) {
          translations = defaultLangModule.dictionary;
        });
      }
    });
  }

  // On load fetch the translations only once
  getTranslationFile();

  var publics = {
    getShortWebsiteLang: getShortWebsiteLang,
    getFullWebsiteLang: getFullWebsiteLang,
    getElementLang: getElementLang,
    getBrowserLangStringName: getBrowserLangStringName,
    translate: translate,
    localizeStrings: localizeStrings,
    getExtendedFontCharsetName: getExtendedFontCharsetName,
    translateNumber: translateNumber
  };

  if (SC_UNIT) {
    module.exports = publics;
  }

  return publics;
});