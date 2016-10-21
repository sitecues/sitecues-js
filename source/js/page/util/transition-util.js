// This module assists with transforming elements with transition styles
define(
  [
    'run/inline-style/inline-style',
    'run/util/array-utility',
    'mini-core/native-global'
  ],
  function (
    inlineStyle,
    arrayUtil,
    nativeGlobal
  ) {
  'use strict';

  function disableTransformTransition(element) {
    var style  = getComputedStyle(element),
        property = style.transitionProperty,
        delay    = style.transitionDelay.split(',').some(function (dly) {
          return parseFloat(dly);
        }),
        duration;

    if (!delay) {
      duration = style.transitionDuration.split(',').some(function (drtn) {
        return parseFloat(drtn);
      });
    }

    if (!delay && !duration) {
      return;
    }

    if (property.indexOf('all') >= 0 || property.indexOf('transform') >= 0) {
      var transitionValue = inlineStyle(element).transition;
      if (transitionValue) {
        transitionValue += ', ';
      }
      transitionValue += 'transform 0s';
      inlineStyle.override(element, {
        transition : transitionValue
      });
    }
  }

  function applyInstantTransform(elmnts, transform) {
    var elements = arrayUtil.wrap(elmnts);
    elements.forEach(disableTransformTransition);
    inlineStyle.override(elements, ['transform', transform]);
    nativeGlobal.setTimeout(function () {
      elements.forEach(restoreTransition);
    }, 0);
  }

  function restoreTransition(element) {
    inlineStyle.restore(element, 'transition');
  }

  return {
    applyInstantTransform      : applyInstantTransform,
    disableTransformTransition : disableTransformTransition,
    restoreTransition          : restoreTransition
  };
});
