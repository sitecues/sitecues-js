/*
 * Transform
 *
 * Scales and translates fixed elements. Fixed elements are scaled with the body, but restricted to a maximum of 1.8x
 *
 * Fixed elements are translated in the following cases:
 *   1. If a fixed element is overlapping with the Sitecues toolbar
 *   2. If a fixed element is taller or wider than the viewport, we translate the element on scroll
 *   3. If a fixed element's bounding rect is contained in the 'middle' 60% of the viewport's height, and there is a toolbar, we
 *     shift it down by the height of the toolbar. This handles cases where fixed elements are intended to be positioned over static elements
 *     that have already been shifted down by the toolbar height. We don't shift down fixed elements close to the top or bottom of the viewport
 *     because they are more likely to be part of a fixed menu that we shouldn't shift down (like a drop down menu)
 * */
/*jshint -W072 */
define(
  [
    'page/positioner/util/element-map',
    'page/zoom/util/body-geometry',
    'page/zoom/state',
    'page/positioner/transform/targets',
    'page/viewport/viewport',
    'page/positioner/util/element-info',
    'core/platform',
    'page/positioner/transform/rect-cache',
    'core/dom-events',
    'core/util/array-utility',
    'page/zoom/style',
    'page/viewport/scrollbars',
    'page/zoom/config/config',
    'core/events',
    'core/native-functions'
  ],
  function (
    elementMap,
    bodyGeo,
    state,
    targets,
    viewport,
    elementInfo,
    platform,
    rectCache,
    domEvents,
    arrayUtil,
    zoomStyle,
    scrollbars,
    config,
    events,
    nativeFn
  ) {
    /*jshint +W072 */
    'use strict';

    var
      shouldRestrictWidth, originalBody,
      isTransformXOriginCentered,
      shouldRepaintOnZoomChange,
      transformProperty, transformOriginProperty,
      // Fixed elements taller than the viewport
      tallElements           = [],
      // Fixed elements wider than the viewport
      wideElements           = [],
      cachedXOffset          = null,
      cachedYOffset          = null,
      animationFrame         = null,
      lastRepaintZoomLevel   = null,
      resizeTimer            = null,
      toolbarHeight          = 0,
      MARGIN_FROM_EDGE       = 15,
      isTransformingOnResize = false,
      // If we're using the toolbar, we need to transform fixed elements immediately or they may cover the toolbar / be covered
      isTransformingOnScroll = false;

    // This function scales and translates fixed elements as needed, e.g. if we've zoomed and the body is wider than the element
    function transformFixedElement(element, opts) {

      function getRectLeft(left, width, scale) {
        // Since transform origin 50 0 splits the scaled width evenly between the left and right sides, we need to subtract
        // half of the difference between the scaled and unscaled width from the left side
        return (isTransformXOriginCentered ? left - width * (scale - 1) / 2 : left);
      }

      var
        resetCurrentTranslation = opts.resetTranslation,
        pageOffsets             = viewport.getPageOffsets(),
        viewportDims            = viewport.getInnerDimensions(),
        currentPageXOffset      = pageOffsets.x,
        currentPageYOffset      = pageOffsets.y,
        lastPageXOffset         = elementMap.getField(element, 'lastPageXOffset') || cachedXOffset,
        lastPageYOffset         = elementMap.getField(element, 'lastPageYOffset') || cachedYOffset,
        viewportWidth           = viewportDims.width,
        viewportHeight          = viewportDims.height,
        currentScale            = elementInfo.getScale(element, 'fixed'),
        unscaledRect            = rectCache.getUnscaledRect(element, 'fixed', currentScale),
        translationValues       = getTranslationValues(element),
        currentXTranslation     = translationValues.x,
        currentYTranslation     = translationValues.y;

      // On zoom we should reset the current translations to
      // 1. reassess if we should shift the element vertically down by the toolbar offset
      // 2. we may not need to horizontally pan the element depending on its new width
      if (resetCurrentTranslation) {
        unscaledRect.left -= currentXTranslation;
        unscaledRect.top  -= currentYTranslation;
        currentYTranslation = 0;
        currentXTranslation = 0;
      }

      var
        newScale        = getRestrictedScale(unscaledRect, opts.onResize),
        newXTranslation = currentXTranslation,
        newYTranslation = currentYTranslation;
      elementInfo.setScale(element, newScale);

      if (!unscaledRect.width || !unscaledRect.height) {
        setNewTransform(element, 0, 0, newScale);
        cachePageOffsets(element, currentPageXOffset, currentPageYOffset);
        return;
      }

      // Calculate the dimensions of the fixed element after we apply the next scale transform
      var rect = {
        width  : unscaledRect.width * newScale,
        height : unscaledRect.height * newScale,
        top    : unscaledRect.top
      };
      rect.left   = getRectLeft(unscaledRect.left, unscaledRect.width, newScale);
      rect.bottom = rect.top  + rect.height;
      rect.right  = rect.left + rect.width;

      newXTranslation = calculateXTranslation({
        scale               : newScale,
        dimensions          : rect,
        viewportWidth       : viewportWidth,
        lastPageXOffset     : lastPageXOffset,
        scrollDifference    : currentPageXOffset - lastPageXOffset,
        currentPageXOffset  : currentPageXOffset,
        currentXTranslation : currentXTranslation
      });

      newYTranslation = calculateYTranslation({
        dimensions              : rect,
        viewportHeight          : viewportHeight,
        scrollDifference        : currentPageYOffset - lastPageYOffset,
        currentPageYOffset      : currentPageYOffset,
        currentYTranslation     : currentYTranslation,
        resetCurrentTranslation : resetCurrentTranslation
      });

      var
        xDelta = resetCurrentTranslation ? newXTranslation : newXTranslation - currentXTranslation,
        yDelta = resetCurrentTranslation ? newYTranslation : newYTranslation - currentYTranslation;

      // Translate the rectangle by our transformation, so that we can update the cached rectangle for this element. This allows us to avoid re-calculating
      // the binding rectangle on scroll, which is a very expensive operation
      rect.top    += yDelta;
      rect.bottom += yDelta;
      rect.left   += xDelta;
      rect.right  += xDelta;

      setNewTransform(element, newXTranslation, newYTranslation, newScale);
      cachePageOffsets(element, currentPageXOffset, currentPageYOffset);
      rectCache.update(element, rect);
    }

    function getTranslationValues(element) {
      var
        split  = element.style[transformProperty].split(/(?:\()|(?:px,*)/),
        index  = split.indexOf('translate3d'),
        values = { x: 0, y: 0 };
      if (index >= 0) {
        values.x = parseFloat(split[index + 1]);
        values.y = parseFloat(split[index + 2]);
      }
      return values;
    }

    function cachePageOffsets(element, xOffset, yOffset) {
      elementMap.setField(element, 'lastPageXOffset', xOffset);
      elementMap.setField(element, 'lastPageYOffset', yOffset);
    }

    function setNewTransform(element, translateX, translateY, scale) {
      element.style[transformProperty] = 'translate3d(' + translateX + 'px, ' + translateY + 'px, 0) scale(' + scale + ')';
    }

    function calculateXTranslation(args) {
      var
        currentXTranslation = args.currentXTranslation,
        elementWidth        = Math.round(args.dimensions.width),
        left                = args.dimensions.left,
        viewportWidth       = args.viewportWidth,
        currentPageXOffset  = args.currentPageXOffset,
        scrollDifference    = args.scrollDifference,
        offLeft             = elementWidth > viewportWidth ? left - scrollDifference : left,
        offRight            = elementWidth - viewportWidth + offLeft,
        newXTranslation     = elementWidth > viewportWidth ? currentXTranslation - scrollDifference : currentXTranslation,
        scrollWidth         = bodyGeo.getScrollWidth();

      var
        bodyRect    = rectCache.getRect(originalBody),
        percentOff  = (bodyRect.left + currentPageXOffset) / bodyRect.width,
        intendedOff = elementWidth * percentOff;

      // Shift fixed elements out of the viewport by the same proportion as the body
      offLeft     -= intendedOff;
      scrollWidth -= intendedOff;

      // If the fixed element is wider than the viewport
      if (elementWidth >= viewportWidth) {
        var
          scrollLimit     = scrollWidth - viewportWidth,
          remainingScroll = scrollLimit - currentPageXOffset;

        // If the length of the element outside of the right side of the viewport is greater than the remaining scroll width, shift
        // the element the difference between the two values (so that we can pan the entire element into view)
        if (offRight > remainingScroll) {
          newXTranslation -= offRight - remainingScroll;
        }
        // If the right side of the element is within the viewport, translate it over by its distance from the viewport
        else if (offRight < 0) {
          newXTranslation -= offRight;
        }
        // If the left side of the element is off by more than we can scroll in to view
        else if ((currentPageXOffset >= 0 && currentPageXOffset < -offLeft) || (currentPageXOffset < 0 && currentPageXOffset !== -offLeft)) {
          // Subtract
          newXTranslation -= offLeft + currentPageXOffset;
        }
        // If the left side of the element is visible in the viewport
        else if (offLeft > 0 && currentPageXOffset >= 0) {
          // Shift the element to the left side of the viewport
          newXTranslation -= offLeft;
        }
      }
      // If the fixed element's right edge is outside of the viewport, we need to shift it back inside the viewport
      else if (offRight > 0) {
        newXTranslation = -offRight + currentXTranslation - MARGIN_FROM_EDGE;
      }
      // If the fixed element's left edge is outside of the viewport, shift it back in
      else if (offLeft < 0) {
        newXTranslation = -offLeft + currentXTranslation + MARGIN_FROM_EDGE;
      }

      return newXTranslation;
    }

    function calculateYTranslation(args) {
      var
        viewportHeight          = args.viewportHeight,
        currentYTranslation     = args.currentYTranslation,
        currentPageYOffset      = args.currentPageYOffset,
        resetCurrentTranslation = args.resetCurrentTranslation,
        elementHeight           = args.dimensions.height,
        bottom                  = args.dimensions.bottom,
        top                     = args.dimensions.top,
        scrollDifference        = args.scrollDifference,
        scrollHeight            = bodyGeo.getScrollHeight(),
        isTallerThanViewport    = elementHeight > viewportHeight - toolbarHeight;

      if (resetCurrentTranslation && toolbarHeight) {
        if (shouldVerticallyShiftFixedElement(top, bottom, viewportHeight, elementHeight)) {
          currentYTranslation += toolbarHeight;
          top    += toolbarHeight;
          bottom += toolbarHeight;
        }
      }

      var
        newYTranslation = currentYTranslation,
        bottomOutOfView = bottom > viewportHeight,
        topOutOfView    = top < toolbarHeight;

      if (resetCurrentTranslation) {
        // On reset, translate fixed elements below the toolbar
        // or if they're below the viewport, translate them into view
        if (isTallerThanViewport) {
          var
            correctedYTranslation = currentYTranslation,
            yTranslationLimit     = viewportHeight - elementHeight - toolbarHeight,
            scrollLimit           = scrollHeight - viewportHeight,
            offsetRemaining       = Math.abs(yTranslationLimit - currentYTranslation),
            scrollRemaining       = scrollLimit - currentPageYOffset,
            scrollPercent         = currentPageYOffset / scrollLimit;

          // If the scroll distance to the edge of the page is less than the distance required to translate the
          // fixed element completely into the viewport, set the current y offset to a proportional value to the current pageYOffset
          if (offsetRemaining > scrollRemaining) {
            correctedYTranslation = yTranslationLimit * scrollPercent;
          }

          newYTranslation = correctedYTranslation;
        }
        else if (topOutOfView) {
          newYTranslation += toolbarHeight - top;
        }
        else if (bottomOutOfView) {
          newYTranslation += viewportHeight - bottom;
        }
      }
      else if (isTallerThanViewport) {
        // If we've scrolled down
        if (scrollDifference > 0) {
          if (bottomOutOfView) {
            newYTranslation -= Math.min(scrollDifference, bottom - viewportHeight);
          }
        }
        // If we've scrolled up
        else if (scrollDifference < 0) {
          if (topOutOfView) {
            newYTranslation += Math.min(-scrollDifference, toolbarHeight - top);
          }
        }
      }
      return newYTranslation;
    }

    function getRestrictedScale(dimensions, isOnResize) {
      var
        scrollWidth  = bodyGeo.getScrollWidth(isOnResize),
        elementWidth = dimensions.width;
      return Math.min(state.fixedZoom, scrollWidth / elementWidth);
    }

    function shouldVerticallyShiftFixedElement(top, bottom, viewportHeight, elementHeight) {
      // We shift fixed elements if they are clipping the boundaries of the toolbar
      // or if they are positioned in the middle 60% of the viewport height. This heuristic works pretty well, we don't shift elements that
      // are near the bottom of the screen, and we don't shift dropdown fixed menus that are intended to be flush with the top menu
      var
        isOverlappingToolbar = top < toolbarHeight,
        isFlushWithToolbar   = top === toolbarHeight,
        isCloseToBottom      = viewportHeight * 0.8 < bottom,
        isTallerThanViewport = elementHeight > viewportHeight;

      // Fixed elements that are close to the bottom or top are much more likely to be part of fixed menus that are
      // intended to be flush with the edges of the viewport
      return isTallerThanViewport || isOverlappingToolbar || (!isFlushWithToolbar && !isCloseToBottom);
    }

    function transformAllTargets(opts) {
      targets.forEach(function (element) {
        transformFixedElement(element, opts);
      });

      if (lastRepaintZoomLevel !== state.completedZoom && shouldRepaintOnZoomChange) {
        lastRepaintZoomLevel = state.completedZoom;
        zoomStyle.repaintToEnsureCrispText();
      }
    }

    function refreshResizeListener() {

      function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = nativeFn.setTimeout(function () {
          targets.forEach(scaleTop);
          transformAllTargets({
            resetTranslation: true,
            onResize: true
          });
          refreshScrollListener();
        }, 200);
      }

      var doTransformOnResize = Boolean(targets.getCount());

      if (!isTransformingOnResize && doTransformOnResize) {
        // There may be css media rules that change the positioning when the viewport is resized
        window.addEventListener('resize', onResize);
      }
      else if (isTransformingOnResize && !doTransformOnResize) {
        window.removeEventListener('resize', onResize);
      }
    }

    function refreshElementTransform(element) {
      transformFixedElement(element, {
        resetTranslation: true
      });
      refreshScrollListener(element);
      refreshResizeListener();
    }

    function fixZIndex(element) {
      // In IE, transformed fixed elements show up underneath other elements on the page when we apply a transformation
      // This is because we don't transplant fixed elements in IE, so the new containing blocks created by the transformation
      // are layered within the original body
      if (platform.browser.isIE) {
        var zIndex = getComputedStyle(element).zIndex;
        if (zIndex === 'auto') {
          element.style.zIndex = '999999';
        }
      }
    }

    function scaleTop(element) {
      var
        currentInlinePosition = element.style.position,
        currentInlineTop      = element.style.top,
        cachedInitialTop      = elementMap.getField(element, 'initialTop'),
        cachedAppliedTop      = elementMap.getField(element, 'appliedTop');

      if (currentInlineTop !== cachedAppliedTop) {
        cachedInitialTop = currentInlineTop;
      }

      element.style.top      = cachedInitialTop;
      // Absolute elements return the used top value if there isn't one specified. Setting the position to static ensures
      // that only specified top values are returned with the computed style
      // EXCEPTION: IE returns the used value for both
      if (!platform.browser.isIE) {
        element.style.position = 'static';
      }

      var
        specifiedTop   = getComputedStyle(element).top,
        specifiedValue = parseFloat(specifiedTop);


      if (!isNaN(specifiedValue) && specifiedTop.indexOf('px') >= 0) {
        element.style.top = (specifiedValue * state.fixedZoom) + 'px';
      }

      element.style.position = currentInlinePosition;
      cachedAppliedTop       = element.style.top;
      elementMap.setField(element, 'initialTop', cachedInitialTop);
      elementMap.setField(element, 'appliedTop', cachedAppliedTop);
    }

    function restoreTop(element) {
      var
        currentInlineTop = element.style.top,
        cachedInitialTop = elementMap.getField(element, 'initialTop'),
        cachedAppliedTop = elementMap.getField(element, 'appliedTop');

      // The inline top value has mutated from what we've set, so keep the current value
      if (currentInlineTop !== cachedAppliedTop) {
        return;
      }

      element.style.top = cachedInitialTop;
    }

    function onTargetAdded(element) {
      element.style[transformOriginProperty] = isTransformXOriginCentered ? '50% 0' : '0 0';
      // This handler runs when a style relevant to @element's bounding rectangle has mutated
      rectCache.listenForMutatedRect(element, function () {
        /*jshint validthis: true */
        if (targets.has(this)) {
          scaleTop(element);
          fixZIndex(element);
          refreshElementTransform(this);
        }
        /*jshint validthis: false */
      });
      rectCache.listenForMutatedRect(originalBody);
      refreshElementTransform(element);
    }

    function onTargetRemoved(element) {
      element.style[transformProperty]       = '';
      element.style[transformOriginProperty] = '';
      restoreTop(element);
      rectCache.delete(element);
      // This is the cached metadata we used for transforming the element. We need to clear it now that
      // the information is stale
      elementMap.flushField(element, [
        'lastPageXOffset', 'lastPageYOffset', 'scale', 'unscaledTop'
      ]);
      refreshResizeListener();
      refreshScrollListener(element);
    }

    function onScroll() {

      function transformOnScroll() {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        animationFrame = requestAnimationFrame(function () {
          transformAllTargets({});
        });
      }

      var
        currentOffsets        = viewport.getPageOffsets(),
        xDelta                = currentOffsets.x - cachedXOffset,
        yDelta                = currentOffsets.y - cachedYOffset,
        doVerticalTransform   = Boolean(tallElements.length),
        doHorizontalTransform = Boolean(wideElements.length);
      cachedXOffset = currentOffsets.x;
      cachedYOffset = currentOffsets.y;

      if ((xDelta && doHorizontalTransform) || (yDelta && doVerticalTransform)) {
        transformOnScroll();
      }
    }

    function refreshScrollListener(element) {
      var
        viewportDims   = viewport.getInnerDimensions(),
        viewportHeight = viewportDims.height,
        viewportWidth  = viewportDims.width;

      function identifyTallOrWideElement(element) {
        var
          rect   = rectCache.getRect(element, 'fixed'),
          height = rect.height,
          width  = rect.width;

        if (height > viewportHeight) {
          arrayUtil.addUnique(tallElements, element);
        }
        else {
          tallElements = arrayUtil.remove(tallElements, element);
        }

        if (width > viewportWidth) {
          arrayUtil.addUnique(wideElements, element);
        }
        else {
          wideElements = arrayUtil.remove(wideElements, element);
        }
      }

      // If this function is called when we add a transform target, evaluate the new target
      if (element) {
        identifyTallOrWideElement(element);
      }
      // If this function is called at the end of a zoom, evaluate all fixed targets
      else {
        tallElements = [];
        wideElements = [];
        targets.forEach(identifyTallOrWideElement);
      }

      var
        doTransformOnHorizontalScroll = Boolean(wideElements.length),
        doTransformOnVerticalScroll   = Boolean(tallElements.length),
        doTransformOnScroll           = doTransformOnHorizontalScroll || doTransformOnVerticalScroll,
        addOrRemoveFn;

      scrollbars.forceScrollbars(doTransformOnHorizontalScroll, doTransformOnVerticalScroll);

      if (doTransformOnScroll !== isTransformingOnScroll) {
        addOrRemoveFn = doTransformOnScroll ? domEvents.on : domEvents.off;
        addOrRemoveFn(window, 'scroll', onScroll, { capture: false });
        isTransformingOnScroll = doTransformOnScroll;
      }
    }

    function onZoom() {
      nativeFn.setTimeout(function () {
        targets.forEach(scaleTop);
        refresh();
      }, 0);
    }

    // Typically these are shift transforms that assume that the body is untransformed. Once we transform the body, these fixed elements will effectively
    // be absolutely positioned relative to the body and thus do not need to be specifically shifted. We'll update these transformations once they've been
    // transplanted.
    function clearInvalidTransforms() {
      targets.forEach(function (element) {
        if (!platform.browser.isIE && state.completedZoom === 1 && elementInfo.isInOriginalBody(element)) {
          element.style[transformProperty] = '';
        }
      });
    }

    function refresh() {
      transformAllTargets({
        resetTranslation: true
      });
      refreshScrollListener();
    }

    function init(toolbarHght) {
      if (toolbarHght) {
        toolbarHeight = toolbarHght;
      }
      originalBody               = document.body;
      shouldRestrictWidth        = config.shouldRestrictWidth;
      isTransformXOriginCentered = !shouldRestrictWidth;
      rectCache.init(isTransformXOriginCentered);
      // In Chrome we have to trigger a repaint after we transform elements because it causes blurriness
      shouldRepaintOnZoomChange  = platform.browser.isChrome;
      transformProperty          = platform.transformProperty;
      transformOriginProperty    = platform.transformOriginProperty;
      targets.init();
      targets.registerAddHandler(onTargetAdded);
      targets.registerRemoveHandler(onTargetRemoved);
      events.on('zoom', onZoom);
      events.on('zoom/begin', clearInvalidTransforms);
    }

    return {
      init: init,
      refresh: refresh,
      allTargets: transformAllTargets
    };
  });