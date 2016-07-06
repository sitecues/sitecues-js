  /**
   * This module adjusts positioned elements to correctly render
   * for the current zoom and scroll position in the window.
   *
   */
  define(
  [
    'core/platform',
    'page/positioner/transplant/transplant',
    'page/positioner/transform/transform',
    'page/positioner/transform/targets',
    'page/zoom/state',
    'page/positioner/style-lock/style-lock',
    'page/positioner/util/element-info',
    'page/positioner/constants',
    'page/zoom/util/body-geometry',
    'core/events'
  ],
  function (
    platform,
    transplant,
    transform,
    transformTargets,
    state,
    styleLock,
    elementInfo,
    constants,
    bodyGeo,
    events
  ) {

  'use strict';

  var originalBody, docElem, unprocessedTransplantCandidates,
    // Should we transplant elements from the original body to the auxiliary body
    isTransplanting            = false,
    isTransplantInitialized    = false,
    // Should we replant elements from the auxiliary body to the original body
    isReplanting               = false,
    // Do we ever use the transplant operation (not IE browser flag)
    doUseTransplantOperation   = false,
    isInitialized              = false,
    // If there's a toolbar we need to translate fixed elements down
    areFixedHandlersRegistered = false,
    isFirstZoom                = true,
    TRANSPLANT_STATE           = constants.TRANSPLANT_STATE;

  function onZoom(completedZoom) {
    isTransplanting = Boolean(completedZoom > 1 && doUseTransplantOperation);
    if (isTransplanting) {
      initializeTransplant();
      processTransplantCandidates();
    }

    // If we we're listening for fixed positioning, initialize the listener
    if (isFirstZoom) {
      onFirstZoom();
    }

    unlockPositionIfNotZoomed();
  }

  function onFirstZoom() {
    if (!areFixedHandlersRegistered) {
      styleLock.init(function () {
        initFixedPositionListener();
      });
    }

    // This flag means that we should run the transplant operation even if we're aren't zoomed in cases
    // where we have to replant an element back to the original body
    isReplanting = doUseTransplantOperation;
    isFirstZoom  = false;
  }

  function initializeTransplant() {
    if (!isTransplantInitialized) {
      transplant.init();
      isTransplantInitialized = true;
    }
  }

  function processTransplantCandidates() {
    unprocessedTransplantCandidates.forEach(function (candidate) {
      // TODO: order these initial position handlers by distance from body, closest distance runs first
      setTimeout(function (candidate) {
        var position = getComputedStyle(candidate).position;
        if (position === 'fixed') {
          toPositionHandler.call(candidate, { toValue : position });
        }
      }, 0, candidate);
    });
    unprocessedTransplantCandidates.clear();
  }

  function initFixedPositionListener() {
    styleLock({
        property : 'position',
        value    : 'fixed'
      }, {
        initial  : toPositionHandler,
        before   : fromPositionBeforeHandler,
        after    : fromPositionAfterHandler
    });
    areFixedHandlersRegistered = true;
  }

  function unlockPositionIfNotZoomed(element) {
    // If we haven't zoomed we haven't applied a horizontal translation to the fixed element, so it isn't worth the delay
    // to unlock the element (there is a slight blink on chicagolighthouse's fixed navbar without this)
    if (state.completedZoom === 1) {
      // If @element is undefined, unlocks all elements with a locked position
      styleLock.unlockStyle(element, 'position');
    }
  }

  // This handler runs when we find an element with a resolved fixed or absolute position
  function toPositionHandler(args) {
    /*jshint validthis: true */
    var
      position    = args.toValue,
      oldPosition = args.fromValue,
      wasFixed    = oldPosition === 'fixed';

    // These cases are handled by fromPosition hooks
    if (wasFixed) {
      return;
    }

    var
      isFixed          = position === 'fixed',
      isInOriginalBody = elementInfo.isInOriginalBody(this),
      flags            = {
        isFixed: isFixed,
        isInOriginalBody: isInOriginalBody
      };

    if (isReplanting) {
      var results = transplant.evaluateCandidate(this, flags);
      if (results) {
        var
          transplantState = results.transplantState,
          needsTransplant =
            transplantState === TRANSPLANT_STATE.UNCLONED ||
            transplantState === TRANSPLANT_STATE.CLONED ||
            transplantState === TRANSPLANT_STATE.MIXED;

        if (!needsTransplant || (needsTransplant && isTransplanting)) {
          transplant.prepareCandidate(this, results);
          transplant.performOperation(this, results);
          transformElement(this, flags);
          transplant.postOperation(this, results);
        }
        else {
          unprocessedTransplantCandidates.add(this);
        }
      }
    }
    else if (doUseTransplantOperation) {
      // Evaluate the element's transplant status once we have to transplant fixed elements (after a zoom is applied to the body)
      unprocessedTransplantCandidates.add(this);
    }

    // Even if we don't transplant the fixed element, potentially we still need to shift the element below the toolbar
    if (isFixed && !isTransplanting) {
      transformTargets.add(this);
    }
    unlockPositionIfNotZoomed(this);
    /*jshint validthis: false */
  }

  // This handler runs when the document is mutated such that an element no longer resolves to the specified style value
  // Since we've applied a 'locking' style, that resolved style hasn't taken effect yet when this handler runs
  function fromPositionBeforeHandler(args) {
    /*jshint validthis: true */
    var
      oldPosition        = args.fromValue,
      position           = args.toValue,
      // A transplant root is an element with a position value that requires that it be transplanted into the auxiliary body.
      // Typically this value is 'fixed', but occasionally we also need to transplant absolute elements
      isTransplantRoot   = elementInfo.isTransplantRoot(this),
      // A transplant anchor is a root element with no ancestor roots. All of the elements in its subtree are original,
      // regardless of their current position value. If a subroot becomes statically positioned, it will not be replanted
      // into the original body. If a transplant anchor becomes statically positioned, it will be replanted into the original body
      // and each of its subroots will be transplanted back into the auxiliary body
      isTransplantAnchor = elementInfo.isTransplantAnchor(this),
      isInOriginalBody   = elementInfo.isInOriginalBody(this),
      isFixed            = position === 'fixed',
      wasFixed           = oldPosition === 'fixed',
      flags              = {
        isTransplantAnchor: isTransplantAnchor,
        isTransplantRoot: isTransplantRoot,
        isInOriginalBody: isInOriginalBody,
        isFixed: isFixed,
        wasFixed: wasFixed
      };

    if (isReplanting) {
      var results = transplant.evaluateCandidate(this, flags);
      if (results) {
        var
          transplantState = results.transplantState,
          needsTransplant =
            transplantState === TRANSPLANT_STATE.UNCLONED ||
            transplantState === TRANSPLANT_STATE.CLONED ||
            transplantState === TRANSPLANT_STATE.MIXED;

        if (!needsTransplant || (needsTransplant && isTransplanting)) {
          transplant.prepareCandidate(this, results);
          return results;
        }
        else {
          unprocessedTransplantCandidates.add(this);
        }
      }
    }
    else if (doUseTransplantOperation) {
      // Evaluate the element's transplant status once we have to transplant fixed elements (after a zoom is applied to the body)
      unprocessedTransplantCandidates.add(this);
    }

    return {
      flags: flags
    };
    /*jshint validthis: false */
  }

  // This handler runs after we've unlocked the style value on the element, so that its new resolved value takes effect
  // e.g., if we we're applying 'position: absolute !important', that style has now been removed and the element's true position is in effect
  function fromPositionAfterHandler(opts) {
    /*jshint validthis: true */
    var
      flags                = opts.flags,
      didPrepareTransplant = opts.didPrepareTransplant;

    if (didPrepareTransplant) {
      transplant.performOperation(this, opts);
      transformElement(this, flags);
      transplant.postOperation(this, opts);
    }
    else {
      transformElement(this, flags);
    }

    unlockPositionIfNotZoomed(this);
    /*jshint validthis: false */
  }

  // Applies or removes transformation from element, based on position and transplant status
  function transformElement(element, flags) {
    var
      isTransplantAnchor = flags.isTransplantAnchor,
      isFixed            = flags.isFixed;

    if (isTransplantAnchor || isFixed) {
      transformTargets.add(element);
    }
    else {
      transformTargets.remove(element);
    }
  }

  function initFromToolbar(callback, toolbarHeight) {
    if (isInitialized) {
      callback();
      return;
    }

    init(function() {
      transform.init(toolbarHeight);
      styleLock.init(function() {
        // The toolbar may overlap with fixed elements so we'll need to transform them immediately
        // Fixed position elements are located and their position locked, so that we can run handlers before
        // and after the element's position changes.
        initFixedPositionListener();
        callback();
      });
    });
  }

  function initFromZoom() {
    if (isInitialized) {
      return;
    }

    init(function () {
      transform.init();
      // We only need to use the transplant algorithm once we've applied a transformation on the body, i.e. when we've zoomed
      setTimeout(onZoom, 0, state.completedZoom);
    });
  }

  function init(callback) {
    isInitialized = true;

    function onBodyGeoInitialized() {
      elementInfo.init();

      if (doUseTransplantOperation) {
        unprocessedTransplantCandidates = new Set();
      }

      events.on('zoom', onZoom);
      callback();
    }

    // Internet Explorer doesn't require us to use the transplant algorithm because transformed elements do not create new
    // containing blocks for fixed descendants, and fixed descendants do not inherit transformations
    doUseTransplantOperation = !platform.browser.isIE;
    docElem                  = document.documentElement;
    originalBody             = document.body;

    return bodyGeo.init(onBodyGeoInitialized);
  }

  return {
    initFromZoom: initFromZoom,
    initFromToolbar: initFromToolbar
  };
});