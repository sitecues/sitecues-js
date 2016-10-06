define(
  [
    'core/events',
    'page/zoom/state',
    'core/inline-style/inline-style',
    'core/util/array-utility',
    'core/platform',
    'mini-core/native-global'
  ],
  function (
    events,
    state,
    inlineStyle,
    arrayUtil,
    platform,
    nativeGlobal
  ) {
  'use strict';

  var comboBoxListener, zoomStyleSheet,
      selector = 'select[size="1"],select:not([size])';

  function listenForNewComboBoxes(records) {
    records.some(function (record) {
      var addedNodes = arrayUtil.from(record.addedNodes);
      return addedNodes.some(function (node) {
        if (node.localName === 'select' ||
          (typeof node.getElementsByTagName === 'function' && node.getElementsByTagName('select')[0])) {
            fixAllSelectElements();
            return true;
        }
      });
    });
  }

  function fixSelectElement(element, zoom) {
    var appearance;

    if (platform.browser.isWebKit) {
      appearance = '-webkit-appearance';
    }
    else {
      appearance = '';
    }

    inlineStyle.override(element, ['transition', 'all 0s']);
    inlineStyle.restore(element, ['font-size', 'width', 'height', 'transform', 'transform-origin', appearance]);

    if (zoom === 1) {
      inlineStyle.restore(element, 'transition');
      // We don't need to fix combo boxes if we aren't zooming
      return;
    }

    var fontSize,
      styles        = {},
      computedStyle = getComputedStyle(element);

    if (platform.browser.isFirefox) {
      // setting the em font size to the scale factor seems to work well
      fontSize   = 1 + (zoom - 1) * 0.8;
      // Select elements in Firefox misposition their drop down menus if their ancestors are scaled, so we apply the inverse transform
      // and bump up the width as needed. The height of the element grows to contain the font size automatically
      styles.transform = 'scale(' + (1 / zoom) + ')';
      var parent = element.parentElement;
      if (parent && getComputedStyle(parent).display === 'inline') {
        // If the containing element is inline, we should try to keep it grouped with the rest of the line (important for Fairfield Bank)
        styles.transformOrigin = '100% 75%';
      }
      else {
        styles.transformOrigin = '0 75%';
      }
    }
    else {
      // Arbitrary scale so that font size of the drop down items grow with the zoom
      fontSize = 1 + (zoom - 1) * 0.3;
    }

    // Allow the element to auto-adjust to size of the font
    styles.height   = 'initial';
    styles.width    = 'initial';
    styles.fontSize = fontSize + 'em';

    if (computedStyle[appearance] === 'menulist') {
      // Menulist styles prevent certain css styles from taking effect, in this case width and height
      styles[appearance] = 'menulist-button';
    }

    inlineStyle.override(element, styles);
    nativeGlobal.setTimeout(function () {
      // If we reapply the transition style in the same synchronous block, it animates our changes
      inlineStyle.restore(element, 'transition');
    }, 0);
  }

  function fixAllSelectElements() {
    var elements = arrayUtil.from(document.body.querySelectorAll(selector));
    elements.forEach(function (element) {
      fixSelectElement(element, state.completedZoom);
    });
  }

  function init() {

    if (platform.browser.isIE) {
      // We don't need to fix combo boxes in IE
      return;
    }

    comboBoxListener = new MutationObserver(listenForNewComboBoxes);
    comboBoxListener.observe(document.body, { childList : true, subtree : true });
    zoomStyleSheet = document.createElement('style');
    fixAllSelectElements();
    events.on('zoom', function () {
      nativeGlobal.setTimeout(function () {
        fixAllSelectElements();
      }, 0);
    });
  }

  return {
    init : init
  };
});