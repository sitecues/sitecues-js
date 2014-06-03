sitecues.def('zoom', function (zoom, callback) {
 
  'use strict';

  // Values used for zoom math
  zoom.max = 3;
  zoom.min = 1;
  zoom.step = 0.1;
  zoom.defaultLevel = 1;
  zoom.precision = 0.1;

  // Calculate the zoom range. This calc is used throughout library. Easier to do here only.
  zoom.range = zoom.max - zoom.min;

  // Save this value to reduce the width of the <html> when zooming
  var originalDocumentWidth = getDocumentWidth();

  function getDocumentWidth() {
    // We used to use document.documentElement.clientWidth, but this caused the page
    // to continually shrink on resize events.
    // Check out some different methods for determining viewport size: http://ryanve.com/lab/dimensions/
    // More information on document.documentElement.clientWidth and browser viewports: http://www.quirksmode.org/mobile/viewports.html
    return window.outerWidth;
  }

  // get dependencies
  sitecues.use('jquery', 'conf', 'util/common', 'platform', function ($, conf, common, platform) {
    var zoomConfig = {
      doManualScrollbars: platform.browser.isIE,
      repaintOnZoomChange: platform.browser.isChrome && platform.os.isWin
      // In the future we are likely to go back to using the zoom property again, as it looks
      // much better in Chrome on Windows (text is crisper, kerning looks right)
      //useZoomProperty: false //(platform.browser.isChrome && platform.os.isWin)
    };

    // use conf module for sharing
    // current zoom level value
    conf.def('zoom', function (value) {

      value = parseFloat(value);

      // value is too small
      if (value < zoom.min){
        return zoom.min;
      }

      // value is too big
      if (value > zoom.max){
        return zoom.max;
      }

      // use precision to get right value
      value = (value / zoom.precision) * zoom.precision;

      // value have float value
      return parseFloat(value.toFixed(1));
    });

    // define default value for zoom if needed
    if (!conf.get('zoom')) {
      conf.set('zoom', zoom.defaultLevel);
    }

    // handle zoom/increase event fired by any module
    sitecues.on('zoom/increase', function() {
      conf.set('zoom', conf.get('zoom') + zoom.step);
    });

    // handle zoom/decrease event fired by any module
    sitecues.on('zoom/decrease', function() {
      conf.set('zoom', conf.get('zoom') - zoom.step);
    });

      /**
     * [renderPage purpose is to render text clearly in browsers (chrome windows only (for now))
     * that do not repaint the DOM when using CSS Transforms.  This function simply sets a
     * property, which is hopefully not set on pages sitecues runs on, that forces repaint.
     * 15ms of time is required, because the browser may not be done transforming
     * by the time Javascript is executed without the setTimeout.
     *
     * See here: https://equinox.atlassian.net/wiki/display/EN/Known+Issues
     *
     * Note: This problem is not consistent across websites.  This function is in response to
     * behavior experienced on www.nytimes.com]
     *
     * Weird: Aaron tried to reverse this and it caused the text on nytimes.com to blur every 7 seconds. WEIRD!!!
     */
    var forceRepaintToEnsureCrispText = function () {
      document.body.style.webkitBackfaceVisibility = '';
      setTimeout(function() {
        document.body.style.webkitBackfaceVisibility = 'hidden';
      }, 15);
    };

    /**
    * [Window resizing will change the size of the viewport. In the zoom function we use the original size of the
    * viewport to properly resize the html elements' width.  We must also re-zoom the page as it handles the logic
    * to properly scale, resize, and position the page and its' elements.]
    */
    $(window).resize(function () {
      var zoom = conf.get('zoom');
      originalDocumentWidth = getDocumentWidth();
      adjustPageStyleForZoomAndWidth(zoom);  // Do not emit zoom event here since zoom is not changing
      sitecues.emit('resize');
    });

    /**
    * [
    * The width of the html element should always match the width of the viewport.
    * document.documentElement.clientWidth reports the *viewport* dimensions (regardless of the <html> dimensions)
    * in CSS pixels and is cross-browser compatible.  Does not factor in the scrollbar dimensions.
    * ]
    * 
    */
    function zoomFn(currZoom) {
      adjustPageStyleForZoomAndWidth(currZoom);
      sitecues.emit('zoom', currZoom);   // notify all about zoom change
    }

    function adjustPageStyleForZoomAndWidth(currZoom) {
      if (currZoom === 1) {
        // Clear all CSS values
        $('html').css({ width: '', transform: '', transformOrigin: '', overflow: '', zoom: '', textRendering: '' });
        document.body.style.webkitBackfaceVisibility = '';
        return;
      }

      if (zoomConfig.doManualScrollbars) {
        // In IE we control the visibility of scrollbars ourselves, which corrects the dreaded
        // scrollbar bug in IE, where fixed position content and any use of getBoundingClientRect()
        // was off by the height of the horizontal scrollbar, or the width of the vertical scroll bar,
        // but only when the user scrolled down or to the right.
        // By controlling the visibility of the scrollbars ourselves, the bug magically goes away.
        // This is also good because we're better than IE at determining when content is big enough to need scrollbars.
        // Step 1: remove the scrollbars before changing zoom.
        // Step 2 (below): re-add the scrollbar if necessary for size of content
        document.documentElement.style.overflow = 'hidden';
      }
      var newCss = {
        width: Math.round(originalDocumentWidth / currZoom) + 'px',
        transformOrigin: '0% 0%', // By default the origin for the body is 50%, setting to 0% zooms the page from the top left.
        transform: 'scale(' + currZoom + ')'
      };
      newCss.textRendering = 'optimizeLegibility';
      $('html').css(newCss);

      // Un-Blur text in Chrome
      if (zoomConfig.repaintOnZoomChange) {
        forceRepaintToEnsureCrispText();
      }

      // Part 2 of IE horizontal scrollbar fix: re-add scrollbars if necessary
      // Get the visible content rect (as opposed to element rect which contains whitespace)
      if (zoomConfig.doManualScrollbars) {
        var rect,
          range = document.createRange(),
          winHeight = window.innerHeight,
          winWidth = window.innerWidth;
        range.selectNodeContents(document.body);
        rect = range.getBoundingClientRect();
        // If the right side of the visible content is beyond the window width,
        // or the visible content is wider than the window width, show the scrollbars.
        if (rect.right > winWidth || rect.width > winWidth) {
          document.documentElement.style.overflowX = 'scroll';
        }
        if (rect.bottom > winHeight || rect.height > winHeight) {
          document.documentElement.style.overflowY = 'scroll';
        }
      }
    }

    // Get and set are now in 'source/js/conf/user/manager.js'
    conf.get('zoom', zoomFn);  //This use to be an anonymous function,
                               //but we must force a zoom if the browser window is resized
    // done
    callback();

  });

});