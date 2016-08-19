/*
* Inline-Style
*
* This module is responsible for watching inline style mutations of elements modified by Sitecues in order to accurately
* calculate the `intended style` of an element, i.e. the style an element would have if Sitecues had not manipulated its inline value.
* */
define(
  [
    'core/native-functions',
    'core/bp/model/element-info'
  ],
  function (
    nativeFn,
    bpElemInfo
  ) {
  'use strict';

  var inlinePattern, styleMap, proxyMap,
      assignmentRecords, updateTimer,
      cssNumbers = {
        "animationIterationCount" : true,
        "columnCount"             : true,
        "fillOpacity"             : true,
        "flexGrow"                : true,
        "flexShrink"              : true,
        "fontWeight"              : true,
        "lineHeight"              : true,
        "opacity"                 : true,
        "order"                   : true,
        "orphans"                 : true,
        "widows"                  : true,
        "zIndex"                  : true,
        "zoom"                    : true
      };

  function fixUnits(property, value) {
    return typeof value === 'number' && value !== 0 && !cssNumbers[property] ? value + 'px' : value;
  }

  function arrayAssignment(element, styleInfo, styleProperty) {
    var property = styleInfo[0];
    element[styleProperty].setProperty(property, fixUnits(property, styleInfo[1]), styleInfo[2] || '');
  }

  function objectAssignment(element, styleInfo, styleProperty) {
    Object.keys(styleInfo).forEach(function (property) {
      element[styleProperty][property] = fixUnits(property, styleInfo[property]);
    });
  }

  function stringAssignment(element, styleInfo, styleProperty) {
    element[styleProperty].cssText = styleInfo;
  }

  function setStyle(elmts, styleInfo, opts) {
    opts = opts || {};

    var assignmentFn,
      styleType = Array.isArray(styleInfo) ? 'array' : typeof styleInfo,
      elements  = Array.isArray(elmts)     ? elmts   : [elmts];

    switch (styleType) {
      case 'array':
        assignmentFn = arrayAssignment;
        break;

      case 'object':
        assignmentFn = objectAssignment;
        break;

      case 'string':
        assignmentFn = stringAssignment;
        break;
    }

    elements.forEach(function (element) {
      var styleProperty;

      if (isStyleProxied(element)) {
        styleProperty = '_scStyle';
      }
      else {
        var shouldProxyStyle = opts.doProxy !== false && !bpElemInfo.isBPElement(element);
        styleProperty = shouldProxyStyle ? '_scStyle' : 'style';

        if (shouldProxyStyle) {
          var intendedStyles = parseCss(getCssText(element));
          styleMap.set(element, intendedStyles);
          insertStyleProxy(element);
        }
      }

      assignmentFn(element, styleInfo, styleProperty);
    });
  }

  function removeProperty(element, property) {
    getStyle(element).removeProperty(property);
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
  function getStyle(element, property) {
    var styleProperty = getDirectStyleProperty(element);
    return property ? element[styleProperty][property] : element[styleProperty];
  }

  function queueAssignmentRecord(element, styleInfo) {
    console.log('queueAssignmentRecord:', arguments);
    assignmentRecords.push({
      element   : element,
      styleInfo : styleInfo
    });

    if (!updateTimer) {
      updateTimer = nativeFn.setTimeout(function () {
        updateIntendedStyles();
        updateTimer = null;
      }, 300);
    }
  }

  function updateIntendedStyles() {
    var normalizer = document.createElement('div').style;

    assignmentRecords.forEach(function (record) {
      var cssObject,
        element          = record.element,
        styleInfo        = record.styleInfo,
        isCssOverwritten = typeof styleInfo === 'string',
        intendedStyles   = isCssOverwritten ? {} : styleMap.get(element) || {};

      if (isCssOverwritten) {
        normalizer.cssText = styleInfo;
      }
      else {
        Object.keys(styleInfo).forEach(function (property) {
          normalizer[property] = styleInfo[property];
        });
      }

      // This gives us the kebab-case property names, so that we're not writing both camelCase and kebab-case intended styles
      cssObject          = parseCss(normalizer.cssText);
      normalizer.cssText = '';

      Object.keys(cssObject).forEach(function (property) {
        intendedStyles[property] = cssObject[property];
      });

      styleMap.set(element, intendedStyles);
    });

    assignmentRecords = [];
  }

  /*
  * If this function is called with an undefined `property` parameter, de-proxy the element's style property
  * */
  // NOTE: currently this function only takes kebab case properties!
  function restore(element, props) {
    var properties,
      intendedStyles = getIntendedStyles(element);

    if (!intendedStyles) {
      // If we haven't cached any intended styles, the element has not been modified by Sitecues
      return;
    }

    if (props) {
      properties = Array.isArray(props) ? props : [props];
      properties.forEach(function (property) {
        var value = intendedStyles[property];

        if (value) {
          getStyle(element)[property] = value;
        }
        else {
          removeProperty(element, property);
        }
      });
      return;
    }

    var cssText = stringifyCss(intendedStyles);

    if (cssText) {
      getStyle(element).cssText = cssText;
    }
    else {
      element.removeAttribute('style');
    }

    delete element.style;
    delete element._scStyle;
    delete element._scStyleProxy;
  }

  function getIntendedStyles(element) {
    updateIntendedStyles();
    clearTimeout(updateTimer);
    updateTimer = null;
    return styleMap.get(element);
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
    if (isStyleProxied(element)) {
      return element._scStyle.cssText;
    }
    return element.style.cssText;
  }

  function stringifyCss(cssObject) {
    var cssText = '';
    Object.keys(cssObject).forEach(function (property) {
      cssText += property + ': ' + cssObject(property) + '; ';
    });
    return cssText;
  }

  function parseCss(cssText) {
    var
      cssObj = {},
      match = inlinePattern.exec(cssText);
    while (match) {
      var property     = match[1],
          value        = match[2];
      cssObj[property] = value;
      match            = inlinePattern.exec(cssText);
    }
    return cssObj;
  }

  function insertStyleProxy(element) {
    console.log('proxied element:', element);
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
      set : function (cssText) {
        queueAssignmentRecord(element, cssText);
        element._scStyle.cssText = cssText;
      }
    });
  }

  function init() {
    inlinePattern = /([^:]*):\s?([\W\w]*?)(?:;\s|;$)/g;
    // element -> intended css object
    styleMap          = new WeakMap();
    // element -> style proxy object
    proxyMap          = new WeakMap();
    assignmentRecords = [];
  }

  return {
    set             : setStyle,
    get             : getStyle,
    restore         : restore,
    removeProperty  : removeProperty,
    removeAttribute : removeAttribute,
    init            : init
  };
});