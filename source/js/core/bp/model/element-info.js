define(
  [
    'core/events',
    'core/util/array-utility'
  ],
  function (
    events,
    arrayUtil
  ) {
  'use strict';

  var didCacheBPElements = false,
      bpElementMap       = new WeakMap();

  function isBPElement(element) {
    if (!didCacheBPElements) {
      var
        badge         = document.getElementById('sitecues-badge'),
        bp            = document.getElementById('scp-bp-container'),
        badgeElems    = badge ? arrayUtil.toArray(badge.querySelectorAll('*')).concat(badge) : [],
        bpElems       = bp    ? arrayUtil.toArray(bp.querySelectorAll('*')).concat(bp) : [];

      badgeElems.concat(bpElems).forEach(function (el) {
        bpElementMap.set(el, true);
      });

      didCacheBPElements = Boolean(badge);
    }
    return Boolean(bpElementMap.get(element)) || element.localName === 'sc';
  }

  function init() {
    events.on('bp/inserted-secondary-markup bp/content-loaded bp/bp-element-inserted', function () {
      didCacheBPElements = false;
    });
  }

  return {
    isBPElement: isBPElement,
    init: init
  };
});