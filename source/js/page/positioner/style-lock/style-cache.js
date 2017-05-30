define(
[
  'run/util/array-utility',
  'run/inline-style/inline-style'
],
function (
  arrayUtil,
  inlineStyle
) {
  'use strict';

  var inlineCache          = new WeakMap(),  // WeakMap(element : {property : value})
      resolvedCache        = new WeakMap(),  // WeakMap(element : {property : value})
      resolvedElementCache = {};             // {property : {value : Set(elements)}}

  // Private
  function setValue(opts) {
    var styles   = opts.styles,
        property = opts.property,
        value    = opts.value;
    styles[property] = value;
  }

  // Private
  function getStyles(element, cache) {
    var styles = cache.get(element);
    if (styles) {
      return styles;
    }
    styles = {};
    cache.set(element, styles);
    return styles;
  }

  // Private
  function getResolvedValueMap(property) {
    var valueMap = resolvedElementCache[property];
    if (valueMap) {
      return valueMap;
    }
    valueMap = {};
    resolvedElementCache[property] = valueMap;
    return valueMap;
  }

  // Private
  function getResolvedCache(element) {
    return getStyles(element, resolvedCache);
  }

  // Private
  function getInlineCache(element) {
    return getStyles(element, inlineCache);
  }

  function hasResolvedValue(element, property) {
    return getResolvedValue(element, property) !== undefined;
  }

  function hasInlineValue(element, property) {
    return getInlineValue(element, property) !== undefined;
  }

  function saveInlineValue(element, property, value) {
    value = value === undefined ? inlineStyle.getIntendedStyle(element, property) : value;
    setValue({
      styles   : getInlineCache(element),
      property : property,
      value    : value 
    });
  }

  function saveResolvedValue(element, property, value) {
    var resolvedStyles = getResolvedCache(element),
        valueMap       = getResolvedValueMap(property),
        cacheValue     = resolvedStyles[property];

    if (value === cacheValue) {
      // No need to update the cache if the value hasn't changed
      return;
    }

    if (typeof cacheValue === 'string') {
      // Delete the element from its previous value map
      valueMap[cacheValue].delete(element);
    }

    setValue({
      styles   : resolvedStyles,
      property : property,
      value    : value
    });

    var elements = valueMap[value];

    if (!elements) {
      elements = new Set();
      valueMap[value] = elements;
    }

    elements.add(element);
  }

  // This will return undefined if we haven't cached
  // an inline value for this element
  function getInlineValue(element, property) {
    var inlineStyles = inlineCache.get(element);
    return inlineStyles && inlineStyles[property];
  }

  // This will return undefined if we haven't cached
  // a resolved value for this element
  function getResolvedValue(element, property) {
    var resolvedStyles = resolvedCache.get(element);
    return resolvedStyles && resolvedStyles[property];
  }

  function clear(element, property) {
    delete getInlineCache(element)[property];
    delete getResolvedCache(element)[property];
  }

  function getResolvedElements(opts) {
    var property = opts.property,
        value    = opts.value,
        valueMap = getResolvedValueMap(property),
        elements = valueMap[value];
    if (elements) {
      // You're not allowed to add elements to this returned array
      // you need to call saveResolvedValue on an element to add it to the cache
      return arrayUtil.from(elements);
    }
    return [];
  }

  return {
    getResolvedValue    : getResolvedValue,
    getInlineValue      : getInlineValue,
    saveResolvedValue   : saveResolvedValue,
    saveInlineValue     : saveInlineValue,
    hasInlineValue      : hasInlineValue,
    hasResolvedValue    : hasResolvedValue,
    getResolvedElements : getResolvedElements,
    clear               : clear
  };
});
