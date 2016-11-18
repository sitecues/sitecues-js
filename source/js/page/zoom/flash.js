define(
  [
    'run/events',
    'page/zoom/state',
    'run/conf/urls',
    'run/util/array-utility',
    'run/inline-style/inline-style'
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
    var flashElements = [];
    mutations.forEach(function (mutation) {
      arrayUtil.from(mutation.addedNodes).forEach(function (node) {
        if (isFlashElement(node)) {
          flashElements.push(node);
        }
        else if (isFrameElement(node)) {
          flashElements = flashElements.concat(findFlashElements(node));
        }
      });
    });
    fixFlashElements(flashElements);
  }

  function observeDocument(document) {
    if (observedDocuments.get(document)) {
      return;
    }

    observedDocuments.set(document, true);

    var opts = {
      subtree   : true,
      childList : true
    };

    flashObserver.observe(document, opts);
  }

  function fixFlashElements(elems) {
    var elements = elems || findFlashElements();

    function setDimension(element, dimension, value, unit) {
      if (isInteger(value)) {
        element.setAttribute(dimension, value + unit);
      }
    }

    elements.forEach(function (element) {
      // We have no recourse if the immediate parent of the flash element is the body
      if (element.parentElement === document.body) {
        return;
      }

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
        width          = element.getAttribute('width') || element.style.width || '',
        height         = element.getAttribute('height') || element.style.height || '';

      var
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

  function getFrameDocument(frame) {
    return !frame.src || urls.isSameOrigin(frame.src) ? frame.contentDocument : null;
  }

  function getWindowDocument(currentWindow) {
    try {
      // wrapped in a try block to avoid cross-origin Errors halting the script
      var currentDoc = currentWindow.document;
      return currentDoc;
    }
    catch (e) {
      return null;
    }
  }

  function getHighestPermittedDocument() {
    var parentDocument,
        highestWindow = window,
        parentWindow  = window.parent,
        highestDoc    = window.document;

    while (window !== window.parent) {
      parentWindow   = highestWindow.parent;
      parentDocument = getWindowDocument(parentWindow);

      if (!parentDocument) {
        break;
      }

      highestWindow = parentWindow;
      highestDoc    = parentDocument;
    }

    return highestDoc;
  }

  function findFlashElements(frame) {
    var documentsToSearch,
      embedSelector     = 'object, embed',
      frameSelector     = 'iframe, frame',
      embedElements     = [];

    if (frame) {
      var frameDoc      = getFrameDocument(frame);
      documentsToSearch = frameDoc ? [frameDoc] : [];
    }
    else {
      documentsToSearch = [getHighestPermittedDocument()];
    }

    function searchDocument(doc) {
      var nestedFrames = arrayUtil.from(doc.querySelectorAll(frameSelector));
      embedElements    = embedElements.concat(arrayUtil.from(doc.querySelectorAll(embedSelector)));

      observeDocument(doc);

      nestedFrames.forEach(function (frame) {
        var frameDoc = getFrameDocument(frame);
        if (frameDoc) {
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
    
  function isFrameElement(element) {
    return element.localName === 'iframe' || element.localName === 'frame';
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
