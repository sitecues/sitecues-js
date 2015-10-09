/**
 *
 * This file exposes an API for creating javascript animations.
 */

define(['util/transform', 'core/platform'], function (transform, platform) {

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
      animationFunctions = {
        linear: function (t) { return t; },
        easeOutCubic: function (t) { return (--t) * t * t + 1; }
        //sinusoidal: function(t) { return -0.5 * (Math.cos(Math.PI * t ) - 1); }
      },

      defaultAnimation = 'easeOutCubic';

  function setTransform (element, useAttribute, left, top, transformScale, rotate) {

    var scaleCss       = transformScale && transformScale !== 1 ? ' scale(' + transformScale + ') ' : '',
        // Need to set translate if we also set scale or the element sometimes disappears in Firefox
        // See https://bugzilla.mozilla.org/show_bug.cgi?id=969270
        translateCss   = 'translate(' + left + ',' + top + ') ',
        rotateCss      = rotate         ? ' rotate(' + rotate + ')'     : '',
        attrVal        = (translateCss + scaleCss + rotateCss);

    if (useAttribute) {
      element.setAttribute('transform', attrVal);
    }
    else {
      element.style[platform.transformProperty] = attrVal;
    }

  }

  function normalizeTransformProps (animation) {

    var element          = animation.element,
        fromTransform    = animation.useAttribute ? element.getAttribute('transform') : element.style[platform.transformProperty],
        toTransform      = animation.CSSProperties.transform,
        fromTransformObj = transform.getTransform(fromTransform),
        toTransformObj   = transform.getTransform(toTransform),
        styles = animation.animateStyles,
        from = styles.from,
        to = styles.to;

    from.scale = fromTransformObj.scale;
    from.translate = fromTransformObj.translate;
    from.rotate = fromTransformObj.rotate;

    to.scale = toTransformObj.scale;
    to.translate = toTransformObj.translate;
    to.rotate = toTransformObj.rotate;
  }

  function Animate (element, CSSProperties, options) {

    this.element            = element;
    this.CSSProperties      = CSSProperties;
    this.options            = options;
    this.onFinish           = options.onFinish;
    this.animateStyles      = {
      'from': {},
      'to' : {}
    };

    this.useAttribute       = options.useAttribute;

    this.animationStartTime = Date.now();
    this.animationFn        = options.animationFn ? animationFunctions[options.animationFn] : animationFunctions[defaultAnimation];
    this.duration           = options.duration || options || 1;

    for (var prop in CSSProperties) {
      if (CSSProperties.hasOwnProperty(prop)) {
        if (prop === 'transform') {
          normalizeTransformProps(this);
        } else {
          this.animateStyles.from[prop] = element.style[prop];
          this.animateStyles.to[prop]  = CSSProperties[prop];
        }
      }
    }

    this.isRunning = true;
    this.animationId = this.tick(); // Start the animation automatically.

  }

  Animate.prototype.tick = function () {

    var timeSinceFirstAnimationTick = Date.now() - this.animationStartTime,
        normalizedAnimationTime     = Math.min(1, this.animationFn(timeSinceFirstAnimationTick / this.duration)),
        that                        = this,
        fromStyles               = this.animateStyles.from,
        toStyles                = this.animateStyles.to;
    if (this.CSSProperties.transform) {
      setTransform(
        this.element,
        this.useAttribute,
        fromStyles.translate.left + (toStyles.translate.left - fromStyles.translate.left) * normalizedAnimationTime,
        fromStyles.translate.top + (toStyles.translate.top - fromStyles.translate.top) * normalizedAnimationTime,
        fromStyles.scale + (toStyles.scale - fromStyles.scale) * normalizedAnimationTime,
        fromStyles.rotate + (toStyles.rotate - fromStyles.rotate) * normalizedAnimationTime
      );
    }

    if (normalizedAnimationTime < 1) {
      this.animationId = requestFrameFn(function () {
        that.tick();
      });
    } else if (this.onFinish) {
      this.onFinish(this.to);
    }

  };

  function finishNow(animation) {
    if (animation.isRunning) {
      if (animation.onTick) {
        animation.onTick(1);
      }
      if (animation.onFinish) {
        animation.onFinish(1);
      }
      cancelFrameFn(animation.animationId);
      animation.isRunning = false;
    }
  }
  
  Animate.prototype.finishNow = function () {
    finishNow(this);
  };

  function ArbitraryAnimate (options) {
    this.onTick             = options.onTick;
    this.onFinish           = options.onFinish;
    this.animationFn        = options.animationFn ? animationFunctions[options.animationFn] : animationFunctions[defaultAnimation];
    this.duration           = options.duration || 1;
    this.animationStartTime = Date.now();
    this.isRunning          = true;
    this.animationId        = this.tick(); // Start the animation automatically.
  }

  ArbitraryAnimate.prototype.tick = function () {

    var timeSinceFirstAnimationTick = Date.now() - this.animationStartTime,
        normalizedAnimationTime     = Math.min(1, this.animationFn(timeSinceFirstAnimationTick / this.duration)),
        that                        = this;

    if (this.onTick) {
      this.onTick(normalizedAnimationTime);
    }
    if (normalizedAnimationTime < 1) {
      this.animationId = requestFrameFn(function () {
        that.tick();
      });
    } else {
      if (this.onFinish) {
        this.onFinish(normalizedAnimationTime);
      }
      this.isRunning = false;
    }
  };

  ArbitraryAnimate.prototype.finishNow= function () {
    finishNow(this);
  };

  function animateCssProperties(element, CSSProperties, options) {
    return new Animate(element, CSSProperties, options);
  }

  function animateViaCallbacks(options) {
    return new ArbitraryAnimate(options);
  }

  // Optimized transform animation that works via @transform on IE, CSS transition on other browsers
  // Currently only works with CSS transform, on element at a time
  function animateTransform(element, options) {
    if (platform.browser.isIE) {
      return animateViaCallbacks(options); // Cannot use CSS for SVG in IE
    }
    // Will use CSS instead
    function stopAnimation(t) {
      element.removeEventListener(platform.transitionEndEvent, options.onFinish);
      element.style.transition = '';
      options.onTick(t);
    }

    function finishNow() {
      stopAnimation(1);
    }

    function beginTransition() {
      element.addEventListener(platform.transitionEndEvent, options.onFinish);
      element.style.transition = platform.transformPropertyCss + ' ' + options.duration + 'ms';
      setTimeout(function() { options.onTick(1); }, 0);
    }

    stopAnimation(0);  // Reset to start
    element.removeAttribute('transform'); // Don't use transform attribute
    setTimeout(beginTransition, 0);

    return {
      finishNow: finishNow
    };
  }

  function getDuration(duration, from, to, currentVal) {
    return Math.abs(((to - currentVal) / (to - from))) * duration;
  }

  return {
    animateCssProperties: animateCssProperties,
    animateViaCallbacks: animateViaCallbacks,
    animateTransform: animateTransform,
    getDuration: getDuration
  };
});
