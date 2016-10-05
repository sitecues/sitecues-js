define(
  [
    'core/events',
    'page/zoom/state',
    'core/conf/urls',
    'core/util/array-utility',
    'core/inline-style/inline-style'
  ],
  function (
    events,
    state,
    urls,
    arrayUtil,
    inlineStyle
  ) {

  'use strict';

  var flashObserver,
    dimensionsMap     = new WeakMap(),
    observedDocuments = new WeakMap();

  function isInteger(number) {
    return !isNaN(number) && Math.floor(number) === number;
  }

  function onDocumentMutation(mutations) {
    mutations.forEach(function (mutation) {
      arrayUtil.from(mutation.addedNodes).forEach(function (node) {
        if (isFlashElement(node)) {
          fixFlashElements(node);
        }
      });
    });
  }

  function observeDocument(document) {
    if (observedDocuments.get(document)) {
      return;
    }

    var opts = {
      subtree   : true,
      childList : true
    };

    flashObserver.observe(document, opts);
  }

  function fixFlashElements(documentOrElement) {
    var elements;

    if (documentOrElement) {
      elements = documentOrElement.nodeType === Node.ELEMENT_NODE ? [documentOrElement] : findFlashElements(documentOrElement);
    }
    else {
      elements = findFlashElements();
    }

    function setDimension(element, dimension, value, unit) {
      if (isInteger(value)) {
        element.setAttribute(dimension, value + unit);
      }
    }

    elements.forEach(function (element) {
      var
        zoomReciprocal = 1 / state.completedZoom,
        ancestor       = element.parentElement;

      while(!isTransformable(ancestor)) {
        ancestor = ancestor.parentElement;
      }
      var styles = {};
      styles.transform       = 'scale(' + zoomReciprocal + ')';
      styles.transformOrigin = '0 0';
      inlineStyle.override(ancestor, styles);

      var
        originalDimensions = dimensionsMap.get(element) || {},
        originalWidth  = originalDimensions.width,
        originalHeight = originalDimensions.height,
        width          = element.getAttribute('width'),
        height         = element.getAttribute('height'),
        widthMatch     = width.match(/[^0-9\.]+/),
        heightMatch    = height.match(/[^0-9\.]+/),
        widthUnit      = widthMatch  ? widthMatch[0]  : '',
        heightUnit     = heightMatch ? heightMatch[0] : '';

      if (typeof originalWidth === 'undefined') {
        width  = parseInt(width);
        height = parseInt(height);
        // Rounding `null` coerces to zero, so we use a string here
        originalDimensions.width  = isNaN(width)  ? 'null' : width;
        originalDimensions.height = isNaN(height) ? 'null' : height;
        dimensionsMap.set(element, originalDimensions);
      }
      else {
        width  = originalWidth;
        height = originalHeight;
      }

      width  = Math.round(width * state.completedZoom);
      height = Math.round(height * state.completedZoom);

      setDimension(element, 'width', width, widthUnit);
      setDimension(element, 'height', height, heightUnit);
    });
  }

  function findFlashElements(document) {
    var
      embedSelector     = 'object, embed',
      frameSelector     = 'iframe, frame',
      embedElements     = [],
      documentsToSearch = [document || getHighestPermittedDocument()];

    function getHighestPermittedDocument() {
      var docRef,
        refSucceeded  = false,
        highestWindow = window,
        document      = window.document;
      while (highestWindow !== highestWindow.parent) {

        try {
          // wrapped in a try block to avoid cross-origin Errors halting the script
          docRef       = highestWindow.parent.document;
          refSucceeded = true;
        }
        catch (e) {}

        if (refSucceeded) {
          highestWindow = highestWindow.parent;
          document      = docRef;
          refSucceeded  = false;
        }
        else {
          break;
        }

      }
      return document;
    }

    function searchDocument(document) {
      var nestedFrames = Array.prototype.slice.call(document.querySelectorAll(frameSelector), 0);
      embedElements    = embedElements.concat(Array.prototype.slice.call(document.querySelectorAll(embedSelector)));

      observeDocument(document);

      nestedFrames.forEach(function (frame) {
        if (!frame.src || urls.isSameOrigin(frame.src)) {
          documentsToSearch.push(frame.contentDocument);
        }
      });
    }

    while(documentsToSearch.length) {
      searchDocument(documentsToSearch.shift());
    }

    return embedElements.filter(isFlashElement);
  }

  function isFlashElement(element) {
    if (element.type === 'application/x-shockwave-flash') {
      return true;
    }

    var
      swfSrc  = element.src  && element.src.indexOf('swf')  >= 0,
      swfData = element.data && element.data.indexOf('swf') >= 0;
    return swfSrc || swfData;
  }

  function isTransformable(element) {
    return ['object', 'embed', 'param'].indexOf(element.localName) === -1;
  }

  function init() {
    flashObserver = new MutationObserver(onDocumentMutation);
    events.on('zoom', function () {
      fixFlashElements();
    });
  }

  return {
    init: init
  };
});
