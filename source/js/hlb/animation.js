/*
  This module animates the HLB.  Depending on the browser, the mechanism
  of animation is either CSS3 Transitions or jQuery.animate.
 */
sitecues.def('hlb/animation', function (hlbAnimation, callback) {

  'use strict';

  sitecues.use('hlb/dimmer', 'util/transform', 'jquery', 'hlb/positioning', 'platform',

  function (dimmer, transform, $, hlbPositioning, platform) {

    var INFLATION_SPEED = 400, // Default inflation duration
        INFLATION_SPEED_FAST = 0, // Inflation duration when retargeting
        DEFLATION_SPEED = 150, // Default deflation duration

        $animation;            // A reference to the $.animate we use for IE9 inflation and deflation

    function shouldFixFirefoxAnimationBug($hlb) {
      // The Firefox animation bug occurs on retina displays, with Firefox version < 33
      // and a scale animation >= 1024 pixels wide. Basically, the animation goes haywire
      // and jumps to 1/4 the size and back in an unexpected way.
      return platform.browser.isFirefox && platform.browser.version < 33 &&
        devicePixelRatio > 1.5 && $hlb[0].clientWidth * hlbPositioning.getFinalScale($hlb) >= 1024;
    }

    /**
     * [transitionInHLB animates the inflation of the HLB and background dimmer]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    hlbAnimation.transitionInHLB = function (doShowQuickly, data) {

      // Dim the background!
      dimmer.dimBackgroundContent(INFLATION_SPEED, data.$hlb.parent());
      var $hlb = data.$hlb,
        speed = doShowQuickly ? INFLATION_SPEED_FAST : INFLATION_SPEED;

      if (shouldFixFirefoxAnimationBug($hlb)) {

        // Render instantly, don't animate (which would activate the Firefox animation bug)
        $hlb.css({
          'transform'       : 'scale(' + hlbPositioning.getFinalScale($hlb) + ') ' + data.translateCSS,
          'transform-origin': data.originCSS
        });

        data.onHLBReady();

        return;

      }
      if (platform.useJqueryAnimate) {
        transitionInHLBWithJquery(data, speed);
      } else {
        transitionInHLBWithCSS(data, speed);
      }
    };

    /**
     * [transitionOutHLB animates and removes the HLB and background dimmer]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    hlbAnimation.transitionOutHLB = function (data) {

      var $hlb = data.$hlb;

      // Listeners: mouse-highlight.js, invert.js
      sitecues.emit('hlb/deflating', $hlb);

      // Un-dim the background!
      dimmer.undimBackgroundContent(DEFLATION_SPEED);

      // Do we bother animating the deflation?

      // Sometimes, if the user presses the spacebar extremely fast, the HLB is toggled
      // to close during the HLB inflation animation (transitionInHLB). Because this is
      // possible, it is also possible that the value of transform:scale is 1 by the time
      // we want to deflate, and thus the transition end event cannot be used as a callback
      // mechanism (because there is nothing to animate if scale is already 1).  Therefore,
      // we check to see if the HLB scale is greater than one, and if so, we animate the
      // deflation, otherwise, we just skip the deflation step
      if (isHLBZoomed($hlb)) {

        if (shouldFixFirefoxAnimationBug($hlb)) {

          $hlb.css({
            'transform'       : 'scale(' + hlbPositioning.getStartingScale($hlb) + ') ' + data.translateCSS,
            'transform-origin': data.originCSS
          });

          data.onHLBClosed();

          return;

        }

        if (platform.useJqueryAnimate) {
          // Stop the previous animation if it exists.
          if ($animation) {
            $animation.stop();
          }
          transitionOutHLBWithJquery(data);
        } else {
          transitionOutHLBWithCSS(data);
        }

      } else {
        data.onHLBClosed();
      }

    };

    /**
     * [transitionInHLBWithJquery animates the HLB open with jQuery.animate()]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    function transitionInHLBWithJquery(data, speed) {

      var $hlb = data.$hlb,
        startingScale = hlbPositioning.getStartingScale($hlb);

      $hlb.css({
        'transform-origin': data.originCSS,
        'transform'       : 'scale(' + startingScale + ') ' + data.translateCSS
      });

      $animation = $({'scale': startingScale}).animate(
        {
          'scale': hlbPositioning.getFinalScale($hlb)
        }, {
          'step'    : (function (data) {
            return function (now) {
              hlbSteppingAnimation(now, data);
            };
          }(data)),
          'duration': speed,
          'complete': data.onHLBReady
        }
      );

    }

    /**
     * [transitionOutHLBWithJquery animates the HLB closed with jQuery.animate()]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    function transitionOutHLBWithJquery(data) {

      $animation = $({'scale' : $animation.attr('scale')}).animate(
        {
          'scale': hlbPositioning.getStartingScale(data.$hlb)
        }, {
          'step'    : (function (data) {
            return function (now) {
              hlbSteppingAnimation(now, data);
            };
          }(data)),
          'duration': DEFLATION_SPEED,
          'complete': data.onHLBClosed
        }
      );

    }

    /**
     * [transitionOutHLBWithCSS animates the HLB closed with CSS transitions]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    function transitionOutHLBWithCSS(data) {

      var $hlb             = data.$hlb,
          transitionOutCSS = getTransitionOutCSS(data);

      // After the deflation animation completes, clean up the HLB modes and DOM
      $hlb[0].addEventListener(platform.transitionEndEvent, data.onHLBClosed);

      // Animate the deflation by setting the transform scale to startingScale.
      $hlb.css(transitionOutCSS);

    }

    /**
     * [transitionInHLBWithCSS animates the HLB open with CSS transitions]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    function transitionInHLBWithCSS(data, speed) {

      var $hlb            = data.$hlb,
          transitionInCSS = getTransitionInCSS(data, speed);

      // After the HLB animates, execute the callback that signifies the end of one-touch-read visuals
      $hlb[0].addEventListener(platform.transitionEndEvent, data.onHLBReady);

      // Scale the element up the final amount
      $hlb.css(transitionInCSS);

    }

    /**
     * [hlbSteppingAnimation is a custom step function for the jQuery animate method]
     * @param  {[Number]} now [The value of the property we are animating]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    function hlbSteppingAnimation(now, data) {

      var $hlb = data.$hlb;

      if ($hlb) {
        $hlb.css('transform', 'scale(' + now + ') ' + data.translateCSS);
      }

    }

    /**
     * [getTransitionInCSS returns the jquery CSS object needed to animate the HLB open]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     * @return {[Object]} [The jquery CSS object needed to animate the HLB open]
     */
    function getTransitionInCSS(data, speed) {

      // The order in which these CSS properties are set matters.  For example, if the
      // transition property is the last property in the transitionInCSS object, then
      // the transition would never occur. https://equinox.atlassian.net/browse/SC-1856
      var transitionInCSS = {
        'transition'                : data.transitionProperty + speed + 'ms',
        'transition-timing-function': 'ease',
        'transform'                 : 'scale(' + hlbPositioning.getFinalScale(data.$hlb) + ') ' + data.translateCSS,
        'transform-origin'          : data.originCSS
      };

      // Implemented because Chrome 36 update.
      if (platform.browser.isChrome) {
        transitionInCSS['-webkit-transform-origin'] = data.originCSS;
      }

      return transitionInCSS;

    }

    /**
     * [isHLBZoomed determines if the $hlb is scaled greater than one.
     * This is useful for the transitionOutHLB function.]
     * @return {Boolean} [if true, $hlb is scaled > zoom]
     * @example "matrix(1.5, 0, 0, 1.5, 1888.0610961914063, 2053.21875)"
     * @example "matrix(1, 0, 0, 1, 1888.0610961914063, 2053.21875)"
     */
    function isHLBZoomed($hlb) {

      // If there isn't any transform, then it isn't scaled.
      var scale = transform.getComputedScale($hlb[0]);
      return scale > hlbPositioning.getStartingScale($hlb);
    }

    /**
     * [getTransitionOutCSS returns the jquery CSS object needed to animate the HLB closed]
     * @return {[Object]} [The jquery CSS object needed to animate the HLB closed]
     */
    function getTransitionOutCSS(data) {

      return {
        'transition'                : data.transitionProperty + DEFLATION_SPEED + 'ms',
        'transition-timing-function': 'ease',
        'transform'                 : 'scale(' + hlbPositioning.getStartingScale(data.$hlb) + ') ' + data.translateCSS,
        'transform-origin'          : data.originCSS
      };

    }

    callback();

  });

});