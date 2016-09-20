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
    records.some(function (record) {
      var addedNodes = arrayUtil.from(record.addedNodes);
      return addedNodes.some(function (node) {
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
      computedStyle = getComputedStyle(element),
      height        = parseFloat(computedStyle.height),
      width         = parseFloat(computedStyle.width);
    
    if (platform.browser.isFirefox) {
      // As we zoom, the width of the element needs to grow both to contain the font size and to compensate for the inverse transform
      widthScale  = Math.pow(zoom, 1.1);
      // setting the em font size to the scale factor seems to work well
      fontSize    = zoom;
      // Select elements in Firefox misposition their drop down menus if their ancestors are scaled, so we apply the inverse transform
      // and bump up the width as needed. The height of the element grows to contain the font size automatically
      styles.transform = 'scale(' + (1 / zoom) + ')';
      // This transform origin was taken from previous code, it keeps elements in their intended location
      styles.transformOrigin = '0 62%';
    }
    else {
      // These are scales so that boxes expand to fit the larger font size
      widthScale  = 1.5;
      heightScale = 1.3;
      // Arbitrary scale so that font size of the drop down items grow with the zoom
      fontSize    = 1 + (zoom - 1) * 0.4;
      styles.height = height * heightScale;
    }

    styles.fontSize = fontSize + 'em';
    styles.width    = (width * widthScale) + 'px';

    if (computedStyle[appearance] === 'menulist') {
      // Menulist styles prevent certain css styles from taking effect, in this case width and height
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