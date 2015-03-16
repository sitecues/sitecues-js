// TODO make it simpler to add new locales
// TODO Locales should probably be loaded dynamically
// TODO sub-locales should provide things like 'colour' vs 'color'

/*
 */
sitecues.def('util/localization', function(locale, callback) {
  'use strict';

  var translations;
  var locales = {
    'english': 'en',
    'polish': 'pl',
    'german': 'de'
  };
  var modules = [locales['english'], locales['polish'], locales['german']];

  locale.default = locales.english;

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
      return websiteLang;
    }

    return websiteLang;
  };
  /**
   * Represents browser language.
   * @returns String Example: 'en_US'
   */
  locale.getBrowserLangStringName = function() {
     return (navigator && navigator.language) || locale.default;
  };

  locale.translate = function(key) {
    var lang = locale.getShortWebsiteLang();
    try {
      return translations[key];
    } catch (e) {
      // todo: fallback to default?
      console.log('Unable to get translation for text code: "'+ key + '" and language: "' + lang + '".');
    }

  // todo: request the translation and store them in localstorage or a global variable

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

  // todo: fetch from the server via CORS Ajax
  function getTranslationFile() {
    var lang = locale.getShortWebsiteLang();
    var moduleName = 'locale/';
    switch(lang) {
      case locales.german:
        moduleName += modules[2]; // e.g. 'locale/german'
        locale.current = locales.german;
        break;
      case locales.polish:
        moduleName += modules[1]; // e.g. 'locale/polish'
        locale.current = locales.polish;
        break;
      default:
        moduleName += modules[0]; // e.g. 'locale/english'
        locale.current = locales.english;
        break;
    }

    // moduleName = 'locale/pl'; // todo: remove it, this is for QA

    //todo: maybe, place this code in 'default' switch case
    // use ajax for polish
    sitecues.use(moduleName, function(lang) {
      translations = lang.dictionary;
    });
  }

  // On load fetch the translations only once
  // todo: rename
  getTranslationFile();

  callback();

});