define(
  [
    'core/events',
    'page/zoom/state',
    'core/conf/urls'
  ],
  function (
    events,
    state,
    urls
  ) {

  'use strict';

  var dimensionsMap = new WeakMap();

  function isInteger(number) {
    return !isNaN(number) && Math.floor(number) === number;
  }

  function fixFlashElements() {
    var elements = findFlashElements();
    elements.forEach(function (element) {
      var
        zoomReciprocal = 1 / state.completedZoom,
        ancestor       = element.parentElement;

      while(!isTransformable(ancestor)) {
        ancestor = ancestor.parentElement;
      }

      ancestor.style.transform       = 'scale(' + zoomReciprocal + ')';
      ancestor.style.transformOrigin = '0 0';

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

      if (isInteger(width)) {
        element.setAttribute('width', width + widthUnit);
      }
      if (isInteger(height)) {
        element.setAttribute('height', height + heightUnit);
      }
    });
  }

  function findFlashElements() {
    var
      flashSelector     = 'object, embed',
      frameSelector     = 'iframe, frame',
      flashElements     = [],
      documentsToSearch = [window.top.document];

    function searchDocument(document) {
      var nestedFrames = Array.prototype.slice.call(document.querySelectorAll(frameSelector), 0);
      flashElements    = flashElements.concat(Array.prototype.slice.call(document.querySelectorAll(flashSelector)));
      console.log('flash elements:', flashElements);
      nestedFrames.forEach(function (frame) {
        if (!frame.src || urls.isSameDomain(frame.src)) {
          documentsToSearch.push(frame.contentDocument);
        }
      });
    }

    while(documentsToSearch.length) {
      searchDocument(documentsToSearch.shift());
    }

    flashElements = flashElements.filter(function (element) {
      var
        swfSrc  = element.src  && element.src.indexOf('swf')  >= 0,
        swfData = element.data && element.data.indexOf('swf') >= 0;
      return swfSrc || swfData;
    });

    return flashElements;
  }

  function isTransformable(element) {
    return ['object', 'embed', 'param'].indexOf(element.localName) === -1;
  }

  function init() {
    events.on('zoom', fixFlashElements);
  }

  return {
    init: init
  };
});