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
          // no easing, no acceleration
          linear: function (t) { return t; },
          // accelerating from zero velocity
          easeInQuad: function (t) { return t*t; },
          // decelerating to zero velocity
          easeOutQuad: function (t) { return t*(2-t); },
          // acceleration until halfway, then deceleration
          easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t; },
          // accelerating from zero velocity
          easeInCubic: function (t) { return t*t*t; },
          // decelerating to zero velocity
          easeOutCubic: function (t) { return (--t)*t*t+1; },
          // acceleration until halfway, then deceleration
          easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },
          // accelerating from zero velocity
          easeInQuart: function (t) { return t*t*t*t; },
          // decelerating to zero velocity
          easeOutQuart: function (t) { return 1-(--t)*t*t*t; },
          // acceleration until halfway, then deceleration
          easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },
          // accelerating from zero velocity
          easeInQuint: function (t) { return t*t*t*t*t; },
          // decelerating to zero velocity
          easeOutQuint: function (t) { return 1+(--t)*t*t*t*t; },
          // acceleration until halfway, then deceleration
          easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; }
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
          currentTransform    = animation.useAttribute ? element.getAttribute('transform') : element.style[transformProperty],
          targetTransform     = animation.CSSProperties[transformProperty],
          currentScale        = transform.getScale(currentTransform),
          targetScale         = transform.getScale(targetTransform),
          currentTranslate    = transform.getTranslate(currentTransform),
          targetTranslate     = transform.getTranslate(targetTransform);

      animation.animateStyles.current.scale = currentScale;
      animation.animateStyles.target.scale  = targetScale;

      animation.animateStyles.current.translate = currentTranslate;
      animation.animateStyles.target.translate  = targetTranslate;

    }

    function Animate (element, CSSProperties, options) {

      this.element            = element;
      this.CSSProperties      = CSSProperties;
      this.options            = options;

      this.animateStyles      = {
        'current': {},
        'target' : {}
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
            this.animateStyles.current[prop] = element.style[prop];
            this.animateStyles.target[prop]  = CSSProperties[prop];
          }
        }
      }

      this.animationId = this.tick(); // Start the animation automatically.

    }

    Animate.prototype.tick = function () {

      var timeSinceFirstAnimationTick = Date.now() - this.animationStartTime,
          normalizedAnimationTime     = Math.min(1, this.animationFn(timeSinceFirstAnimationTick / this.duration)),
          that                        = this,
          currentStyles               = this.animateStyles.current,
          targetStyles                = this.animateStyles.target;

      if (this.useAttribute && this.CSSProperties.transform) {
        setTransformAttr(
          this.element,
          currentStyles.translate.left + (targetStyles.translate.left - currentStyles.translate.left) * normalizedAnimationTime,
          currentStyles.translate.top + (targetStyles.translate.top - currentStyles.translate.top) * normalizedAnimationTime,
          currentStyles.scale + (targetStyles.scale - currentStyles.scale) * normalizedAnimationTime
        );
      }

      if (normalizedAnimationTime < 1) {
        this.animationId = requestFrameFn(function () {
          that.tick();
        });
      }

    };

    Animate.prototype.cancel = function () {
      cancelFrameFn(this.animationId);
    };

    animate.create = function (element, CSSProperties, options) {
      return new Animate(element, CSSProperties, options);
    };

    callback();

  });


});
