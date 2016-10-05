define(
  [
    'page/positioner/util/element-map',
    'page/zoom/state',
    'core/platform',
    'core/events',
    'core/util/array-utility',
    'hlb/hlb'
  ],
  function (
    elementMap,
    state,
    platform,
    events,
    arrayUtil,
    hlb
  ) {
  'use strict';

  var originalBody, docElem, didCacheBPElements, bpElementMap, isInitialized;

  function getScale(element, position) {
    // If we've never scaled this element before, it's possible that this element is inheriting a transformation from the original body
    // It's important that we know the resolved transformation so that we can calculate the element's untransformed dimensions.
    // This method is less expensive than computing the resolved transformation, and the math is simpler
    var
      fixed          = position === 'fixed',
      // In IE, fixed elements do not inherit transformations
      inheritedScale = !(fixed && platform.browser.isIE) && isInOriginalBody(element);
    return elementMap.getField(element, 'scale') || (inheritedScale ? state.completedZoom : 1);
  }

  function setScale(element, value) {
    elementMap.setField(element, 'scale', value);
  }

  function getPosition(element) {
    return getCacheValue(element, 'position');
  }

  function setPosition(element, value) {
    setCacheValue(element, 'position', value);
  }

  function getCacheValue(element, property) {
    return elementMap.getField(element, 'cache_' + property);
  }

  function setCacheValue(element, property, value) {
    elementMap.setField(element, 'cache_' + property, value);
  }

  function addSubroots(element, newSubroots) {
    elementMap.setField(element, 'subroots', getSubroots(element).concat(newSubroots));
  }

  function clearSubroots(element) {
    elementMap.setField(element, 'subroots', []);
  }

  function removeSubroots(element, oldSubroots) {
    if (!Array.isArray(oldSubroots)) {
      oldSubroots = [oldSubroots];
    }
    var subroots = getSubroots(element);
    oldSubroots.forEach(function (subroot) {
      var index = subroots.indexOf(subroot);
      if (index !== -1) {
        subroots.splice(index, 1);
      }
    });
    elementMap.setField(element, 'subroots', subroots);
  }

  function setSubroots(element, subroots) {
    elementMap.setField(element, 'subroots', subroots);
  }

  function getSubroots(element) {
    return elementMap.getField(element, 'subroots') || [];
  }

  function getRoot(element) {
    return elementMap.getField(element, 'root');
  }

  function setRoot(element, root) {
    elementMap.setField(element, 'root', root);
  }

  function getPlaceholderOwner(element) {
    return elementMap.getField(element, 'placeholderFor');
  }

  function getPlaceholder(element) {
    return elementMap.getField(element, 'placeholder');
  }

  function setPlaceholder(element, placeholder) {
    elementMap.setField(element, 'placeholder', placeholder);
  }

  function setHostBody(element, body) {
    elementMap.setField(element, 'body', body);
  }

  // This returns the body the element is current parented within, either the auxiliary or original body
  function getHostBody(element) {
    // Root elements have a cached reference to their host body in the element map
    var body = elementMap.getField(element, 'body');
    if (!body) {
      var ancestor = element;

      if (!ancestor.parentElement) {
        return null;
      }

      do {
        ancestor = ancestor.parentElement;
      } while (ancestor.localName.toLowerCase() !== 'body' && ancestor !== docElem);
      body = ancestor === docElem ? null : ancestor;
    }
    return body;
  }

  function isPlaceholder(element) {
    return element.className === 'placeholder';
  }

  function isClone(element, value) {
    return getOrSet(element, 'isClone', value);
  }

  function isOriginal(element) {
    return !isClone(element) && !isPlaceholder(element);
  }

  function isBPElement(element) {
    if (!didCacheBPElements) {
      var
        badge         = document.getElementById('sitecues-badge'),
        bp            = document.getElementById('scp-bp-container'),
        badgeElems    = badge ? arrayUtil.from(badge.querySelectorAll('*')).concat(badge) : [],
        bpElems       = bp    ? arrayUtil.from(bp.querySelectorAll('*')).concat(bp)       : [];

      badgeElems.concat(bpElems).forEach(function (el) {
        bpElementMap.set(el, true);
      });

      // If the badge hasn't been inserted yet, don't bother saving the cached list (it's empty)
      didCacheBPElements = Boolean(badge);
    }
    return Boolean(bpElementMap.get(element));
  }

  function isHLBElement(element) {
    var hlbElement = hlb.getElement();
    if (hlbElement) {
      var ancestor = element.parentElement;
      while (ancestor) {
        if (ancestor === hlbElement) {
          return true;
        }
        ancestor = ancestor.parentElement;
      }
    }
    return false;
  }

  function isSitecuesElement(element) {
    return isBPElement(element) || isHLBElement(element);
  }

  function isTransplantRoot(element, value) {
    if (value === true) {
      hasBeenTransplanted(element, true);
    }
    return getOrSet(element, 'isRoot', value);
  }

  function isTransplantAnchor(element) {
    return isTransplantRoot(element) && !getRoot(element);
  }

  function hasBeenTransplanted(element, value) {
    return getOrSet(element, 'hasBeenTransplanted', value);
  }

  function isInOriginalBody(element) {
    return getHostBody(element) === originalBody;
  }

  function getOrSet(element, field, value) {
    if (typeof value !== 'undefined') {
      elementMap.setField(element, field, value);
      return;
    }
    return elementMap.getField(element, field);
  }

  function init() {
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    originalBody = document.body;
    docElem      = document.documentElement;
    bpElementMap = new WeakMap();

    events.on('bp/did-insert-secondary-markup bp/content-loaded bp/did-insert-bp-element', function () {
      didCacheBPElements = false;
    });
  }

  return {
    getScale            : getScale,
    setScale            : setScale,
    getCacheValue       : getCacheValue,
    setCacheValue       : setCacheValue,
    getPosition         : getPosition,
    setPosition         : setPosition,
    getHostBody         : getHostBody,
    setHostBody         : setHostBody,
    getPlaceholder      : getPlaceholder,
    setPlaceholder      : setPlaceholder,
    getPlaceholderOwner : getPlaceholderOwner,
    getRoot             : getRoot,
    setRoot             : setRoot,
    clearSubroots       : clearSubroots,
    getSubroots         : getSubroots,
    setSubroots         : setSubroots,
    addSubroots         : addSubroots,
    removeSubroots      : removeSubroots,
    isClone             : isClone,
    isOriginal          : isOriginal,
    isSitecuesElement   : isSitecuesElement,
    isPlaceholder       : isPlaceholder,
    hasBeenTransplanted : hasBeenTransplanted,
    isTransplantRoot    : isTransplantRoot,
    isTransplantAnchor  : isTransplantAnchor,
    isInOriginalBody    : isInOriginalBody,
    init                : init
  };
});