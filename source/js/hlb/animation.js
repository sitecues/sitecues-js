/*
  This module animates the HLB.  Depending on the browser, the mechanism
  of animation is either CSS3 Transitions or jQuery.animate.
 */
sitecues.def('hlb/animation', function (hlbAnimation, callback) {

  'use strict';

  sitecues.use('hlb/dimmer', 'util/common', 'jquery', 'hlb/safe-area', 'platform',

  function (dimmer, common, $, hlbSafeArea, platform) {

    var INFLATION_SPEED = 400, // Default inflation duration
        DEFLATION_SPEED = 150, // Default deflation duration

        $animation;            // A reference to the $.animate we use for IE9 inflation and deflation

    /**
     * [transitionInHLB animates the inflation of the HLB and background dimmer]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    hlbAnimation.transitionInHLB = function (data) {

      // Dim the background!
      dimmer.dimBackgroundContent(data.$hlbWrappingElement, INFLATION_SPEED);

      if (common.useJqueryAnimate) {

        transitionInHLBWithJquery(data);

      } else {

        transitionInHLBWithCSS(data);

      }

    };

    /**
     * [transitionOutHLB animates and removes the HLB and background dimmer]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    hlbAnimation.transitionOutHLB = function (data) {

      var $hlbElement = data.$hlbElement;

      // Listeners: mouse-highlight.js, invert.js
      sitecues.emit('hlb/deflating', $hlbElement);

      // Un-dim the background!
      dimmer.removeDimmer(DEFLATION_SPEED);

      // Do we bother animating the deflation?

      // Sometimes, if the user presses the spacebar extremely fast, the HLB is toggled
      // to close during the HLB inflation animation (transitionInHLB). Because this is
      // possible, it is also possible that the value of transform:scale is 1 by the time
      // we want to deflate, and thus the transition end event cannot be used as a callback
      // mechanism (because there is nothing to animate if scale is already 1).  Therefore,
      // we check to see if the HLB scale is greater than one, and if so, we animate the
      // deflation, otherwise, we just skip the deflation step
      if (isHLBScaleGreaterThanOne($hlbElement)) {

        if (common.useJqueryAnimate) {

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
    function transitionInHLBWithJquery(data) {

      var $hlbElement = data.$hlbElement;

      $hlbElement.css({
        'transform-origin': data.originCSS,
        'transform'       : 'scale(1) ' + data.translateCSS
      });

      $animation = $({'scale': 1}).animate(
        {
          'scale': hlbSafeArea.HLBZoom
        }, {
          'step'    : (function (data) {
            return function (now) {
              hlbSteppingAnimation(now, data);
            };
          }(data)),
          'duration': INFLATION_SPEED,
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
          'scale': 1
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

      var $hlbElement      = data.$hlbElement,
          transitionOutCSS = getTransitionOutCSS(data);

      // After the deflation animation completes, clean up the HLB states and DOM
      $hlbElement[0].addEventListener(common.transitionEndEvent, data.onHLBClosed);

      // Animate the deflation by setting the transform scale to 1.
      $hlbElement.css(transitionOutCSS);

    }

    /**
     * [transitionInHLBWithCSS animates the HLB open with CSS transitions]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    function transitionInHLBWithCSS(data) {

      var $hlbElement     = data.$hlbElement,
          transitionInCSS = getTransitionInCSS(data);

      // After the HLB animates, execute the callback that signifies the end of one-touch-read visuals
      $hlbElement[0].addEventListener(common.transitionEndEvent, data.onHLBReady);

      // Scale the element up to 1.5 (hlbPositioning.HLBZoom)
      $hlbElement.css(transitionInCSS);

    }

    /**
     * [hlbSteppingAnimation is a custom step function for the jQuery animate method]
     * @param  {[Number]} now [The value of the property we are animating]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     */
    function hlbSteppingAnimation(now, data) {

      var $hlbElement = data.$hlbElement;

      if ($hlbElement) {
        $hlbElement.css('transform', 'scale(' + now + ') ' + data.translateCSS);
      }

    }

    /**
     * [getTransitionInCSS returns the jquery CSS object needed to animate the HLB open]
     * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
     * @return {[Object]} [The jquery CSS object needed to animate the HLB open]
     */
    function getTransitionInCSS(data) {

      // The order in which these CSS properties are set matters.  For example, if the
      // transition property is the last property in the transitionInCSS object, then
      // the transition would never occur. https://equinox.atlassian.net/browse/SC-1856
      var transitionInCSS = {
        'transition'                : data.transitionProperty + INFLATION_SPEED + 'ms',
        'transition-timing-function': 'ease',
        'transform'                 : 'scale(' + hlbSafeArea.HLBZoom + ') ' + data.translateCSS,
        'transform-origin'          : data.originCSS
      };

      // Implemented because Chrome 36 update.
      if (platform.browser.isChrome) {
        transitionInCSS['-webkit-transform-origin'] = data.originCSS;
      }

      return transitionInCSS;

    }
    /**
     * [isHLBScaleGreaterThanOne determines if the $hlbElement is scaled greater than one.
     * This is useful for the transitionOutHLB function.]
     * @return {Boolean} [if true, $hlbElement is scaled > 1]
     * @example "matrix(1.5, 0, 0, 1.5, 1888.0610961914063, 2053.21875)"
     * @example "matrix(1, 0, 0, 1, 1888.0610961914063, 2053.21875)"
     */
    function isHLBScaleGreaterThanOne($hlbElement) {

      // If there isn't any transform, then it isn't scaled.
      if ($hlbElement.css('transform') === 'none') {
        return false;
      }

      if ($hlbElement.css('transform').match('matrix\\(1,')) {
        return false;
      }

      return true;

    }
    /**
     * [getTransitionOutCSS returns the jquery CSS object needed to animate the HLB closed]
     * @return {[Object]} [The jquery CSS object needed to animate the HLB closed]
     */
    function getTransitionOutCSS(data) {

      return {
        'transition'                : data.transitionProperty + DEFLATION_SPEED + 'ms',
        'transition-timing-function': 'ease',
        'transform'                 : 'scale(1) ' + data.translateCSS,
        'transform-origin'          : data.originCSS
      };

    }

    callback();

  });

});