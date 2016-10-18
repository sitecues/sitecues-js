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
    var style  = getComputedStyle(element),
        transitionProperty = style.transitionProperty,
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
  
    if (transitionProperty.indexOf('all') >= 0 || transitionProperty.indexOf(property) >= 0) {
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
  function getFinalStyleValue(element, property) {
    var transitionTimer,
        computedStyle        = getComputedStyle(element),
        initialValue         = computedStyle[property],
        initialTransition    = computedStyle.transition,
        transitionProperties = computedStyle.transitionProperty.split(','),
        transitionDurations  = computedStyle.transitionDuration.split(','),
        transitionDelays     = computedStyle.transitionDelay.split(',');

    var transIndex = arrayUtil.findIndex(transitionProperties, function (transProperty) {
      return transProperty === 'all' || transProperty === property;
    });

    if (transIndex === -1) {
      // The style isn't transitioning, we're good to return immediately
      return Promise.resolve(initialValue);
    }

    var
      durCount = transitionDurations.length,
      // If there are more transition properties than transition durations, the duration
      // list is repeated over
      duration = transitionDurations[transIndex] || transitionDurations[(transIndex + 1) % durCount],
      // If there are more transition properties than transition delays,
      // the remaining delay values are set to '0s'
      delay     = transitionDelays[transIndex] || '0s';

    duration = parseTimeInMilliseconds(duration);

    if (!duration) {
      // this transition has no duration, any assignments took effect immediately
      return Promise.resolve(initialValue);
    }

    delay = parseTimeInMilliseconds(delay);

    return new Promise(function (resolve) {
      domEvents.on(element, 'transitionend', function onTransition(evt) {
        if (evt.propertyName === property) {
          clearTimeout(transitionTimer);
          domEvents.off(element, 'transitionend', onTransition);
          resolve(computedStyle[property]);
        }
      });

      function setTransitionTimeout() {
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
              transitionTimer = setTransitionTimeout();
              return;
            }
          }

          resolve(resolveValue);
        }, timeoutLength);
      }

      transitionTimer = setTransitionTimeout();
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
    getFinalStyleValue         : getFinalStyleValue
  };
});
