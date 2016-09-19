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

  // Overwrite the entire namespace that we use for storing data.
  function setAllRaw(dataString) {
    try {
      localStorage.setItem(NAMESPACE, dataString);
    } catch (err) {}
  }

  // Get value of the entire namespace that we use for storing data.
  // You should probably NOT use this! Prefer getAll().
  function getAllRaw() {
    return localStorage.getItem(NAMESPACE);
  }

  // Get the final representation that we will put into storage.
  function serialize(data) {
    return nativeFn.JSON.stringify(data || {});
  }

  // Get the normalized representation of what was in storage.
  function deserialize(dataString) {
    return dataString ? nativeFn.JSON.parse(dataString) : {};
  }

  // Friendly API for overwriting all data we have put into storage.
  function setAll(data) {
    cachedAppData = data;
    setAllRaw(serialize(data));
  }

  // Friendly API for retrieving all data we have put into storage.
  // Returns an object.
  function getAll() {
    if (cachedAppData) {
      return cachedAppData;
    }
    return deserialize(getAllRaw());
  }

  // Merge some new data into the existing store, with the
  // new data taking precedence.
  function set(input) {
    var appData = getAll();
    // TODO: Switch to Object.assign() when possible.
    Object.keys(input).forEach(function (key) {
      appData[key] = input[key];
    });
    setAll(appData);
  }

  return {
    setAll : setAll,
    getAll : getAll,
    clearCache : clearCache
  };
});
