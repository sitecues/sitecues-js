define(
  [
    'core/events',
    'page/zoom/constants',
    'page/zoom/state',
    'core/inline-style/inline-style',
    'core/util/array-utility'
  ],
  function (
    events,
    constants,
    state,
    inlineStyle,
    arrayUtil
  ) {
  'use strict';

  var comboBoxListener, zoomStyleSheet,
      SITECUES_ZOOM_FORMS_ID = constants.SITECUES_ZOOM_FORMS_ID,
      selector = 'select[size="1"],select:not([size])';

  function listenForNewComboBoxes(records) {
    records.forEach(function (record) {
      var addedNodes = arrayUtil.from(record.addedNodes);
      addedNodes.some(function (node) {
        if (node.localName === 'select' || node.querySelectorAll(selector).length) {
          fixAllSelectElements();
          return true;
        }
      });
    });
  }

  function fixSelectElement(element, zoom) {
    inlineStyle.restore(element, ['font-size', 'width', 'height', 'transform']);

    if (zoom === 1) {
      // We don't need to fix combo boxes if we aren't zooming
      return;
    }

    var
      newFormScale = Math.pow(zoom, 1.3),
      style        = getComputedStyle(element),
      height       = parseFloat(style.height),
      width        = parseFloat(style.width),
      newWidth     = width  * newFormScale,
      newHeight    = height * newFormScale;

    inlineStyle.override(element, {
      fontSize  : zoom + 'em',
      height    : newHeight + 'px',
      width     : newWidth + 'px',
      transform : 'scale(' + (1 / zoom) + ')'
    });
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
    var css = selector + ' {\n' +
      'transform-origin: 0 0 !important; \n}\n';
    zoomStyleSheet.id        = SITECUES_ZOOM_FORMS_ID;
    zoomStyleSheet.innerText = css;
    document.head.appendChild(zoomStyleSheet);
    fixAllSelectElements();
    events.on('zoom', fixAllSelectElements);
  }

  return {
    init : init
  };
});