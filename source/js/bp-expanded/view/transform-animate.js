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
        translateX: toTransform.translateX || fromTransform.translateX || 0,
        translateY: toTransform.translateY || fromTransforms.translateY || 0,
        scale: toTransform.scale || fromTransform.scale || 1,
        scaleType: toTransform.scaleType,
        rotate: toTransform.rotate || fromTransform.rotate || 0
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
        origTransforms[index] = transformUtil.getAttrTransformMap(elements[index]);
      }
    }
    return origTransforms;
  }


  function JsAnimation(elements, requestedTransforms, duration, onFinish, timingFunctionName) {
    var animationStartTime = Date.now(),
      origTransforms = getOrigTransforms(elements),
      finalTransforms = getFinalTransforms(requestedTransforms, origTransforms),
      timingFn = timingFunctions[timingFunctionName],
      currAnimation = this;

    this.onFinish           = onFinish;
    this.isRunning          = true;
    this.onTick             = tick;
    this.animationId        = tick(); // Start the animation automatically.

    function tick() {
      var time = duration > 0 ? timingFn(Math.min(1, (Date.now() - animationStartTime) / duration)) : 1,
        index = elements.length,
        fromTransforms,
        toTransforms,
        interimTransforms;
      while (index --) {
        if (elements[index]) {
          fromTransforms = origTransforms[index];
          toTransforms = finalTransforms[index];
          interimTransforms = {
            translateX: fromTransforms.translateX + (toTransforms.translateX - fromTransforms.translateX) * time,
            translateY: fromTransforms.translateY + (toTransforms.translateY - fromTransforms.translateY) * time,
            scale: fromTransforms.scale + (toTransforms.scale - fromTransforms.scale) * time,
            scaleType: toTransforms.scaleType,
            rotate: fromTransforms.rotate + (toTransforms.rotate - fromTransforms.rotate) * time
          };
          transformUtil.setElemTransform(elements[index], interimTransforms);
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

  function CssAnimation(elements, transforms, duration, onCustomFinish, timingFunctionName) {
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
          transformUtil.setElemTransform(elements[index], transforms[index]);
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
  function animateTransforms(elements, transforms, duration, onCustomFinish, timingFunctionName) {

    timingFunctionName = timingFunctionName || 'ease-out';

    var animationType = transformUtil.shouldUseCss(elements[0]) ? CssAnimation : JsAnimation;

    return new animationType(elements, transforms, duration, onCustomFinish, timingFunctionName);  // Cannot use CSS transform for SVG in IE
  }

  return {
    animateTransformLinear: animateTransformLinear,
    animateTransforms: animateTransforms
  };
});
