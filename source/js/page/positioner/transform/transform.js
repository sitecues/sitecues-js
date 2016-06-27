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
define(
  [
    'page/positioner/util/element-map',
    'page/zoom/util/body-geometry',
    'page/zoom/state',
    'page/positioner/transform/targets',
    'page/viewport/viewport',
    'page/positioner/util/element-info',
    'core/platform',
    'page/positioner/util/rect-cache',
    'core/dom-events',
    'page/positioner/util/array-utility',
    'page/zoom/style',
    'page/viewport/scrollbars'
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
    scrollbars
  ) {

  'use strict';

  var
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

    var
      resetCurrentTranslation  = opts.resetTranslation,
      pageOffsets              = viewport.getPageOffsets(),
      viewportDims             = viewport.getInnerDimensions(),
      currentPageXOffset       = pageOffsets.x,
      currentPageYOffset       = pageOffsets.y,
      lastPageXOffset          = elementMap.getField(element, 'lastPageXOffset') || currentPageXOffset,
      lastPageYOffset          = elementMap.getField(element, 'lastPageYOffset') || currentPageYOffset,
      viewportWidth            = viewportDims.width,
      viewportHeight           = viewportDims.height,
      currentScale             = elementInfo.getScale(element, 'fixed'),
      unscaledRect             = rectCache.getUnscaledRect(element, currentScale),
      translationValues        = getTranslationValues(element),
      currentXTranslation      = translationValues.x,
      currentYTranslation      = translationValues.y,
      verticalScrollDifference = currentPageYOffset - lastPageYOffset;

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
      newScale        = restrictScale(unscaledRect, opts.onResize),
      newXTranslation = currentXTranslation,
      newYTranslation = currentYTranslation;
    elementMap.setField(element, 'scale', newScale);

    if (!unscaledRect.width || !unscaledRect.height) {
      setNewTransform(element, 0, 0, newScale);
      cachePageOffsets(element, currentPageXOffset, currentPageYOffset);
      return;
    }

    // Calculate the dimensions of the fixed element after we apply the next scale transform
    var rect = {
      width: unscaledRect.width * newScale,
      height: unscaledRect.height * newScale,
      top: unscaledRect.top,
      left: unscaledRect.left
    };
    rect.bottom = rect.top  + rect.height;
    rect.right  = rect.left + rect.width;

    newXTranslation = calculateXTranslation({
      dimensions: rect,
      currentXTranslation: currentXTranslation,
      viewportWidth: viewportWidth,
      scrollDifference: currentPageXOffset - lastPageXOffset,
      currentPageXOffset: currentPageXOffset,
      lastPageXOffset: lastPageXOffset
    });
    
    newYTranslation = calculateYTranslation({
      dimensions: rect,
      currentYTranslation: currentYTranslation,
      viewportHeight: viewportHeight,
      scrollDifference: verticalScrollDifference,
      currentPageYOffset: currentPageYOffset,
      resetCurrentTranslation: resetCurrentTranslation
    });

    var
      xDelta = resetCurrentTranslation ? newXTranslation : newXTranslation - currentXTranslation,
      yDelta = resetCurrentTranslation ? newYTranslation : newYTranslation - currentYTranslation;

    rect.top    += yDelta;
    rect.bottom += yDelta;
    rect.left   += xDelta;
    rect.right  += xDelta;

    setNewTransform(element, newXTranslation, newYTranslation, newScale);
    cachePageOffsets(element, currentPageXOffset, currentPageYOffset);
    rectCache.update(element, rect);
  }

  function calculateXTranslation(args) {
    var
      currentXTranslation = args.currentXTranslation,
      elementWidth        = args.dimensions.width,
      right               = args.dimensions.right,
      viewportWidth       = args.viewportWidth,
      lastPageXOffset     = args.lastPageXOffset,
      currentPageXOffset  = args.currentPageXOffset,
      newXTranslation     = currentXTranslation,
      scrollWidth         = bodyGeo.getScrollWidth();

    // If the fixed element is wider than the viewport
    if (elementWidth > viewportWidth) {
      var
        scrollDifference     = currentPageXOffset - lastPageXOffset,
        correctedXOffset     = currentXTranslation,
        xTranslationLimit    = viewportWidth - elementWidth,
        scrollLimit          = scrollWidth - viewportWidth,
        offsetRemaining      = Math.abs(xTranslationLimit - currentXTranslation),
        rightScrollRemaining = scrollLimit - currentPageXOffset,
        scrollPercent        = currentPageXOffset / scrollLimit;

      // If the scroll distance to the edge of the page is less than the distance required to translate the
      // fixed element completely into the viewport, set the current x offset to a proportional value to the current pageXOffset
      if (offsetRemaining > rightScrollRemaining) {
        correctedXOffset = xTranslationLimit * scrollPercent;
      }

      // Translate the fixed element to pan 1:1 with the page scroll
      newXTranslation = Math.min(Math.max(correctedXOffset - scrollDifference, xTranslationLimit), 0);
    }
    // If the fixed element's right edge is outside of the viewport, we need to shift it back inside the viewport
    else if ((right + currentXTranslation) > viewportWidth) {
      newXTranslation = (-right + currentXTranslation + viewportWidth - MARGIN_FROM_EDGE);
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

    // This clause shifts fixed elements if necessary. We shift fixed elements if they are clipping the boundaries of the toolbar
    // or if they are positioned in the middle 60% of the viewport height. This heuristic works pretty well, we don't shift elements that
    // are near the bottom of the screen, and we don't shift dropdown fixed menus that are intended to be flush with the top menu
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
          yTranslationLimit = viewportHeight - elementHeight - toolbarHeight,
          scrollLimit       = scrollHeight - viewportHeight,
          offsetRemaining   = Math.abs(yTranslationLimit - currentYTranslation),
          scrollRemaining   = scrollLimit - currentPageYOffset,
          scrollPercent     = currentPageYOffset / scrollLimit;

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

  function restrictScale(dimensions, onResize) {
    var scrollWidth = bodyGeo.getScrollWidth(onResize);
    // If the fixed element is wider than the body, scale it back down to fit the body
    return Math.min(state.fixedZoom, scrollWidth / dimensions.width);
  }

  function shouldVerticallyShiftFixedElement(top, bottom, viewportHeight, elementHeight) {
    var
      isOverlappingToolbar = top < toolbarHeight,
      closeToTop           = viewportHeight * 0.2 > top,
      closeToBottom        = viewportHeight * 0.8 < bottom,
      isInMiddle           = !closeToTop && !closeToBottom,
      isTallerThanViewport = elementHeight > viewportHeight;

    // Fixed elements that are close to the bottom or top are much more likely to be part of fixed menus that are
    // intended to be flush with the edges of the viewport
    return isTallerThanViewport || isOverlappingToolbar || isInMiddle;
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
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(function () {
        transformAllTargets({
          resetTranslation: true,
          onResize: true
        });
      }, 200);
    }

    var doTransformOnResize = Boolean(targets.getCount());

    if (!isTransformingOnResize && doTransformOnResize) {
      // There may be css media rules that radically change the positioning when the viewport is resized
      window.addEventListener('resize', onResize);
    }
    else if (isTransformingOnResize && !doTransformOnResize) {
      window.removeEventListener('resize', onResize);
    }
  }

  function refreshElementTransform() {
    /*jshint validthis: true */
    transformFixedElement(this, {
      resetTranslation: true
    });
    refreshScrollListener(this);
    refreshResizeListener();
    /*jshint validthis: false */
  }

  function onTargetAdded(element) {
    element.style[transformOriginProperty] = '0 0';
    // This handler runs when a style relevant to @element's bounding rectangle has mutated
    rectCache.listenForMutatedRect(element, refreshElementTransform);
    refreshElementTransform.call(element);
  }

  function onTargetRemoved(element) {
    element.style[transformProperty]       = '';
    element.style[transformOriginProperty] = '';
    // This is the cached metadata we used for transforming the element. We need to clear it now that
    // the information is stale
    elementMap.flushField(element, [
      'lastPageXOffset', 'lastPageYOffset', 'scale'
    ]);
    refreshResizeListener(element);
    refreshScrollListener();
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
        rect   = rectCache.getRect(element),
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
      targets.get().forEach(identifyTallOrWideElement);
    }

    var
      doTransformOnHorizontalScroll = Boolean(wideElements.length),
      doTransformOnVerticalScroll   = Boolean(tallElements.length),
      doTransformOnScroll           = doTransformOnHorizontalScroll || doTransformOnVerticalScroll,
      addOrRemoveFn;

    scrollbars.forceScrollbars(doTransformOnHorizontalScroll, doTransformOnVerticalScroll);
    if (doTransformOnScroll !== isTransformingOnScroll) {
      addOrRemoveFn = doTransformOnScroll ? domEvents.on : domEvents.off;
      addOrRemoveFn(window, 'scroll', onScroll, {capture: false});
      isTransformingOnScroll = doTransformOnScroll;
    }
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
    rectCache.init();
    // In Chrome we have to trigger a repaint after we transform elements because it causes blurriness
    shouldRepaintOnZoomChange = platform.browser.isChrome;
    transformProperty         = platform.transformProperty;
    transformOriginProperty   = platform.transformOriginProperty;
    targets.init();
    targets.registerAddHandler(onTargetAdded);
    targets.registerRemoveHandler(onTargetRemoved);
  }

  return {
    init: init,
    refresh: refresh,
    allTargets: transformAllTargets
  };
});