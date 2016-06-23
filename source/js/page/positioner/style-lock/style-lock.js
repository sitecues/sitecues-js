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
    'page/positioner/style-lock/style-listener/style-listener',
    'page/positioner/constants',
    'core/constants',
    'page/positioner/util/element-info'
  ],
  function (
    styleListener,
    constants,
    coreConstants,
    elementInfo
  ) {
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
  function lock() {
    var
      args = Array.prototype.slice.call(arguments, 0),
      arg3 = args[2];
    // Three arguments means an element is meant to be locked
    if (typeof arg3 === 'object') {
      lockElementProperty.apply(null, args);
    }
    else {
      lockResolvedDeclaration.apply(null, args);
    }
  }

  // The handlers are run before and after the property's resolved value mutates
  function lockElementProperty(element, property, handlers) {
    styleListener.init(function () {

      function onPropertyMutation(opts) {
        var
          value            = opts.toValue,
          results          = [],
          elementHandlers  = elementHandlerMap.get(this),
          propertyHandlers = elementHandlers[opts.property],
          beforeHandlers   = propertyHandlers.before,
          afterHandlers    = propertyHandlers.after;

        for (var i = 0, beforeCount = beforeHandlers.length; i < beforeCount; i++) {
          results.push(beforeHandlers[i].call(this, opts));
        }

        lockStyle(this, property, value);

        for (var j = 0, afterCount = afterHandlers.length; j < afterCount; j++) {
          afterHandlers[j].call(this, results[j]);
        }
      }

      var
        before           = handlers.before || noop,
        after            = handlers.after  || noop,
        currentValue     = getComputedStyle(element)[property],
        declaration      = { property: property, value: currentValue },
        elementHandlers  = elementHandlerMap.get(element) || {},
        propertyHandlers = elementHandlers[property];

      if (propertyHandlers) {
        propertyHandlers.before.push(before);
        propertyHandlers.after.push(after);
      }
      else {
        elementHandlers[property] = {
          after  : [after],
          before : [before]
        };
      }
      elementHandlerMap.set(element, elementHandlers);
      lockStyle(element, property, currentValue);
      styleListener.registerPropertyMutationHandler(element, declaration, onPropertyMutation);
    });
  }

  // Before and after handlers will run respectively before and after a non-sitecues element's resolved value mutates
  // to and from the declaration
  // The initial handler will run when we identify elements with a resolved value matching the declaration
  function lockResolvedDeclaration(declaration, handlers) {
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
      }

      function toHandler(args) {
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

      // Handle elements that initially match the declaration
      if (initial !== noop) {
        // We run this asynchronously because it is an expensive operation
        // and we want to allow the browser to run other events before we begin it
        setTimeout(function () {
          var elements = styleListener.getElementsWithResolvedValue(declaration);

          function runHandler(element) {
            toHandler.call(element, { toValue: value, property: property });
          }

          for (var i = 0, elementCount = elements.length; i < elementCount; i++) {
            if (isValidLockTarget(this)) {
              // Likewise each initial handler call is potentially expensive if we have to transplant the target
              setTimeout(runHandler, 0, elements[i]);
            }
          }
        }, 0);
      }
    });
  }

  function getDeclarationKey(declaration) {
    return declaration.property + '_' + declaration.value;
  }

  function lockStyle(element, property, value) {
    var
      lockAttribute  = LOCK_ATTR + property,
      attributeLocks = lockSelectorMap[lockAttribute] || {},
      valueLock      = attributeLocks[value];
    if (!valueLock) {
      valueLock = '[' + lockAttribute + '="' + value + '"]';
      appendStylesheet(valueLock + ' { ' + property + ': ' + value + ' !important; }\n');
      attributeLocks[value] = valueLock;
      lockSelectorMap[lockAttribute] = attributeLocks;
    }
    element.setAttribute(lockAttribute, value);
  }
  
  function unlockStyle(element, property) {
    var lockAttribute = LOCK_ATTR + property;

    if (element) {
      element.setAttribute(lockAttribute, '');
      return;
    }

    var
      propertyLockSelector = '[' + lockAttribute + ']',
      elements             = document.querySelectorAll(propertyLockSelector);

    for (var i = 0, elementCount = elements.length; i < elementCount; i++) {
      elements[i].setAttribute(lockAttribute, '');
    }
  }

  function insertStylesheet(css) {
    stylesheet = document.createElement('style');
    stylesheet.id = stylesheetId;
    stylesheet.innerHTML = css;
    document.head.appendChild(stylesheet);
  }

  function appendStylesheet(css) {
    if (!stylesheet) {
      insertStylesheet(css);
    }
    else {
      stylesheet.innerHTML += css;
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

  lock.init        = init;
  lock.unlockStyle = unlockStyle;

  return lock;
});