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
    'core/conf/user/storage'
  ],
  function (uuid, storage) {
    'use strict';

    var namespace = 'user';

    // Get a user from storage. Returns an object representing the user.
    function getAll() {
      return storage.getAll()[namespace] || {};
    }

    // Save a user in storage. Takes in the data used to represent the user.
    // Will overwrite any existing user.
    function setAll(input) {
      var data = {};
      data[namespace] = input;
      storage.set(data);
    }

    // Merge some new data into the existing user, with the
    // new data taking precedence.
    function set(input) {
      var user = getAll();
      // TODO: Switch to Object.assign() when possible.
      Object.keys(input).forEach(function (key) {
        user[key] = input[key];
      });
      setAll(user);
    };

    // TODO: Remove this in December 2016, when it is unlikely any legacy users remain.
    function getLegacyId() {
      return storage.getAll().userId;
    }

    // Get the current user ID from storage.
    function getId() {
      return getAll().id || getLegacyId();
    };

    // Return the current user if one exists.
    // Otherwise create a new user.
    function create() {
      var existingUser = getAll();

      if (existingUser.id) {
          return existingUser;
      }

      var legacyId = getLegacyId();

      if (legacyId) {
        return {
          id : legacyId
        };
      }

      // TODO: Switch to Object.assign() when possible.
      var newUser = {};
      Object.keys(existingUser).forEach(function (key) {
        newUser[key] = existingUser[key];
      });
      newUser.id = uuid();

      set(newUser);

      return newUser;
    };

    // Get the user settings we have stored, nested within app data.
    // Returns an object.
    function getPrefs() {
      var appData = storage.getAll();
      return appData[getId()] || {};
    }

    // Save a setting associated with the user.
    function setPref(name, value) {
      var userId = getId();

      if (!userId) {
        throw new Error('No user ID is set to save preferences for.');
      }

      var userPreferences = getPrefs();

      userPreferences[name] = value;

      var appData = {};
      appData[userId] = userPreferences;

      storage.set(appData);
    }

    return {
        create   : create,
        getId    : getId,
        getPrefs : getPrefs,
        setPref  : setPref
    };
  }
);
