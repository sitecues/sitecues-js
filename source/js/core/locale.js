// TODO sub-locales should provide things like 'colour' vs 'color'

/**
 * Localization / language functons, such as:
 * - Get the current language for the document or an element
 * - Provide localized strings for current language
 * - Translate text with {{keys}} in it
 * - Localize a number string
 */
define(['core/conf/site'], function(site) {
  var translations = {},  // TODO this is a workaround
    DEFAULT_LANG = 'en-us',
    LANG_PREFIX = 'locale-data/',
    SUPPORTED_LANGS = ['de', 'en', 'es', 'fr', 'pl'],
    // Countries which have localization files that are different from the default for that language
    // For example, en-us files use 'color' instead of the worldwide standard 'colour'
    COUNTRY_EXCEPTIONS = { 'en-US': 1 },
    mainBrowserLang = site.get('browserLang') || navigator.language || navigator.userLanguage || navigator.browserLanguage || DEFAULT_LANG;

  // Get the language but not the regional differences
  // For example, return just 'en' but not 'en-US'.
  function getLanguagePrefix(lang) {
    return lang.split('-')[0];
  }

  // The the foll xx-XX code for the website
  function getFullWebsiteLang() {
    var docElem = document.documentElement,
      lang = docElem.lang || docElem.getAttribute('xml:lang') || mainBrowserLang || DEFAULT_LANG;
    return lang;
  }

  /**
   * Represents website language.
   * For example, returns 'en', 'de'
   * If there are country-specific translation exceptions, return the full string, e.g. 'en-us'
   * @returns String
   */
  function getShortWebsiteLang() {
    var websiteLanguage = getFullWebsiteLang();
    return getLanguagePrefix(websiteLanguage);
  }

  // The language for audio
  // Takes an optional parameter for a lang (e.g. from an element to be spoken). If not provided, assumes the doc language.
  // Returns a full country-affected language, like en-CA when the browser's language matches the site's language prefix.
  // For example, if an fr-CA browser visits an fr-FR website, then fr-CA is returned instead of the page code,
  // because that is the preferred accent for French.
  // However, if the fr-CA browser visits an en-US or en-UK page, the page's code is returned because the
  // user's preferred English accent in unknown
  function getAudioLang(optionalStartingLang) {
    var langToConvert = optionalStartingLang || getFullWebsiteLang();

    return extendLangWithBrowserCountry(langToConvert);
  }

  // If document is in the same language as the browser, then
  // we should prefer to use the browser's country-specific version of that language.
  // This helps make sure UK users get a UK accent on all English sites, for example.
  // We now check all the preferred languages of the browser.
  function extendLangWithBrowserCountry(lang, acceptableCodes) {
    function extendLangWith(extendCode) {
      if (extendCode.indexOf('-') > 0 && langPrefix === getLanguagePrefix(extendCode)) {
        if (!acceptableCodes || acceptableCodes.hasOwnProperty(extendCode)) {
          return extendCode;
        }
      }
    }

    var langPrefix = getLanguagePrefix(lang),
      prioritizedBrowserLangs = (function() {
        var browserLangs = navigator.languages || [ ];
        browserLangs.slice().reverse().shift(mainBrowserLang);
        return browserLangs;
      })(),
      langWithCountry,
      index = 0;

    for (; index < prioritizedBrowserLangs.length; index ++) {
      langWithCountry = extendLangWith(prioritizedBrowserLangs[index]);
      if (langWithCountry) {
        return langWithCountry; // Matched one of the preferred accents
      }
    }

    return lang;
  }

  // Return the translated text for the key
  function translate(key) {
    var lang = getShortWebsiteLang(),
      text = translations[key];

    if (typeof text === 'undefined') {
      // todo: fallback to default?
      if (SC_DEV) { console.log('Unable to get translation for text code: "'+ key + '" and language: "' + lang + '".'); }
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
   * Translate a number
   * @param number  Number to translate
   * @param numDigits (optional)
   */
  function translateNumber(number, numDigits) {
    var lang = getShortWebsiteLang();
    var translated = number.toLocaleString(lang);
    return numDigits ? translated.slice(0, numDigits + 1) : translated;
  }

  // The language of user interface text:
  // In most cases, just returns 'en', 'de', etc.
  // However, when there are special files for a country translation, returns a longer name like 'en-us' for the U.S.
  // The language is based on the page, but the country is based on the browser (if the lang is the same)
  function getTranslationLang() {
    var langOnly = getShortWebsiteLang();

    return extendLangWithBrowserCountry(langOnly, COUNTRY_EXCEPTIONS).toLowerCase();
  }

  function getBrowserLang() {
    return mainBrowserLang;
  }

  function init() {
    // On load fetch the translations only once
    var lang = getShortWebsiteLang(),
      sanitizedLang = SUPPORTED_LANGS.indexOf(lang) === -1 ? DEFAULT_LANG : lang,
      langModuleName = LANG_PREFIX + sanitizedLang;

    // Hack: sitecues.require() is used instead of require() so that we can use it with a variable name
    sitecues.require([ langModuleName ], function(langEntries) {
      translations = langEntries;
      sitecues.emit('locale/did-complete');
    });

  }

  return {
    getShortWebsiteLang: getShortWebsiteLang,
    getAudioLang: getAudioLang,
    getBrowserLang: getBrowserLang,
    getTranslationLang: getTranslationLang,
    translate: translate,
    localizeStrings: localizeStrings,
    translateNumber: translateNumber,
    init: init
  };
});

