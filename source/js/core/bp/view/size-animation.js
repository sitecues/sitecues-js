/**
 * Expand or contract the BP
 */
define(
  [
    'core/bp/model/state',
    'core/bp/constants',
    'core/bp/helper',
    'core/platform',
    'core/events',
    'nativeFn',
    'core/inline-style/inline-style'
  ],
  function (
    state,
    BP_CONST,
    helper,
    platform,
    events,
    nativeFn,
    inlineStyle
  ) {
  'use strict';

  var requestFrameFn = window.requestAnimationFrame,
      cancelFrameFn  = window.cancelAnimationFrame,
      expandEasingFn   = function (t) { return (--t)*t*t+1;}, // https://gist.github.com/gre/1650294
      collapseEasingFn = function (t) { return t; },          // Linear looks better for collapse animation
      animationStartTime,
      animationId,
      MINIMUM_DISTANCE_FROM_EDGE  = 20,
      MINIMUM_DISTANCE_FROM_EDGE_TOP = 2, // More forgiving on top side because of toolbar
      ZOOM_MIN = 1,
      ZOOM_RANGE = 2,

      // What we're transitioning from and to
      // Note that if you exit/enter the panel in the middle of animation you can
      // end up transitioning as badge -> badge, or panel -> panel
      currentlyTransitioningFrom          = BP_CONST.BADGE_MODE,
      currentlyTransitioningTo            = null,  // Not currently transitioning to anything


      // The minimum amount we want to increase the badge size
      // when transitioning to the panel.  Basically, the panel
      // should be BP_CONST.IDEAL_PANEL_WIDTH by BP_CONST.IDEAL_PANEL_HEIGHT
      // or 1.2x the size of the badge.
      MINIMUM_PANEL_SIZE_INCREASE = 1.2,
      panelScaleFromBadge,
      badgeScaleFromPanel,
      transformElementId          = BP_CONST.BP_CONTAINER_ID,

      // The stable target badge width
      targetBadgeWidth,

      // Amount of zoom currently applied to the badge
      currentZoom = 1,

      // Convenience methods
      byId = helper.byId,
      getRect = helper.getRect;

  function isToolbarBadge() {
    return state.get('isToolbarBadge');
  }

  function getSvgElement() {
    return byId(BP_CONST.SVG_ID);
  }

  function getBadgeElement() {
    return byId(BP_CONST.BADGE_ID);
  }

  /**
   * getDifferenceObject builds and returns an object that represents the differences
   * between two objects.  The two objects must contain only numbers or objects as values
   * for properties.
   *
   * @example
   *
   *      PARAM 1               PARAM 2                 OUTPUT
   *
   *    {                     {                      {
   *      'a': 4,              'a': 10,                'a': 6,
   *      'b': {       =>       'b': {          =      'b': {
   *        'c': 1                'c': 5                 'c': 4
   *      }                     }                      }
   *    }                     }                      }
   *
   * @param  {Object} obj1 [Object whose values are numbers or objects]
   * @param  {Object} obj2 [Object whose values are numbers or objects]
   * @return {Object}      [Object whose values are numbers or objects]
   */
  function getDifferenceObject (obj1, obj2) {

    var result = {},
        obj1Prop,
        obj2Prop;

    for (var prop in obj1) {

      if (obj1.hasOwnProperty(prop)) {

        obj1Prop = obj1[prop];
        obj2Prop = obj2[prop];

        if (typeof obj1Prop === 'number') {

          result[prop] = obj2Prop - obj1Prop;

        } else {

          result[prop] = getDifferenceObject(obj1Prop, obj2Prop);

        }

      }
    }

    return result;

  }

  /**
   * getPossibleOutlineRects returns the visible panel rectangle to be.  This is useful in our
   * calculation for determining where the panel should be animated to when expanding.
   * The actual containers of the UI (and even the UI to some degree) are much larger
   * than what the appearance suggests.
   * @param  {number} targetDimensions The target width and height for the SVG_ID element.
   * @return {Object}           The bounding client rect of the MAIN_OUTLINE_ID element after
   *                            panel expansion.
   */
  function getPossibleOutlineRects (targetDimensions) {

    var currentSVGWidth       = helper.getRectById(BP_CONST.SVG_ID).width,
        targetSVGWidth        = targetDimensions.width,
        increaseFactor        = targetSVGWidth / currentSVGWidth,
        currentOutlineRect    = helper.getRectById(BP_CONST.MAIN_OUTLINE_ID),
        remainingTime         = 1 - state.get('currentMode'),
        possibleOutlineRects;

    if (isToolbarBadge()) {
      // Centered toolbar gets centered expansion treatment
      possibleOutlineRects = {
        'center'  : getScaledRect(currentOutlineRect, 0.68 * remainingTime, 0, increaseFactor)
      };
    }
    else {
      possibleOutlineRects = {
        '25%0%'   : getScaledRect(currentOutlineRect, 0.25 * remainingTime, 0, increaseFactor),
        'topLeft' : getScaledRect(currentOutlineRect, 0, 0, increaseFactor),
        '75%0%'   : getScaledRect(currentOutlineRect, 0.75 * remainingTime, 0, increaseFactor),
        'topRight': getScaledRect(currentOutlineRect, 1, 0, increaseFactor),
        'botRight': getScaledRect(currentOutlineRect, 0, 1, increaseFactor),
        'botLeft' : getScaledRect(currentOutlineRect, 1, 1, increaseFactor)
      };
    }

    return possibleOutlineRects;
  }

  /**
   * getScaledRect scales a rectangle from an origin
   * @param  {Object} rect    Rectangle
   * @param  {number} originX  0 - 1
   * @param  {number} originY  0 - 1
   * @param  {number} scale    How much we scale the rectangle
   * @return {Object}         Rectangle
   */
  function getScaledRect (rect, originX, originY, scale) {

    var scaledWidth  = rect.width  * scale,
        scaledHeight = rect.height * scale,
        resultRect   = {};

    resultRect.left   = rect.left - (scaledWidth  * originX) / 2;
    resultRect.top    = rect.top  - (scaledHeight * originY) / 2;
    resultRect.width  = scaledWidth;
    resultRect.height = scaledHeight;
    resultRect.right  = resultRect.left + scaledWidth;
    resultRect.bottom = resultRect.top  + scaledHeight;

    return resultRect;

  }

  function isRectLeftOfViewport (rect) {
    return rect.left < MINIMUM_DISTANCE_FROM_EDGE;
  }

  function isRectRightOfViewport (rect) {
    return rect.right > window.innerWidth - MINIMUM_DISTANCE_FROM_EDGE;
  }

  function isRectAboveViewport (rect) {
    return rect.top < MINIMUM_DISTANCE_FROM_EDGE_TOP;
  }

  function isRectBelowViewport (rect) {
    return rect.bottom > window.innerHeight - MINIMUM_DISTANCE_FROM_EDGE;
  }

  /**
   * [isRectOutsideViewport determines if the provided rectangle will be outside the viewport]
   * @param  {[Object]} rect [Bounding Client Rectangle]
   * @return {[Boolean]}     [True if rect is outside viewport]
   */
  function isRectOutsideViewport (rect) {
    return isRectLeftOfViewport(rect)  ||
           isRectRightOfViewport(rect) ||
           isRectAboveViewport(rect)   ||
           isRectBelowViewport(rect);
  }

  /**
   * [moveRectIntoViewport returns a rectangle that is guarenteed to be within the viewport]
   * @param  {Object} rect [Rectangle]
   * @return {Object}      [Rectangle]
   */
  function moveRectIntoViewport (rect) {

    if (isRectLeftOfViewport(rect)) {
      rect.left = MINIMUM_DISTANCE_FROM_EDGE;
    }

    if (isRectAboveViewport(rect)) {
      rect.top = MINIMUM_DISTANCE_FROM_EDGE;
    }

    if (isRectRightOfViewport(rect)) {
      rect.left = window.innerWidth - rect.width - MINIMUM_DISTANCE_FROM_EDGE * 2;
    }

    if (isRectBelowViewport(rect)) {
      rect.top = window.innerHeight - rect.height - MINIMUM_DISTANCE_FROM_EDGE * 2;
    }

    return rect;
  }

  /**
   * [getTargetSize computes and returns the size of whatever we are animating to]
   * @return {Object} [width and height]
   */
  function getTargetSize () {
    return state.isPanelRequested() ? getTargetPanelSize() : getTargetBadgeSize();
  }

  function getTargetPanelSize() {

    var svgRect             = getRect(getSvgElement()),
        portionRemaining    = 1 - state.get('currentMode'),
        newPanelWidth       = Math.max(BP_CONST.IDEAL_PANEL_WIDTH, svgRect.width * MINIMUM_PANEL_SIZE_INCREASE * portionRemaining),
        newPanelHeight      = newPanelWidth * BP_CONST.IDEAL_PANEL_HEIGHT / BP_CONST.IDEAL_PANEL_WIDTH;

    return {
      width : newPanelWidth,
      height: newPanelHeight
    };
  }

  function getAspectRatio() {
    var viewBoxRect = getSvgElement().viewBox.baseVal;
    return viewBoxRect.width / viewBoxRect.height;
  }

  function getAppliedBadgeZoom() {
    return state.get('isPageBadge') ? currentZoom : 1;
  }

  function getTargetBadgeSize() {
    if (!targetBadgeWidth || !state.get('isToolbarBadge')) {
      targetBadgeWidth = getTargetBadgeWidth(getAppliedBadgeZoom());
    }
    return {
      width: targetBadgeWidth,
      height: targetBadgeWidth / getAspectRatio()
    };
  }

  function getTargetBadgeWidth(zoomMult) {
    var badgeElement = getBadgeElement(),
      badgeRect = getRect(badgeElement),
      badgeComputedStyles = window.getComputedStyle(badgeElement),
      extraWidth = (parseFloat(badgeComputedStyles.paddingLeft) + parseFloat(badgeComputedStyles.paddingRight)) * zoomMult,
      badgeRectWidth = badgeRect.width - extraWidth;
    return badgeRectWidth * state.get('ratioOfSVGToVisibleBadgeSize');
  }

  /**
   * [getTargetBadgePosition computes and returns the desired badge position]
   * @return {Object} [top and left]
   */
  function getTargetBadgePosition () {

    var FUDGE_FACTOR        = -0.5, // This makes it  not jerk to a new spot, not sure why
        isPageBadge         = state.get('isPageBadge'),
        badgeElement        = getBadgeElement(),
        badgeComputedStyles = window.getComputedStyle(badgeElement),
        badgeRect           = getRect(badgeElement),
        completedZoom       = currentZoom,
        paddingTop          = parseFloat(badgeComputedStyles.paddingTop),
        paddingLeft         = parseFloat(badgeComputedStyles.paddingLeft),
        top,
        left;

    // Badge implemented by customer
    if (isPageBadge) {

      top  = badgeRect.top  + (paddingTop  * completedZoom) - BP_CONST.BADGE_VERTICAL_OFFSET + FUDGE_FACTOR;
      left = badgeRect.left + (paddingLeft * completedZoom) + FUDGE_FACTOR;

    // Floating badge
    } else {
      top  = paddingTop;
      left = paddingLeft;
    }

    return {
      'top' : Math.ceil(top),
      'left': Math.ceil(left)
    };
  }

  /**
   * [getTargetPosition gets all desired outline boundlingClientRects based on the
   * current SVG_ID height and width.  It checks if any of them would be inside the
   * viewport.  The first that does is the boundingClientRect of the outlineRect.]
   * @param  {Object} targetDimensions [Height and width of the SVG_ID]
   * @return {Object}                  [top and left]
   */
  function getTargetPanelPosition () {

    var targetSize   = getTargetSize(),
        outlineRects = getPossibleOutlineRects(targetSize),
        rect,
        currentRect,
        resultRect;

    if (isToolbarBadge()) {
      return outlineRects.center;
    }

    for (rect in outlineRects) {
      if (outlineRects.hasOwnProperty(rect)) {
        currentRect = outlineRects[rect];
        if (!isRectOutsideViewport(currentRect)) {
          resultRect = currentRect;
          if (SC_DEV) { console.log('Panel position using origin: ' + rect); }
          break;
        }
      }
    }

    // Must animate into the viewport.
    if (!resultRect) {
      if (SC_DEV) { console.log('Panel position forced into viewport.'); }
      resultRect = moveRectIntoViewport(outlineRects.topLeft);
    }

    return resultRect;

  }

  function getTargetTransformPosition () {

    if (state.isPanelRequested()) {
      return getTargetPanelPosition();
    }

    return getTargetBadgePosition();

  }

  /**
   * [getTargetSVGElementTransforms returns the transforms for multiple SVG elements]
   * @return {Object} [Keys are the IDs for SVG elements, Values are their transforms]
   */
  function getTargetSVGElementTransforms () {

    function copyObj (obj) {
      return nativeFn.JSON.parse(nativeFn.JSON.stringify(obj));
    }

    var isPanelRequested = state.isPanelRequested(),
        transforms       = isPanelRequested ? BP_CONST.TRANSFORMS.PANEL   : BP_CONST.TRANSFORMS.BADGE,
        sliderWidth      = isPanelRequested ? BP_CONST.LARGE_SLIDER_WIDTH : BP_CONST.SMALL_SLIDER_WIDTH,
        percentage       = (currentZoom - ZOOM_MIN) / ZOOM_RANGE,
        result           = copyObj(transforms);

    result[BP_CONST.ZOOM_SLIDER_THUMB_ID].translateX += percentage * sliderWidth;

    return result;

  }

  // TODO just move this right into the SVG? Why not just have it in the markup
  function firstTimeRender() {

    var SLIDER_BAR_ID       = BP_CONST.ZOOM_SLIDER_BAR_ID,
        SLIDER_THUMB_ID     = BP_CONST.ZOOM_SLIDER_THUMB_ID,
        badgeTransforms     = BP_CONST.TRANSFORMS.BADGE,
        TRANSFORM_STRING    = 'transform',
        TRANSLATE_STRING    = 'translate(',
        SCALE_STRING        = 'scale(',
        CLOSING_PAREN       = ') ',
        sliderBarTransforms = badgeTransforms[SLIDER_BAR_ID],
        sliderBarTransform  = sliderBarTransforms.translateX + CLOSING_PAREN +
                              SCALE_STRING     + sliderBarTransforms.scaleX + ',' + sliderBarTransforms.scaleY,
        isRealSettings      = state.get('isRealSettings'),
        sliderThumbTranslateX = isRealSettings ? badgeTransforms[SLIDER_THUMB_ID].translateX : BP_CONST.TRANSFORMS.FAKE_BADGE_TRANSLATEX;

    function getTranslateX(id) {
      return badgeTransforms[id].translateX;
    }

    function setTransform (id, value) {
      byId(id).setAttribute(TRANSFORM_STRING, TRANSLATE_STRING + (value || getTranslateX(id)) + CLOSING_PAREN);
    }

    setTransform(BP_CONST.SMALL_A_ID);
    setTransform(BP_CONST.LARGE_A_ID);
    setTransform(BP_CONST.SPEECH_ID);
    setTransform(BP_CONST.VERT_DIVIDER_ID);

    setTransform(SLIDER_BAR_ID, sliderBarTransform);
    setTransform(SLIDER_THUMB_ID, sliderThumbTranslateX);
  }

  function getCurrentTransformPosition () {

    var transform = inlineStyle(byId(transformElementId))[platform.transformProperty],
        position  = {},
        transformValues,
        translateLeft,
        translateTop;

    if (transform === 'none' || transform === '') {

      position.left = 0;
      position.top  = 0;

    } else {

      transformValues = transform.split(',');
      translateLeft   = transformValues[0];
      translateTop    = transformValues[1].split('scale')[0];

      position.left   = helper.getNumberFromString(translateLeft);
      position.top    = helper.getNumberFromString(translateTop);

    }

    return position;

  }

  function getCurrentSize () {

    var svgRect = getRect(getSvgElement());

    return {
      'width' : svgRect.width,
      'height': svgRect.height
    };

  }

  function getCurrentScale () {

    var transformStyle = inlineStyle(byId(transformElementId))[platform.transformProperty],
        transformValues;

    if (transformStyle.indexOf('scale') !== -1) {

      transformValues = transformStyle.split('scale');

      return helper.getNumberFromString(transformValues[1]);

    }

    return 1;
  }

  function setSize (size, crispFactor) {
    inlineStyle.set(getSvgElement(), {
    // Height and Width
      width  : (size.width * crispFactor) + 'px',
      height : (size.height * crispFactor) + 'px'
    });
  }

  function setTransform (left, top, transformScale) {
    inlineStyle(byId(transformElementId))[platform.transformProperty] = 'translate(' + left + 'px' + ' , ' + top + 'px' + ') ' + 'scale(' + transformScale + ')';
  }

  /**
   * [setSVGElementTransforms sets the transform attribute of all SVG elements that need to
   * be translated and scaled]
   * @param {Object} startingSVGElementTransforms  [Object representing the translation and
   *                                                  scale of the SVG elements before any animation]
   * @param {Object} svgElementTransformDifference [Object representing the difference elements
   *                                                  must translate and scale]
   * @param {Float}  animationTime                 [0 - 1, the fraction the animation is at]
   */
  function setSVGElementTransforms (startingSVGElementTransforms, svgElementTransformDifference, animationTime) {
    var translateX,
      transformStr,
        scaleX,
        scaleY,
        currentStartingValue,
        currentDifferenceValue,
        id;

    for (id in startingSVGElementTransforms) {

      if (startingSVGElementTransforms.hasOwnProperty(id)) {

        currentStartingValue   = startingSVGElementTransforms[id];
        currentDifferenceValue = svgElementTransformDifference[id];

        translateX = currentStartingValue.translateX + currentDifferenceValue.translateX * animationTime;
        transformStr = 'translate(' + translateX + ')';

        if (currentStartingValue.scaleX) {

          scaleX = currentStartingValue.scaleX + currentDifferenceValue.scaleX * animationTime;
          scaleY = currentStartingValue.scaleY + currentDifferenceValue.scaleY * animationTime;

          transformStr += ' scale(' + scaleX + ',' + scaleY + ')';

        }

        byId(id).setAttribute('transform', transformStr);
      }
    }

  }

  //  https://equinox.atlassian.net/wiki/display/EN/BP2%3A+Implementation+Details
  function getTargetScale (endingSizeToStartingSizeRatio, crispFactor) {

    var isPanelRequested = state.isPanelRequested(),

        BADGE_TO_PANEL           = 0,
        TWEEN_TO_PANEL_CRISPED   = 1,
        TWEEN_TO_PANEL_UNCRISPED = 2,

        PANEL_TO_BADGE           = 3,
        TWEEN_TO_BADGE_CRISPED   = 4,
        TWEEN_TO_BADGE_UNCRISPED = 5,

        scalingFunction;

    if (isPanelRequested) {

      if (state.isBadge()) {

        scalingFunction = BADGE_TO_PANEL;

      } else {

        if (currentlyTransitioningFrom === BP_CONST.PANEL_MODE) {
          scalingFunction = TWEEN_TO_PANEL_UNCRISPED;
        }

        if (currentlyTransitioningFrom === BP_CONST.BADGE_MODE) {
          scalingFunction = TWEEN_TO_PANEL_CRISPED;
        }

      }

    } else {

      if (state.isPanel()) {

        scalingFunction = PANEL_TO_BADGE;

      } else {

        if (currentlyTransitioningFrom === BP_CONST.PANEL_MODE) {
          scalingFunction = TWEEN_TO_BADGE_UNCRISPED;
        }

        if (currentlyTransitioningFrom === BP_CONST.BADGE_MODE) {
          scalingFunction = TWEEN_TO_BADGE_CRISPED;
        }

      }


    }

    switch (scalingFunction) {

      case BADGE_TO_PANEL:

        panelScaleFromBadge = endingSizeToStartingSizeRatio / crispFactor;

        return panelScaleFromBadge;

      case TWEEN_TO_PANEL_CRISPED:

        return panelScaleFromBadge;

      case TWEEN_TO_PANEL_UNCRISPED:

        return 1;

      case PANEL_TO_BADGE:

        badgeScaleFromPanel = endingSizeToStartingSizeRatio;

        return  badgeScaleFromPanel;

      case TWEEN_TO_BADGE_CRISPED:

        return getCurrentScale() * endingSizeToStartingSizeRatio;

      case TWEEN_TO_BADGE_UNCRISPED:

        return badgeScaleFromPanel;

    }

  }

  /**
   * performAnimation begins the animation. We must animate the following:
   *   - position
   *   - size
   *   - transforms (translateX and scale)
   */
  function performAnimation() {

    var isPanelRequested              = state.isPanelRequested(),

      startingPosition              = getCurrentTransformPosition(),
      startingSize                  = getCurrentSize(),
      startingSVGElementTransforms  = helper.getCurrentSVGElementTransforms(),
      startingScale,

      endingPosition                = getTargetTransformPosition(),
      endingSize                    = getTargetSize(),
      endingSVGElementTransforms    = getTargetSVGElementTransforms(),
      endingScale,

      positionDifference            = getDifferenceObject(startingPosition, endingPosition),
      svgElementTransformDifference = getDifferenceObject(startingSVGElementTransforms, endingSVGElementTransforms),
      scaleDifference,

      fullAnimationDuration         = isPanelRequested ? BP_CONST.EXPAND_ANIMATION_DURATION_MS : BP_CONST.SHRINK_ANIMATION_DURATION_MS,

      startCrispFactor,

      percentEnlarged               = state.get('currentMode'),
      percentAnimationComplete      = isPanelRequested ? percentEnlarged : 1 - percentEnlarged;

    function animationTick () {

      var timeSinceFirstAnimationTick = Date.now() - animationStartTime,
          animationEasingFn           = isPanelRequested ? expandEasingFn : collapseEasingFn,
          normalizedAnimationTime     = Math.min(1, animationEasingFn(timeSinceFirstAnimationTick / fullAnimationDuration)),
          currentMode                 = isPanelRequested ? normalizedAnimationTime : 1 - normalizedAnimationTime,
          isAnimationEnding           = normalizedAnimationTime === 1;

      state.set('currentMode', currentMode);

      // Don't set width and height of <svg>, but instead use scale transform
      // To quote from http://www.html5rocks.com/en/tutorials/speed/high-performance-animations/
      // To achieve silky smooth animations you need to avoid work, and the best way to do that is to only change properties
      // that affect compositing -- transform and opacity.
      setTransform(
        (startingPosition.left + positionDifference.left * normalizedAnimationTime),
        (startingPosition.top  + positionDifference.top  * normalizedAnimationTime),
        (startingScale         + scaleDifference         * normalizedAnimationTime)
      );

      setSVGElementTransforms(startingSVGElementTransforms, svgElementTransformDifference, normalizedAnimationTime);

      if (isAnimationEnding) {

        // The final size must be IDEAL_PANEL_WIDTH x IDEAL_PANEL_HEIGHT
        // We use scale to make up the difference so that all HTML BP content is also sized properly (not just SVG)
        var currentSize = getCurrentSize(),
          ratioFromIdealSize = isPanelRequested ? BP_CONST.IDEAL_PANEL_WIDTH / currentSize.width : 1;
        setSize(getCurrentSize(), ratioFromIdealSize);

        setTransform(
          (startingPosition.left + positionDifference.left * normalizedAnimationTime),
          (startingPosition.top  + positionDifference.top  * normalizedAnimationTime),
          isPanelRequested ? 1 / ratioFromIdealSize : 1
        );

        endAnimation();

        return;
      }

      animationId = requestFrameFn(animationTick);

    }

    // Chrome is affected by the size of the source of what's scaled
    // It ends up being faster when the source is smaller, but less crisp
    function getStartCrispFactor() {
      if (!platform.browser.isChrome) {
        return 1;  // Don't need to play games with crisping other than in Chrome
      }

      return platform.isRetina() ? 1.5 : 3;
    }

    if (isPanelRequested && state.isBadge()) {

      startCrispFactor = getStartCrispFactor();

      setSize(startingSize, startCrispFactor);

      setTransform(
        startingPosition.left,
        startingPosition.top,
        1 / startCrispFactor
      );

    }

    startingScale   = getCurrentScale();
    endingScale     = getTargetScale(endingSize.width / startingSize.width, startCrispFactor);
    scaleDifference = endingScale - startingScale;

    // The animation start time will be NOW minus how long the previous animation duration.
    animationStartTime = Date.now() - percentAnimationComplete * fullAnimationDuration;

    animationId = requestFrameFn(animationTick);

  }

  function endAnimation () {

    var isPanelRequested = state.isPanelRequested();

    cancelAnimation();

    getBadgeElement().setAttribute('aria-expanded', isPanelRequested);

    state.set('currentMode', currentlyTransitioningTo);
    currentlyTransitioningFrom = currentlyTransitioningTo;
    currentlyTransitioningTo = null;

    events.emit(isPanelRequested ? 'bp/did-expand' : 'bp/did-shrink');

    require([ 'core/bp/view/view' ], function(view) {
      view.update();
    });
  }

  function cancelAnimation() {
    cancelFrameFn(animationId);
  }

  function onZoomChange(zoomLevel) {
    currentZoom = zoomLevel;
  }

  function animate() {

    if (currentlyTransitioningTo === state.get('transitionTo')) {
      // Already where we've been requested to be
      // This prevents us from starting a new animation of the same kind when we've already started one
      return;
    }

    if (state.isExpanding() || state.isShrinking()) {

      // There is room to animate, not already at the size limit of where we're transitioning to
      performAnimation();
    }

    currentlyTransitioningTo = state.get('transitionTo');
  }


  function init() {
    firstTimeRender();

    events.on('bp/will-expand bp/will-shrink', cancelAnimation);

    events.on('zoom/begin', function () {
      animationStartTime = 0;
    });

    events.on('zoom', onZoomChange);

  }

  return {
    init: init,
    animate: animate
  };

});
