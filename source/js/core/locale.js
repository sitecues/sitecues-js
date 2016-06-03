/**
 * Localization / language functions, such as:
 * - Get the current language for the document or an element
 * - Provide localized strings for current language
 * - Translate text with {{keys}} in it
 * - Localize a number string
 *
 * Definitions:
 * - lang is a 2 letter code such as 'en'
 * - locale is either a lang or can include more info, such as 'en-GB'
 */
define([ 'core/data-map', 'Promise' ], function(dataMap, Promise) {
  var translations = {},
    DEFAULT_LOCALE = 'en-us',
    LOCALE_DATA_PREFIX = 'locale-data/',
    AUDIO_CUE_DATA_PREFIX = LOCALE_DATA_PREFIX + 'cue/',
    SUPPORTED_UI_LANGS = {'de':1, 'en':1, 'es':1, 'fr':1, 'pl':1, 'sv':1 },
    // Countries which have localization files that are different from the default for that language
    // For example, en-us files use 'color' instead of the worldwide standard 'colour'
    COUNTRY_EXCEPTIONS = { 'en-US': 1 },
    mainBrowserLocale;

  // Get the language but not the regional differences
  // For example, return just 'en' but not 'en-US'.
  function getLanguageFromLocale(locale) {
    return locale.split('-')[0];
  }

  // The the full xx-XX code for the website
  function getLocale() {
    var
      docElem = document.documentElement,
      docLocales = [docElem.lang, docElem.getAttribute('xml:lang'), getMetaTagLocale()],
      validDocLocale;

    docLocales.some(function (locale) {
      if (isValidLocale(locale)) {
        validDocLocale = locale;
        return true;
      }
    });

    return validDocLocale || mainBrowserLocale || DEFAULT_LOCALE;
  }

  function isValidLocale(locale) {
    // Regex from http://stackoverflow.com/questions/3962543/how-can-i-validate-a-culture-code-with-a-regular-expression
    var VALID_LOCALE_REGEX = /^[a-z]{2,3}(?:-[A-Z]{2,3}(?:-[a-zA-Z]{4})?)?$/;
    return locale && locale.match(VALID_LOCALE_REGEX);
  }

  function getMetaTagLocale() {
    var META_LANG_SELECTOR = 'meta[name=language],meta[http-equiv=language],meta[name=Content-Language],meta[http-equiv=Content-Language]',
      metaLocaleElement = document.querySelector(META_LANG_SELECTOR),
      metaLocale;

    if (metaLocaleElement) {
      metaLocale = metaLocaleElement.getAttribute('content').split(',')[0].trim();  // Can be comma-separated
      // Validate the format of the attribute -- some docs online use invalid strings such as 'Spanish'
      return isValidLocale(metaLocale) && metaLocale;
    }
  }

  /**
   * Represents website language.
   * For example, returns 'en', 'de'
   * If there are country-specific translation exceptions, such as 'en-US', we strip the last part and return only 'en'
   * @returns String
   */
  function getLang() {
    var websiteLanguage = getLocale();
    return getLanguageFromLocale(websiteLanguage);
  }

  function getSupportedUiLang() {
    var lang = getLang();

    return SUPPORTED_UI_LANGS[lang] ? lang : DEFAULT_LOCALE;
  }

  // The language for audio
  // Takes an optional parameter for a lang (e.g. from an element to be spoken). If not provided, assumes the doc language.
  // Returns a full country-affected language, like en-CA when the browser's language matches the site's language prefix.
  // For example, if an fr-CA browser visits an fr-FR website, then fr-CA is returned instead of the page code,
  // because that is the preferred accent for French.
  // However, if the fr-CA browser visits an en-US or en-UK page, the page's code is returned because the
  // user's preferred English accent in unknown
  function getAudioLocale(optionalStartingLocale) {
    var localeToConvert = isValidLocale(optionalStartingLocale) ? optionalStartingLocale : getLocale();

    return extendLocaleWithBrowserCountry(localeToConvert);
  }

  // If document is in the same language as the browser, then
  // we should prefer to use the browser's country-specific version of that language.
  // This helps make sure UK users get a UK accent on all English sites, for example.
  // We now check all the preferred languages of the browser.
  // @param countriesWhiteList -- if provided, it is the list of acceptable fully country codes, e.g. en-US.
  // If not provided, all countries and langs are acceptable
  // @param langsWhiteList -- if provided, it is the list of acceptable languages.
  function extendLocaleWithBrowserCountry(locale, countriesWhiteList, langsWhiteList) {

    var langPrefix = getLanguageFromLocale(locale),
      prioritizedBrowserLocales = (function() {
        var browserLocales = (navigator.languages || [ ]).slice();
        // Put the mainBrowserLang at the start of the prioritized list of languages
        if (!browserLocales.length) {
          browserLocales = [ mainBrowserLocale ];
        }
        return browserLocales;
      })(),
      langWithCountry,
      index = 0;

    function extendLangWith(extendCode) {
      if (extendCode.indexOf('-') > 0 && langPrefix === getLanguageFromLocale(extendCode)) {
        if (!countriesWhiteList || countriesWhiteList.hasOwnProperty(extendCode)) {
          return extendCode;
        }
        if (langsWhiteList[langPrefix]) {
          return langPrefix;  // Use without a country
        }
      }
    }

    for (; index < prioritizedBrowserLocales.length; index ++) {
      langWithCountry = extendLangWith(prioritizedBrowserLocales[index]);
      if (langWithCountry) {
        return langWithCountry; // Matched one of the preferred accents
      }
    }

    return locale;
  }

  // Return the translated text for the key
  function translate(key) {
    var lang = getLang(),
      text = translations[key];

    if (typeof text === 'undefined') {
      if (SC_DEV) { console.log('Unable to get translation for text code: "'+ key + '" and language: "' + lang + '".'); }
      return '-';
    }

    return text;
  }

  // Globally replace all instances of the pattern {{keyname}} with the translation using that key
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
    var lang = getLang();
    //Number.toLocaleString locale parameter is unsupported in Safari
    var translated = number.toLocaleString(lang);
    return numDigits ? translated.slice(0, numDigits + 1) : translated;
  }

  // The language of user interface text:
  // In most cases, just returns 'en', 'de', etc.
  // However, when there are special files for a country translation, returns a longer name like 'en-us' for the U.S.
  // The language is based on the page, but the country is based on the browser (if the lang is the same)
  function getUiLocale() {
    var langOnly = getSupportedUiLang();

    return extendLocaleWithBrowserCountry(langOnly, COUNTRY_EXCEPTIONS, SUPPORTED_UI_LANGS).toLowerCase();
  }

  // The preferred language of the current browser
  function getBrowserLocale() {
    return mainBrowserLocale;
  }

  function getAudioCueTextAsync(key, callback) {
    var lang = getLang(),
      langModuleName = AUDIO_CUE_DATA_PREFIX + lang;
    dataMap.get(langModuleName, function(data) {
      callback(data[key] || '');
    });
  }

  function getMainBrowserLocale() {
    return navigator.language || navigator.userLanguage || navigator.browserLanguage || DEFAULT_LOCALE;
  }

  function init() {
    return new Promise(function(resolve, reject) {
      mainBrowserLocale = getMainBrowserLocale();

      // On load fetch the translations only once
      var lang = getSupportedUiLang(),
        langModuleName = LOCALE_DATA_PREFIX + lang;

      dataMap.get(langModuleName, function (data) {
        translations = data;
        if (translations) {
          resolve();
        }
        else {
          // TODO solve this mystery error (this info should help)
          reject(new Error('Translation not found for ' + lang));
        }
      });
    });
  }

  return {
    getLang: getLang,
    getAudioLocale: getAudioLocale,
    getBrowserLang: getBrowserLocale,
    getUiLocale: getUiLocale,
    getAudioCueTextAsync: getAudioCueTextAsync,
    translate: translate,
    localizeStrings: localizeStrings,
    translateNumber: translateNumber,
    init: init
  };
});

