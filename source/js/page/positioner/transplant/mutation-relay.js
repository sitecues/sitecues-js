/*
 * Mutation Relay
 *
 * This module is responsible for copying attribute changes from original elements to clone elements.
 * NOTE: This module currently only copies class mutations, other mutations can be monitored for and copied over as necessary
 * */
define(
  [
    'page/positioner/util/element-info',
    'page/positioner/transplant/clone'
  ],
  function (
    elementInfo,
    clone
  ) {

  var domObserver,
      originalBody;

  function copyClassToComplement(mutation) {
    var target     = mutation.target,
        complement = clone.get(target);

    if (complement) {
      complement.className = target.className;
    }
  }

  function init() {
    originalBody = document.body;

    domObserver = new MutationObserver(function (mutations) {
      var len = mutations.length;

      for (var i = 0; i < len; i++) {
        var
          mutation   = mutations[i],
          target     = mutation.target;

        // Don't bother looking for a complement to Sitecues elements, they have been removed
        if (elementInfo.isSitecuesElement(target)) {
          continue;
        }

        copyClassToComplement(mutation);
      }
    });

    domObserver.observe(originalBody, {
      attributes: true,
      attributeOldValue: true,
      subtree: true,
      // For now we only need to copy classes over, it's the simplest case. Copying inline styles over is more complicated
      // and will need to be more thoroughly thought through
      attributeFilter: ['class']
    });
  }

  return {
    init: init
  };
});