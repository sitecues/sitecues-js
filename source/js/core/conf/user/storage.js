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
  var isInitialized;

  /*
   * Get value of Local Storage's "sitecues" key which is the outer namespace.
   * @returns {DOMString}
   */
  function getSitecuesLs() {
    return localStorage.getItem('sitecues') || setSitecuesLs();
  }

  /*
   * Set value of Local Storage's "sitecues" key which is the outer namespace.
   */
  function setSitecuesLs(data) {
    var dataString = JSON.stringify(data || {});
    localStorage.setItem('sitecues', dataString);
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
   * Update LocalStorage data in key, value format | sitecues:userID namespace.
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
  }

  /**
   * Get LocalStorage data | sitecues:userID namespace.
   * @returns {DOMString}
   */
  function getPrefs() {
    var sitecuesLs = JSON.parse(getSitecuesLs()),
      prefs = sitecuesLs[getUserId()];
    return typeof prefs === 'object' ? prefs : {};
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    if (getUserId()) {
      // Has local storage sitecues prefs for this website
      return getPrefs();
    }

  }

  return {
    init: init,
    clear: clear,
    getUserId: getUserId,
    setUserId: setUserId,
    setPref: setPref,
    getPrefs: getPrefs,
    setSitecuesLs: setSitecuesLs,
    getSitecuesLs: getSitecuesLs
  };
});
