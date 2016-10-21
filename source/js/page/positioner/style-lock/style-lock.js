/*
* Style-Lock
*
* The style-lock gets elements mutating to certain style values, and 'locks' that value by applying a data attribute
* tied to a rule applying the current style value with importance. Handlers are run before and after allowing the
* style mutation to take effect.
* e.g.
* We request position: fixed styles to be locked
* All elements currently styled with position: fixed are returned by the style listener, and data-sc-lock-position='fixed' is set on each
* Subsequently when an element is dynamically unfixed, attached handlers can run before and after the style has been resolved
*
* */
define(
  [
    'exports',
    'page/positioner/style-lock/style-listener/style-listener',
    'page/positioner/constants',
    'run/constants',
    'page/positioner/util/element-info',
    'mini-core/native-global'
  ],
  function (
    exports,
    styleListener,
    constants,
    coreConstants,
    elementInfo,
    nativeGlobal
  ) {
  'use strict';

  var stylesheet,
    noop                  = function () {},
    elementHandlerMap     = new WeakMap(),
    declarationHandlerMap = {},
    initCallbacks         = [],
    lockSelectorMap       = {},
    stylesheetId          = 'sitecues-js-locked-styles',
    LOCK_ATTR             = constants.LOCK_ATTR,
    READY_STATE           = coreConstants.READY_STATE,
    readyState            = READY_STATE.UNINITIALIZED;

  // This function is the entry point for the module. Depending on the arguments passed to the function, it will either
  // lock a single element's resolved property value, or lock all elements in the document matching a given resolved declaration
  function lock(target, opts) {
    // Target can be either an element or a declaration
    if (target.nodeType === Node.ELEMENT_NODE) {
      lockElementProperty(target, opts);
    }
    else {
      lockResolvedDeclaration(target, opts);
    }
  }

  // The handlers are run before and after the property's resolved value mutates
  function lockElementProperty(element, opts) {
    var handlers = opts.handlers || {},
        property = opts.property;

    styleListener.init(function () {
      function onPropertyMutation(opts) {
        /*jshint validthis: true */
        var
          value            = opts.toValue,
          results          = [],
          elementHandlers  = elementHandlerMap.get(this),
          propertyHandlers = elementHandlers[property],
          beforeHandlers   = propertyHandlers.before,
          afterHandlers    = propertyHandlers.after;

        for (var i = 0, beforeCount = beforeHandlers.length; i < beforeCount; i++) {
          results.push(beforeHandlers[i].call(this, opts));
        }

        lockStyle(this, property, value);

        for (var j = 0, afterCount = afterHandlers.length; j < afterCount; j++) {
          afterHandlers[j].call(this, results[j]);
        }
        /*jshint validthis: false */
      }

      var
        before           = handlers.before ? [handlers.before] : [],
        after            = handlers.after  ? [handlers.after]  : [],
        currentValue     = getComputedStyle(element)[property],
        elementHandlers  = elementHandlerMap.get(element) || {},
        propertyHandlers = elementHandlers[property];

      if (propertyHandlers) {
        propertyHandlers.before.concat(before);
        propertyHandlers.after.concat(after);
      }
      else {
        elementHandlers[property] = {
          after  : after,
          before : before
        };
      }

      elementHandlerMap.set(element, elementHandlers);
      lockStyle(element, property, currentValue);
      styleListener.bindPropertyListener(element, property, onPropertyMutation);
    });
  }

  // Before and after handlers will run respectively before and after a non-sitecues element's resolved style value mutates
  // to or from the declaration
  // The initial handler will run when we identify elements with a resolved value matching the declaration
  function lockResolvedDeclaration(declaration, handlers) {
    handlers = handlers || {};
    styleListener.init(function () {
      var
        initial  = handlers.initial || noop,
        before   = handlers.before || noop,
        after    = handlers.after || noop,
        property = declaration.property,
        value    = declaration.value,
        key      = getDeclarationKey(declaration);

      function isValidLockTarget(element) {
        return !elementInfo.isSitecuesElement(element);
      }

      function fromHandler(args) {
        /*jshint validthis: true */
        if (isValidLockTarget(this)) {
          var
            results  = [],
            property = args.property,
            value    = args.fromValue,
            key      = property + '_' + value,
            handlers = declarationHandlerMap[key];

          var
            beforeHandlers = handlers.before,
            afterHandlers  = handlers.after;

          for (var i = 0, beforeCount = beforeHandlers.length; i < beforeCount; i++) {
            results.push(beforeHandlers[i].call(this, args));
          }

          unlockStyle(this, property);

          for (var j = 0, afterCount = afterHandlers.length; j < afterCount; j++) {
            afterHandlers[j].call(this, results[j]);
          }
        }
        /*jshint validthis: false */
      }

      function toHandler(args) {
        /*jshint validthis: true */
        if (isValidLockTarget(this)) {
          var
            property        = args.property,
            value           = args.toValue,
            key             = property + '_' + value,
            initialHandlers = declarationHandlerMap[key].initial;

          lockStyle(this, property, value);

          for (var i = 0, initialCount = initialHandlers.length; i < initialCount; i++) {
            initialHandlers[i].call(this, args);
          }
        }
        /*jshint validthis: false */
      }

      var declarationHandlers = declarationHandlerMap[key];

      if (declarationHandlers) {
        // We're already listening for when elements lose or gain this resolved style value, add additional handlers
        declarationHandlers.before.push(before);
        declarationHandlers.after.push(after);
        declarationHandlers.initial.push(initial);
      }
      else {
        declarationHandlerMap[key] = {
          before: [before],
          after: [after],
          initial: [initial]
        };
        styleListener.registerToResolvedValueHandler(declaration, toHandler);
        styleListener.registerFromResolvedValueHandler(declaration, fromHandler);
      }

      // We run this asynchronously because it is an expensive operation
      // and we want to allow the browser to run other events before we begin it
      nativeGlobal.setTimeout(function () {
        var elements = styleListener.getElementsWithResolvedValue(declaration);

        function runHandler(element) {
          toHandler.call(element, { toValue: value, property: property });
        }

        for (var i = 0, elementCount = elements.length; i < elementCount; i++) {
          if (initial !== noop) {
            // Likewise each initial handler call is potentially expensive if we have to transplant the target
            nativeGlobal.setTimeout(runHandler, 0, elements[i]);
          }
          else {
            lockStyle(elements[i], property, value);
          }
        }
      }, 0);
    });
  }

  function getDeclarationKey(declaration) {
    return declaration.property + '_' + declaration.value;
  }

  function lockStyle(element, property, value) {
    var
      attributeName = LOCK_ATTR + property,
      valueLocks    = lockSelectorMap[attributeName] || {},
      lockSelector  = valueLocks[value];
    if (!lockSelector) {
      lockSelector = '[' + attributeName + '="' + value + '"]';
      appendStylesheet(lockSelector + ' { ' + property + ': ' + value + ' !important; }\n');
      valueLocks[value] = lockSelector;
      lockSelectorMap[attributeName] = valueLocks;
    }
    element.setAttribute(attributeName, value);
  }
  
  function unlockStyle(element, property) {

    function removeLock(element, attribute) {
      element.removeAttribute(attribute);
    }

    // Remove all of the style locks for @element
    // if @property is undefined
    if (!property) {
      var attributes = Object.keys(lockSelectorMap);
      attributes.forEach(function (attribute) {
        removeLock(element, attribute);
      });
      return;
    }

    var lockAttribute = LOCK_ATTR + property;

    // If @element and @property are defined, remove the property lock from @element
    if (element && element.nodeType === Node.ELEMENT_NODE) {
      removeLock(element, lockAttribute);
      return;
    }

    // If @element is undefined, unlock all elements with @property locks
    var
      propertyLockSelector = '[' + lockAttribute + ']',
      elements             = document.querySelectorAll(propertyLockSelector);

    for (var i = 0, elementCount = elements.length; i < elementCount; i++) {
      removeLock(elements[i], lockAttribute);
    }
  }

  function isLocked(element, property) {
    var handlerMap = elementHandlerMap.get(element);
    return handlerMap && handlerMap[property];
  }

  function insertStylesheet(css) {
    stylesheet = document.createElement('style');
    stylesheet.id = stylesheetId;
    stylesheet.textContent = css;
    document.head.appendChild(stylesheet);
  }

  function appendStylesheet(css) {
    if (!stylesheet) {
      insertStylesheet(css);
    }
    else {
      stylesheet.textContent += css;
    }
  }

  function executeCallbacks() {
    initCallbacks.forEach(function (callback) {
      callback();
    });
    initCallbacks = null;
  }

  function init(callback) {
    switch (readyState) {
      case READY_STATE.UNINITIALIZED:
        initCallbacks.push(callback);
        readyState = READY_STATE.INITIALIZING;
        styleListener.init(function () {
          readyState = READY_STATE.COMPLETE;
          executeCallbacks();
        });
        break;

      case READY_STATE.INITIALIZING:
        initCallbacks.push(callback);
        break;

      case READY_STATE.COMPLETE:
        callback();
        break;
    }
  }

  exports.isLocked    = isLocked;
  exports.unlockStyle = unlockStyle;
  exports.lock        = lock;
  exports.init        = init;
});
