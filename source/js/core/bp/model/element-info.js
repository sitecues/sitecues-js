// Utility module for miscellaneous information about elements. Separated from the element-info module in the page bundle so that we're not
// including more code in the core than is absolute necessary.
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

  // This function caches a map of all elements nested within the sitecues badge and bp container.
  // This cache is invalidated when new elements are inserted into either element
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

      // If the badge hasn't been inserted yet, don't bother saving the cached list (it's empty)
      didCacheBPElements = Boolean(badge);
    }
    return Boolean(bpElementMap.get(element)) || element.localName === 'sc';
  }

  function init() {
    events.on('bp/did-insert-secondary-markup bp/content-loaded bp/did-inserted-bp-element', function () {
      didCacheBPElements = false;
    });
  }

  return {
    isBPElement: isBPElement,
    init: init
  };
});