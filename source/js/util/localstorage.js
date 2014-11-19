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
sitecues.def('util/localstorage', function(ls, callback) {

  /*
   * Run the function everytime we want to work with Local Storage
   * because settings can be changes while working with sitecues.
   * @returns {Boolean}
   */
  ls.isSupported = function() {
    var testKey = 'test', storage = window.sessionStorage;
    try {
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      SC_DEV && console.log('Local Storage is not supported or cannot be used.');
      return false;
    }
  };
  /*
   * Get value of Local Storage's "sitecues" key which is the outer namespace.
   * @returns {DOMString}
   */
  ls.getSitecuesLs = function() {
    if (ls.isSupported()) {
      return window.localStorage.getItem('sitecues') || ls.setSitecuesLs();
    }
  };

  /*
   * Set value of Local Storage's "sitecues" key which is the outer namespace.
   * @returns {DOMString}
   */
  ls.setSitecuesLs = function(data) {
    if (ls.isSupported()) {
      var data = data || {};
      window.localStorage.setItem('sitecues', JSON.stringify(data));
      return ls.getSitecuesLs();
    }
  };

  /*
   * Clear "sitecues" key value which is the outer namespace.
   * @returns {DOMString}
   */
  ls.clearSitecuesLs = function() {
    ls.isSupported() && window.localStorage.removeItem('sitecues');
  };

  /*
   * Get current userId from Local Storage under "sitecues" namespace.
   * @returns {JSON.parse.j|Array|Object}
   */
  ls.getUserId = function() {
    if (ls.isSupported()) {
      var sitecuesLs = ls.getSitecuesLs();
      if (sitecuesLs) {
        var internalLs = JSON.parse(sitecuesLs);
        return internalLs && internalLs['userId'];
      }
    }
  };

  /*
   * Set current userId from Local Storage under "sitecues" namespace.
   * @returns {JSON.parse.j|Array|Object}
   */
  ls.setUserId = function(value) {
    if (ls.isSupported()) {
      var value = value || {};
      var sitecuesLs = ls.getSitecuesLs() || ls.setSitecuesLs();
      if (sitecuesLs) {
        var internalLs = JSON.parse(sitecuesLs);
        internalLs['userId'] = value;
        ls.setSitecuesLs(internalLs);
      }
    }
  };

  /**
   * Set Local Storage data | siteues:userID namespace.
   * @param {Object} data
   * @returns {void}
   */
  ls.setUserPreferencesById = function(userPrefData) {
    if (ls.isSupported()) {
      var userPrefData = userPrefData || "{}";
      var sitecuesLs = JSON.parse(ls.getSitecuesLs());
      sitecuesLs[ls.getUserId()] = userPrefData;

      // Set the initial data under userId namespace.
      ls.setSitecuesLs(sitecuesLs);
      SC_DEV && console.log('Setting the data in LocalStorage: ' + JSON.stringify(sitecuesLs));
    }
  };

  /**
   * Update LocalStorage data in key, value format | siteues:userID namespace.
   * @param {String} lsByUserId
   * @param {String} key
   * @param {String} value
   * @returns {void}
   */
  ls.setUserPreferenceById = function(key, value) {
    if (ls.isSupported()) {
      var userPrefData = ls.getUserPreferencesById();
      var sitecuesLs = JSON.parse(ls.getSitecuesLs());
      // Update value.
      userPrefData[key] = value;
      sitecuesLs[ls.getUserId()] = userPrefData;
      // Save in LocalStorage.
      ls.setSitecuesLs(sitecuesLs);
      SC_DEV && console.log('Updating the data in LocalStorage: ' + JSON.stringify(sitecuesLs));
    }
  };

  /**
   * Get LocalStorage data | siteues:userID namespace.
   * @returns {DOMString}
   */
  ls.getUserPreferencesById = function() {
    if (ls.isSupported()) {
      var sitecuesLs = JSON.parse(ls.getSitecuesLs());
      return sitecuesLs[ls.getUserId()];
    }
  };

  // Expose getLocalData() for testing purposes.
  window.sitecues.getLocalData = function() {
    if (ls.isSupported()) {
      return JSON.parse(ls.getSitecuesLs())
    } else {
      return "Local Storage isn't supported or cannot be used.";
    }
  };

  callback();

});

