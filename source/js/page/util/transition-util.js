// This module assists with transforming elements with transition styles
define(
  [
    'Promise',
    'core/inline-style/inline-style',
    'core/util/array-utility',
    'nativeFn',
    'core/dom-events'
  ],
  function (
    Promise,
    inlineStyle,
    arrayUtil,
    nativeFn,
    domEvents
  ) {
  'use strict';

  function disableTransformTransition(element) {
    disableStyleTransition(element, 'transform');
  }
  
  function disableStyleTransition(element, property) {
    if (canPropertyTransition({ element : element, property : property })) {
      var transitionValue = inlineStyle(element).transition;
      if (transitionValue) {
        transitionValue += ', ';
      }
      transitionValue += property + ' 0s';
      inlineStyle.override(element, {
        transition : transitionValue
      });
    }
  }

  function applyInstantTransform(elmnts, transform) {
    var elements = arrayUtil.wrap(elmnts);
    elements.forEach(disableTransformTransition);
    inlineStyle.override(elements, ['transform', transform]);
    nativeFn.setTimeout(function () {
      elements.forEach(restoreTransition);
    }, 0);
  }
    
  function applyInstantStyle(elmnts, property, value) {
    var elements = arrayUtil.wrap(elmnts);
    elements.forEach(function (element) {
      disableStyleTransition(element, property);
    });
    inlineStyle.override(elements, [property, value]);
    nativeFn.setTimeout(function () {
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

  // Returns a promise for the computed value of the property once the style has finished
  // transitioning, if it currently is transitioning
  function getFinalStyleValue(element, opts) {
    var transitionTimer,
        property          = opts.property,
        computedStyle     = getComputedStyle(element),
        initialValue      = computedStyle[property],
        initialTransition = computedStyle.transition,
        transitionInfo    = opts.transitionInfo || getTransitionInfo(element);

    var propertyTransition = findPropertyTransition(property, transitionInfo),
        delay    = propertyTransition.delay,
        duration = propertyTransition.duration;

    function setTransitionTimeout(resolve) {
      // setTimeout takes it time parameter in milliseconds
      // A 20% buffer time is added because there is typically a slight
      // discrepancy between the explicit timeout and the practical timeout
      var timeoutLength = Math.ceil((duration + delay) * 1.2);

      return nativeFn.setTimeout(function () {
        // It's important that we update the current style value after the time out
        var resolveValue,
            currentValue      = computedStyle[property],
            currentTransition = computedStyle.transition;

        if (currentValue === initialValue) {
          // If the style value hasn't changed, a transition has not taken place
          resolveValue = currentValue;
        }
        else if (initialTransition !== currentTransition) {
          // The `transitionend` event didn't fire because the transition value changed in the interim, interrupting the transition
          // since we can't guarantee that between that time and now a new target property value hasn't been assigned, add another
          // getFinalStyleValue promise to the chain
          resolveValue = getFinalStyleValue(element, property);
        }
        else {
          var boundingRect = element.getBoundingClientRect();
          if (!boundingRect.height || !boundingRect.width) {
            // If an element has been unrendered, its transitions are interrupted
            resolveValue = currentValue;
          }
          else {
            // If the element is still rendered, its current value is different than its initial value, and it still
            // has the same transition, a new value has been assigned to its target property and we should set a new
            // timeout.
            initialValue    = currentValue;
            transitionTimer = setTransitionTimeout(resolve);
            return;
          }
        }

        resolve(resolveValue);
      }, timeoutLength);
    }

    return new Promise(function (resolve) {
      domEvents.on(element, 'transitionend', function onTransition(evt) {
        if (evt.propertyName === property) {
          clearTimeout(transitionTimer);
          domEvents.off(element, 'transitionend', onTransition);
          resolve(computedStyle[property]);
        }
      });
      transitionTimer = setTransitionTimeout(resolve);
    });
  }

  function getTransitionInfo(element) {
    var computedStyle        = getComputedStyle(element),
        transitionProperties = computedStyle.transitionProperty.split(','),
        transitionDurations  = computedStyle.transitionDuration.split(','),
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
    var element        = opts.element,
        property       = opts.property,
        transitionInfo = opts.transitionInfo || getTransitionInfo(element);

    var propertyInfo = findPropertyTransition(property, transitionInfo);

    return Boolean(propertyInfo && propertyInfo.duration);
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
    getFinalStyleValue         : getFinalStyleValue,
    canPropertyTransition      : canPropertyTransition,
    getTransitionInfo          : getTransitionInfo
  };
});
