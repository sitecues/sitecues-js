/**
 * Sitecues A/B test switch for the current user
 * Wiki: https://equinox.atlassian.net/wiki/display/EN/AB+Testing
 *
 * Input: user id + ab-test/config
 * Output: something like undefined for no test, or 'icontest.settingsTest.gear'
 *
 * Terminology:
 * - Layer: a scope in the tests corresponding to the config or a sub-object of the config
 *   In the example 'icontest.settingsTest.gear', there are 3 layers
 * - Weight: how likely a test outcome in one of the layers is, relative to other outcomes in the same layer
 */
define(
  [
    'core/conf/id',
    'core/ab-test/config'
  ],
  function (
    id,
    globalABConfig
  ) {
  'use strict';

  var userAbConfig = [];

  function getLayerWeight(layer, keys) {
    var total = 0;
    keys.forEach(function(key) {
      total += layer[key].weight || 1; // If weight is not specified, defaults to 1
    });
    return total;
  }

  function selectKeyInLayer(seed, layer, keys) {
    var
      layerWeight = getLayerWeight(layer, keys),
      selectionIndex = seed % layerWeight,
      weightAccumulator = 0,
      index = 0,
      numKeys = keys.length,
      key;

    for (; index < numKeys - 1; index ++) {
      key = keys[index];
      weightAccumulator += layer[key].weight || 1;
      if (selectionIndex < weightAccumulator) {
        return key;
      }
    }

    return keys[numKeys - 1];
  }

  function getArrayKeys(array) {
    return array.map(function(value, index) {
      return index;
    });
  }

  function selectTests(layerValues, userIdParts, layerIndex) {
    var
      usesValuesArray = Array.isArray(layerValues),  // Otherwise Object map of key: value
      layerKeys = usesValuesArray ? getArrayKeys(layerValues) : Object.keys(layerValues),
      seed = parseInt(userIdParts[layerIndex], 16),   // Choose an option in the layer based on this part of the user id
      selectedKey = selectKeyInLayer(seed, layerValues, layerKeys),
      nextLayerValues = layerValues[selectedKey].values;

    // If array is provided, use the simple value provided, otherwise the key
    userAbConfig[layerIndex] = usesValuesArray ? layerValues[selectedKey] : selectedKey;
    if (nextLayerValues) {
      ++ layerIndex;
      if (layerIndex > userIdParts.length) {  // Realistically this is always 5
        if (SC_DEV) {
          console.log('Too much depth in A/B test config'); // Very unlikely!
        }
        return;
      }
      selectTests(nextLayerValues, userIdParts, layerIndex);
    }
  }

  // Return a value for the key
  // Input: a key
  // The key can be simple, e.g. 'moreButtonTimer' or
  // you can string keys together, such as 'iconTest.settingsIconTest'
  // No key will return the user's entire ab test configuration array
  //
  // Returns:
  // Values are together with . (or just true if there are no remaining keys)
  //
  // Examples (where userAbConfig = ['iconTest', 'settingsIconTest', 'lightbulb']) :
  // get() => 'iconTest.settingsIconTest.lightbulb'
  // get('iconTest') => 'settingsIconTest.lightbulb'
  // get('iconTest.settingsIconTest') => 'lightbulb'
  // get('iconTest.settingsIconTest.lightbulb') => true
  // get('qqqq') => undefined   (not a current A/B test)
  // get('iconText.qqq') => undefined (not a current A/B test)
  function get(key, defaultVal) {
    if (!userAbConfig.length ||  // Occurs when AB testing was never initialized (e.g. when not a supported platform)
      userAbConfig[0] === 'NONE') {
      return defaultVal;
    }

    var keyIndex = 0,
      keys = key ? key.split('.') : [],
      numKeys = keys.length;

    for (; keyIndex < numKeys; keyIndex ++) {
      if (keys[keyIndex] !== userAbConfig[keyIndex]) {
        return defaultVal;
      }
    }

    // Remaining keys make up te value
    // or true is returned
    var valueSlice = userAbConfig.slice(keyIndex);
    return valueSlice.length ? valueSlice.join('.') : true;
  }

  function init() {
    var userId = id.user,
      userIdParts = userId.split('-');

    selectTests(globalABConfig, userIdParts, 0);

    if (SC_DEV) {
      console.log('A/B test: ' + get());
    }
  }

  return {
    init: init,
    get: get
  };
});
