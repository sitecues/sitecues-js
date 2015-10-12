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
      },
      SHOULD_USE_CSS_TRANSITION_IN_SVG = false; //!platform.browser.isIE;

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


  function JsAnimation(elements, finalTransforms, duration, onFinish, timingFunctionName) {
    var animationStartTime = Date.now(),
      origTransforms = getOrigTransforms(elements),
      timingFn = timingFunctions[timingFunctionName],
      currAnimation = this;

    this.onFinish           = onFinish;
    this.isRunning          = true;
    this.onTick             = tick;
    this.animationId        = tick(); // Start the animation automatically.

    function tick() {
      var time = timingFn(Math.min(1, (Date.now() - animationStartTime) / duration)),
        index = elements.length,
        fromTransforms,
        toTransforms;
      while (index --) {
        if (elements[index]) {
          fromTransforms = origTransforms[index];
          toTransforms = finalTransforms[index];
          transformUtil.setElemTransform(elements[index], {
            translateX: fromTransforms.translateX + (toTransforms.translateX - fromTransforms.translateX) * time,
            translateY: fromTransforms.translateY + (toTransforms.translateY - fromTransforms.translateY) * time,
            scale: fromTransforms.scale + (toTransforms.scale - fromTransforms.scale) * time,
            scaleType: toTransforms.scaleType,
            rotate: fromTransforms.rotate + (toTransforms.rotate - fromTransforms.rotate) * time
          });
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

  function animateTransformLinear(element, value, duration) {
    return animateTransforms([element], [value], duration, null, 'linear');
  }

  // Optimized transform animation that works via @transform on IE, CSS transition on other browsers
  // Currently only works with CSS transform, on element at a time
  function animateTransforms(elements, transforms, duration, onCustomFinish, timingFunctionName) {

    timingFunctionName = timingFunctionName || 'ease-out';

    if (!SHOULD_USE_CSS_TRANSITION_IN_SVG) {
      return new JsAnimation(elements, transforms, duration, onCustomFinish, timingFunctionName);  // Cannot use CSS transform for SVG in IE
    }
    // Will use CSS instead
    function stopAnimation() {
      initTransitionStyles('');
    }

    function initTransitionStyles(transition) {
      elements.forEach(function(elem) {
        if (elem) {
          elem.style.transition = transition;
          elem.style.willChange = platform.transformPropertyCss;
          elem.style.transitionTimingFunction = timingFunctionName;
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
      removeTransitionEndListener();
      if (onCustomFinish) {
        onCustomFinish();
      }
      evt.stopPropagation(); // Don't bubble to a parent animation (e.g the secondary panel may still need to animate while a hover finishes animating)
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

  return {
    animateTransformLinear: animateTransformLinear,
    animateTransforms: animateTransforms
  };
});
