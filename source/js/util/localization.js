// TODO make it simpler to add new locales
// TODO Locales should probably be loaded dynamically
// TODO sub-locales should provide things like 'colour' vs 'color'

/*
 */
sitecues.def('util/localization', function(locale, callback) {
  'use strict';

  var translations;

  locale.default = 'en';

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
  locale.getShortWebsiteLang = function() {
    var websiteLanguage = getWebsiteLang();
    return websiteLanguage ? getBaseLanguage(websiteLanguage) : locale.default;
  };

  locale.getFullWebsiteLang = function() {
    var browserLang = navigator.language,
      websiteLang = getWebsiteLang() || locale.default;
    if (websiteLang && browserLang && browserLang.indexOf('-') > 0) {
      if (getBaseLanguage(websiteLang) === getBaseLanguage(browserLang)) {
        // If document is in the same language as the browser, then
        // we should prefer to use the browser's locale.
        // This helps make sure UK users get a UK accent on all English sites, for example.
        return browserLang;
      }
    }

    return websiteLang;
  };

  // Get language that applies to element (optional param)
  // Fallback on document and then browser default language
  locale.getElementLang = function(element) {
    while (element) {
      var lang = element.getAttribute('lang') || element.getAttribute('xml:lang');
      if (lang) {
        return lang;
      }
      element = element.parentElement;
    }

    return locale.getFullWebsiteLang();
  };

  /**
   * Represents browser language.
   * @returns String Example: 'en_US'
   */
  locale.getBrowserLangStringName = function() {
     return (navigator && navigator.language) || locale.default;
  };

  locale.translate = function(key) {
    var lang = locale.getShortWebsiteLang(),
      text = translations[key];

    if (typeof text === 'undefined') {
      // todo: fallback to default?
      SC_DEV && console.log('Unable to get translation for text code: "'+ key + '" and language: "' + lang + '".');
      return '-';
    }

    return text;
  };

  // Replace each {{keyname}} with the translation using that key
  // Key names can container lower case letters, numbers and underscores
  locale.localizeStrings = function(text) {
    var MATCH_KEY = /\{\{([a-z0-9\_]+)\}\}/g;
    return text.replace(MATCH_KEY, function (match, capture) { return locale.translate(capture); });
  };

  /**
   * Translate a number
   * @param number  Number to translate
   * @param numDigits (optional)
   */
  locale.translateNumber = function(number, numDigits) {
    var lang = locale.getShortWebsiteLang();
    var translated = number.toLocaleString(lang);
    return numDigits ? translated.slice(0, numDigits + 1) : translated;
  };

  function getLanguageModuleName(lang) {
    return 'locale/' + lang;
  }

  // todo: fetch from the server via CORS Ajax
  function getTranslationFile() {
    var lang = locale.getShortWebsiteLang();

    // use ajax for polish
    sitecues.use(getLanguageModuleName(lang), function(lang) {
      if (lang) {
        translations = lang.dictionary;
      }
      else {
        sitecues.use(getLanguageModuleName(locale.default), function(lang) {
          translations = lang.dictionary;
        });
      }
    });
  }

  // On load fetch the translations only once
  // todo: rename
  getTranslationFile();

  callback();

});