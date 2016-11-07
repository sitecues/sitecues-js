/*
* Style-Listener
*
* This module is passed css declarations and handlers to call when the document mutates such that an element resolves to or from
* that declaration.
* 
* The positioner uses this module to listen for elements resolving to and from position: fixed.
*
* */
define(
  [
    'exports',
    'page/positioner/style-lock/style-listener/query-manager',
    'page/positioner/style-lock/style-listener/selector-map',
    'page/positioner/style-lock/style-listener/selectors',
    'page/positioner/transplant/anchors',
    'run/util/array-utility',
    'page/positioner/util/element-info',
    'page/positioner/util/element-map',
    'run/constants',
    'core/native-global',
    'run/inline-style/inline-style',
    'page/util/transition-util',
    'page/positioner/style-lock/style-lock',
    'page/positioner/transplant/mutation-relay'
  ],
  /*jshint -W072 */ //Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
  function (
    exports,
    queryManager,
    selectorMap,
    selectors,
    anchors,
    arrayUtil,
    elementInfo,
    elementMap,
    coreConstants,
    nativeGlobal,
    inlineStyle,
    transitionUtil,
    styleLock,
    mutationRelay
  ) {
  /*jshint +W072 */
  'use strict';

  var domObserver, docElem,
    originalBody,
    observedProperties = [],
    callbacks          = [],
    READY_STATE        = coreConstants.READY_STATE,
    readyState         = READY_STATE.UNINITIALIZED,
    // We always need to listen for inline style mutations
    observedAttributes = ['style'],
    /*
     * {
     *   property: ['valueA', 'valueB']
     * }
     *
     * Declarations we're listening for
     * */
    observedPropertyToValues = {},
    /*
    * {
    *   property_value: [elementA, elementB]
    * }
    *
    * List of elements that have resolved to this declaration
    * */
    resolvedElementsMap = {},
    /*
     * {
     *   direction_property_value: [handlerA, handlerB]
     * }
     *
     * Handlers keyed with their directional style hooks
     * e.g. to_position_fixed: [handlerFn]
     * */
    handlerMap = {},
    /*
    * {
    *   elementReference: { property: [handler] }
    * }
    *
    * The outer map keys an element reference to a map of the properties we're listening for specifically for this element, and the handlers that fire when
    * this property mutates
    * */
    elementPropertyHandlerMap = new WeakMap(),
    observerOptions           = {
      attributes        : true,
      attributeOldValue : true,
      subtree           : true,
      attributeFilter   : observedAttributes
    },
    elementsToUnresolvedPropertyMap = new WeakMap();

    // This handler is run on mutated elements /intended/ to be in the original body, which is to say elements currently nested in the
    // original body and original elements currently nested in the clone body
    function onOriginalElementMutations(mutations) {
      var selectorsToRefresh = [],
          mutationCount      = mutations.length;

      function evaluateProperty(target, property) {
        evaluateResolvedValues(target, {
          property: property
        });
      }

      for (var i = 0; i < mutationCount; i++) {
        var
          mutation  = mutations[i],
          target    = mutation.target,
          attribute = mutation.attributeName,
          oldValue  = mutation.oldValue;

        if (elementInfo.isClone(target) || elementInfo.isSitecuesElement(target)) {
          // We only consider changes to original elements when refreshing the fixed elementMap
          // We don't bother listening to sitecues element changes
          continue;
        }

        // Relay the original element's mutation to its clone
        mutationRelay(mutation);

        // This switch evaluates attribute mutations for their styling impact
        switch (attribute) {
          case 'class':
            var
              // SVG elements in IE11 do not define classList
              newClasses     = target.classList ? Array.prototype.slice.call(target.classList, 0) : target.className.baseVal.split(' '),
              oldClasses     = oldValue ? oldValue.split(' ') : [],
              changedClasses = arrayUtil.symmetricDifference(newClasses, oldClasses);
            if (changedClasses.length) {
              selectorsToRefresh = selectorsToRefresh.concat(selectors.filterByClasses(changedClasses));
            }
            break;

          case 'id':
            selectorsToRefresh = selectorsToRefresh.concat(selectors.filterByIds(target.id, oldValue));
            break;

          case 'style':
            for (var j = 0, propertyCount = observedProperties.length; j < propertyCount; j++) {
              var
                property       = observedProperties[j],
                inlineKey      = getInlineKey(property),
                inlineValue    = inlineStyle(target)[property],
                oldInlineValue = elementMap.getField(target, inlineKey),
                didChange      = oldInlineValue !== inlineValue,
                isIntended     = inlineStyle.getIntendedStyle(target, property) === inlineValue;

              if (didChange && isIntended) {
                elementMap.setField(target, inlineKey, inlineValue);
                nativeGlobal.setTimeout(evaluateProperty, 0, target, property);
              }
            }
            break;

          default:
            break;
        }
      }

      if (selectorsToRefresh.length) {
        queryManager.queue(selectorsToRefresh);
      }
    }

  function getInlineKey(property) {
    return property + '_inline_value';
  }

  function evaluateResolvedValues(element, opts) {
    var properties;

    if (opts.selector) {
      // Returns the css properties we collected this selector for
      properties = selectors.getPropertiesBySelector(opts.selector);
    }
    else {
      properties = [opts.property];
    }

    properties.forEach(function (property) {
      var lockVal,
        unresolvedProperties = elementsToUnresolvedPropertyMap.get(element);

      if (!unresolvedProperties) {
        unresolvedProperties = new Set();
        elementsToUnresolvedPropertyMap.set(element, unresolvedProperties);
      }

      if (unresolvedProperties.has(property)) {
        // We're already waiting to get this resolved value
        return;
      }

      var transitionInfo = transitionUtil.getTransitionInfo(element),
          isLocked = styleLock.isLocked(element, property);

      if (isLocked) {
        lockVal = styleLock.unlockStyle(element, property);
      }

      if (!transitionUtil.canPropertyTransition({ transitionInfo : transitionInfo, property : property })) {
        var value = getComputedStyle(element)[property];

        if (isLocked) {
          styleLock.lock(element, {
            property  : property,
            lockValue : lockVal
          });
        }

        // If this style can't transition, we can compute its resolved value synchronously and run the relevant property handlers
        runPropertyHandlers(element, {
          property : property,
          value : value
        });
        return;
      }

      unresolvedProperties.add(property);

      // We also restore the inline property to its intended value
      inlineStyle.restore(element, property);
      transitionUtil.getFinalStyleValue(element, { property : property, transitionInfo : transitionInfo }).then(function (value) {
        // The inline value is restored to its previous (potentially overridden by us) value
        inlineStyle.restoreLast(element, property);
        unresolvedProperties.delete(property);
        // Evaluate if we should call style-listeners handlers when / if the property finishes transitioning
        runPropertyHandlers(element, {
          property : property,
          value : value
        });
      });
    });
  }

  function runPropertyHandlers(element, opts) {
    var handlerKey,
        fromHandlers     = [],
        toHandlers       = [],
        property         = opts.property,
        value            = opts.value,
        observedValues   = observedPropertyToValues[property] || [],
        cachedValue      = elementInfo.getCacheValue(element, property),
        elementHandlers  = elementPropertyHandlerMap.get(element),
        propertyHandlers = elementHandlers && elementHandlers[property],
        handlerOpts      = {
          element   : element,
          property  : property,
          toValue   : value,
          fromValue : cachedValue
        };
    
    function runHandlers(directionHandlers) {
      directionHandlers.forEach(function (propertyHandlers) {
        for (var i = 0, handlerCount = propertyHandlers.length; i < handlerCount; i++) {
          propertyHandlers[i].call(element, handlerOpts);
        }
      });
    }

    if (propertyHandlers && cachedValue !== value) {
      // These element handlers run when the element's resolved value for a given style property has mutated from its cached value
      propertyHandlers.forEach(function (fn) {
        fn.call(element, handlerOpts);
      });
    }
  
    for (var i = 0, valueCount = observedValues.length; i < valueCount; i++) {
      var handlers,
          // Style value we're listening for, e.g. 'fixed' or 'absolute'
          observedValue    = observedValues[i],
          declarationKey   = property + '_' + observedValue,
          resolvedElements = resolvedElementsMap[declarationKey] || [],
          isMatching       = value === observedValue,
          elementIndex     = resolvedElements.indexOf(element),
          wasMatching      = elementIndex !== -1;
    
      if (isMatching && !wasMatching) {
        handlerKey = 'to_' + declarationKey;
        handlers = handlerMap[handlerKey];
        if (handlers) {
          toHandlers.push(handlers);
        }
        resolvedElements.push(element);
      }
      else if (!isMatching && wasMatching) {
        handlerKey = 'from_' + declarationKey;
        handlers = handlerMap[handlerKey];
        if (handlers) {
          fromHandlers.push(handlers);
        }
        resolvedElements.splice(elementIndex, 1);
      }
    }

    elementInfo.setCacheValue(element, property, value);
    runHandlers(fromHandlers);
    runHandlers(toHandlers);
  }

  function disconnectDOMObserver() {
    var mutationRecords = domObserver.takeRecords();
    // Handle the remaining queued mutation records
    if (mutationRecords.length) {
      nativeGlobal.setTimeout(function (mutationRecords) {
        onOriginalElementMutations(mutationRecords);
      }, 0, mutationRecords);
    }

    domObserver.disconnect();
  }

  function observeOriginalElements() {
    anchors.forEach(function (element) {
      domObserver.observe(element, observerOptions);
    });

    domObserver.observe(originalBody, observerOptions);
  }

  function listenForDynamicStyling(property) {
    var
      propertySelectors   = selectors.getForProperty(property),
      compositeAttributes = selectors.getCompositeAttributes(propertySelectors);

    selectorMap.cacheInitialQueries(propertySelectors);

    observedAttributes              = arrayUtil.union(observedAttributes, compositeAttributes);
    observerOptions.attributeFilter = observedAttributes;

    disconnectDOMObserver();
    observeOriginalElements();
  }

  function getDeclarationKey(declaration) {
    return getPropertyValueKey(declaration.property, declaration.value);
  }

  function getPropertyValueKey(property, value) {
    return property + '_' + value;
  }

  function addHandlerToMap(handler, key) {
    if (!handlerMap[key]) {
      handlerMap[key] = [];
    }
    handlerMap[key].push(handler);
  }
    
  function registerResolvedValueHandler(declaration, handlerKey, handler) {
    var
      property           = declaration.property,
      value              = declaration.value,
      observedValues     = observedPropertyToValues[property] || [],
      key                = getPropertyValueKey(property, value),
      isPropertyObserved = observedProperties.indexOf(property) !== -1,
      isValueObserved    = observedValues.indexOf(value) !== -1;

    if (!isValueObserved) {
      observedValues.push(value);
      observedPropertyToValues[property] = observedValues;

      if (!isPropertyObserved) {
        observedProperties.push(property);
      }

      nativeGlobal.setTimeout(function () {
        resolvedElementsMap[key] = getElementsWithResolvedValue(declaration);
        if (!isPropertyObserved) {
          listenForDynamicStyling(property);
        }
      }, 0);
    }
    addHandlerToMap(handler, handlerKey);
  }

  // Runs the passed handler when @element's resolved style @property value has changed
  function bindPropertyListener(element, property, handler) {
    var
      resolvedValue      = getComputedStyle(element)[property],
      isPropertyObserved = observedProperties.indexOf(property) !== -1,
      handlers           = elementPropertyHandlerMap.get(element) || {},
      inlineValue        = inlineStyle.getIntendedStyle(element, property);

    // Cache the current inline value so that we can tell if it changes
    elementMap.setField(element, getInlineKey(property), inlineValue);

    addToResolvedElementsMap(element, property, resolvedValue);

    // If we've already attached handlers to run when this element's resolved property value mutates,
    // we know that we're already listening for relevant document mutations
    if (handlers[property]) {
      handlers[property].push(handler);
    }
    else {
      handlers[property] = [handler];
      if (!isPropertyObserved) {
        listenForDynamicStyling(property);
        observedProperties.push(property);
      }
    }
    elementPropertyHandlerMap.set(element, handlers);
  }

  function unbindPropertyListener(element, property, handler) {
    var elementHandlers  = elementPropertyHandlerMap.get(element) || {},
        propertyHandlers = elementHandlers[property] || [],
        index            = propertyHandlers.indexOf(handler);
    if (index >= 0) {
      propertyHandlers.splice(index, 1);
    }
    elementPropertyHandlerMap.set(element, elementHandlers);
  }

  // This map caches elements we know have a given resolved value
  function addToResolvedElementsMap(element, property, value) {
    var key = getPropertyValueKey(property, value);
    if (resolvedElementsMap[key]) {
      resolvedElementsMap[key] = arrayUtil.addUnique(resolvedElementsMap[key], element);
    }
    else {
      resolvedElementsMap[key] = [element];
    }
    elementInfo.setCacheValue(element, property, value);
  }

  // When the document is mutated such that an element's computed style matches the declaration, pass it to the handler
  function registerToResolvedValueHandler(declaration, handler) {
    var
      declarationKey = getDeclarationKey(declaration),
      handlerKey = 'to_' + declarationKey;
    registerResolvedValueHandler(declaration, handlerKey, handler);
  }

  // When an element's computed style was matching the passed declaration, and the document is mutated such that it no longer matches
  function registerFromResolvedValueHandler(declaration, handler) {
    var
      declarationKey = getDeclarationKey(declaration),
      handlerKey = 'from_' + declarationKey;
    registerResolvedValueHandler(declaration, handlerKey, handler);
  }

  function getElementsWithResolvedValue(declaration) {
    var
      property       = declaration.property,
      value          = declaration.value,
      observedValues = observedPropertyToValues[property],
      declarationKey = getDeclarationKey(declaration);

    // If we're already listening for elements with this resolved style value, return the list
    if (observedValues && observedValues.indexOf(value) >= 0 && resolvedElementsMap[declarationKey]) {
      return resolvedElementsMap[declarationKey];
    }

    var
      transplantAnchors = anchors.get(),
      allBodyElements   = Array.prototype.slice.call(document.body.getElementsByTagName('*'), 0);

    resolvedElementsMap[declarationKey] = [];

    // If original elements are transplanted to the auxiliary body, include them in the search
    transplantAnchors.forEach(function (anchor) {
      allBodyElements = allBodyElements.concat(Array.prototype.slice.call(anchor.getElementsByTagName('*'), 0));
    });

    for (var i = 0, elementCount = allBodyElements.length; i < elementCount; i++) {
      var element = allBodyElements[i];
      if (getComputedStyle(element)[property] === value) {
        resolvedElementsMap[declarationKey].push(element);
        elementInfo.setCacheValue(element, property, value);
      }
    }

    return resolvedElementsMap[declarationKey];
  }

  function onNewTransplantAnchor() {
    /*jshint validthis: true */
    domObserver.observe(this, observerOptions);
    /*jshint validthis: false */
  }

  function onRemovedTransplantAnchor() {
    disconnectDOMObserver();
    observeOriginalElements();
  }

  function executeCallbacks() {
    callbacks.forEach(function (callback) {
      callback();
    });
    callbacks = null;
  }

  function init(callback) {
    switch (readyState) {
      case READY_STATE.UNINITIALIZED:
        callbacks.push(callback);
        elementInfo.init();
        mutationRelay.init();
        readyState   = READY_STATE.INITIALIZING;
        docElem      = document.documentElement;
        originalBody = document.body;
        domObserver  = new MutationObserver(onOriginalElementMutations);

        selectors.init(function () {
          readyState = READY_STATE.COMPLETE;
          queryManager.init(evaluateResolvedValues);
          executeCallbacks();
        });
        anchors.registerNewAnchorHandler(onNewTransplantAnchor);
        anchors.registerRemovedAnchorHandler(onRemovedTransplantAnchor);
        break;

      case READY_STATE.INITIALIZING:
        callbacks.push(callback);
        break;

      case READY_STATE.COMPLETE:
        callback();
        break;
    }
  }

  exports.bindPropertyListener             = bindPropertyListener;
  exports.unbindPropertyListener           = unbindPropertyListener;
  exports.registerToResolvedValueHandler   = registerToResolvedValueHandler;
  exports.registerFromResolvedValueHandler = registerFromResolvedValueHandler;
  exports.getElementsWithResolvedValue     = getElementsWithResolvedValue;
  exports.init                             = init;
});
