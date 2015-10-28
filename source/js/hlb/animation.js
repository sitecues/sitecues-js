/*
  This module animates the HLB.  Depending on the browser, the mechanism
  of animation is either CSS3 Transitions or jQuery.animate.
 */
define(['hlb/dimmer', 'page/util/common', 'hlb/positioning', 'core/platform', '$'],
  function (dimmer, common, hlbPositioning, platform, $) {

  var INFLATION_SPEED = 400, // Default inflation duration
      INFLATION_SPEED_FAST = 0, // Inflation duration when retargeting
      DEFLATION_SPEED = 150, // Default deflation duration

      getStartingScale = hlbPositioning.getStartingScale,

      animate = platform.browser.isIE9 ? animateJs : animateCss,

      animationTimerIE9;

  /**
   * [transitionInHLB animates the inflation of the HLB and background dimmer]
   * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
   */
  function transitionInHLB(doShowQuickly, data) {

    // Dim the background!
    dimmer.dimBackgroundContent(INFLATION_SPEED, data.$hlb.parent());

    var $hlb = data.$hlb,
      speed = doShowQuickly ? INFLATION_SPEED_FAST : INFLATION_SPEED,
      startingScale = getStartingScale($hlb),
      hlbStyle = $hlb[0].style;

    hlbStyle[platform.transformOriginProperty] = data.originCSS;

    animate($hlb[0], startingScale, hlbPositioning.getFinalScale($hlb), speed, data.translateCSS, data.onHLBReady);
  }

  /**
   * [transitionOutHLB animates and removes the HLB and background dimmer]
   * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
   */
  function transitionOutHLB(data) {

    var $hlb = data.$hlb;

    // Un-dim the background!
    dimmer.undimBackgroundContent(DEFLATION_SPEED);

    // Stop any IE9 animations
    clearTimeout(animationTimerIE9);

    // Do we bother animating the deflation?

    // Sometimes, if the user presses the spacebar extremely fast, the HLB is toggled
    // to close during the HLB inflation animation (transitionInHLB). Because this is
    // possible, it is also possible that the value of transform:scale is 1 by the time
    // we want to deflate, and thus the transition end event cannot be used as a callback
    // mechanism (because there is nothing to animate if scale is already 1).  Therefore,
    // we check to see if the HLB scale is greater than one, and if so, we animate the
    // deflation, otherwise, we just skip the deflation step
    if (!isHLBZoomed($hlb)) {
      data.onHLBClosed();
      return;
    }

    animate($hlb[0], getCurrentScale($hlb), getStartingScale($hlb), DEFLATION_SPEED, data.translateCSS, data.onHLBClosed);
  }

  function animateJs(hlbElement, startScale, endScale, speed, translateCSS, onCompleteFn) {
    function nextFrame() {
      var timeElapsed = new Date() - startTime,
        percentComplete = timeElapsed >= speed ? 1 : timeElapsed / speed,
        currentScale = startScale + (endScale - startScale) * percentComplete,
        transformValue = 'scale(' + currentScale + ') ' + translateCSS;

      hlbElement.style[platform.transformProperty] = transformValue;
      if (percentComplete < 1) {
        animationTimerIE9 = setTimeout(nextFrame, 16);
      }
      else if (onCompleteFn) {
        onCompleteFn();
      }
    }

    var startTime = new Date();
    nextFrame();
  }

  function animateCss(hlbElement, startScale, endScale, speed, translateCSS, onCompleteFn) {

    $(hlbElement).css({
      transition: '',
      transform: 'scale(' + startScale + ') ' + translateCSS
    });

    function onComplete() {
      hlbElement.removeEventListener(platform.transitionEndEvent, onComplete);
      onCompleteFn();
    }

    setTimeout(function() {
      $(hlbElement).css({
        transition: platform.transformProperty + ' ' + speed + 'ms ease-in-out',
        transform: 'scale(' + endScale + ') ' + translateCSS
      });
      hlbElement.addEventListener(platform.transitionEndEvent, onComplete);
    }, 0);
  }

  function getCurrentScale($hlb) {
    return common.getComputedScale($hlb[0]);
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
    var scale = getCurrentScale($hlb);
    return scale > hlbPositioning.getStartingScale($hlb);
  }

  return {
    transitionInHLB: transitionInHLB,
    transitionOutHLB: transitionOutHLB
  };

});
