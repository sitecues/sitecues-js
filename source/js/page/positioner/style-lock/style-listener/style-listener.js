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
  'Promise',
  'page/positioner/style-lock/style-listener/query-manager',
  'page/positioner/style-lock/style-listener/selector-map',
  'page/positioner/style-lock/style-listener/selectors',
  'page/positioner/transplant/anchors',
  'run/util/array-utility',
  'page/positioner/util/element-info',
  'run/constants',
  'core/native-global',
  'run/inline-style/inline-style',
  'page/positioner/transplant/mutation-relay',
  'run/util/object-utility',
  'page/positioner/style-lock/resolved-style',
  'page/positioner/style-lock/style-cache',
  'page/positioner/style-lock/style-listener/declaration-handlers',
  'page/positioner/style-lock/style-listener/element-handlers'
],
/*jshint -W072 */ //Currently there are too many dependencies, so we need to tell JSHint to ignore it for now
function (
  exports,
  Promise,
  queryManager,
  selectorMap,
  selectors,
  anchors,
  arrayUtil,
  elementInfo,
  coreConstants,
  nativeGlobal,
  inlineStyle,
  mutationRelay,
  objectUtil,
  resolvedStyle,
  styleCache,
  declarationHandlers,
  elementHandlers
) {
  /*jshint +W072 */
  'use strict';

  var domObserver,
    docElem,
    originalBody,
    parsedProperties   = new Set(),
    callbacks          = [],
    READY_STATE        = coreConstants.READY_STATE,
    readyState         = READY_STATE.UNINITIALIZED,
    // We always need to listen for inline style mutations
    observedAttributes = ['style'],
    observerOptions      = {
      attributes        : true,
      attributeOldValue : true,
      subtree           : true,
      attributeFilter   : observedAttributes
    },
    unresolvedElementMap = new WeakMap();

  function evaluateProperty(target, property) {
    evaluateResolvedValues(target, {
      property: property
    });
  }

  function onOriginalElementMutations(mutations) {
    var selectorsToRefresh = [];

    for (var i = 0, mutationCount = mutations.length; i < mutationCount; i++) {
      var mutation  = mutations[i],
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
          var observedProperties = getObservedProperties(target);
          for (var j = 0, propertyCount = observedProperties.length; j < propertyCount; j++) {
            var property    = observedProperties[j],
                value       = inlineStyle.getIntendedStyle(target, property),
                cachedValue = styleCache.getInlineValue(target, property),
                didChange   = value !== cachedValue;

            if (didChange) {
              styleCache.saveInlineValue(target, property, value);
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

  function getUnresolvedProperties(element) {
    var unresolvedProperties = unresolvedElementMap.get(element);

    if (!unresolvedProperties) {
      unresolvedProperties = new Set();
      unresolvedElementMap.set(element, unresolvedProperties);
    }

    return unresolvedProperties;
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
      var unresolvedProperties = getUnresolvedProperties(element);

      if (unresolvedProperties.has(property)) {
        // We're already waiting to get this resolved value
        return;
      }

      unresolvedProperties.add(property);

      resolvedStyle.getIntendedValue({
        element  : element,
        property : property,
        // Wait for the value to stabilize (i.e. finish transitioning) before computing the intended value
        stable   : true
      }).then(function (value) {
        var cachedValue = styleCache.getResolvedValue(element, property);
        unresolvedProperties.delete(property);
        if (cachedValue !== value) {
          var handlerOpts = {
                element   : element,
                property  : property,
                toValue   : value,
                fromValue : cachedValue
              },
              isHandled = elementHandlers.isHandled(handlerOpts) || declarationHandlers.isHandled(handlerOpts);

          if (isHandled || cachedValue !== undefined) {
            styleCache.saveResolvedValue(element, property, value);
          }

          if (isHandled) {
            elementHandlers.run(handlerOpts);
            declarationHandlers.run(handlerOpts);
          }
        }
      });
    });
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
    var opts = objectUtil.assign({}, observerOptions);
    anchors.forEach(function (element) {
      domObserver.observe(element, opts);
    });

    domObserver.observe(originalBody, opts);
    delete opts.subtree;
    domObserver.observe(docElem, opts);
  }

  function listenForDynamicStyling(property) {
    if (parsedProperties.has(property)) {
      // We've already parsed the selectors of the relevant style rules for this style property
      return;
    }

    parsedProperties.add(property);

    var propertySelectors   = selectors.getForProperty(property),
        compositeAttributes = selectors.getCompositeAttributes(propertySelectors);

    selectorMap.cacheInitialQueries(propertySelectors);

    observedAttributes              = arrayUtil.union(observedAttributes, compositeAttributes);
    observerOptions.attributeFilter = observedAttributes;

    disconnectDOMObserver();
    observeOriginalElements();
  }

  // Returns all observed declaration properties and this element's specifically handled properties
  function getObservedProperties(element) {
    var elementProperties     = elementHandlers.getHandledProperties(element),
        declarationProperties = declarationHandlers.getHandledProperties();
    return arrayUtil.union(elementProperties, declarationProperties);
  }

  function isDeclarationObserved(declaration) {
    return declarationHandlers.getHandledValues(declaration.property).indexOf(declaration.value) >= 0;
  }

  function bindDeclarationListener(declaration, handlers) {
    var resolveValue,
        property = declaration.property;

    if (isDeclarationObserved(declaration)) {
      resolveValue = Promise.resolve();
      declarationHandlers.bindHandlers(declaration, handlers);
    }
    else {
      resolveValue = new Promise(function (resolve) {
        nativeGlobal.setTimeout(function () {
          // This is a pretty expensive operation, requiring us to compute the style of every element in the DOM. We only
          // access a single property on the computed style, so it isn't as bad as it sounds (many values are only calculated as needed)
          // but even so we mitigate this expense by running it in its own synchronous block
          cacheResolvedElements(declaration);
          declarationHandlers.bindHandlers(declaration, handlers);
          resolve();
        }, 0);
      });
    }

    listenForDynamicStyling(property);

    // Return a promise for when we've successfully cached all matching resolved elements
    return resolveValue;
  }

  function cacheResolvedElements(declaration) {
    if (isDeclarationObserved(declaration)) {
      // We've already cached the elements matching this declaration
      return;
    }

    var resolvedElements = resolvedStyle.getMatchingElements(declaration),
        property         = declaration.property;
    resolvedElements.forEach(function (element) {
      if (!styleCache.hasResolvedValue(element, property)) {
        // This is an important conditional, if we're already observing this property we can't update its value in the cache without losing the chance
        // to run mutation handlers. If everything is running smoothly, any change will be picked up by the mutation observer
        cacheStyleState(element, declaration);
      }
    });
  }

  // Runs the passed handler when @element's resolved style @property value has changed
  function bindPropertyListener(element, property, handler) {
    var isPropertyValueCached = styleCache.hasResolvedValue(element, property);

    if (!isPropertyValueCached) {
      var resolvedValue = resolvedStyle.getIntendedValue({
            element  : element,
            property : property
          }),
          declaration   = {
            property : property,
            value    : resolvedValue
          };

      // It's possible that this element has recently mutated such that it would trigger a declaration handler,
      // but we haven't processed the mutation record yet. By caching its current resolved value, we are potentially
      // masking that mutation and preventing the listener from firing.
      // To prevent this we will manually trigger the declaration handlers to run if appropriate
      declarationHandlers.run({
        element   : element,
        property  : property,
        toValue   : resolvedValue,
        fromValue : null
      });

      cacheStyleState(element, declaration);

      listenForDynamicStyling(property);
    }

    elementHandlers.bindHandler({
      element  : element,
      property : property,
      handler  : handler
    });
  }

  function cacheStyleState(element, declaration) {
    var property = declaration.property,
        value    = declaration.value;
    styleCache.saveResolvedValue(element, property, value);
    styleCache.saveInlineValue(element, property);
  }

  function unbindPropertyListener(element, property, handler) {
    elementHandlers.unbind({
      element  : element,
      property : property,
      handler  : handler
    });

    // Clear the cache if we aren't observing this property any longer
    if (getObservedProperties(element).indexOf(property) === -1) {
      styleCache.clear(element, property);
    }
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

  exports.bindPropertyListener    = bindPropertyListener;
  exports.unbindPropertyListener  = unbindPropertyListener;
  exports.bindDeclarationListener = bindDeclarationListener;
  exports.init                    = init;
});
