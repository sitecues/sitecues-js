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

  var
    isInitialized,
    NAMESPACE = 'sitecues';

  /*
   * Clear "sitecues" key value which is the outer namespace.
   * @returns {DOMString}
   */
  function clear() {
    localStorage.removeItem(NAMESPACE);
  }

  function setSerializedAppData(dataString) {
    localStorage.setItem(NAMESPACE, dataString);
  }

  /*
   * Get value of Local Storage's "sitecues" key which is the outer namespace.
   * @returns {DOMString}
   */
  function getSerializedAppData() {
    return localStorage.getItem(NAMESPACE);
  }

  function serialize(data) {
    return JSON.stringify(data || {});
  }

  function deserialize(dataString) {
    return dataString ? JSON.parse(dataString) : {};
  }

  /*
   * Set value of Local Storage's "sitecues" key which is the outer namespace.
   */
  function setAppData(data) {

    var dataString = serialize(data);

    setSerializedAppData(dataString);
  }

  function getAppData() {

    var dataString = getSerializedAppData();

    return deserialize(dataString);
  }

  /*
   * Set current userId from Local Storage under "sitecues" namespace.
   * @returns {JSON.parse.j|Array|Object}
   */
  function setUserId(id) {
    if (id) {
      var appData = getAppData();
      appData.userId = id;
      setAppData(appData);
    }
  }

  /*
   * Get current userId from Local Storage under "sitecues" namespace.
   * @returns {JSON.parse.j|Array|Object}
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

    // TODO: setPref() would be more useful if it knew how to
    //       generate a user ID.
    if (!userId) {
      throw new Error('No user ID is set to save preferences for.');
    }

    var
      userPreferences = getPrefs(),
      appData = getAppData();

    userPreferences[name] = value;

    appData[getUserId()] = userPreferences;
    setAppData(appData);
  }

  /**
   * Get LocalStorage data | sitecues:userID namespace.
   * @returns {DOMString}
   */
  function getPrefs() {
    var
      appData = getAppData(),
      userPreferences = appData[getUserId()];

    return userPreferences || {};
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    // TODO: This seems bad. The caller should call methods explicitly.
    if (getUserId()) {
      // Has local storage sitecues prefs for this website
      return getPrefs();
    }

  }

  return {
    init: init,
    clear: clear,
    setUserId: setUserId,
    getUserId: getUserId,
    setPref: setPref,
    getPrefs: getPrefs,
    setAppData: setAppData,
    getSerializedAppData: getSerializedAppData
  };
});
