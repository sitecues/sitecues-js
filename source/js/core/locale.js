// TODO sub-locales should provide things like 'colour' vs 'color'

/**
 * Localization / language functons, such as:
 * - Get the current language for the document or an element
 * - Provide localized strings for current language
 * - Translate text with {{keys}} in it
 * - Localize a number string
 */
define([], function() {
  var translations = {},  // TODO this is a workaround
    DEFAULT_LANG = 'en-us',
    LANG_PREFIX = 'locale-data/',
    SUPPORTED_LANGS = ['de', 'en', 'es', 'fr', 'pl'],
    // Countries which have localization files that are different from the default for that language
    // For example, en-us files use 'color' instead of the worldwide standard 'colour'
    COUNTRY_EXCEPTIONS = {'en-us': 1};

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

    return lang.toLowerCase();
  }

  /**
   * Represents website language.
   * For example, returns 'en', 'de'
   * If there are country-specific translation exceptions, return the full string, e.g. 'en-us'
   * @returns String
   */
  function getShortWebsiteLang() {
    var websiteLanguage = getWebsiteLang();
    return getBaseLanguage(websiteLanguage || DEFAULT_LANG);
  }

  function getFullWebsiteLang() {
    var browserLang = getBrowserLangStringName(),
      websiteLang = getWebsiteLang() || browserLang;
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

  /**
   * Represents browser language.
   * @returns String Example: 'en_US'
   */
  function getBrowserLangStringName() {
     return navigator.language || DEFAULT_LANG;
  }

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

  // In most cases, just returns 'en', 'de', etc.
  // However, when there are special files for a country translation, returns a longer name like 'en-us' for the U.S.
  // The language is based on the page, but the country is based on the browser (if the lang is the same)
  function getSuffixForLocalizedFileName() {
    var langOnly = getShortWebsiteLang(),
      browserLang = getBrowserLangStringName().toLocaleLowerCase(),
      isSameLangAsBrowser = langOnly === getBaseLanguage(browserLang),
      langWithCountry;

    if (isSameLangAsBrowser) {
      langWithCountry = browserLang;
      if (COUNTRY_EXCEPTIONS[langWithCountry]) {  // We have country exceptions for the browser home country
        return langWithCountry;
      }
    }

    return langOnly;
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
    getFullWebsiteLang: getFullWebsiteLang,
    getBrowserLangStringName: getBrowserLangStringName,
    getSuffixForLocalizedFileName: getSuffixForLocalizedFileName,
    translate: translate,
    localizeStrings: localizeStrings,
    translateNumber: translateNumber,
    init: init
  };


});

