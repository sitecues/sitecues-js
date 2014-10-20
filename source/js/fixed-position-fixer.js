/**
 * This module adjusts fixed position elements to correctly render
 * for the current zoom and scroll position in the window.
 * It is used as little as possible because it runs code on scroll events, which can slow down scrolling significantly.
 */
sitecues.def('fixed-fixer', function (fixedfixer, callback) {

  'use strict';

  sitecues.use('jquery', 'zoom', 'platform', 'style-service',
    function ($, zoomMod, platform, styleService) {

      var isOn = false,
        fixedSelector            = '',   //CSS selectors & properties that specify position:fixed
        lastAdjustedElements     = $(),
        MAX_ZOOM_FIXED_CONTENT = 1.8;

      /*
       For every fixed element on the page, we must translate them to their correct positions using
       transforms.  This basically happens on scroll events. We must apply
       the transforms that are reactions to the scroll events on top of any transforms.
       */
      function refresh() {
        /**
         * Positions a fixed element as if it respects the viewport rule.
         * Also clears the positioning if the element is no longer fixed.
         * (It's often the case that toolbars become fixed only after the user scrolls,
         * and returning to the top of the document returns the toolbar to non-fixed positioning).
         * @param  elements [element to position]
         */
        function adjustElement(index, element) {
          var transform = '',
            transformOrigin = '',
            maxWidth = '';

          if ($(element).css('position') === 'fixed') {
            transform = 'translate(' + offsetLeft + 'px, ' + offsetTop + 'px)';
            if (scaleTransform < 1) {
              transform += ' scale(' + scaleTransform + ')';
              transformOrigin = '0% 0%';
            }
            maxWidth = (winWidth / fixedItemZoom) + 'px';
          }
          $(element).css({
            transform: transform,
            transformOrigin: transformOrigin,
            maxWidth: maxWidth
          });
        }

        var elementsToAdjust = $(fixedSelector),
          // The current amount of zoom applied to the fixed content
          pageZoom = zoomMod.getCompletedZoom(),
          // The actual amount of zoom we want for the fixed content.
          // It can be up to MAX_ZOOM_FIXED_CONTENT
          fixedItemZoom = Math.min(pageZoom, MAX_ZOOM_FIXED_CONTENT),
          // Amount to scale to bring fixed position content down to MAX_ZOOM_FIXED_CONTENT
          // Will be 1 if the current zoom level is <= MAX_ZOOM_FIXED_CONTENT, because the size doesn't need to change.
          // Otherwise, will be < 1 in order to reduce the size.
          scaleTransform = fixedItemZoom / pageZoom,
          bodyRect = document.body.getBoundingClientRect(),
          // Amount to move the fixed positioned items so that they appear in the correct place
          offsetLeft = (- bodyRect.left / pageZoom),
          offsetTop = (- bodyRect.top / pageZoom),
          // To help restrict the width of toolbars
          winWidth = window.innerWidth;

        // Include last adjusted elements to ensure our adjustment styles are cleared if the element is no longer fixed
        elementsToAdjust.add(lastAdjustedElements).each(adjustElement);
        lastAdjustedElements = elementsToAdjust;
      }

      // Get a CSS selector matching all elements that can be position: fixed
      function getFixedPositionSelector() {
        var styles = styleService.getAllMatchingStyles('position', 'fixed'),
          selectors = styles.map(function(style) { return style.rule.selectorText; });
        return selectors.join();
      }

      /**
       * Listens for events emitted by the cursor module, which indicates that new CSS has
       * been added to the <style id='sitecues-css'></style>.  This is necessary to get any
       * fixed positioned elements that are not used on a page when sitecues first loads.
       * Basically, it gets any styles that declare position:fixed so we can later filter for
       * any elements that are dynamically fixed.
       * @return {[type]} [description]
       */
      function initializeModule() {
        sitecues.on('style-service/ready', function () {
          fixedSelector = getFixedPositionSelector();
          if (fixedSelector) {
            lazyTurnOn(zoomMod.getCompletedZoom());
          }
        });

        /**
         * Now that the html element has a new level of scale and width, reposition fixed elements, badge, and panel
         */
        sitecues.on('zoom', function (zoom) {
          lazyTurnOn(zoom);
          refresh();
        });

        sitecues.on('zoom/begin', function () {
          // Temporarily hide until smooth zooming ends
          // This is done because during smooth zoom, the fixed toolbars tend
          // to migrate into the middle of the page, which looks weird.
          // Better to hide and then reshow them in the right place, until
          // we come up with a more clever solution.
          $(fixedSelector).css('transform', 'translate(-9999px,-9999px)');
        });
      }


      if (!platform.browser.isIE) {
        initializeModule();
      }

      // Initialize only when we really have to, because it's a very, very bad idea to
      // attach handlers to the window scroll event:
      // http://ejohn.org/blog/learning-from-twitter
      function lazyTurnOn(zoom) {
        var doTurnOn = fixedSelector && zoom > 1;

        if (!doTurnOn) {
          return;
        }
        // We used to turn the scroll listener off when the user went back to 1x, but nowadays
        // the sitecues transform stays on the body in that case, in order to avoid the Chrome jerk-back bug on zoom
        if (!isOn) {
          isOn = true;
          $(window).on('scroll', refresh);
        }

        refresh();
      }

      callback();
    });

});