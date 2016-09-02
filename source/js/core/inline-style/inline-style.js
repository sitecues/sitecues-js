/*
* Inline-Style
*
* This module is responsible for watching inline style mutations of elements modified by Sitecues in order to accurately
* calculate the `intended style` of an element, i.e. the style an element would have if Sitecues had not manipulated its inline value.
*
* This is important for a couple reasons:
 A complete reset of Sitecues should restore all the original styles. The problem with our past solution, caching an element's style value before setting
 our own style, is that it doesn't allow for dynamic re-setting of the style during the lifetime of the document, because we will overwrite the updated style
 with our cached value.

 Even without a complete reset, we frequently want to restore individual elements to their intended state for certain operations.
 For example zoom resets the transform and width of the body element to an empty string when it recomputes the original body dimensions,
 instead of restoring values that were potentially already defined. This makes that process very easy now: inlineStyle.restore(body, ['width', 'transform'])

 If instead we actually do want to restore only the prior value of a style, rather than its intended style (for example, if we had set overflow-x on the document element and need to
 override that value briefly), you can do this: inlineStyle.restoreLast(docElem, ['overflow-x'])
* */
define(
  [
    'core/native-functions',
    'core/util/array-utility',
    'core/util/object-utility'
  ],
  function (
    nativeFn,
    arrayUtil,
    objectUtil
  ) {
  'use strict';

  var inlinePattern, proxyMap,
      assignmentDictionary, assignmentRecords,
      lastStyleMap, intendedStyleMap,
      updateTimer, styleParser,
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


  // This function replicates jQuery's coercion of numeric style values to unit strings when appropriate
  function fixUnits(property, value) {
    return typeof value === 'number' && value !== 0 && !cssNumbers[property] ? value + 'px' : value;
  }

  function arrayAssignment(element, styleInfo, styleProperty) {
    var property = toKebabCase(styleInfo[0]);
    element[styleProperty].setProperty(property, fixUnits(property, styleInfo[1]), styleInfo[2] || '');
  }

  function objectAssignment(element, styleInfo, styleProperty) {
    Object.keys(styleInfo).forEach(function (prop) {
      var property = toKebabCase(prop);
      element[styleProperty][prop] = fixUnits(property, styleInfo[prop]);
    });
  }

  function stringAssignment(element, styleInfo, styleProperty) {
    element[styleProperty].cssText = styleInfo;
  }

  // @param elmts     : the elements to apply inline styles to
  // @param styleInfo : accepts a string, array or object in the following formats:
    /*
     * { property : value, ... }
     * 'property: value; ...'
     * ['property', 'value', 'importance']
     * */
  // @param callback  : if a callback is defined, instead of inserting a style proxy for each element, cached their intended styles, apply our style values,
  // run the callback function, and then restore the intended styles. By doing this in a synchronous block we can guarantee that no other scripts will have an opportunity
  // to apply an style value
  function overrideStyle(elmts, styleInfo, callback) {
    var assignmentFn = getAssignmentFunction(styleInfo),
        elements     = arrayUtil.wrap(elmts),
        hasCallback  = typeof callback === 'function';

    elements.forEach(function (element) {
      var styleProperty, currentStyles,
          shouldProxyStyle = !hasCallback,
          isProxied        = isStyleProxied(element);

      currentStyles = getCurrentStyles(element);
      lastStyleMap.set(element, currentStyles);

      if (isProxied) {
        styleProperty = '_scStyle';
      }
      else {
        styleProperty = shouldProxyStyle ? '_scStyle' : 'style';
  
        if (shouldProxyStyle) {
          intendedStyleMap.set(element, objectUtil.assign({}, currentStyles));
          insertStyleProxy(element);
        }
      }

      assignmentFn(element, styleInfo, styleProperty);
    });

    if (hasCallback) {
      callback();
      // After running the callback, we restore the last inline values of each element before the current override. Importantly we don't
      // restore the intended styles, because we may be overriding a prior override. Restoring to the intended styles needs to be done
      // explicitly with an inlineStyle.restore() call
      elements.forEach(function (element) {
        var props = getModifiedProperties(element, styleInfo),
            lastStyles = getLastStyles(element),
            style = getStyle(element);
        
        for (var i = 0; i < props.length; i++) {
          var property = props[i];
          style[property] = lastStyles[property] || '';
        }
        
        if (!isStyleProxied(element)) {
          lastStyleMap.delete(element);
        }
      });
    }
  }

  function toKebabCase(str) {
    return str.replace(/([a-z][A-Z])/g, function (g) { return g[0] + '-' + g[1].toLowerCase(); });
  }

  function getIntendedStyles(element) {
    updateIntendedStyles();
    return intendedStyleMap.get(element);
  }

  function getCurrentStyles(element) {
    return parseCss(getCssText(element));
  }

  function getLastStyles(element) {
    return lastStyleMap.get(element);
  }

  // Return the properties to restore if this styleInfo has been assigned
  function getModifiedProperties(element, styleInfo) {
    switch (getStyleType(styleInfo)) {
      case 'array':
        return [toKebabCase(styleInfo[0])];

      case 'object':
        return Object.keys(styleInfo).map(toKebabCase);

      case 'string':
        var current = Object.keys(getCurrentStyles(element) || {}),
            last    = Object.keys(getLastStyles(element) || {});
        return arrayUtil.union(current, last);
    }
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

  function removeProperty(element, property) {
    getStyle(element).removeProperty(toKebabCase(property));
  }

  // Remove the style attribute from @element
  function removeAttribute(element) {
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
      updateTimer = nativeFn.setTimeout(function () {
        updateIntendedStyles();
      }, 300);
    }
  }

  function updateIntendedStyles() {
    assignmentRecords.forEach(function (record) {
      var cssObject,
        element          = record.element,
        styleInfo        = record.styleInfo,
        isCssOverwritten = typeof styleInfo === 'string',
        intendedStyles   = isCssOverwritten ? {} : intendedStyleMap.get(element) || {},
        lastStyles       = isCssOverwritten ? {} : lastStyleMap.get(element) || {};

      if (isCssOverwritten) {
        cssObject = parseCss(styleInfo);
      }
      else {
        // This gives us kebab-case property names
        cssObject = parseCss(stringifyCss(styleInfo));
      }

      Object.keys(cssObject).forEach(function (property) {
        intendedStyles[property] = cssObject[property];
        lastStyles[property]     = cssObject[property];
      });

      intendedStyleMap.set(element, intendedStyles);
    });

    assignmentRecords = [];
    clearTimeout(updateTimer);
    updateTimer = null;
  }

  function restoreLast(element, props) {
    var lastStyles = getLastStyles(element);

    if (!lastStyles) {
      // If we haven't saved last styles, do nothing
      return;
    }

    var style = getStyle(element);

    arrayUtil.wrap(props).map(toKebabCase).forEach(function (property) {
      var value = lastStyles[property];

      if (value) {
        style[property] = value;
      }
      else {
        removeProperty(element, property);
      }
    });
  }

  /*
  * If this function is called with an undefined `props` parameter, de-proxy the element's style property
  * */
  function restore(element, props) {
    var properties,
      style = getStyle(element),
      intendedStyles = getIntendedStyles(element);

    if (!intendedStyles) {
      // If we haven't saved intended styles, there is nothing to restore.
      return;
    }

    if (props) {
      properties = arrayUtil.wrap(props).map(toKebabCase);
      properties.forEach(function (property) {
        var value = intendedStyles[property];

        if (value) {
          style[property] = value;
        }
        else {
          removeProperty(element, property);
        }
      });
      return;
    }

    var cssText = stringifyCss(intendedStyles);

    if (cssText) {
      style.cssText = cssText;
    }
    else {
      element.removeAttribute('style');
    }

    delete element.style;
    delete element._scStyle;
    delete element._scStyleProxy;
  }

  // Proxying the style object doesn't allow us to intercept style changes via setAttribute and setAttributeNode
  // value, nodeValue, textContent would have to be intercepted on the attributeNode
  // TODO: proxy element.removeAttribute, element.setAttribute, style.setProperty, style.removeProperty
  //function proxySetAttribute(element) {
  //
  //}

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

  function createProxy(element) {
    var styleChain        = element.style,
        styleProxy        = {},
        proxiedProperties = {};

    function interceptProperty(property) {
      if (proxiedProperties[property]) {
        return;
      }

      var boundGetter = nativeFn.bindFn.call(styleProxyGetter, element, property),
          boundSetter = nativeFn.bindFn.call(styleProxySetter, element, property);

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
    Object.keys(cssObject).forEach(function (property) {
      styleParser[property] = cssObject[property];
    });
    return styleParser.cssText;
  }

  function parseCss(cssText) {
    var cssObj = {};

    styleParser.cssText = cssText;

    for (var i = 0; i < styleParser.length; i++) {
      var property = styleParser[i];
      cssObj[property] = styleParser[property];
    }

    return cssObj;
  }

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

  function init() {
    inlinePattern = /([^:]*):\s?([\W\w]*?)(?:;\s|;$)/g;
    // element -> intended css object
    intendedStyleMap     = new WeakMap();
    // element -> last css object
    lastStyleMap         = new WeakMap();
    // element -> style proxy object
    proxyMap             = new WeakMap();
    assignmentRecords    = [];
    styleParser          = document.createElement('div').style;
    assignmentDictionary = {
      'array'  : arrayAssignment,
      'object' : objectAssignment,
      'string' : stringAssignment
    };
  }

  getStyle.override        = overrideStyle;
  getStyle.set             = setStyle;
  getStyle.restore         = restore;
  getStyle.restoreLast     = restoreLast;
  getStyle.removeProperty  = removeProperty;
  getStyle.removeAttribute = removeAttribute;
  getStyle.init            = init;
  return getStyle;
});