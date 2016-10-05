/*
 * Selectors
 *
 * Collects all rule sets applying specified declarations, and creates an array of the selectors for those rule sets.
 * The attributes and values composing each selector are parsed and mapped to the selector. This allows us to listen for mutations for
 * those specific attributes, and return selectors
 * */
define(
  [
    'page/style-service/style-service',
    'page/positioner/constants',
    'core/util/array-utility'
  ],
  function (
    styleService,
    constants,
    arrayUtil
  ) {

  'use strict';

  var
    // Maps attribute name/value keys to buckets of fixed selectors
    // e.g. { id_foo : [selectorA], class_foo : [selectorA, selectorB] }
    // selectors composed of attributes without specific values are mapped as: { attributeName : [selector] }
    attributeValueToSelectorsMap     = {},
    // maps CSS properties to the selectors for the rule sets they are contained in
    propertyToSelectorsMap           = {},
    // maps selector to the properties that the style-listener is observing
    selectorToPropertiesMap          = {},
    // Maps selector to its composite attributes
    selectorToCompositeAttributesMap = {},
    parsedSelectors                  = [],
    ID_REGEX                         = constants.ID_REGEX,
    CLASS_REGEX                      = constants.CLASS_REGEX,
    ATTRIBUTE_REGEX                  = constants.ATTRIBUTE_REGEX;

  // Identifies classes, ids, etc. that compose selectors
  function parseCompositeAttributes(selectors) {
    selectors.forEach(function (selector) {
      var name, match,
        originalSelector  = selector,
        specialAttributes = { 'id' : ID_REGEX, 'class' : CLASS_REGEX },
        results           = selector.match(ATTRIBUTE_REGEX);

      while (results) {
        match = results[0];
        name  = results[1];
        if (name) {
          attributeValueToSelectorsMap[name] = attributeValueToSelectorsMap[name] || [];
          // It's impractical to re-implement the comparison operations available when selecting by attribute value, so instead we just always
          // re-query selectors composed of mutated attributes, regardless of the attribute's new value
          arrayUtil.addUnique(attributeValueToSelectorsMap[name], originalSelector);
          selectorToCompositeAttributesMap[originalSelector] = selectorToCompositeAttributesMap[originalSelector] || [];
          arrayUtil.addUnique(selectorToCompositeAttributesMap[originalSelector], name);
        }
        // we remove attribute value matches, the values could
        // match the regex patterns for selecting by class or id
        // e.g. [data-foo="#id"]]
        selector = selector.replace(match, '');
        results  = selector.match(ATTRIBUTE_REGEX);
      }

      for (name in specialAttributes) {
        if (specialAttributes.hasOwnProperty(name)) {
          var regex = specialAttributes[name];
          results   = regex.exec(selector);
          while (results) {
            var
              value = results[1],
              key   = name + '_' + value;
            selectorToCompositeAttributesMap[originalSelector] = selectorToCompositeAttributesMap[originalSelector] || [];
            arrayUtil.addUnique(selectorToCompositeAttributesMap[originalSelector], name);
            attributeValueToSelectorsMap[key] = attributeValueToSelectorsMap[key] || [];
            arrayUtil.addUnique(attributeValueToSelectorsMap[key], originalSelector);
            results = regex.exec(selector);
          }
        }
      }
    });
  }

  function getPropertiesBySelector(selector) {
    return selectorToPropertiesMap[selector];
  }

  // Get selectors for rule sets that contain declaration
  function getSelectorsForProperty(property) {
    var
      selectors = propertyToSelectorsMap[property];
    if (!selectors) {
      selectors = propertyToSelectorsMap[property] = styleService.getAllMatchingStyles(property).map(function (styleObject) {
        var selector = styleObject.rule.selectorText;
        // Map selectors to declarations so that we can check the resolved value of styles tied to that selector
        selectorToPropertiesMap[selector] = selectorToPropertiesMap[selector] || [];
        selectorToPropertiesMap[selector].push(property);
        return selector;
      });
      parseCompositeAttributes(selectors);
      parsedSelectors = arrayUtil.union(parsedSelectors, selectors);
    }
    return selectors;
  }

  function getCompositeAttributes(selectors) {
    var allAttributes = [];
    selectors.forEach(function (selector) {
      allAttributes = allAttributes.concat(selectorToCompositeAttributesMap[selector]);
    });
    return arrayUtil.unique(allAttributes);
  }

  // e.g. { id_foo : ['#foo > element', '#foo'] }
  function filterByAttributeValues(attribute, values) {
    // If an attribute value isn't provided, we return selectors mapped to just the attribute name
    // e.g. { data-sc-foo :  [selectorA] }
    if (typeof values === 'undefined') {
      return attributeValueToSelectorsMap[attribute];
    }
    else if (!Array.isArray(values)) {
      values = [values];
    }

    var
      filteredSelectors = [],
      length             = values.length;

    for (var i = 0; i < length; i++) {
      var
        value     = values[i],
        key       = attribute + '_' + value,
        selectors = attributeValueToSelectorsMap[key];

      if (selectors) {
        filteredSelectors = filteredSelectors.concat(selectors);
      }
    }
    return filteredSelectors;
  }

  function filterByAttribute(name) {
    return filterByAttributeValues(name);
  }

  function filterByIds(currentId, oldId) {
    var values = [];

    // If ID hasn't changed we don't need to reprocess selectors that depend on it
    if (currentId === oldId) {
      return [];
    }

    if (oldId) {
      values.push(oldId);
    }

    if (currentId) {
      values.push(currentId);
    }

    return filterByAttributeValues('id', values);
  }

  // Return selectors for newly added and removed classes
  function filterByClasses(classes) {
    return filterByAttributeValues('class', classes);
  }

  function init(callback) {
    styleService.init(callback);
  }


  return {
    getCompositeAttributes: getCompositeAttributes,
    getForProperty: getSelectorsForProperty,
    getPropertiesBySelector: getPropertiesBySelector,
    filterByClasses: filterByClasses,
    filterByIds: filterByIds,
    filterByAttribute: filterByAttribute,
    init: init
  };
});