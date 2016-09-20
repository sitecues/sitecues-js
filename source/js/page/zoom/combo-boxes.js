define(
  [
    'core/events',
    'page/zoom/state',
    'core/inline-style/inline-style',
    'core/util/array-utility',
    'core/platform'
  ],
  function (
    events,
    state,
    inlineStyle,
    arrayUtil,
    platform
  ) {
  'use strict';

  var comboBoxListener, zoomStyleSheet,
      selector = 'select[size="1"],select:not([size])';

  function listenForNewComboBoxes(records) {
    records.forEach(function (record) {
      var addedNodes = arrayUtil.from(record.addedNodes);
      addedNodes.some(function (node) {
        if (node.localName === 'select' ||
          (typeof node.querySelectorAll === 'function' && node.querySelectorAll(selector).length)) {
            fixAllSelectElements();
            return true;
        }
      });
    });
  }

  function fixSelectElement(element, zoom) {
    var appearance = '-webkit-appearance';

    inlineStyle.override(element, ['transition', 'all 0s']);
    inlineStyle.restore(element, ['font-size', 'width', 'height', 'transform', 'transform-origin', appearance]);

    if (zoom === 1) {
      inlineStyle.restore(element, 'transition');
      // We don't need to fix combo boxes if we aren't zooming
      return;
    }

    var heightScale, widthScale, fontSize,
      styles        = {},
      computedStyle = getComputedStyle(element);
    
    if (platform.browser.isFirefox) {
      var scale = Math.pow(zoom, 1.3);
      widthScale  = scale;
      heightScale = scale;
      fontSize = zoom;
      styles.transform = 'scale(' + (1 / zoom) + ')';
      styles.transformOrigin = '0 62%';
    }
    else {
      widthScale  = 1.5;
      heightScale = 1.3;
      fontSize    = 1 + (zoom - 1) * 0.4;
    }

    var
      height       = parseFloat(computedStyle.height),
      width        = parseFloat(computedStyle.width),
      newWidth     = width  * widthScale,
      newHeight    = height * heightScale;

    styles.fontSize = fontSize + 'em';
    styles.height   = newHeight + 'px';
    styles.width    = newWidth + 'px';

    if (computedStyle[appearance] === 'menulist') {
      styles[appearance] = 'menulist-button';
    }

    inlineStyle.override(element, styles);
    inlineStyle.restore(element, 'transition');
  }

  function fixAllSelectElements() {
    var elements = arrayUtil.from(document.body.querySelectorAll(selector));
    elements.forEach(function (element) {
      fixSelectElement(element, state.completedZoom);
    });
  }

  function init() {
    comboBoxListener = new MutationObserver(listenForNewComboBoxes);
    comboBoxListener.observe(document.body, { childList : true, subtree : true });
    zoomStyleSheet = document.createElement('style');
    fixAllSelectElements();
    events.on('zoom', fixAllSelectElements);
  }

  return {
    init : init
  };
});