define(
  [
    'core/inline-style/inline-style'
  ],
  function (
    inlineStyle
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

  return {
    disableTransformTransition : disableTransformTransition
  };
});