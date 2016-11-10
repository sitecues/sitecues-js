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
    disableStyleTransition(element, 'transform');
  }
  
  function disableStyleTransition(element, property) {
    if (canPropertyTransition({ element : element, property : property })) {
      var transitionValue   = inlineStyle(element).transition,
          disableTransition = property + ' 0s';
      if (transitionValue) {
        disableTransition += ', ' + transitionValue;
      }
      inlineStyle.override(element, {
        transition : disableTransition
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
    
  function applyInstantStyle(elmnts, property, value) {
    var elements = arrayUtil.wrap(elmnts);
    elements.forEach(function (element) {
      disableStyleTransition(element, property);
    });
    inlineStyle.override(elements, [property, value]);
    // We need to restore the transition styles asynchronously, otherwise they will animate the override
    nativeGlobal.setTimeout(function () {
      elements.forEach(restoreTransition);
    }, 0);
  }

  // This function works for standardized css values returned by the browser, but it won't work for
  // decimals that don't include the leading zero e.g. '.5s' vs '0.5s'
  function parseTimeInMilliseconds(timeString) {
    var
      value = parseFloat(timeString),
      // Can be seconds or milliseconds
      unit  = timeString.substring(String(value).length);
    return value * (unit === 's' ? 1000 : 1);
  }

  function getTransitionInfo(element) {
    var computedStyle        = getComputedStyle(element),
        transitionProperties = computedStyle.transitionProperty.split(',');

    // This value can be an empty string if the element isn't inserted into the DOM
    if (!transitionProperties.length) {
      return [];
    }

    var transitionDurations  = computedStyle.transitionDuration.split(','),
        durationCount        = transitionDurations.length,
        transitionDelays     = computedStyle.transitionDelay.split(',');

    return transitionProperties.map(function (property, index) {
          // If there are more transition properties than transition durations, the duration
          // list is repeated over
      var duration = transitionDurations[index] || transitionDurations[(index + 1) % durationCount],
          // If there are more transition properties than transition delays,
          // the remaining delay values are set to '0s'
          delay    = transitionDelays[index] || '0s';
      return {
        property : property,
        duration : parseTimeInMilliseconds(duration),
        delay    : parseTimeInMilliseconds(delay)
      };
    });
  }

  function canPropertyTransition(opts) {
    var propertyTransition = opts.propertyTransition,
        element            = opts.element,
        height             = element.getBoundingClientRect().height;

    if (!height) {
      // Unrendered elements can't transition
      return false;
    }

    if (!propertyTransition) {
      var property = opts.property,
          transitionInfo = opts.transitionInfo || getTransitionInfo(element);
      propertyTransition = findPropertyTransition(property, transitionInfo);
    }

    return Boolean(propertyTransition && propertyTransition.duration);
  }

  function findPropertyTransition(property, transitionInfo) {
    return arrayUtil.find(transitionInfo, function (propertyInfo) {
      var transProperty = propertyInfo.property;
      return transProperty === property || transProperty === 'all';
    });
  }

  function restoreTransition(element) {
    inlineStyle.restore(element, 'transition');
  }

  return {
    applyInstantTransform      : applyInstantTransform,
    applyInstantStyle          : applyInstantStyle,
    disableTransformTransition : disableTransformTransition,
    disableStyleTransition     : disableStyleTransition,
    restoreTransition          : restoreTransition,
    findPropertyTransition     : findPropertyTransition,
    canPropertyTransition      : canPropertyTransition,
    getTransitionInfo          : getTransitionInfo
  };
});
