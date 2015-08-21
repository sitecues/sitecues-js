/*
 * Basically, it stores userId and user preferences.
 *
 * Namespace: "sitecues", "sitecues":"userId".
 *
 * Example of the current Local Storage string:
 *
 * sitecues: {
 * "userId":"51eb744d-ef35-42ec-b44d-be2afcbf9e83",
 * "51eb744d-ef35-42ec-b44d-be2afcbf9e83":
 *    {"firstHighZoom":1408448995870,
 *     "zoom":1.1,
 *     "ttsOn":false,
 *     "firstSpeechOn":"1406131476374"
 *    }
 * }
 */
define([], function() {

  'use strict';

  /*
   * Run the function everytime we want to work with Local Storage
   * because settings can be changes while working with sitecues.
   * @returns {Boolean}
   */
  function isSupported() {
    var testKey = 'test', storage = window.sessionStorage;
    try {
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      SC_DEV && console.log('Local Storage is not supported or cannot be used.');
      return false;
    }
  }

  /*
   * Get value of Local Storage's "sitecues" key which is the outer namespace.
   * @returns {DOMString}
   */
  function getSitecuesLs() {
    if (isSupported()) {
      return window.localStorage.getItem('sitecues') || setSitecuesLs();
    }
  }

  /*
   * Set value of Local Storage's "sitecues" key which is the outer namespace.
   * @returns {DOMString}
   */
  function setSitecuesLs(data) {
    if (isSupported()) {
      window.localStorage.setItem('sitecues', JSON.stringify(data || {}));
      return getSitecuesLs();
    }
  }

  /*
   * Clear "sitecues" key value which is the outer namespace.
   * @returns {DOMString}
   */
  function clearSitecuesLs() {
    isSupported() && window.localStorage.removeItem('sitecues');
  }

  /*
   * Get current userId from Local Storage under "sitecues" namespace.
   * @returns {JSON.parse.j|Array|Object}
   */
  function getUserId() {
    if (isSupported()) {
      var sitecuesLs = getSitecuesLs();
      if (sitecuesLs) {
        var internalLs = JSON.parse(sitecuesLs);
        return internalLs && internalLs.userId;
      }
    }
  }

  /*
   * Set current userId from Local Storage under "sitecues" namespace.
   * @returns {JSON.parse.j|Array|Object}
   */
  function setUserId(value) {
    if (isSupported()) {
      var sitecuesLs = getSitecuesLs() || setSitecuesLs();
      if (sitecuesLs) {
        var internalLs = JSON.parse(sitecuesLs);
        internalLs.userId = value || {};
        setSitecuesLs(internalLs);
      }
    }
  }

  /**
   * Set Local Storage data | siteues:userID namespace.
   * @param {Object} data
   * @returns {void}
   */
  function setUserPreferencesById(userPrefData) {
    if (isSupported()) {
      var sitecuesLs = JSON.parse(getSitecuesLs());
      sitecuesLs[getUserId()] = userPrefData || '{}';

      // Set the initial data under userId namespace.
      setSitecuesLs(sitecuesLs);
      SC_DEV && console.log('Setting the data in LocalStorage: ' + JSON.stringify(sitecuesLs));
    }
  }

  /**
   * Update LocalStorage data in key, value format | siteues:userID namespace.
   * @param {String} lsByUserId
   * @param {String} key
   * @param {String} value
   * @returns {void}
   */
  function setUserPreferenceById(key, value) {
    if (isSupported()) {
      var userPrefData = getUserPreferencesById();
      var sitecuesLs = JSON.parse(getSitecuesLs());
      // Update value.
      userPrefData[key] = value;
      sitecuesLs[getUserId()] = userPrefData;
      // Save in LocalStorage.
      setSitecuesLs(sitecuesLs);
      //SC_DEV && console.log('Updating the data in LocalStorage: ' + JSON.stringify(sitecuesLs));
    }
  }

  /**
   * Get LocalStorage data | siteues:userID namespace.
   * @returns {DOMString}
   */
  function getUserPreferencesById() {
    if (isSupported()) {
      var sitecuesLs = JSON.parse(getSitecuesLs());
      return sitecuesLs[getUserId()];
    }
  }

  var publics = {
    clearSitecuesLs: clearSitecuesLs,
    getUserId: getUserId,
    setUserId: setUserId,
    setUserPreferencesById: setUserPreferencesById,
    setUserPreferenceById: setUserPreferenceById,
    getUserPreferencesById: getUserPreferencesById
  };
  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});

