//  TODO
//  * Get rid of all jerk-back code
//  * If JS animation works best everywhere, just use it and get rid of key frames stuff
//  * Bug bash
//  * Unit tests & docs

sitecues.def('zoom', function (zoom, callback) {

  'use strict';

  // get dependencies
  sitecues.use('jquery', 'conf', 'platform',
    function ($, conf, platform) {
      if (window !== window.top) {
        return; // Only zoom top level window -- TODO explain why
      }
      var
        // Default zoom configuration
        // Can be customized via zoom.provideCustomConfig()
        zoomConfig = {
          // Should smooth zoom animations be enabled?
          shouldSmoothZoom: true,

          // Is the web page responsively designed?
          isResponsive: undefined, // Can override in site preferences

          // Should the width of the page be restricted as zoom increases?
          // This is helpful for pages that try to word-wrap or use responsive design
          // Eventually use fast page health calculation to automatically determine this
          // Assumes window width of 1440 (maximized screen on macbook)
          maxZoomToRestrictWidthIfResponsive: 1.35,

          // Set to 5 on sites where the words get too close to the left window's edge
          leftMarginOffset: 0
        },
        body = document.body,
        $body = $(body),
        originalBodyInfo,
        minZoomChangeTimer,  // Keep zooming at least for this long, so that a pressing/clicking A/+/- does a step
        zoomAnimator,
        zoomEvent,
        currentZoom = 1,
        currentTargetZoom = 1,
        startZoomTime,      // If no current zoom operation, this is cleared (0 or undefined)
        animationStyleSheet,

        // Should document scrollbars be calculated by us?
        // Should always be true for IE, because it fixes major positioning bugs
        shouldManuallyAddScrollbars = platform.browser.isIE,

        // Should we repaint when zoom is finished (after any animations)?
        // Should always be true in Chrome, because it makes text crisper
        shouldRepaintOnZoomChange = platform.browser.isChrome,

        // Optimize fonts for legibility? Helps a little bit with Chrome on Windows
        shouldOptimizeLegibility = platform.browser.isChrome && platform.os.isWin,

        // Native form control CSS fix -- automagically fixes the form appearance issues in Chrome when zooming
        shouldFixNativeFormAppearance =  platform.browser.isChrome && platform.os.isMac,

        MIN_ZOOM_PER_CLICK = 0.16,
        MS_PER_X_ZOOM = 1600,// For animations, the number of milliseconds per unit of zoom (e.g. from 1x to 2x)
        ZOOM_PRECISION = 4, // Decimal places
        SITECUES_ZOOM = 'sitecues-zoom';

      // ------------------------ PUBLIC -----------------------------

      // Values used for zoom math
      zoom.max = 3;
      zoom.min = 1;
      zoom.step = 0.01;
      zoom.range = zoom.max - zoom.min;

      // Allow customization of zoom configuration on a per-website basis
      zoom.provideCustomZoomConfig = function(customZoomConfig) {
        $.extend(zoomConfig, customZoomConfig);
      };

      // Use to jump the current zoom immediately to the targetZoom requested
      // The use case for this is currently the zoom slider
      zoom.jumpTo = function(targetZoom) {
        if (!isCurrentlyZooming()) {
          beginZoomOperation(targetZoom);
        }
        else {
          currentTargetZoom = getSanitizedZoomValue(targetZoom); // Change target
        }
        cancelFrame(zoomAnimator);
        if (currentZoom !== currentTargetZoom) {
          zoomAnimator = requestFrame(applyInstantZoomUpdate);
        }
        currentZoom = currentTargetZoom;
      };

      // ------------------------ PRIVATE -----------------------------

      function shouldSmoothZoom() {
        if (SC_DEV && zoomEvent && zoomEvent.shiftKey) {
          return true; // Dev override -- use animation no matter what
        }

        return zoomConfig.shouldSmoothZoom;
      }

      function shouldRestrictWidth() {
        return zoomConfig.isResponsive;
      }

      function getSanitizedZoomValue(value) {
        value = parseFloat(value);

        // value is too small
        if (!value || value < zoom.min){
          return zoom.min;
        }

        // value is too big
        if (value > zoom.max){
          return zoom.max;
        }

        // value have float value
        return parseFloat(value.toFixed(ZOOM_PRECISION));
      }

      function getActualZoom() {
        var transform = $body.css('transform');
        return getSanitizedZoomValue(transform.substring(7));
      }

      function applyJSAnimation() {
        function jsZoomStep(/*currentTime*/) {  // Firefox passes in a weird startZoomTime that can't be compared with Date.now()
          timeElapsed = Date.now() - startZoomTime;
          zoomChange = Math.min(timeElapsed / MS_PER_X_ZOOM, totalZoomChangeRequested);
          nextZoom = currentZoom + zoomDirection * zoomChange;
          $body.css(getZoomCss(nextZoom));
          if (nextZoom === currentTargetZoom) {
            finishZoomOperation();
          }
          zoomAnimator = requestFrame(jsZoomStep);
        }

        var totalZoomChangeRequested = Math.abs(currentTargetZoom - currentZoom),
          zoomDirection = currentTargetZoom > currentZoom ? 1 : -1,
          timeElapsed,
          zoomChange,
          nextZoom;

        zoomAnimator = requestFrame(jsZoomStep);
      }

      function beginGlide(targetZoom) {
        if (!isCurrentlyZooming() && targetZoom !== currentZoom) {
          beginZoomOperation(targetZoom);
          if (!shouldSmoothZoom()) {
            // When no animations -- just be clunky and zoom a bit closer to the target
            var delta = currentZoom < targetZoom ? MIN_ZOOM_PER_CLICK : -MIN_ZOOM_PER_CLICK;
            currentTargetZoom = currentZoom + delta;
            applyInstantZoomUpdate();
            finishZoomOperation();
          }
          else {
            applyJSAnimation();
          }
        }
      }

      // When an A button or +/- key is pressed, we always glide at least MIN_ZOOM_PER_CLICK.
      // This provides a consistent amount of zoom change for discrete presses.
      function stopGlideIfEnough() {
        if (!isCurrentlyZooming()) {
          return;
        }
        var achievedZoom = getActualZoom(),
          zoomRemainingBeforeMin = MIN_ZOOM_PER_CLICK - Math.abs(achievedZoom - currentZoom),
          msBeforeZoomFinished = zoomRemainingBeforeMin * MS_PER_X_ZOOM;

        if (msBeforeZoomFinished <= 0) {
          currentTargetZoom = achievedZoom;
          finishZoomOperation();
        }
        else {
          minZoomChangeTimer = setTimeout(stopGlideNow, msBeforeZoomFinished);
        }
      }

      function stopGlideNow() {
        currentTargetZoom = getActualZoom();
        finishZoomOperation();
      }

      function getRestrictedWidth(currZoom) {
        // Adjust for current window width
        var winWidth = window.outerWidth,
          maxZoomToRestrictWidth = zoomConfig.maxZoomToRestrictWidthIfResponsive * (winWidth / 1440),
          useZoom = Math.min(currZoom, maxZoomToRestrictWidth);
        // We used to use document.documentElement.clientWidth, but this caused the page
        // to continually shrink on resize events.
        // Check out some different methods for determining viewport size: http://ryanve.com/lab/dimensions/
        // More information on document.documentElement.clientWidth and browser viewports: http://www.quirksmode.org/mobile/viewports.html
        return (winWidth / useZoom) + 'px';
      }

      function beginZoomOperation(targetZoom) {
        // Make sure we're ready
        initZoomModule();

        // Ensure no other operation is running
        clearZoomCallbacks();

        // Remove scrollbars -- we will re-add them after zoom if content is large enough
        removeScrollbars();

        // Add general stylesheet fixes if we haven't already
        applyZoomStyleSheetFixes();

        // Make sure all animations are dead
        // Temporarily disable mouse cursor events and CSS behavior, to help with zoom performance
        $body.css({
          pointerEvents: 'none'
        });

        sitecues.emit('zoom/begin');

        currentTargetZoom = getSanitizedZoomValue(targetZoom);
        startZoomTime = Date.now();
      }

      function isCurrentlyZooming() {
        return startZoomTime;
      }

      function finishZoomOperation() {
        currentZoom = currentTargetZoom;
        startZoomTime = 0;

        if (currentZoom === 1) {
          clearAllCss();
        }
        else {
          // Add scrollbars back in where necessary
          addScrollbars();
        }

        // Restore mouse cursor events and CSS behavior
        $body.css('pointerEvents', '');

        // When zooming is finished, we will restrict the width
        // Un-Blur text in Chrome
        repaintToEnsureCrispText();

        // notify all about zoom change
        conf.set('zoom', currentZoom);
        sitecues.emit('zoom', currentZoom);

        clearZoomCallbacks();
      }

      function clearZoomCallbacks() {
        // Ensure no further changes to zoom from this operation
        cancelFrame(zoomAnimator);
        clearTimeout(minZoomChangeTimer);
      }

      /**
       * repaintToEnsureCrispText's purpose is to render text clearly in browsers (chrome only)
       * that do not repaint the DOM when using CSS Transforms.  This function simply sets a
       * property, which is hopefully not set on pages sitecues runs on, that forces repaint.
       * 15ms of time is required, because the browser may not be done transforming
       * by the time Javascript is executed without the setTimeout.
       *
       * See here: https://equinox.atlassian.net/wiki/display/EN/Known+Issues
       */
      function repaintToEnsureCrispText() {
        // We used to use backfaceVisibility trick, but it erased backgrounds on the body.
        // This was done as follows:
        //   $(body).css('backfaceVisibility', '');
        //   setTimeout(function() { $(body).css('backfaceVisibility', 'hidden') }, 15);
        // Luckily, inserting a shim seems to work now (may not have in previous versions of Chrome when we tried it)
        if (!shouldRepaintOnZoomChange) {
          return;
        }
        var appendedDiv = $('<div>')
          .css({
            position: 'fixed',
            width: '1px',
            height: '1px',
            backgroundColor: 'transparent',
            pointerEvents: 'none'
          })
          .appendTo('html');
        setTimeout(function () {
          appendedDiv.remove();
        }, 15);
      }

      function removeScrollbars() {
        if (shouldManuallyAddScrollbars) {
          // We are going to remove scrollbars and re-add them ourselves, because we can do a better job
          // of knowing when the visible content is large enough to need scrollbars.
          // This also corrects the dreaded IE scrollbar bug, where fixed position content
          // and any use of getBoundingClientRect()
          // was off by the height of the horizontal scrollbar, or the width of the vertical scroll bar,
          // but only when the user scrolled down or to the right.
          // By controlling the visibility of the scrollbars ourselves, the bug magically goes away.
          // This is also good because we're better than IE at determining when content is big enough to need scrollbars.
          // Step 1: remove the scrollbars before changing zoom.
          // Step 2 (below): re-add the scrollbar if necessary for size of content
          document.documentElement.style.overflow = 'hidden';
        }
      }

      function addScrollbars() {
        // Re-add scrollbars if necessary
        // Get the visible content rect (as opposed to element rect which contains whitespace)
        if (shouldManuallyAddScrollbars) {
          var rect = getBodyInfo(), // TODO check perf
            right = Math.max(rect.right, rect.width),
            bottom = Math.max(rect.bottom, rect.height),
            winHeight = window.innerHeight,
            winWidth = window.innerWidth;

          // If the right side of the visible content is beyond the window width,
          // or the visible content is wider than the window width, show the scrollbars.
          $('html').css({
            overflowX: right > winWidth ? 'scroll' : 'hidden',
            overflowY: bottom > winHeight ? 'scroll' : 'hidden'
          });
        }
      }

      function requestFrame(fn) {
        if (shouldSmoothZoom()) {
          // Don't use in Firefox until they fix rendering corruption bug with wide windows and retina displays.
          // The bug shows the contents of the window as 1/4 the size during some moments of the animation
          var req = window.requestAnimationFrame || window.msRequestAnimationFrame;
          if (req) {
            return req(fn);
          }
        }
        return setTimeout(fn, 16);
      }

      function cancelFrame(id) {
        var cancel = window.cancelAnimationFrame || window.msCancelRequestAnimationFrame;
        if (cancel) {
          cancel(id);
        }
        else {
          clearTimeout(id);
        }
      }

      function getZoomStylesheetFixes() {
        return shouldFixNativeFormAppearance ?
          // Adding this CSS automagically fixes the form issues in Chrome when zooming
          'select[size="1"] { border: 1px solid #bbb;' +
          'background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#ffffff), color-stop(35%,#f9f9f9), color-stop(100%,#dddddd)); }\n\n'
          : ''
      }

      function applyZoomStyleSheetFixes() {
        if (!animationStyleSheet) {
          var css = getZoomStylesheetFixes();
          if (css === '') {
            return; // Nothing to apply, no need to create style sheet
          }
          animationStyleSheet = document.createElement('style');
          animationStyleSheet.id = SITECUES_ZOOM;
          $('head').append(animationStyleSheet)
          animationStyleSheet.innerHTML = css;
        }
      }

      function getFormattedTranslateX(translateX) {
        return shouldRestrictWidth() ? '' : 'translateX(' + translateX + 'px)';
      }

      function getZoomCss(targetZoom) {
        var translateX = getTranslateX(targetZoom),
          transform = 'scale(' + targetZoom + ') ' + getFormattedTranslateX(translateX),
          css = {
            transform: transform
          };
        if (shouldRestrictWidth()) {
          css.width = getRestrictedWidth(targetZoom);
        }

        return css;
      }

      function getTranslateX(currZoom) {
        var halfOfWindow = window.outerWidth / 2,
          bodyLeft = originalBodyInfo.left,
          halfOfBody = (halfOfWindow - bodyLeft) * currZoom,
          pixelsOffScreenLeft = (halfOfBody - halfOfWindow) + zoomConfig.leftMarginOffset,
          pixelsToShiftRight = Math.max(0, pixelsOffScreenLeft);

        // Need to shift entire zoom image to the right so that start of body fits on screen
        return pixelsToShiftRight / currZoom;
      }

      function clearAllCss() {
        if (platform.browser.isIE9) {
          console.log('IE9');
          return;
        }
        console.log('Not IE9');
        // It is a best practice to clean up after ourselves
        // Clear all CSS values
        $body.css({
          transform: '',
          transformOrigin: '',
          overflow: '',
          width: '',
          perspective: '',
          backfaceVisibility: ''
        });

        $(animationStyleSheet).remove();
        animationStyleSheet = null;
      }

      function applyInstantZoomUpdate() {
        currentTargetZoom = getSanitizedZoomValue(currentTargetZoom);
        $body.css(getZoomCss(currentTargetZoom));
      }

      // Perform the initial zoom on load
      function initialZoom(targetZoom) {
        if (shouldSmoothZoom()) {
          beginGlide(targetZoom);  // Animation is faster for initial load
        }
        else {
          beginZoomOperation(targetZoom);
          applyInstantZoomUpdate();
          finishZoomOperation();
        }
      }


      // Is it a responsive page?
      function isResponsiveDesign() {
        // We consider it responsive if the main node we discovered inside the body changes width
        // if we change the body's width.
        var origWidth = originalBodyInfo.mainNode.scrollWidth,
          newWidth,
          isResponsive;
        body.style.width = (window.outerWidth / 5) + 'px';
        newWidth = originalBodyInfo.mainNode.scrollWidth;
        isResponsive = (origWidth !== newWidth);
        body.style.width = '';

        return isResponsive;
      }

      // Get the rect for visible contents in the body, and the main content node
      function getBodyInfo() {
        var bodyInfo = { },
          visibleNodes = [ ],
          mainNode,
          mainNodeRect = { width: 0, height: 0 },
          MIN_WIDTH_MAIN_NODE = 300;

        getBodyRectImpl(body, bodyInfo, visibleNodes);

        bodyInfo.width = bodyInfo.right - bodyInfo.left;
        bodyInfo.height = bodyInfo.bottom - bodyInfo.top;

        // Find tallest node
        visibleNodes.forEach(function(node) {
          var rect = getAbsoluteRect(node);
          if (rect.height >= mainNodeRect.height && rect.width > MIN_WIDTH_MAIN_NODE) {
            if (rect.height > mainNodeRect.height || rect.width > mainNodeRect.width) {
              mainNodeRect = rect;
              mainNode = node;
            }
          }
        });
        bodyInfo.mainNode = mainNode;

        return bodyInfo;
      }

      function getBodyRectImpl(node, sumRect, visibleNodes) {
        var newRect = getAbsoluteRect(node);
        newRect.right = newRect.left + newRect.width;
        newRect.bottom = newRect.top + newRect.height;
        if (addRect(sumRect, newRect)) {
          visibleNodes.push(node);
          return;  // Valid rectangle added. No need to walk into children.
        }
        $(node).children().each(function() {
          getBodyRectImpl(this, sumRect, visibleNodes);
        });
      }

      function addRect(sumRect, newRect) {
        if (newRect.left > 0 && newRect.top >= 0 &&
          newRect.width > 1 && newRect.height > 1) {
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
          return true; // Successfully added
        }
      }

      // Gets the absolute rect of a node
      // Does not use getBoundingClientRect because we need size to include overflow
      function getAbsoluteRect(node) {
        var clientRect = node.getBoundingClientRect(),
          width = Math.max(node.scrollWidth, clientRect.width),
          height = Math.max(node.scrollHeight, clientRect.height);
        return {
          left: clientRect.left,
          top: clientRect.top,
          width: width,
          height: height,
          right: clientRect.left + width,
          bottom: clientRect.top + height
        };
      }

      // Lazy init, saves time on page load
      function initZoomModule() {
        if (originalBodyInfo) {
          return;
        }

        originalBodyInfo = getBodyInfo();

        if (typeof zoomConfig.isResponsive === 'undefined') {
          zoomConfig.isResponsive = isResponsiveDesign();
        }

        $body
          // CSS that is shared between various types of animation
          .css({
            // Allow the content to be horizontally centered, unless it would go
            // offscreen to the left, in which case start zooming the content from the left-side of the window
            transformOrigin: shouldRestrictWidth() ? '0% 0%' : '50% 0%',
            // These two properties prevent webKit from having the jump back bug when we pause the animation
            perspective: 999,
            backfaceVisibility: 'hidden'
          });

        if (shouldOptimizeLegibility) {
          $body.css('textRendering', 'optimizeLegibility');
        }

        if (SC_DEV) {
          console.log('_______________________________________________________');
          console.log("Zoom configuration: %o", zoomConfig);
          console.log("Window width: %o", window.outerWidth);
          console.log("Visible body rect: %o", originalBodyInfo);
          console.log("isResponsive?: %o", zoomConfig.isResponsive);
          console.log('_______________________________________________________');
        }
      }

      /**
       * Recompute the visible body size, and re-zoom the page as that handles the logic
       * to properly scale, resize, and position the page and its elements with respect to the current
       * sizes of the body and window.
       */
      $(window).resize(function () {
        if (currentZoom > 1) {
          $body.css(getZoomCss(1));
          originalBodyInfo = getBodyInfo();
          $body.css(getZoomCss(currentZoom));
          removeScrollbars();
          if (shouldRestrictWidth()) {
            // Restrict the width of the body so that it works similar to browser zoom
            // Documents designed to fit the width of the page still will
            $body.css('width', getRestrictedWidth(currentZoom));
          }
          addScrollbars();
          sitecues.emit('resize');
        }
        else {
          originalBodyInfo = null; // Invalidate our initialized data
        }
      });

      // use conf module for sharing current zoom level value
      conf.def('zoom', function (value) {
        return getSanitizedZoomValue(value);
      });

      // Set up listeners for zoom  operations
      sitecues.on('zoom/stop-slider', finishZoomOperation);
      sitecues.on('zoom/stop-button', stopGlideIfEnough);
      sitecues.on('zoom/increase', function(event) {
        // Increase up to max or until zoom/stop requested
        zoomEvent = event;
        beginGlide(zoom.max);
      });
      sitecues.on('zoom/decrease', function(event) {
        zoomEvent = event;
        beginGlide(zoom.min);
      });

      // define default value for zoom if needed
      var targetZoom = conf.get('zoom');
      if (!targetZoom) {
        // Initialize as soon as panel opens for faster slider responsiveness
        sitecues.on('panel/show', initZoomModule);
      }
      else if (targetZoom > 1) {
        initialZoom(targetZoom);
      }

      callback();
    });

});