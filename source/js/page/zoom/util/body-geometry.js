define(
  [
    '$',
    'page/util/common',
    'page/zoom/config/config',
    'page/zoom/constants',
    'page/zoom/state',
    'page/zoom/util/restrict-zoom',
    'core/platform',
    'page/zoom/util/viewport'
  ],
  function (
    $,
    common,
    config,
    constants,
    state,
    restrictZoom,
    platform,
    viewport
  ) {

  'use strict';

  var body, $body, docElem,
    isInitialized = false,
    callbacks = [],
    cachedDocumentScrollWidth,
    cachedDocumentScrollHeight,
    cachedBoundingBodyWidth,
    cachedBoundingBodyHeight,
    zoomLevelWhenCached,
    // Should document scrollbars be calculated by us?
    // Should always be true for IE, because it fixes major positioning bugs
    shouldManuallyAddScrollbars,
    originalBodyInfo, // The info we have on the body, including the rect and mainNode
    MIN_RECT_SIDE  = constants.MIN_RECT_SIDE,
    ZOOM_PRECISION = constants.ZOOM_PRECISION;

  // This is the body's currently visible width, with zoom factored in
  function getBodyWidth() {
    // Use the originally measured visible body width
    init();

    // If width was restricted
    var divisorUsedToRestrictWidth = config.shouldRestrictWidth ? restrictZoom.forFluidWidth(state.completedZoom) : 1;

    // Multiply be the amount of zoom currently used
    return state.completedZoom * originalBodyInfo.width / divisorUsedToRestrictWidth;
  }

  function getBodyRight() {
    init();

    return originalBodyInfo.right * state.completedZoom;
  }

  function getBodyLeft() {
    init();

    return originalBodyInfo.leftMostNode.getBoundingClientRect().left + window.pageXOffset;
  }

  function getMainNode() {
    init();

    return originalBodyInfo.mainNode;
  }

  // Is it a fluid layout?
  function isFluidLayout() {
    if (originalBodyInfo.width === window.outerWidth) {
      // Handle basic case -- this works for duxburysystems.com, where the visible body content
      // spans the entire width of the available space
      return true;
    }
    // We consider it fluid if the main node we discovered inside the body changes width
    // if we change the body's width.
    var
      originalBodyWidth = body.style.width,
      origWidth = originalBodyInfo.mainNode.clientWidth,
      newWidth,
      isFluid;
    body.style.width = (viewport.getInnerWidth() / 5) + 'px';
    newWidth = originalBodyInfo.mainNode.clientWidth;
    isFluid = origWidth !== newWidth;
    body.style.width = originalBodyWidth;
    return isFluid;
  }

  // Get the rect for visible contents in the body, and the main content node
  function computeBodyInfo() {
    var bodyInfo = { },
      visibleNodes = [ ],
      mainNode,
      mainNodeRect = { width: 0, height: 0 },
      leftMostNode,
      leftMostCoord = 9999, // Everything else will be smaller
      rightMostNode,
      rightMostCoord = 0,
      startNode = $(config.visibleRoots)[0] || body,
      MIN_WIDTH_MAIN_NODE = 300,
      bodyStyle = getComputedStyle(body);

    getBodyRectImpl(startNode, bodyInfo, visibleNodes, bodyStyle, true);

    if (!visibleNodes.length) {
      getBodyRectImpl(startNode, bodyInfo, visibleNodes, bodyStyle);
    }

    bodyInfo.width = bodyInfo.right - bodyInfo.left;
    bodyInfo.height = bodyInfo.bottom - bodyInfo.top;

    // Find tallest node
    visibleNodes.forEach(function(node) {
      var rect = node.rect;
      if (rect.height >= mainNodeRect.height && rect.width > MIN_WIDTH_MAIN_NODE) {
        if (rect.height > mainNodeRect.height || rect.width > mainNodeRect.width) {
          mainNodeRect = rect;
          mainNode = node.domNode;
        }
      }
      if (rect.left < leftMostCoord) {
        leftMostNode = node.domNode;
        leftMostCoord = rect.left;
      }
      if (rect.right > rightMostCoord) {
        rightMostNode = node.domNode;
        rightMostCoord = rect.right;
      }
    });

    bodyInfo.mainNode = mainNode || document.body;
    bodyInfo.leftMostNode = leftMostNode;
    bodyInfo.rightMostNode = rightMostNode;
    cachedBoundingBodyWidth = body.getBoundingClientRect().width;
    cachedDocumentScrollWidth = docElem.scrollWidth;
    zoomLevelWhenCached = state.completedZoom;
    bodyInfo.transformOriginX = cachedBoundingBodyWidth / 2;

    return bodyInfo;
  }

  function willAddRect(newRect, node, style, parentStyle, isStrict) {
    if (node === document.body) {
      return;
    }

    // Strict checks
    if (isStrict) {
      if (node.childNodes.length === 0 ||
        newRect.width < MIN_RECT_SIDE || newRect.height < MIN_RECT_SIDE ||
          // Watch for text-align: center or -webkit-center -- these items mess us up
        style.textAlign.indexOf('center') >= 0) {
        return;
      }
    }

    // Must check
    if (newRect.left < 0 || newRect.top < 0 ||
      style.visibility !== 'visible') {
      return;
    }

    // Good heuristic -- when x > 0 it tends to be a useful rect
    if (newRect.left > 0) {
      return true;
    }

    // newRect.left === 0
    // We usually won't these rectangles flush up against the left margin,
    // but will add them if there are visible children.
    // If we added them all the time we would often have very large left margins.
    // This rule helps get left margin right on duxburysystems.com.
    if (style.overflow !== 'visible' || !common.hasVisibleContent(node, style, parentStyle)) {
      return; // No visible content
    }

    return true;
  }

  // Recursively look at rectangles and add them if they are useful content rectangles
  function getBodyRectImpl(node, sumRect, visibleNodes, parentStyle, isStrict) {
    var newRect = getAbsoluteRect(node),
      style = getComputedStyle(node);
    if (willAddRect(newRect, node, style, parentStyle, isStrict)) {
      addRect(sumRect, newRect);
      visibleNodes.push({ domNode: node, rect: newRect });
      return;  // Valid rectangle added. No need to walk into children.
    }
    $(node).children().each(function() {
      //For some reason, Edge will run this function despite there not being any element children belonging to the element. Edge...
      //TODO: Remove this conditional if Edge ever gets its act together. Reproducible here: www.njstatelib.org
      //NOTE: Does not reproduce when the console is open. Yeah that was a fun one to figure out
      if (this.nodeType === 1) {
        getBodyRectImpl(this, sumRect, visibleNodes, style, isStrict);
      }
    });
  }

  // Add the rectangle to the sum rect if it is visible and has a left margin > 0
  function addRect(sumRect, newRect) {
    if (isNaN(sumRect.left) || newRect.left < sumRect.left) {
      sumRect.left = newRect.left;
    }
    if (isNaN(sumRect.right) || newRect.right > sumRect.right) {
      sumRect.right = newRect.right;
    }
    if (isNaN(sumRect.top) || newRect.top < sumRect.top) {
      sumRect.top = newRect.top;
    }
    if (isNaN(sumRect.bottom) || newRect.bottom > sumRect.bottom) {
      sumRect.bottom = newRect.bottom;
    }
  }

  // Gets the absolute rect of a node
  // Does not use getBoundingClientRect because we need size to include overflow
  function getAbsoluteRect(node) {
    var
      clientRect = node.getBoundingClientRect(),
      width = clientRect.width, //  Math.max(node.scrollWidth, clientRect.width),
      height = Math.max(node.scrollHeight, clientRect.height),
      left = clientRect.left + window.pageXOffset,
      top = clientRect.top + window.pageYOffset;
    return {
      left: left,
      top: top,
      width: width,
      height: height,
      right: left + width,
      bottom: top + height
    };
  }

  // Return a formatted string for translateX as required by CSS
  function getFormattedTranslateX(targetZoom) {
    if (config.shouldRestrictWidth) {
      return '';  // For fluid layouts, we use an transform-origin of 0% 0%, so we don't need this
    }
    var zoomOriginX = Math.max(window.innerWidth, originalBodyInfo.transformOriginX) / 2, // X-coordinate origin of transform
      bodyLeft = originalBodyInfo.left,
      halfOfBody = (zoomOriginX - bodyLeft) * targetZoom,
      pixelsOffScreenLeft = (halfOfBody - zoomOriginX) + config.leftMarginOffset,
      pixelsToShiftRight = Math.max(0, pixelsOffScreenLeft),
      translateX = pixelsToShiftRight / targetZoom;

    // Need to shift entire zoom image to the right so that start of body fits on screen
    return 'translateX(' + translateX.toFixed(ZOOM_PRECISION) + 'px)';
  }

  // Get the desired width of the body for the current level of zoom
  function getRestrictedBodyWidth(currZoom) {
    // For a short period of time, we tried the following, in a commit that suggested it helped reduce horizontal panning.
    // However, that change led to SC-3191
    //var winWidth = originalBodyInfo.width;

    return window.innerWidth / restrictZoom.forFluidWidth(currZoom) + 'px';
  }

  // Return cached body info or undefined if unknown
  function getOriginalBodyInfo() {
    return originalBodyInfo;
  }

  function getScrollWidth(onResize) {
    var
      isIE  = platform.browser.isIE,
      width = isIE ? cachedDocumentScrollWidth : cachedBoundingBodyWidth;

    if (onResize || !width || state.completedZoom !== zoomLevelWhenCached) {
      if (isIE) {
        cachedDocumentScrollWidth = docElem.scrollWidth;
        width = cachedDocumentScrollWidth;
      }
      else {
        cachedBoundingBodyWidth = body.getBoundingClientRect().width;
        width = cachedBoundingBodyWidth;
      }
      zoomLevelWhenCached = state.completedZoom;
    }
    return width;
  }
  
  function getScrollHeight(onResize) {
    var
      isIE  = platform.browser.isIE,
      height = isIE ? cachedDocumentScrollHeight : cachedBoundingBodyHeight;
  
    if (onResize || !height || state.completedZoom !== zoomLevelWhenCached) {
      if (isIE) {
        cachedDocumentScrollHeight = docElem.scrollHeight;
        height = cachedDocumentScrollHeight;
      }
      else {
        cachedBoundingBodyHeight = body.getBoundingClientRect().height;
        height = cachedBoundingBodyHeight;
      }
      zoomLevelWhenCached = state.completedZoom;
    }
    return height;
  }

  function refreshBodyInfo() {
    originalBodyInfo = computeBodyInfo();
  }

  function executeCallbacks() {
    callbacks.forEach(function (callback) {
      callback();
    });
    callbacks = [];
  }

  // We are going to remove scrollbars and re-add them ourselves, because we can do a better job
  // of knowing when the visible content is large enough to need scrollbars.
  // This also corrects the dreaded IE scrollbar bug, where fixed position content
  // and any use of getBoundingClientRect() was off by the height of the horizontal scrollbar, or the
  // width of the vertical scroll bar, but only when the user scrolled down or to the right.
  // By controlling the visibility of the scrollbars ourselves, the bug magically goes away.
  // This is also good because we're better than IE at determining when content is big enough to need scrollbars.
  function determineScrollbars() {
    if (!shouldManuallyAddScrollbars) {
      return;
    }

    // Use scrollbars if necessary for size of content
    // Get the visible content rect (as opposed to element rect which contains whitespace)
    var rect = computeBodyInfo(),
      right = Math.max(rect.right, rect.width),
      bottom = Math.max(rect.bottom, rect.height),
      winHeight = window.innerHeight,
      winWidth = window.innerWidth;

    // -- Clear the scrollbars --
    $('html').css({
      overflowX: 'hidden',
      overflowY: 'hidden'
    });

    // -- Set the scrollbars after a delay --
    // If the right side of the visible content is beyond the window width,
    // or the visible content is wider than the window width, show the scrollbars.
    // Doing this after a timeout fixes SC-3722 for some reason -- the toolbar was moving up and down by the height
    // of the horizontal scrollbar. It's as if doing it on a delay gives IE/Edge a chance to
    // deal with zoom first, and then scrollbars separately
    setTimeout(function() {
      $('html').css({
        overflowX: right > winWidth ? 'scroll' : 'hidden',
        overflowY: bottom > winHeight ? 'scroll' : 'hidden'
      });
    }, 0);
  }

  // Scroll content to maximize the use of screen real estate, showing as much content as possible.
  // In effect, stretch the bottom-right corner of the visible content down and/or right
  // to meet the bottom-right corner of the window.
  function maximizeContentVisibility() {
    var bodyRight = getOriginalBodyInfo().rightMostNode.getBoundingClientRect().right, // Actual right coord of visible content
      bodyHeight = getScrollHeight(),
      winWidth = viewport.getInnerWidth(),
      winHeight = viewport.getInnerHeight(),
      hScrollNow = viewport.getPageXOffset(),
      vScrollNow = viewport.getPageYOffset(),
    // How much do we need to scroll by to pull content to the bottom-right corner
      hScrollDesired = Math.max(0, winWidth - bodyRight), // Amount to pull right as a positive number
      vScrollDesired = Math.max(0, winHeight - bodyHeight), // Amount to pull down as a positive number
    // Don't scroll more than we actually can
      hScroll = Math.min(hScrollNow, hScrollDesired),
      vScroll = Math.min(vScrollNow, vScrollDesired);

    window.scrollBy(-hScroll, -vScroll); // Must negate the numbers to get the expected results
  }

  // Ensure that initial body info is ready
  function init(callback) {

    if (isInitialized) {
      if (callback) {
        callback();
      }
      return;
    }
    else if (callback) {
      callbacks.push(callback);
    }

    // We expect <body> to be defined now, but we're being defensive
    // (perhaps future extension will init and call us very early).
    if (document.body) {
      isInitialized = true;
      // IE doesn't know when to put in scrollbars after CSS transform
      // Edge does, but we need to do this because of SC-3722 -- jiggling of Sitecues toolbar during vertical scrolls
      shouldManuallyAddScrollbars = platform.browser.isMS;
      body = document.body;
      docElem = document.documentElement;
      $body = $(body);
      refreshBodyInfo();
      executeCallbacks();
      return;
    }

    // No document.body yet
    if (document.readyState !== 'loading') {
      init(callback);
    }
    else {
      document.addEventListener('DOMContentLoaded', function() {
        init(callback);
      });
    }

    // Not necessary to use CSS will-change with element.animate()
    // Putting this on the <body> is too much. We saw the following message in Firefox's console:
    // Will-change memory consumption is too high. Surface area covers 2065500 pixels, budget is the document
    // surface area multiplied by 3 (450720 pixels). All occurrences of will-change in the document are
    // ignored when over budget.
    // shouldUseWillChangeOptimization =
    // typeof body.style.willChange === 'string' && !shouldUseElementDotAnimate;
  }

  return {
    isFluidLayout: isFluidLayout,
    getBodyWidth: getBodyWidth,
    getRestrictedBodyWidth: getRestrictedBodyWidth,
    getBodyRight: getBodyRight,
    getBodyLeft: getBodyLeft,
    getMainNode: getMainNode,
    getOriginalBodyInfo: getOriginalBodyInfo,
    getScrollWidth: getScrollWidth,
    getScrollHeight: getScrollHeight,
    computeBodyInfo: computeBodyInfo,
    refreshBodyInfo: refreshBodyInfo,
    getFormattedTranslateX: getFormattedTranslateX,
    maximizeContentVisibility: maximizeContentVisibility,
    determineScrollbars: determineScrollbars,
    init: init
  };
});