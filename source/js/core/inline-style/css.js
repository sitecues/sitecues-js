define(
  [

  ],
  function (

  ) {
  'use strict';

  var styleParser;

  function toKebabCase(str) {
    return str.replace(/([a-z][A-Z])/g, function (g) { return g[0] + '-' + g[1].toLowerCase(); });
  }

  function stringifyCss(cssObject) {
    styleParser.cssText = '';

    Object.keys(cssObject).forEach(function (property) {
      var value, priority,
          propertyData  = cssObject[property],
          // setProperty requires that properties be kebab-case
          kebabProperty = toKebabCase(property);

      if (typeof propertyData === 'object') {
        value    = cssObject[property].value;
        priority = cssObject[property].priority;
      }
      else {
        value    = propertyData;
        priority = '';
      }

      styleParser.setProperty(kebabProperty, value, priority);
    });

    return styleParser.cssText;
  }

  // Returns an object keyed with style properties to a property data object containing value and priority
  // @return { property : { value : foo, priority : 'important' } }
  function parseCss(cssText) {
    var cssObj = {};
    styleParser.cssText = cssText;

    for (var i = 0; i < styleParser.length; i++) {
      var property = styleParser[i];
      cssObj[property] = {
        value    : styleParser.getPropertyValue(property) || '',
        priority : styleParser.getPropertyPriority(property) || ''
      };
    }

    return cssObj;
  }

  function init() {
    styleParser = document.createElement('div').style;
  }

  return {
    parse : parseCss,
    stringify : stringifyCss,
    toKebabCase : toKebabCase,
    init : init
  };
});