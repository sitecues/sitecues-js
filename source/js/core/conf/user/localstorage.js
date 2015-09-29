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

  /*
   * Get value of Local Storage's "sitecues" key which is the outer namespace.
   * @returns {DOMString}
   */
  function getSitecuesLs() {
    return localStorage.getItem('sitecues') || setSitecuesLs();
  }

  /*
   * Set value of Local Storage's "sitecues" key which is the outer namespace.
   * @returns {DOMString}
   */
  function setSitecuesLs(data) {
    localStorage.setItem('sitecues', JSON.stringify(data || {}));
    return getSitecuesLs();
  }

  /*
   * Clear "sitecues" key value which is the outer namespace.
   * @returns {DOMString}
   */
  function clear() {
    localStorage.removeItem('sitecues');
  }

  /*
   * Get current userId from Local Storage under "sitecues" namespace.
   * @returns {JSON.parse.j|Array|Object}
   */
  function getUserId() {
    var sitecuesLs = getSitecuesLs();
    if (sitecuesLs) {
      var internalLs = JSON.parse(sitecuesLs);
      return internalLs && internalLs.userId;
    }
  }

  /*
   * Set current userId from Local Storage under "sitecues" namespace.
   * @returns {JSON.parse.j|Array|Object}
   */
  function setUserId(value) {
    var sitecuesLs = getSitecuesLs() || setSitecuesLs();
    if (sitecuesLs) {
      var internalLs = JSON.parse(sitecuesLs);
      internalLs.userId = value || {};
      setSitecuesLs(internalLs);
    }
  }

  /**
   * Set Local Storage data | siteues:userID namespace.
   * @param {Object} data
   * @returns {void}
   */
  function setPrefs(userPrefData) {
    var sitecuesLs = JSON.parse(getSitecuesLs());
    sitecuesLs[getUserId()] = userPrefData || '{}';

    // Set the initial data under userId namespace.
    setSitecuesLs(sitecuesLs);
    if (SC_DEV) { console.log('Setting the data in LocalStorage: ' + JSON.stringify(sitecuesLs)); }
  }

  /**
   * Update LocalStorage data in key, value format | siteues:userID namespace.
   * @param {String} lsByUserId
   * @param {String} key
   * @param {String} value
   * @returns {void}
   */
  function setPref(key, value) {
    var userPrefData = getPrefs();
    var sitecuesLs = JSON.parse(getSitecuesLs());
    // Update value.
    userPrefData[key] = value;
    sitecuesLs[getUserId()] = userPrefData;
    // Save in LocalStorage.
    setSitecuesLs(sitecuesLs);
    //if (SC_DEV) { console.log('Updating the data in LocalStorage: ' + JSON.stringify(sitecuesLs)); }
  }

  /**
   * Get LocalStorage data | siteues:userID namespace.
   * @returns {DOMString}
   */
  function getPrefs() {
    var sitecuesLs = JSON.parse(getSitecuesLs()),
      prefs = sitecuesLs[getUserId()];
    return typeof prefs === 'object' ? prefs : {};
  }

  var publics = {
    clear: clear,
    getUserId: getUserId,
    setUserId: setUserId,
    setPrefs: setPrefs,
    setPref: setPref,
    getPrefs: getPrefs
  };
  if (SC_UNIT) {
    module.exports = publics;
  }
  return publics;
});

