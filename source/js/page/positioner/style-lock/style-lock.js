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
    declarationHandlerMap = {},
    initCallbacks         = [],
    lockSelectorMap       = {},
    stylesheetId          = 'sitecues-js-locked-styles',
    LOCK_ATTR             = constants.LOCK_ATTR,
    READY_STATE           = coreConstants.READY_STATE,
    readyState            = READY_STATE.UNINITIALIZED;

  // Before and after handlers will run respectively before and after we remove the data-attribute stabilizing the style value
  // The initial handler will run when we identify elements with a resolved value matching the declaration
  function attachHandlers(declaration, handlers) {
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

          // If we unlocked the style prematurely because we unzoomed,
          // we no longer have the previous style value to reference
          if (!handlers) {
            return;
          }

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

      if (declarationHandlerMap[key]) {
        // We're already listening for when elements lose or gain this resolved style value, add additional handlers
        var declarationHandlers = declarationHandlerMap[key];
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
      lockAttribute = LOCK_ATTR + property,
      lockSelector  = lockSelectorMap[lockAttribute];
    if (!lockSelector) {
      lockSelector = '[' + lockAttribute + '="' + value + '"]';
      appendStylesheet(lockSelector + ' { ' + property + ': ' + value + ' !important; }\n');
      lockSelectorMap[lockAttribute] = lockSelector;
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

  attachHandlers.init = init;
  attachHandlers.unlockStyle = unlockStyle;
  return attachHandlers;
});