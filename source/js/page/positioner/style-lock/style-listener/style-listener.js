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
    'page/positioner/style-lock/style-listener/query-manager',
    'page/positioner/style-lock/style-listener/selector-map',
    'page/positioner/style-lock/style-listener/selectors',
    'page/positioner/util/array-utility',
    'page/positioner/util/element-info',
    'page/positioner/transplant/transplant',
    'page/positioner/util/element-map',
    'page/positioner/constants',
    'core/constants'
  ],
  function (
    queryManager,
    selectorMap,
    selectors,
    arrayUtil,
    elementInfo,
    transplant,
    elementMap,
    constants,
    coreConstants
  ) {
  var domObserver, docElem,
    callbacks                = [],
    READY_STATE              = coreConstants.READY_STATE,
    readyState               = READY_STATE.UNINITIALIZED,
    LOCK_ATTR                = constants.LOCK_ATTR,
    // We always need to listen for inline style mutations
    attributesToObserve      = [ 'style' ],
    /*
     * {
     *   property: ['valueA', 'valueB']
     * }
     * */
    // Declarations that we're listening for
    propertyToObservedValues = {},
    /*
    * {
    *   property_value: [elementA, elementB]
    * }
    * */
    resolvedElementsMap      = {},
    /*
     * {
     *   direction_property_value: [handlerA, handlerB]
     * }
     * */
    handlerMap               = {};


    function onMutations(mutations) {
      var
        len = mutations.length,
        selectorsToRefresh = [];

      function evaluateProperty(target, property) {
        evaluateResolvedValue(target, {
          property: property
        });
      }

      for (var i = 0; i < len; i++) {
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

        // This switch evaluates attribute mutations by their potential impact on fixed positioning
        switch (attribute) {
          case 'class':
            var
              newClasses     = Array.prototype.slice.call(target.classList, 0),
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
            var observedProperties = Object.keys(propertyToObservedValues);
            for (var j = 0, propertyCount = observedProperties.length; j < propertyCount; j++) {
              var
                property       = observedProperties[j],
                inlineKey      = property + '_inline_value',
                inlineValue    = target.style[property],
                oldInlineValue = elementMap.getField(target, inlineKey),
                didChange      = oldInlineValue !== inlineValue;

              if (didChange) {
                elementMap.setField(target, inlineKey, inlineValue);
                setTimeout(evaluateProperty, 0, target, property);
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

  function evaluateResolvedValue(element, opts) {
    var properties,
      fromHandlers = new Map(),
      toHandlers   = new Map(),
      style        = getComputedStyle(element);

    function runHandlers(directionHandlers) {
      directionHandlers.forEach(function (opts, propertyHandlers) {
        for (var i = 0, handlerCount = propertyHandlers.length; i < handlerCount; i++) {
          propertyHandlers[i].call(element, opts);
        }
      });
    }

    if (opts.selector) {
      // Returns the css properties we collected this selector for
      properties = selectors.getPropertiesBySelector(opts.selector);
    }
    else {
      properties = [ opts.property ];
    }

    properties.forEach(function (property) {
      var handlerKey,
        observedValues = propertyToObservedValues[property],
        lockAttribute  = LOCK_ATTR + property,
        lockValue      = element.getAttribute(lockAttribute);

      if (lockValue) {
        // This attribute 'reinforces' the value this element previously resolved to by applying it with importance
        // We need to remove it in order to compute the intended resolved value
        element.setAttribute(lockAttribute, '');
      }

      for (var i = 0, valueCount = observedValues.length; i < valueCount; i++) {
        var handlers,
          // Style value we're listening for, e.g. 'fixed' or 'absolute'
          observedValue    = observedValues[i],
          resolvedValue    = style[property],
          declarationKey   = property + '_' + observedValue,
          resolvedElements = resolvedElementsMap[declarationKey] || [],
          isMatching       = resolvedValue === observedValue,
          elementIndex     = resolvedElements.indexOf(element),
          wasMatching      = elementIndex !== -1,
          opts             = { property: property, toValue: resolvedValue, fromValue: elementInfo.getCacheValue(element, property) };

        elementInfo.setCacheValue(element, property, resolvedValue);

        if (isMatching && !wasMatching) {
          handlerKey = 'to_' + declarationKey;
          handlers = handlerMap[handlerKey];
          if (handlers) {
            toHandlers.set(handlers, opts);
          }
          resolvedElements.push(element);
        }
        else if (!isMatching && wasMatching) {
          handlerKey = 'from_' + declarationKey;
          handlers = handlerMap[handlerKey];
          if (handlers) {
            fromHandlers.set(handlers, opts);
          }
          resolvedElements.splice(elementIndex, 1);
        }
      }

      if (lockValue) {
        element.setAttribute(lockAttribute, lockValue);
      }
    });
    runHandlers(fromHandlers);
    runHandlers(toHandlers);
  }

  function listenForDynamicStyling(propertySelectors) {
    var
      mutationRecords     = domObserver.takeRecords(),
      compositeAttributes = selectors.getCompositeAttributes(propertySelectors);

    selectorMap.cacheInitialQueries(propertySelectors);

    if (mutationRecords.length) {
      setTimeout(function (mutationRecords) {
        onMutations(mutationRecords);
      }, 0, mutationRecords);
    }

    attributesToObserve = arrayUtil.union(attributesToObserve, compositeAttributes);

    domObserver.disconnect();
    domObserver.observe(docElem, {
      attributes: true,
      attributeOldValue: true,
      subtree: true,
      attributeFilter: attributesToObserve
    });
  }

  function getDeclarationKey(declaration) {
    return declaration.property + '_' + declaration.value;
  }

  function addHandlerToMap(handler, key) {
    handlerMap[key] = handlerMap[key] || [];
    handlerMap[key].push(handler);
  }
    
  function registerResolvedValueHandler(declaration, handlerKey, handler) {
    var
      property = declaration.property,
      value    = declaration.value;
    // If we're already observing this style property, we don't need to reparse & listen for selectors
    if (propertyToObservedValues[property]) {
      if (propertyToObservedValues[property].indexOf(value) === -1) {
        propertyToObservedValues[property].push(value);
      }
      addHandlerToMap(handler, handlerKey);
    }
    else {
      var propertySelectors = selectors.getForProperty(property);
      propertyToObservedValues[property] = [];
      propertyToObservedValues[property].push(value);
      // Getting all elements with a resolved value is expensive so do it asynchronously
      setTimeout(function () {
        // By caching the elements we know currently have the resolved value, we can handle when elements mutate to or from that value
        resolvedElementsMap[getDeclarationKey(declaration)] = getElementsWithResolvedValue(declaration);
        listenForDynamicStyling(propertySelectors);
        addHandlerToMap(handler, handlerKey);
      }, 0);
    }
  }

  // When an element is mutated such that its computed style matches the declaration, pass it to the handler
  function registerToResolvedValueHandler(declaration, handler) {
    var
      declarationKey = getDeclarationKey(declaration),
      handlerKey = 'to_' + declarationKey;
    registerResolvedValueHandler(declaration, handlerKey, handler);
  }

  // When an element's computed style was matching the passed declaration, and it is mutated such that it no longer matches
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
      declarationKey = getDeclarationKey(declaration);

    // If we're already listening for elements with this resolved style value, return the list
    if (propertyToObservedValues[property].indexOf(value) >= 0 && resolvedElementsMap[declarationKey]) {
      return resolvedElementsMap[declarationKey];
    }

    var
      transplantAnchors = transplant.getAnchors(),
      allElements       = Array.prototype.slice.call(document.body.getElementsByTagName('*'), 0);

    resolvedElementsMap[declarationKey] = [];

    // If original elements are transplanted to the auxiliary body, include them in the search
    transplantAnchors.forEach(function (anchor) {
      allElements = allElements.concat(Array.prototype.slice.call(anchor.getElementsByTagName('*'), 0));
    });

    for (var i = 0, elementCount = allElements.length; i < elementCount; i++) {
      var element = allElements[i];
      if (getComputedStyle(element)[property] === value) {
        resolvedElementsMap[declarationKey].push(element);
        elementInfo.setCacheValue(element, property, value);
      }
    }

    return resolvedElementsMap[declarationKey];
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
        readyState  = READY_STATE.INITIALIZING;
        docElem     = document.documentElement;
        domObserver = new MutationObserver(onMutations);
        selectors.init(function () {
          readyState = READY_STATE.COMPLETE;
          queryManager.init(evaluateResolvedValue);
          executeCallbacks();
        });
        break;

      case READY_STATE.INITIALIZING:
        callbacks.push(callback);
        break;

      case READY_STATE.COMPLETE:
        callback();
        break;
    }
  }

  return {
    registerToResolvedValueHandler: registerToResolvedValueHandler,
    registerFromResolvedValueHandler: registerFromResolvedValueHandler,
    getElementsWithResolvedValue: getElementsWithResolvedValue,
    init: init
  };
});