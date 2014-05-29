/**
 * This module adjusts fixed position elements to correctly render
 * for the current zoom and scroll position in the window.
 * It is used as little as possible because it runs code on scroll events, which can slow down scrolling significantly.
 */
sitecues.def('fixed-fixer', function (fixedfixer, callback) {

  'use strict';

  sitecues.use('jquery', 'zoom', 'conf', 'platform', 'cursor', 'util/common',
    function ($, zoom, conf, platform, cursor, common) {

      var isOn = false,
        verticalShift            = 0,    // IE specific bug fix for horizontal scrollbars
        lastScrollY              = 0,    // IE specific fix
        horizScrollbarHeight     = 0, // IE specific fix
        fixedSelector            = '',  //CSS selectors & properties that specify position:fixed
        eventsToListenTo         = platform.browser.isIE ? 'scroll mousewheel' : 'scroll',
        lastAdjustedElements     = $();

      // Get the number of pixels tha page has been shifted by the horizontal scrollbar
      // (this calculates the correct scroll bar height even when the height/width of scrollbars
      // are changed in the OS.
      // This is necessary to offset positioned items in IE when transform scale is used,
      // but only after the user scrolls down.
      function getVerticalShiftForIEBug() {
        if (!platform.ieVersion.isIE10 && !platform.ieVersion.isIE11) {
          return 0;
        }

        if (!horizScrollbarHeight) {
          horizScrollbarHeight = common.getHorizontalScrollbarHeight();
        }

        var newScrollY = window.pageYOffset,
          isLastScrollDown = lastScrollY < newScrollY;
        lastScrollY = newScrollY;
        return isLastScrollDown ? horizScrollbarHeight : 0;
      }


      /**
       * Positions a fixed element as if it respects the viewport rule.
       * Also clears the positioning if the element is no longer fixed.
       * @param  elements [element to position]
       */
      function adjustElement(index, element) {
        var zoom = conf.get('zoom'),
            transform = '',
            transformOrigin = '', rect;
        if ($(element).css('position') === 'fixed') {
          if (!platform.browser.isIE) {
            transform = 'translate(' + window.pageXOffset/zoom + 'px, ' +
              window.pageYOffset/zoom + 'px)';
          } else {
            rect = element.getBoundingClientRect();
            transform = 'scale('+ zoom +')';
            transformOrigin =  (-rect.left) + 'px ' + (-rect.top - verticalShift/zoom) + 'px';
          }
        }
        $(element).css({
          transform: transform,
          transformOrigin: transformOrigin
        });
      }

      /**
       * [When the page scrolls, reposition fixed elements, badge, and panel]
       */
      function onScroll() {
        verticalShift = getVerticalShiftForIEBug();
        refresh();
      }

      /*
       For every fixed element on the page, we must translate them to their correct positions using
       transforms.  This basically happens on scroll events. We must apply
       the transforms that are reactions to the scroll events on top of any transforms.
       */
      function refresh() {
        var elementsToAdjust = $(fixedSelector);
        // Include last adjusted elements to ensure our adjustment styles are cleared if the element is no longer fixed
        elementsToAdjust.add(lastAdjustedElements).each(adjustElement);
        lastAdjustedElements = elementsToAdjust;
      }

      function getFixedPositionSelector() {
        var selectors = [];
        cursor.getStyles('position', 'fixed', function(rule) {
          selectors.push(rule.selectorText);
        });
        return selectors.join();
      }

      /**
       * [Listens for events emitted by the cursor module, which indicates that new CSS has
       * been added to the <style id='sitecues-css'></style>.  This is necessary to get any
       * fixed positioned elements that are not used on a page when sitecues first loads.
       * Basically, it gets any styles that declare position:fixed so we can later filter for
       * any elements that are dynamically fixed.]
       * @return {[type]} [description]
       */
      sitecues.on('cursor/addingStyles', function () {
        fixedSelector = getFixedPositionSelector();
        if (fixedSelector) {
          lazyInit(conf.get('zoom'));
        }
      });

      /**
       * [Now that the html element has a new level of scale and width, reposition fixed elements, badge, and panel]
       */
      sitecues.on('zoom', function (zoom) {
        lazyInit(zoom);
        refresh();
      });

      // Initialize only when we really have to, because it's a very, very bad idea to
      // attach handlers to the window scroll event:
      // http://ejohn.org/blog/learning-from-twitter

      function lazyInit(zoom) {
        var doTurnOn = fixedSelector.length && zoom > 1;

        if (doTurnOn === isOn) {
          return;
        }
        isOn = doTurnOn;

        if (doTurnOn) {
          $(window).on(eventsToListenTo, onScroll);
        }
        else {
          $(window).off(eventsToListenTo, onScroll);
        }

        refresh();
      }

      callback();
    });

});