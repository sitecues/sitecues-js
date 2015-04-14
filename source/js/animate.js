/**
 *
 * This file exposes an API for creating javascript animations.
 */

sitecues.def('animate', function (animate, callback) {

  'use strict';

  sitecues.use('util/transform', function (transform) {

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

    function setTransformAttr (element, left, top, transformScale, rotate) {

      var scaleCSS       = transformScale ? ' scale(' + transformScale + ') ' : '',
          rotateCSS      = rotate         ? ' rotate(' + rotate + 'deg) '     : '',
          attrVal        = 'translate(' + left + ' , ' + top + ') ' + scaleCSS + rotateCSS;

      element.setAttribute('transform', attrVal);

    }

    function normalizeTransformProps (animation, transformProperty) {

      var element             = animation.element,
          fromTransform    = animation.useAttribute ? element.getAttribute('transform') : element.style[transformProperty],
          toTransform     = animation.CSSProperties[transformProperty],
          fromScale        = transform.getScale(fromTransform),
          toScale         = transform.getScale(toTransform),
          fromTranslate    = transform.getTranslate(fromTransform),
          toTranslate     = transform.getTranslate(toTransform);

      animation.animateStyles.from.scale = fromScale;
      animation.animateStyles.to.scale  = toScale;

      animation.animateStyles.from.translate = fromTranslate;
      animation.animateStyles.to.translate  = toTranslate;

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
      this.duration           = options.duration || options;

      for (var prop in CSSProperties) {
        if (CSSProperties.hasOwnProperty(prop)) {
          if (prop.indexOf('transform') !== -1) {
            normalizeTransformProps(this, prop);
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

      if (this.useAttribute && this.CSSProperties.transform) {
        setTransformAttr(
          this.element,
          fromStyles.translate.left + (toStyles.translate.left - fromStyles.translate.left) * normalizedAnimationTime,
          fromStyles.translate.top + (toStyles.translate.top - fromStyles.translate.top) * normalizedAnimationTime,
          fromStyles.scale + (toStyles.scale - fromStyles.scale) * normalizedAnimationTime
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

    function ArbitraryAnimate (properties, options) {
      this.from               = properties.from;
      this.to                 = properties.to;
      this.onTick             = options.onTick;
      this.onFinish           = options.onFinish;
      this.animationFn        = options.animationFn ? animationFunctions[options.animationFn] : animationFunctions[defaultAnimation];
      this.duration           = options.duration;
      this.animationStartTime = Date.now();
      this.animationId        = this.tick(); // Start the animation automatically.
    }

    ArbitraryAnimate.prototype.tick = function () {

      var timeSinceFirstAnimationTick = Date.now() - this.animationStartTime,
          normalizedAnimationTime     = Math.min(1, this.animationFn(timeSinceFirstAnimationTick / this.duration)),
          that                        = this;

      if (normalizedAnimationTime < 1) {
        if (this.onTick) {
          this.onTick({
            'current': normalizedAnimationTime,
            'start'  : this.from,
            'end'    : this.to
          });
        }
        this.animationId = requestFrameFn(function () {
          that.tick();
        });
      } else {

        if (this.onTick) {
          this.onTick({
            'current': normalizedAnimationTime,
            'start'  : this.from,
            'end'    : this.to
          });
        }

        if (this.onFinish) {
          this.onFinish({
            'current': normalizedAnimationTime,
            'start'  : this.from,
            'end'    : this.end
          });
        }

      }
    };

    ArbitraryAnimate.prototype.cancel = function () {
      cancelFrameFn(this.animationId);
    };

    animate.create = function (element, CSSProperties, options) {
      if (element.hasOwnProperty('from') && element.hasOwnProperty('to')) {
        return new ArbitraryAnimate(element, CSSProperties);
      }
      return new Animate(element, CSSProperties, options);
    };

    callback();

  });


});