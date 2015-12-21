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
define(['core/conf/user/storage-backup', 'core/util/uuid'], function(storageBackup, uuid) {

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
  function setSitecuesLs(data, doBackup) {
    var dataString = JSON.stringify(data || {});
    localStorage.setItem('sitecues', dataString);
    if (doBackup) {
      // Save in storage backup
      storageBackup.init(function() {
        storageBackup.save(dataString);
      });
    }
  }

  /*
   * Clear "sitecues" key value which is the outer namespace.
   * @returns {DOMString}
   */
  function clear() {
    localStorage.removeItem('sitecues');
    storageBackup.clear();
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
    setSitecuesLs(sitecuesLs, true);
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

  function init(onReadyCallbackFn) {
    if (getUserId()) {
      // Has local storage sitecues prefs for this website
      onReadyCallbackFn(getPrefs());
      return;
    }

    // Could not find local storage for sitecues prefs
    // Try cross-domain backup storage
    storageBackup.init(function() {
      storageBackup.load(function(data) {
        if (data) {
          setSitecuesLs(data);
        }
        if (!getUserId()) {
          // No user id: generate one
          var userId = uuid();
          setUserId(userId);
        }
        onReadyCallbackFn(getPrefs());
      });
    });
  }

  return {
    init: init,
    clear: clear,
    getUserId: getUserId,
    setUserId: setUserId,
    setPref: setPref,
    getPrefs: getPrefs
  };
});

