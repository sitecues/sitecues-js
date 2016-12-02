/*
 * Resolved-Style
 *
 * This module returns the intended resolved value of an element, ignoring overridden inline style values style lock values
 * */
define(
[
  'exports',
  'Promise',
  'page/util/transition-util',
  'page/positioner/style-lock/style-lock',
  'run/inline-style/inline-style',
  'page/positioner/transplant/anchors',
  'core/native-global',
  'run/dom-events',
  'run/util/array-utility'
],
function (
  exports,
  Promise,
  transitionUtil,
  styleLock,
  inlineStyle,
  anchors,
  nativeGlobal,
  domEvents,
  arrayUtil
) {
  'use strict';

  // This should restore the inline value of the element, remove any relevant lock values, and disable any relevant transitions
  // Note that this will interrupt relevant ongoing transitions, so only call this when we badly need a synchronous value
  function getIntendedValue(opts) {
    if (opts.stable) {
      // We will wait until the resolved value of the element stabilizes before
      // computing the resolved value
      return getStableValue(opts).then(function () {
        return computeIntendedValue(opts);
      });
    }
    else {
      return computeIntendedValue(opts);
    }
  }

  function computeIntendedValue(opts) {
    var resolvedValue,
        element  = opts.element,
        property = opts.property;
    transitionUtil.disableStyleTransition(element, property);
    styleLock.runWhileUnlocked(element, property, function () {
      inlineStyle.restore(element, property);
      resolvedValue = getComputedStyle(element)[property];
      inlineStyle.restoreLast(element, property);
    });
    inlineStyle.restoreLast(element, 'transition');
    return resolvedValue;
  }

  // If we're querying for top, height, etc., depending on the browser, we may want to apply `position: static` (in Chrome/Firefox)
  // to get the specified value of the element rather than the used value
  //function getSpecifiedValue(opts) {
  //
  //}

  // This is a heuristic that looks at the number of digits after the decimal, and if that number is greater than 2
  // we guess that it's likely being animated by a script, e.g. if the opacity value is `0.04345` it's probably
  // being animated via keyframes.
  function isValueAnimating(value) {
    var parsedValue = parseFloat(value);

    if (isNaN(parsedValue)) {
      return false;
    }

    var decimalPlaces = String(parsedValue).split('.')[1];
    return decimalPlaces && decimalPlaces.length > 2;
  }

  // We will wait an arbitrarily short period of time (50ms) if the value is animating and check its value again
  // if the value hasn't changed, we assume that it is stable.
  function waitForKeyframesAnimation(opts) {
    var element  = opts.element,
        property = opts.property,
        value    = opts.value;

    if (isValueAnimating(value)) {
      return new Promise(function (resolve) {
        nativeGlobal.setTimeout(function () {
          var updatedValue = getComputedStyle(element)[property];
          if (updatedValue === value) {
            resolve(value);
          }
          else {
            resolve(waitForKeyframesAnimation({
              element  : element,
              property : property,
              value    : updatedValue
            }));
          }
        }, 50);
      });
    }
    return Promise.resolve(value);
  }

  // Returns a promise for the resolved value of the property once the style has finished
  // transitioning, if it currently is transitioning
  function getStableValue(opts) {
    var transitionTimer,
        element           = opts.element,
        property          = opts.property,
        computedStyle     = getComputedStyle(element),
        initialValue      = computedStyle[property],
        initialTransition = computedStyle.transition,
        waitOpts          = {
          element  : element,
          property : property,
          value    : initialValue
        };

    var transitionInfo     = transitionUtil.getTransitionInfo(element),
        propertyTransition = transitionUtil.findPropertyTransition(property, transitionInfo);

    if (!propertyTransition || !transitionUtil.canPropertyTransition({
        propertyTransition : propertyTransition,
        element            : element
      })) {
      return waitForKeyframesAnimation(waitOpts);
    }

    var delay    = propertyTransition.delay,
        duration = propertyTransition.duration;

    function setTransitionTimeout(resolve) {
      // setTimeout takes it time parameter in milliseconds
      // A 20% buffer time is added because there is typically a slight
      // discrepancy between the explicit timeout and the practical timeout
      var timeoutLength = Math.ceil((duration + delay) * 1.2);

      return nativeGlobal.setTimeout(function () {
        var resolveValue,
            // It's important that we update the current style value after the time out
            currentValue      = computedStyle[property],
            currentTransition = computedStyle.transition;

        if (initialTransition !== currentTransition) {
          // The `transitionend` event didn't fire because the transition value changed in the interim, interrupting the transition
          // since we can't guarantee that between that time and now a new target property value hasn't been assigned, add another
          // getFinalStyleValue promise to the chain
          resolveValue = getStableValue({
            element  : element,
            property : property
          });
        }
        else if (currentValue === initialValue) {
          // If the style value hasn't changed, a transition has not taken place
          resolveValue = currentValue;
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

  function getMatchingElements(opts) {
    var property    = opts.property,
        value       = opts.value,
        allElements = arrayUtil.from(document.body.getElementsByTagName('*')).concat(document.body);

    // Add all transplanted elements outside of the body
    anchors.forEach(function (transplantAnchor) {
      var nestedElements = arrayUtil.from(transplantAnchor.getElementsByTagName('*'));
      allElements = allElements.concat(nestedElements, transplantAnchor);
    });

    return allElements.filter(function (element) {
      var intendedValue = getIntendedValue({
        element  : element,
        property : property
      });
      return intendedValue === value;
    });
  }

  exports.getIntendedValue    = getIntendedValue;
  //exports.getSpecifiedValue   = getSpecifiedValue;
  exports.getMatchingElements = getMatchingElements;
});
