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
define(
  [
    'core/util/uuid',
    'core/native-functions'
  ],
  function (
    uuid,
    nativeFn
  ) {
  'use strict';

  var
    NAMESPACE = 'sitecues',
    cachedAppData;

  // For tests only! Do not use in product as it could result in poor performance.
  function clearCache() {
    cachedAppData = undefined;
  }

  /*
   * Friendly API for overwriting all data we have put into storage.
   * If you can, use clearCache() or setPref() instead.
   */
  function setAppData(data) {

    /*
     * Overwrite the entire namespace that we use for storing data.
     */
    function setRawAppData(dataString) {
      try {
        localStorage.setItem(NAMESPACE, dataString);
      }
      catch(ex) {}
    }

    /*
     * Get the final representation that we will put into storage.
     */
    function serialize(data) {
      return nativeFn.JSON.stringify(data || {});
    }

    // Saves data for this page view
    cachedAppData = data;

    // Tries to save data for future page views
    var dataString = serialize(data);
    setRawAppData(dataString);
  }

  /*
   * Friendly API for retrieving all data we have put into storage.
   * If you can, use getPrefs(), instead.
   */
  function getAppData() {
    /*
     * Get value of the entire namespace that we use for storing data.
     * @returns {DOMString or null}
     */
    function getRawAppData() {
      return localStorage.getItem(NAMESPACE);
    }

    /*
     * Get the normalized representation of what was in storage.
     */
    function deserialize(dataString) {
      return dataString ? nativeFn.JSON.parse(dataString) : {};
    }

    if (cachedAppData) {
      return cachedAppData;
    }

    var dataString = getRawAppData();
    return deserialize(dataString);
  }

  /*
   * Overwrite only the userId portion of the data currently in storage.
   */
  function createUser() {
    var userId = uuid(),
      appData = { userId : userId };
    appData[userId] = {};
    console.log('New user ', userId);
    setAppData(appData);
  }

  /*
   * Get current userId from Local Storage under "sitecues" namespace.
   * @returns {String|undefined}
   */
  function getUserId() {
    return getAppData().userId;
  }

  /**
   * Update LocalStorage data in name, value format | sitecues:userID namespace.
   * @param {String} name
   * @param {String} value
   * @returns {void}
   */
  function setPref(name, value) {

    var userId = getUserId();

    if (!userId) {
      throw new Error('No user ID is set to save preferences for.');
    }

    var
      userPreferences = getPrefs(),
      appData = getAppData();

    userPreferences[name] = value;

    appData[userId] = userPreferences;
    setAppData(appData);
  }

  /**
   * Get the user settings we have stored, nested within app data.
   * @returns {Object}
   */
  function getPrefs() {
    var
      appData = getAppData(),
      userPreferences = appData[getUserId()];

    return userPreferences || {};
  }

  return {
    createUser: createUser,
    getUserId: getUserId,
    setPref: setPref,
    getPrefs: getPrefs,
    setAppData: setAppData,
    getAppData: getAppData,
    clearCache: clearCache
  };
});
