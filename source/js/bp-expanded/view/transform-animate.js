/**
 *
 * This file exposes an API for creating javascript animations.
 */

define(['bp-expanded/view/transform-util', 'core/platform'], function (transformUtil, platform) {

  var requestFrameFn = window.requestAnimationFrame   ||
                       window.msRequestAnimationFrame ||
                       function (fn) {
                         return setTimeout(fn, 16);
                       },
      cancelFrameFn  = window.cancelAnimationFrame   ||
                       window.msCancelAnimationFrame ||
                       function (fn) {
                         clearTimeout(fn);
                       },

      // https://gist.github.com/gre/1650294
      timingFunctions = {
        'ease-out': function (t) {
          return (--t) * t * t + 1;
        },
        'linear': function (t) {
          return t;
        }
      };

  function getFinalTransforms(toTransforms, fromTransforms) {
    var finalTransforms = [],
      index = toTransforms.length,
      fromTransform,
      toTransform;

    while (index --) {
      fromTransform = fromTransforms[index] || {};
      toTransform = toTransforms[index] || {};
      finalTransforms[index] = {
        translateX: (typeof toTransform.translateX === 'number') ? toTransform.translateX : fromTransform.translateX || 0,
        translateY: (typeof toTransform.translateY === 'number') ? toTransform.translateY : fromTransforms.translateY || 0,
        scale: (typeof toTransform.scale === 'number') ? toTransform.scale : fromTransform.scale || 1,
        scaleType: toTransform.scaleType,
        rotate: (typeof toTransform.rotate === 'number') ? toTransform.rotate : fromTransform.rotate || 0
      };
    }
    return finalTransforms;
  }

  function getOrigTransforms(elements) {
    var index = elements.length,
      origTransforms = [];
    // Get the original transforms for each element
    while (index --) {
      if (elements[index]) {
        origTransforms[index] = transformUtil.getElemTransformMap(elements[index]);
      }
    }
    return origTransforms;
  }


  function JsAnimation(elements, fromTransforms, toTransforms, duration, onFinish, timingFunctionName) {
    var animationStartTime = Date.now(),
      timingFn = timingFunctions[timingFunctionName],
      currAnimation = this;

    this.onFinish           = onFinish;
    this.isRunning          = true;
    this.onTick             = tick;
    this.animationId        = tick(); // Start the animation automatically.

    function tick() {
      var time = duration > 0 ? timingFn(Math.min(1, (Date.now() - animationStartTime) / duration)) : 1,
        index = elements.length,
        from,
        to,
        interim;
      while (index --) {
        if (elements[index]) {
          from = fromTransforms[index];
          to = toTransforms[index];
          interim = {
            translateX: from.translateX + (to.translateX - from.translateX) * time,
            translateY: from.translateY + (to.translateY - from.translateY) * time,
            scale: from.scale + (to.scale - from.scale) * time,
            scaleType: to.scaleType,
            rotate: from.rotate + (to.rotate - from.rotate) * time
          };
          transformUtil.setElemTransform(elements[index], interim);
        }
      }

      if (time < 1) {
        currAnimation.animationId = requestFrameFn(tick);
      }
      else {
        currAnimation.isRunning = false;
        if (onFinish) {
          onFinish();
        }
      }
    }
  }

  JsAnimation.prototype.finishNow = function () {
    if (this.isRunning) {
      if (this.onTick) {
        this.onTick(1);
      }
      if (this.onFinish) {
        this.onFinish();
      }
      cancelFrameFn(this.animationId);
      this.isRunning = false;
    }
  };

  function CssAnimation(elements, fromTransforms, toTransforms, duration, onCustomFinish, timingFunctionName) {
    function stopAnimation() {
      initTransitionStyles('');
    }

    function initTransitionStyles(transition) {
      elements.forEach(function(elem) {
        if (elem) {
          elem.style.transition = transition;
          if (transition) {
            elem.style.transitionTimingFunction = timingFunctionName;
          }
        }
      });
    }

    function initTransforms() {
      var index = elements.length;
      while (index --) {
        if (elements[index]) {
          transformUtil.setElemTransform(elements[index], toTransforms[index]);
        }
      }
    }

    function addTransitionEndListener() {
      elements[0].addEventListener(platform.transitionEndEvent, onFinish);
    }

    function removeTransitionEndListener() {
      elements[0].removeEventListener(platform.transitionEndEvent, onFinish);
    }

    function onFinish(evt) {
      // Don't bubble to a parent animation (e.g the secondary panel may still need to animate while a hover finishes animating)
      if (evt.target === evt.currentTarget) {
        evt.stopPropagation();
        finishNow();
      }
    }

    function finishNow() {
      removeTransitionEndListener();
      stopAnimation();
      if (onCustomFinish) {
        onCustomFinish();
      }
    }

    function beginTransition() {
      addTransitionEndListener();
      initTransitionStyles(platform.transformPropertyCss + ' ' + duration + 'ms');
      initTransforms();
    }


    beginTransition();

    return {
      finishNow: finishNow
    };
  }

  function animateTransformLinear(element, value, duration) {
    return animateTransforms([element], [value], duration, null, 'linear');
  }

  // Optimized transform animation that works via @transform on IE, CSS transition on other browsers
  // Currently only works with CSS transform, on element at a time
  function animateTransforms(elements, requestedTransforms, duration, onCustomFinish, timingFunctionName) {

    timingFunctionName = timingFunctionName || 'ease-out';

    var animationType = transformUtil.shouldUseCss(elements[0]) ? CssAnimation : JsAnimation,
      fromTransforms = getOrigTransforms(elements),
      toTransforms = getFinalTransforms(requestedTransforms, fromTransforms);

    return new animationType(elements, fromTransforms, toTransforms, duration, onCustomFinish, timingFunctionName);  // Cannot use CSS transform for SVG in IE
  }

  return {
    animateTransformLinear: animateTransformLinear,
    animateTransforms: animateTransforms
  };
});
