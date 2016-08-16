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
      assignmentRecords, updateTimer;

  function setStyle(elements, styleInfo, doNotProxy) {
    var styleType = Array.isArray(styleInfo) ? 'array' : typeof styleInfo;

    if (!Array.isArray(elements)) {
      elements = [elements];
    }

    elements.forEach(function (element) {
      var
        isBPElement      = bpElemInfo.isBPElement(element),
        // We don't care about proxying elements inserted by Sitecues, they don't have an `intended style`
        shouldProxyStyle = !isBPElement && !doNotProxy,
        styleProperty    = shouldProxyStyle ? '_scStyle' : 'style';

      if (shouldProxyStyle && !isStyleProxied(element)) {
        var intendedStyles = parseCss(getCssText(element));
        styleMap.set(element, intendedStyles);
        insertStyleProxy(element);
      }

      switch (styleType) {
        case 'array':
          element[styleProperty].setProperty(styleInfo[0], styleInfo[1], styleInfo[2]);
          break;

        case 'object':
          Object.keys(styleInfo).forEach(function (property) {
            element[styleProperty][property] = styleInfo[property];
          });
          break;

        case 'string':
          element[styleProperty].cssText = styleInfo;
          break;
      }
    });
  }

  // This function exists only because we need a linting rule to ensure that other modules do not interact directly with element's
  // style object directly.
  // NOTE: It is important to use `setStyle` to set style values for `original elements`, defined as elements in the DOM that were not
  // inserted by Sitecues. Though this method can return the style object of an element for conveniently reading and writing from
  // Sitecues elements, it must NOT be used to get the style object of original elements for the intention of setting style values
  function getStyle(element, property) {
    var styleProperty = getDirectStyleProperty(element);
    return property ? element[styleProperty][property] : element[styleProperty];
  }

  // The intended style of an element is the inline style it would have if Sitecues wasn't interfering on the page
  //function getIntendedStyle(element, property) {
  //
  //}

  function queueAssignmentRecord(element, styleInfo) {
    console.log('queueAssignmentRecord:', arguments);
    assignmentRecords.push({
      element: element,
      styleInfo: styleInfo
    });

    if (!updateTimer) {
      updateTimer = nativeFn.setTimeout(function () {
        updateIntendedStyles();
        updateTimer = null;
      }, 100);
    }
  }

  function updateIntendedStyles() {
    assignmentRecords.forEach(function (record) {
      var
        element          = record.element,
        styleInfo        = record.styleInfo,
        isCssOverwritten = typeof styleInfo === 'string',
        cssObject        = isCssOverwritten ? parseCss(styleInfo) : styleInfo,
        intendedStyles   = isCssOverwritten ? {} : styleMap.get(element) || {};
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
  //function restore(element, property) {
  //
  //}

  // Proxying the style object doesn't allow us to intercept style changes via setAttribute and setAttributeNode
  // value, nodeValue, textContent would have to be intercepted on the attributeNode
  //function proxySetAttribute(element) {
  //
  //}

  function styleProxyGetter(property) {
    /*jshint validthis: true */
    // TODO: We should return a proxied version of setProperty
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
      configurable: true,
      /*
      * Interesting:
      * this syntax
      * { get() { ... } }
      * prevented the core from running, should investigate further
      * */
      get : function () { return element._scStyleProxy; },
      set : function (cssText) {
        queueAssignmentRecord(element, cssText);
        element._scStyle.cssText = cssText;
      }
    });
  }

  function init() {
    inlinePattern = /([^:]*):\s?([^;]*);\s?/g;
    // element -> intended css object
    styleMap          = new WeakMap();
    // element -> style proxy object
    proxyMap          = new WeakMap();
    assignmentRecords = [];
    updateTimer       = null;
  }

  return {
    set : setStyle,
    get : getStyle,
    //getIntended: getIntendedStyle,
    init: init
  };
});