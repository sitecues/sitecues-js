/*
 */
sitecues.def('util/localization', function(locale, callback) {
  'use strict';

  var translations;
  var locales = {
    'english': 'en',
    'polish': 'pl'
  };
  var modules = [locales['english'], locales['polish']];

  locale.default = locales.english;

  /**
   * Represents website language.
   * @returns String Example: 'ru_US'
   */
  locale.getWebsiteLangStringName = function() {
    return document.documentElement.lang || locale.default;
  };

  /**
   * Represents browser language.
   * @returns String Example: 'en_US'
   */
  locale.getBrowserLangStringName = function() {
     return (navigator && navigator.language) ? navigator.language : locale.default;
  };

  locale.translate = function(key) {
    var lang = locale.getWebsiteLangStringName();
    try {
      return translations[key];
    } catch (e) {
      // todo: fallback to default?
      console.log('Unable to get translation for text code: "'+ key + '" and language: "' + lang + '".');
    }

  // todo: request the translation and store them in localstorage or a global variable

  };

  // todo: fetch from the server via CORS Ajax
  function getTranslationFile() {
    var lang = locale.getWebsiteLangStringName();
    var moduleName = 'locale/';
    switch(lang) {
      case locales.polish:
        moduleName += modules[1]; // e.g. 'locale/polish'
        locale.current = locales.polish;
        break;
      default:
        moduleName += modules[0]; // e.g. 'locale/english'
        locales.current = locales.english;
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