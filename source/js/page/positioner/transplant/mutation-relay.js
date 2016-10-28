/*
 * Mutation Relay
 *
 * This module is responsible for copying attribute changes from original elements to clone elements.
 * */
define(
  [
    'page/positioner/transplant/clone',
    'core/inline-style/inline-style'
  ],
  function (
    clone,
    inlineStyle
  ) {
  'use strict';

  var originalBody;

  function copyMutationToClone(mutation) {
    var target     = mutation.target,
        complement = clone.get(target),
        attribute  = mutation.attributeName;

    if (!complement) {
      // If the target hasn't been cloned, we don't need to worry about relaying the mutation
      return;
    }

    switch (attribute) {
      case 'class':
        var targetClass = target.className;
        if (complement.className !== targetClass) {
          complement.className = targetClass;
        }
        break;

      case 'style':
        if (target === originalBody) {
          // We override styles on the clone body that we don't want to lose
          // In the future if we have to we can be smarter about relaying specific styles
          return;
        }
        var complementStyle = inlineStyle(complement),
            targetCss       = inlineStyle(target).cssText;
        if (complementStyle.cssText !== targetCss) {
          complementStyle.cssText = targetCss;
        }
        break;

      case 'id':
        var targetId = target.id;
        if (complement.id !== targetId) {
          complement.id = targetId;
        }
        break;
    }
  }

  function init() {
    originalBody = document.body;
  }

  copyMutationToClone.init = init;
  return copyMutationToClone;
});
