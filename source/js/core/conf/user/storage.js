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
    NAMESPACE = 'sitecues';

  /*
   * Delete the outer namespace where we store data.
   * @returns {DOMString|null}
   */
  function clear() {
    localStorage.removeItem(NAMESPACE);
  }

  /*
   * Overwrite the entire namespace that we use for storing data.
   * You should probably NOT use this! Prefer setAppData().
   */
  function setRawAppData(dataString) {
    localStorage.setItem(NAMESPACE, dataString);
  }

  /*
   * Get value of the entire namespace that we use for storing data.
   * You should probably NOT use this! Prefer getAppData().
   * @returns {DOMString or null}
   */
  function getRawAppData() {
    return localStorage.getItem(NAMESPACE);
  }

  /*
   * Get the final representation that we will put into storage.
   */
  function serialize(data) {
    return JSON.stringify(data || {});
  }

  /*
   * Get the normalized representation of what was in storage.
   */
  function deserialize(dataString) {
    return dataString ? JSON.parse(dataString) : {};
  }

  /*
   * Friendly API for overwriting all data we have put into storage.
   * If you can, use clear() or setPref() instead.
   */
  function setAppData(data) {

    var dataString = serialize(data);

    setRawAppData(dataString);
  }

  /*
   * Friendly API for retrieving all data we have put into storage.
   * If you can, use getPrefs(), instead.
   */
  function getAppData() {

    var dataString = getRawAppData();

    return deserialize(dataString);
  }

  /*
   * Overwrite only the userId portion of the data currently in storage.
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

    appData[getUserId()] = userPreferences;
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
    clear: clear,
    setUserId: setUserId,
    getUserId: getUserId,
    setPref: setPref,
    getPrefs: getPrefs,
    setAppData: setAppData,
    getRawAppData: getRawAppData
  };
});
