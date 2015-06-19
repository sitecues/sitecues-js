/**
 *
 * This file exposes an API for creating javascript animations.
 */

sitecues.def('animate', function (animate, callback) {

  'use strict';

  sitecues.use('util/transform', 'platform', function (transform, platform) {

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
          easeOutCubic: function (t) { return (--t)*t*t+1; }
        },

        defaultAnimation = 'easeOutCubic';

    function setTransform (element, useAttribute, left, top, transformScale, rotate) {

      var translateCss   = (left || top) ? 'translate(' + left + ',' + top + ') ' : '',
          scaleCSS       = transformScale ? ' scale(' + transformScale + ') ' : '',
          rotateCSS      = rotate         ? ' rotate(' + rotate + ')'     : '',
          attrVal        = translateCss + scaleCSS + rotateCSS;

      if (useAttribute) {
        element.setAttribute('transform', attrVal);
      }
      else {
        element.style[platform.transformProperty] = attrVal;
      }

    }

    function normalizeTransformProps (animation, transformProperty) {

      var element          = animation.element,
          fromTransform    = animation.useAttribute ? element.getAttribute('transform') : element.style[platform.transformProperty],
          toTransform      = animation.CSSProperties.transform,
          fromTransformObj = transform.getTransform(fromTransform),
          toTransformObj   = transform.getTransform(toTransform),
          styles = animation.animateStyles,
          from = styles.from,
          to = styles.to;

      from.scale =fromTransformObj.scale;
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

    Animate.prototype.cancel = function () {
      cancelFrameFn(this.animationId);
    };

    function ArbitraryAnimate (options) {
      this.onTick             = options.onTick;
      this.onFinish           = options.onFinish;
      this.animationFn        = options.animationFn ? animationFunctions[options.animationFn] : animationFunctions[defaultAnimation];
      this.duration           = options.duration || 1;
      this.animationStartTime = Date.now();
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
      }
    };

    ArbitraryAnimate.prototype.cancel = function () {
      cancelFrameFn(this.animationId);
    };

    animate.animateCssProperties = function (element, CSSProperties, options) {
      return new Animate(element, CSSProperties, options);
    };

    animate.animateViaCallbacks = function(options) {
      return new ArbitraryAnimate(options);
    };

    animate.getDuration = function (duration, from, to, currentVal) {
      return Math.abs(((to - currentVal) / (to - from))) * duration;
    };

    callback();

  });


});