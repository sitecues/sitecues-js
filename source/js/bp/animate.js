sitecues.def('bp/animate', function(animate, callback) {
  'use strict';
  sitecues.use('bp/model/state', 'bp/constants', 'bp/helper', 'zoom', 'bp/controller/panel-controller',

    function(state, BP_CONST, helper, zoomMod, panelController) {

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
          expandEasingFn = function (t) { return (--t)*t*t+1;}, // https://gist.github.com/gre/1650294
          collapseEasingFn = function (t) { return t; },  // Linear just looks better for collapse animation
          animationStartTime,
          animationId,
          lastTransitionTo            = BP_CONST.BADGE_MODE,
          MINIMUM_DISTANCE_FROM_EDGE  = 20,

          // The minimum amount we want to increase the badge size
          // when transitioning to the panel.  Basically, the panel
          // should be BP_CONST.MINIMUM_PANEL_WIDTH by BP_CONST.MINIMUM_PANEL_HEIGHT
          // or 1.5x the size of the badge.
          MINIMUM_PANEL_SIZE_INCREASE = 1.5,
          byId                        = helper.byId;


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
            currentOutlineRect    = helper.getRectById(BP_CONST.MAIN_OUTLINE_BORDER_ID),

            possibleOutlineRects  = {
              '25%0%'   : getScaledRect(currentOutlineRect, 0.25 * (1 - state.get('currentMode')), 0, increaseFactor),
              'topLeft' : getScaledRect(currentOutlineRect, 0, 0, increaseFactor),
              'topRight': getScaledRect(currentOutlineRect, 1, 0, increaseFactor),
              'botRight': getScaledRect(currentOutlineRect, 0, 1, increaseFactor),
              'botLeft' : getScaledRect(currentOutlineRect, 1, 1, increaseFactor)
            };

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
        return rect.top < MINIMUM_DISTANCE_FROM_EDGE;
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
        return (isRectLeftOfViewport(rect)  ||
                isRectRightOfViewport(rect) ||
                isRectAboveViewport(rect)   ||
                isRectBelowViewport(rect));
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

        var zoomMult            = state.get('isPageBadge') ? zoomMod.getCompletedZoom() : 1,
            isPanelRequested    = state.isPanelRequested(),
            svgElement          = byId(BP_CONST.SVG_ID),
            badgeElement        = byId(BP_CONST.BADGE_ID),
            svgRect             = helper.getRect(svgElement),
            badgeRect           = helper.getRect(badgeElement),
            badgeComputedStyles = window.getComputedStyle(badgeElement),
            extraWidth          = (parseFloat(badgeComputedStyles.paddingLeft) + parseFloat(badgeComputedStyles.paddingRight)) * zoomMult,
            badgeRectWidth      = badgeRect.width - extraWidth,
            viewBoxRect         = svgElement.viewBox.baseVal,
            svgAspectRatio      = viewBoxRect.width / viewBoxRect.height,

            // BADGE SIZE
            newBadgeWidth       = badgeRectWidth * state.get('ratioOfSVGToVisibleBadgeSize'),
            newBadgeHeight      = newBadgeWidth / svgAspectRatio,

            // PANEL SIZE
            newPanelWidth       = Math.max(BP_CONST.MINIMUM_PANEL_WIDTH, svgRect.width * MINIMUM_PANEL_SIZE_INCREASE * (1 - state.get('currentMode'))),
            newPanelHeight      = svgRect.height * newPanelWidth / svgRect.width,

            newWidth            = isPanelRequested ? newPanelWidth  : newBadgeWidth,
            newHeight           = isPanelRequested ? newPanelHeight : newBadgeHeight;

        return {
          'width' : newWidth,
          'height': newHeight
        };

      }

      /**
       * [getTargetBadgePosition computes and returns the desired badge position]
       * @return {Object} [top and left]
       */
      function getTargetBadgePosition () {

        var isPageBadge         = state.get('isPageBadge'),
            badgeElement        = byId(BP_CONST.BADGE_ID),
            badgeComputedStyles = window.getComputedStyle(badgeElement),
            badgeRect           = helper.getRect(badgeElement),
            completedZoom       = zoomMod.getCompletedZoom(),
            paddingTop          = parseFloat(badgeComputedStyles.paddingTop),
            paddingLeft         = parseFloat(badgeComputedStyles.paddingLeft),
            top,
            left;
        // Badge implemented by customer
        if (isPageBadge) {

          var FUDGE_FACTOR = -0.5; // This makes it work, and not jerk to a new spot at the end, not sure why

          top  = badgeRect.top  + (paddingTop  * completedZoom) - BP_CONST.BADGE_VERTICAL_OFFSET + FUDGE_FACTOR + window.pageYOffset;
          left = badgeRect.left + (paddingLeft * completedZoom) + window.pageXOffset + FUDGE_FACTOR;

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

        for (rect in outlineRects) {
          if (outlineRects.hasOwnProperty(rect)) {
            currentRect = outlineRects[rect];
            if (!isRectOutsideViewport(currentRect)) {
              resultRect = currentRect;
              SC_DEV && console.log('Panel position using origin: ' + rect);
              break;
            }
          }
        }

        // Must animate into the viewport.
        if (!resultRect) {
          SC_DEV && console.log('Panel position forced into viewport.');
          resultRect = moveRectIntoViewport(outlineRects.topLeft);
        }

        resultRect.left += window.pageXOffset;
        resultRect.top  += window.pageYOffset;

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
          return JSON.parse(JSON.stringify(obj));
        }

        var isPanelRequested = state.isPanelRequested(),
            transforms       = isPanelRequested ? BP_CONST.TRANSFORMS.PANEL   : BP_CONST.TRANSFORMS.BADGE,
            sliderWidth      = isPanelRequested ? BP_CONST.LARGE_SLIDER_WIDTH : BP_CONST.SMALL_SLIDER_WIDTH,
            currentZoom      = zoomMod.getCompletedZoom(),
            percentage       = (currentZoom - zoomMod.min) / zoomMod.range,
            result           = copyObj(transforms);

        result[BP_CONST.ZOOM_SLIDER_THUMB_ID].translateX += percentage * sliderWidth;

        return result;

      }

      // TODO just move this right into the SVG? Why not just have it in the markup
      function firstTimeRender() {

        function setTranslateXAttribute (id) {
          byId(id).setAttribute(TRANSFORM_STRING, TRANSLATE_STRING + badgeTransforms[id].translateX  + CLOSING_PAREN);
        }

        var sliderBarId         = BP_CONST.ZOOM_SLIDER_BAR_ID,
            badgeTransforms     = BP_CONST.TRANSFORMS.BADGE,
            TRANSFORM_STRING    = 'transform',
            TRANSLATE_STRING    = 'translate(',
            SCALE_STRING        = 'scale(',
            CLOSING_PAREN       = ') ',
            sliderBarTransforms = badgeTransforms[sliderBarId],
            sliderBarTransform  = TRANSLATE_STRING + sliderBarTransforms.translateX + CLOSING_PAREN +
                                  SCALE_STRING     + sliderBarTransforms.scaleX + ',' + sliderBarTransforms.scaleY + CLOSING_PAREN;

        setTranslateXAttribute(BP_CONST.SMALL_A_ID);
        setTranslateXAttribute(BP_CONST.LARGE_A_ID);
        setTranslateXAttribute(BP_CONST.SPEECH_ID);
        setTranslateXAttribute(BP_CONST.VERT_DIVIDER_ID);

        byId(sliderBarId).setAttribute(TRANSFORM_STRING, sliderBarTransform);

      }

      function getCurrentTransformPosition () {

        var transform = byId(BP_CONST.BP_CONTAINER_ID).style[helper.transformProperty],
            position  = {},
            transformValues;

        if (transform === 'none' || transform === '') {

          position.left = 0;
          position.top  = 0;

        } else {

          transformValues = transform.split(',');

          position.left   = helper.getNumberFromString(transformValues[0]);
          position.top    = helper.getNumberFromString(transformValues[1]);

        }

        return position;

      }

      function getCurrentSize () {

        var svgStyle = byId(BP_CONST.SVG_ID).style;

        return {
          'width' : parseFloat(svgStyle.width),
          'height': parseFloat(svgStyle.height)
        };

      }

      function setSize (width, height) {

        var svgStyle = byId(BP_CONST.SVG_ID).style;

        // Height and Width
        svgStyle.width  = width  + 'px';
        svgStyle.height = height + 'px';

      }

      function setTransformPosition (left, top) {

        var bpContainerStyle = byId(BP_CONST.BP_CONTAINER_ID).style;

        bpContainerStyle[helper.transformProperty] = 'translate(' + left + 'px' + ' , ' + top + 'px' + ')';

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
            scaleX,
            scaleY,
            currentStartingValue,
            currentDifferenceValue;

        for (var id in startingSVGElementTransforms) {

          if (startingSVGElementTransforms.hasOwnProperty(id)) {

            currentStartingValue   = startingSVGElementTransforms[id];
            currentDifferenceValue = svgElementTransformDifference[id];

            translateX = currentStartingValue.translateX + currentDifferenceValue.translateX * animationTime;

            if (currentStartingValue.scaleX) {

              scaleX = currentStartingValue.scaleX + currentDifferenceValue.scaleX * animationTime;
              scaleY = currentStartingValue.scaleY + currentDifferenceValue.scaleY * animationTime;

              byId(id).setAttribute('transform', 'translate(' + translateX + ') scale(' + scaleX + ',' + scaleY + ')');

            } else {
              byId(id).setAttribute('transform', 'translate(' + translateX + ')');
            }
          }
        }

      }

      animate.initAnimation = function (isFirstTime) {

        if (isFirstTime) {
          firstTimeRender();
          return;
        }

        if (lastTransitionTo === state.get('transitionTo')) {
          return;
        }

        if (state.isExpanding() || state.isShrinking()) {

          lastTransitionTo = state.get('transitionTo');

          SC_DEV && console.log('PERFORM BP2 ANIMATION');
          SC_DEV && console.log('        currentMode : ' + state.get('currentMode'));
          SC_DEV && console.log('        transitionTo: ' + state.get('transitionTo'));

          performAnimation();
        }

      };

      /**
       * performAnimation begins the animation. We must animate the following:
       *   - position
       *   - size
       *   - transforms (translateX and scale)
       */
      function performAnimation() {

        function animationTick () {

          var timeSinceFirstAnimationTick = Date.now() - animationStartTime,
              animationEasingFn           = isPanelRequested ? expandEasingFn : collapseEasingFn,
              normalizedAnimationTime     = Math.min(1, animationEasingFn(timeSinceFirstAnimationTick / fullAnimationDuration)),
              currentMode                 = isPanelRequested ? normalizedAnimationTime : 1 - normalizedAnimationTime;

          state.set('currentMode', currentMode);

          setSize(
            startingSize.width  + sizeDifference.width  * normalizedAnimationTime,
            startingSize.height + sizeDifference.height * normalizedAnimationTime
          );

          setTransformPosition(
            startingPosition.left + positionDifference.left * normalizedAnimationTime,
            startingPosition.top  + positionDifference.top  * normalizedAnimationTime
          );

          setSVGElementTransforms(startingSVGElementTransforms, svgElementTransformDifference, normalizedAnimationTime);

          if (normalizedAnimationTime === 1) {
            endAnimation();
            return;
          }

          animationId = requestFrameFn(animationTick);

        }

        var startingPosition              = getCurrentTransformPosition(),
            startingSize                  = getCurrentSize(),
            startingSVGElementTransforms  = helper.getCurrentSVGElementTransforms(),

            endingPosition                = getTargetTransformPosition(),
            endingSize                    = getTargetSize(),
            endingSVGElementTransforms    = getTargetSVGElementTransforms(),

            positionDifference            = getDifferenceObject(startingPosition, endingPosition),
            sizeDifference                = getDifferenceObject(startingSize, endingSize),
            svgElementTransformDifference = getDifferenceObject(startingSVGElementTransforms, endingSVGElementTransforms),

            isPanelRequested              = state.isPanelRequested(),
            fullAnimationDuration         = isPanelRequested ? BP_CONST.EXPAND_ANIMATION_DURATION_MS : BP_CONST.SHRINK_ANIMATION_DURATION_MS;

        // The animation start time will be NOW minus how long the previous animation duration.
        if (isPanelRequested) {
          animationStartTime = Date.now() - state.get('currentMode') * fullAnimationDuration;
        } else {
          animationStartTime = Date.now() - (1 - state.get('currentMode')) * fullAnimationDuration;
        }

        SC_DEV && console.log('BP2 ANIMATION STARTED ' + (Date.now() - animationStartTime) + ' ago.');

        animationId = requestFrameFn(animationTick);

      }

      function endAnimation () {

        SC_DEV && console.log('BP2 animation complete.');

        var isPanelRequested = state.isPanelRequested();

        cancelAnimation();

        byId(BP_CONST.BADGE_ID).setAttribute('aria-expanded', isPanelRequested);

        if (isPanelRequested) {
          panelController.panelReady();
        } else {
          panelController.panelShrunk();
        }

      }

      function cancelAnimation() {
        SC_DEV && console.log('---- - canceling BP2 animation.  ----');
        cancelFrameFn(animationId);
      }

      sitecues.on('bp/will-expand bp/will-shrink', cancelAnimation);

    });

  callback();

});
