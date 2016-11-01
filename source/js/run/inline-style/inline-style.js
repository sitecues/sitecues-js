/*
* Inline-Style
*
* This module is responsible for watching inline style mutations of elements modified by Sitecues in order to accurately
* calculate the `intended style` of an element, i.e. the style an element would have if Sitecues had not manipulated its inline value.
*
* This is important for a couple reasons:
 A complete reset of Sitecues should restore all the original styles. The problem with our past solution, caching an element's style value before setting
 our own style, is that it doesn't allow for dynamic re-setting of the style during the lifetime of the document, so we end up overwriting
 the updated style with our cached value.

 Even without a complete reset, we frequently want to restore individual elements to their intended state for certain operations.
 For example zoom resets the transform and width of the body element to an empty string when it recomputes the original body dimensions,
 instead of restoring values that were potentially already defined. This makes that process very easy now: inlineStyle.restore(body, ['width', 'transform'])

 If instead we actually do want to restore only the prior value of a style, rather than its intended style (for example, if we had set overflow-x on the document element and need to
 override that value briefly), you can do this: inlineStyle.restoreLast(docElem, ['overflow-x'])
* */
define(
  [
    'mini-core/native-global',
    'run/util/array-utility',
    'run/util/object-utility'
  ],
  function (
    nativeGlobal,
    arrayUtil,
    objectUtil
  ) {
  'use strict';

  var proxyMap,
      kebabCaseCache,
      assignmentDictionary,
      assignmentRecords,
      lastStyleMap,
      intendedStyleMap,
      updateTimer,
      styleParser,
      // Arbitrarily long timeout between updating the intended style.
      // This isn't an especially well tuned number, we just don't need it to update very often
      UPDATE_TIMEOUT = 300,
      cssNumbers = {
        "animation-iteration-count" : true,
        "column-count"              : true,
        "fill-opacity"              : true,
        "flex-grow"                 : true,
        "flex-shrink"               : true,
        "font-weight"               : true,
        "line-height"               : true,
        "opacity"                   : true,
        "order"                     : true,
        "orphans"                   : true,
        "widows"                    : true,
        "z-index"                   : true,
        "zoom"                      : true
      };

  function setProperty(elementStyle, declaration) {
    var property = toKebabCase(declaration.property),
        value    = fixUnits(property, declaration.value),
        priority = declaration.priority || '';
    elementStyle.removeProperty(property); // We need to remove the existing style declaration because in Safari we aren't able to override declarations with higher priority
    if (value !== undefined) {
      elementStyle.setProperty(property, value, priority);
    }
  }

  // This function replicates jQuery's coercion of numeric style values to unit strings when appropriate
  // Important: property must be in kebab-case
  function fixUnits(property, value) {
    return typeof value === 'number' && value !== 0 && !cssNumbers[property] ? value + 'px' : value;
  }

  function arrayAssignment(element, styleInfo, styleField) {
    setProperty(element[styleField], {
      property : styleInfo[0],
      value    : styleInfo[1],
      priority : styleInfo[2]
    });
  }

  function objectAssignment(element, styleInfo, styleField) {
    Object.keys(styleInfo).forEach(function (property) {
      setProperty(element[styleField], {
        property : property,
        value    : styleInfo[property]
      });
    });
  }

  function stringAssignment(element, styleInfo, styleField) {
    element[styleField].cssText = styleInfo;
  }

  // @param elmts     : the elements to apply inline styles to
  // @param styleInfo : accepts a string, array or object in the following formats:
    /*
     * { property : value, ... }
     * 'property: value; ...'
     * ['property', 'value', 'importance']
     * */
  // @param callback  : if a callback is defined, instead of inserting a style proxy for each element, cache their intended styles, apply our style values,
  // run the callback function, and then restore the intended styles. By doing this in a synchronous block we can guarantee that no other scripts will have an opportunity
  // to assign a new value
  function overrideStyle(elmts, styleInfo) {
    var assignmentFn  = getAssignmentFunction(styleInfo),
        elements      = arrayUtil.wrap(elmts);

    elements.forEach(function (element) {
      var currentStyles = getCurrentStyles(element);

      if (isStyleProxied(element)) {
        updateLastStyles(element, styleInfo, currentStyles);
      }
      else {
        lastStyleMap.set(element, objectUtil.assign({}, currentStyles));
        intendedStyleMap.set(element, objectUtil.assign({}, currentStyles));
        insertStyleProxy(element);
      }

      assignmentFn(element, styleInfo, '_scStyle');
    });
  }

  function toKebabCase(str) {
    var memoizedValue = kebabCaseCache[str];
    if (typeof memoizedValue !== 'string') {
      memoizedValue = kebabCaseCache[str] = str.replace(/([A-Z])/g, function (g) { return '-' + g[0].toLowerCase(); });
    }
    return memoizedValue;
  }

  function getIntendedStyle(element, property) {
    updateIntendedStyles();
    var intendedStyle = intendedStyleMap.get(element);

    if (!property) {
      // Return the cached intended styles, or undefined if none have been cached
      // It's important that if we haven't cached styles this returns false
      return intendedStyle;
    }

    property = toKebabCase(property);

    if (!intendedStyle) {
      // If we haven't cached an inline value, return the current value
      return getStyle(element)[property];
    }

    var propObj = intendedStyle[property];
    return propObj ? propObj.value : '';
  }

  function getCurrentStyles(element) {
    return parseCss(getCssText(element));
  }

  function getLastStyles(element) {
    updateIntendedStyles();
    return lastStyleMap.get(element);
  }

  function getStyleType(styleInfo) {
    return Array.isArray(styleInfo) ? 'array' : typeof styleInfo;
  }

  function getAssignmentFunction(styleInfo) {
    return assignmentDictionary[getStyleType(styleInfo)];
  }

  function setStyle(elmts, styleInfo) {
    var assignmentFn = getAssignmentFunction(styleInfo),
        elements     = arrayUtil.wrap(elmts);

    elements.forEach(function (element) {
      assignmentFn(element, styleInfo, 'style');
    });
  }

  function clearStyle(element) {
    element.removeAttribute('style');
  }

    // This function exists mainly because we need a linting rule against /.style[^\w]/ to ensure that other modules do not interact directly
    // with elements' style object directly.
   /* NOTE: It is important to use `setStyle` to set style values for `original elements`, defined as elements in the DOM that were not
    * inserted by Sitecues. Though this method can return the style object of an element for conveniently reading and writing from
    * Sitecues elements, it must NOT be used to get the style object of original elements for the intention of setting style values */
  function getStyle(element) {
    var styleProperty = getDirectStyleProperty(element);
    return element[styleProperty];
  }

  function queueAssignmentRecord(element, styleInfo) {
    assignmentRecords.push({
      element   : element,
      styleInfo : styleInfo
    });

    if (!updateTimer) {
      updateTimer = nativeGlobal.setTimeout(function () {
        updateIntendedStyles();
      }, UPDATE_TIMEOUT);
    }
  }

  // when we override a proxied element, we need to update the last style cache
  // for the element, saving the current field values before the overriding values are assigned
  // Fields that are untouched by this new override retain their existing last value
  function updateLastStyles(element, styleInfo, currentStyles) {
    var lastStyles   = getLastStyles(element),
        styleType    = getStyleType(styleInfo),
        elementStyle = getStyle(element);

    function updateProperty(prop) {
      var property = toKebabCase(prop);
      saveStyleValue(elementStyle, property, lastStyles);
    }

    switch (styleType) {
      case 'array':
        updateProperty(styleInfo[0]);
        break;

      case 'object':
        Object.keys(styleInfo).forEach(updateProperty);
        break;

      case 'string':
        // If we're overriding cssText, we just save all the current styles as 'last styles', because
        // we don't try to distinguish between what has changed and what hasn't
        lastStyles = currentStyles;
        break;
    }

    lastStyleMap.set(element, lastStyles);
  }

  function updateIntendedStyles() {
    assignmentRecords.forEach(function (record) {
      var cssObject,
        element          = record.element,
        styleInfo        = record.styleInfo,
        // cssText was assigned in this case
        isCssOverwritten = typeof styleInfo === 'string',
        intendedStyle    = isCssOverwritten ? {} : intendedStyleMap.get(element) || {},
        lastStyles       = isCssOverwritten ? {} : lastStyleMap.get(element) || {};

      if (isCssOverwritten) {
        cssObject = parseCss(styleInfo);
      }
      else {
        // This gives us kebab-case property names
        cssObject = parseCss(stringifyCss(styleInfo));
      }

      Object.keys(cssObject).forEach(function (property) {
        var declaration = cssObject[property];
        intendedStyle[property] = objectUtil.assign({}, declaration);
        // We don't want a reversion to the `last styles`, the inline values of an element cached before its latest override, to clobber
        // dynamic updates to its intended styles.
        lastStyles[property]    = objectUtil.assign({}, declaration);
      });

      intendedStyleMap.set(element, intendedStyle);
      lastStyleMap.set(element, lastStyles);
    });

    assignmentRecords = [];
    clearTimeout(updateTimer);
    updateTimer = null;
  }

  function restoreLast(element, props) {
    var lastStyles = getLastStyles(element);

    // Styles only need to be restored if we have overridden them.
    if (!lastStyles) {
      return;
    }

    var
      style      = getStyle(element),
      properties = arrayUtil.wrap(props).map(toKebabCase);

    properties.forEach(function (property) {
      restoreStyleValue(style, property, lastStyles);
    });
  }

  // @param property must be kebab case in order to look up the cached styles
  function restoreStyleValue(elementStyle, property, cachedStyles) {
    var declaration = objectUtil.assign({}, cachedStyles[property]);
    declaration.property = property;
    setProperty(elementStyle, declaration);
  }

  // @param property must be kebab case in order to look up the cached styles
  function saveStyleValue(style, property, cachedStyles) {
    var value    = style.getPropertyValue(property) || '',
        priority = style.getPropertyPriority(property) || '';
    cachedStyles[property] = {
      value    : value,
      priority : priority
    };
  }

  /*
  * If this function is called with an undefined `props` parameter, de-proxy the element's style property
  * */
  function restore(element, props) {
    var properties,
      style         = getStyle(element),
      intendedStyle = getIntendedStyle(element);

    // Styles only need to be restored if we have overridden them.
    if (!intendedStyle) {
      return;
    }

    if (props) {
      properties = arrayUtil.wrap(props).map(toKebabCase);
      properties.forEach(function (property) {
        restoreStyleValue(style, property, intendedStyle);
      });
      // Only restore the specified properties
      return;
    }

    var cssText = stringifyCss(intendedStyle);

    if (cssText) {
      style.cssText = cssText;
    }
    else {
      clearStyle(element);
    }

    delete element.style;
    delete element._scStyle;
    delete element._scStyleProxy;
  }

  function styleProxyGetter(property) {
    /*jshint validthis: true */
    // TODO: We should return a proxied version of setProperty / removeProperty
    if (typeof this._scStyle[property] === 'function') {
      return this._scStyle[property].bind(this._scStyle);
    }
    return this._scStyle[property];
    /*jshint validthis: false */
  }

  function styleProxySetter(property, value) {
    /*jshint validthis: true */
    var record = {};
    record[property] = value;
    queueAssignmentRecord(this, record);
    this._scStyle[property] = value;
    /*jshint validthis: false */
  }

  // This inserts a proxy to catch intended style changes set by other scripts, allowing those intended
  // styles to be re-applied after Sitecues styles are removed.
  function insertStyleProxy(element) {
    var proxy = proxyMap.get(element);

    if (element.style === proxy) {
      return;
    }

    if (!proxy) {
      proxy = createProxy(element);
    }

    element._scStyle      = element.style;
    element._scStyleProxy = proxy;

    Object.defineProperty(element, 'style', {
      configurable : true,
      // note : get & set function declarations / expressions de-optimize their containing
      // function. Don't put more in this function than needs to happen
      get : function () { return element._scStyleProxy; },
      // element.style = cssText is equivalent to element.style.cssText = cssText
      set : function (cssText) {
        queueAssignmentRecord(element, cssText);
        element._scStyle.cssText = cssText;
      }
    });
  }

  function createProxy(element) {
    var styleChain        = element.style,
        styleProxy        = {},
        proxiedProperties = {};

    function interceptProperty(property) {
      if (proxiedProperties[property]) {
        return;
      }

      var boundGetter = nativeGlobal.bindFn.call(styleProxyGetter, element, property),
          boundSetter = nativeGlobal.bindFn.call(styleProxySetter, element, property);

      proxiedProperties[property] = true;

      Object.defineProperty(styleProxy, property, {
        get : boundGetter,
        set : boundSetter
      });
    }

    while (styleChain) {
      Object.getOwnPropertyNames(styleChain).forEach(interceptProperty);
      styleChain = Object.getPrototypeOf(styleChain);
    }

    proxyMap.set(element, styleProxy);
    return styleProxy;
  }

  function isStyleProxied(element) {
    return element.style === element._scStyleProxy;
  }

  function getDirectStyleProperty(element) {
    return isStyleProxied(element) ? '_scStyle' : 'style';
  }

  function getCssText(element) {
    return getStyle(element).cssText;
  }

  function stringifyCss(cssObject) {
    styleParser.cssText = '';

    Object.keys(cssObject).forEach(function (prop) {
      var value, priority,
        //setProperty only takes kebab-case
        property     = toKebabCase(prop),
        propertyData = cssObject[prop];

      if (propertyData && typeof propertyData === 'object') {
        value    = cssObject[prop].value;
        priority = cssObject[prop].priority;
      }
      else {
        value    = propertyData;
        priority = '';
      }

      styleParser.setProperty(property, value, priority);
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
      saveStyleValue(styleParser, property, cssObj);
    }

    return cssObj;
  }
  
  // Exported for convenience, not used internally
  function removeProperty(element, property) {
    getStyle(element).removeProperty(toKebabCase(property));
  }

  function init() {
    // element -> intended css object
    intendedStyleMap     = new WeakMap();
    // element -> last css object
    lastStyleMap         = new WeakMap();
    // element -> style proxy object
    proxyMap             = new WeakMap();
    assignmentRecords    = [];
    styleParser          = document.createElement('div').style;
    assignmentDictionary = {
      array  : arrayAssignment,
      object : objectAssignment,
      string : stringAssignment
    };
    kebabCaseCache = {};
  }

  getStyle.override       = overrideStyle;
  getStyle.set            = setStyle;
  getStyle.restore        = restore;
  getStyle.restoreLast    = restoreLast;
  getStyle.removeProperty = removeProperty;
  getStyle.clear          = clearStyle;
  getStyle.getIntendedStyle = getIntendedStyle;
  getStyle.init           = init;

  return getStyle;
});
