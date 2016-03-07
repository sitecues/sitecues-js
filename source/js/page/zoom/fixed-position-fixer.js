/**
 * This module adjusts fixed position elements to correctly render
 * for the current zoom and scroll position in the window.
 * It is used as little as possible because it runs code on scroll events, which can slow down scrolling significantly.
 */
define(['$', 'page/zoom/zoom', 'core/platform', 'core/conf/site', 'page/style-service/style-service', 'core/events'],
  function ($, zoomMod, platform, site, styleService, events) {

    var isOn = false,
      toolbarHeight = 0,
      fixedSelector            = null,   //CSS selectors & properties that specify position:fixed
      unjoinedFixedSelectors   = null,
      lastAdjustedElements     = $(),
      autoRefreshTimer,         // Refresh fixed elements every now and then even if no scroll, e.g. a user's click may have made a fixed lightbox appear
      autoRefreshMs = site.get('fixedPositionRefreshMs'),   // How often to refresh the fixed elements even without a scroll (or falsey if not at all). Recommended setting is 500
      POSITION_STYLESHEET_NAME = 'sitecues-js-position',
      ATTR_SHIFT_INLINE_FIXED = 'data-sc-shift-inline-fixed',
      MAX_ZOOM_FIXED_CONTENT = 1.8,
      domObserver,
      // These browsers need the position of fixed elements to be adjusted on the fly.
      // Note: we avoid this in Safari on Mac and Chrome on Windows because of general shakiness.
      //       In those browsers the fixed content just gets scrolled off when the user scrolls down.
      SHOULD_POSITION_FIXED_ELEMENTS_ON_SCROLL = platform.browser.isFirefox ||
        (platform.browser.isChrome && platform.os.isMac),
      // In IE, fixed content stays fixed even with a transform, so the position does not need to be corrected.
      // However, the fixed elements are not scaled. We therefore need to apply the scale transform directly to the fixed elements.
      SHOULD_ZOOM_FIXED_ELEMENTS = platform.browser.isIE,
      SHOULD_POSITION_FIXED_ELEMENTS_BELOW_TOOLBAR = true;

    /*
     For every fixed element on the page, we must translate them to their correct positions using
     transforms.  This basically happens on scroll events. We must apply
     the transforms that are reactions to the scroll events on top of any transforms.
     */
    function refresh(didZoomChange) {

      var elementsToAdjust, pageZoom, appliedFixedItemZoom, desiredFixedItemZoom,
        scaleTransform, doScrollFix, anchorForFixedElems, anchorRect, newOffsetLeft,
        newOffsetTop, winWidth;

      /**
       * Positions a fixed element as if it respects the viewport rule.
       * Also clears the positioning if the element is no longer fixed.
       * (It's often the case that toolbars become fixed only after the user scrolls,
       * and returning to the top of the document returns the toolbar to non-fixed positioning).
       * @param  elements [element to position]
       */
      function adjustElement(index, element) {
        var id = element.id,
          idPrefix = id && id.split('-')[0];
        if (idPrefix === 'sitecues' || idPrefix === 'scp') {
          return;
        }

        var css = {
          transform: ''
        };

        var computedStyle = getComputedStyle(element);

        if (computedStyle.display === 'none') {
          return; // Don't bother with hidden elements, we don't know their coordinates
        }

        if (computedStyle.position === 'fixed') {
          if (SHOULD_POSITION_FIXED_ELEMENTS_BELOW_TOOLBAR && !doScrollFix && toolbarHeight && element.offsetTop < toolbarHeight) {
            newOffsetTop += toolbarHeight / appliedFixedItemZoom;
          }
          if (SHOULD_POSITION_FIXED_ELEMENTS_ON_SCROLL) {
            css.transform = 'translate3d(' + newOffsetLeft + 'px, ' + newOffsetTop + 'px,0px) ';
          }
          if (scaleTransform !== 1) {
            css.transform += 'scale(' + scaleTransform + ')';
          }
          if (didZoomChange) {
            css.maxWidth = (winWidth / desiredFixedItemZoom) + 'px';
          }
        }
        else {
          css.maxWidth = ''; // Not fixed -- clear width restriction
        }
        if (css.transform) {
          // So that our fix doesn't caused fixed position bars to slowly move down screen, e.g.
          // http://www.ibtimes.com/spiders-rain-down-australia-millions-reportedly-descended-sky-town-1925810
          css.transitionProperty = 'none';
        }
        $(element).css(css);
      }

      elementsToAdjust = $(fixedSelector);
      // The current amount of zoom applied to the page
      pageZoom = zoomMod.getCompletedZoom();
      // The current amount of zoom applied to the fixed content
      appliedFixedItemZoom = SHOULD_ZOOM_FIXED_ELEMENTS ? 1 : pageZoom;
      // The actual amount of zoom we want for the fixed content.
      // It can be up to MAX_ZOOM_FIXED_CONTENT
      desiredFixedItemZoom = Math.min(pageZoom, MAX_ZOOM_FIXED_CONTENT);
      // Amount to scale to bring fixed position content down to MAX_ZOOM_FIXED_CONTENT
      // Will be 1 if the current zoom level is <= MAX_ZOOM_FIXED_CONTENT, because the size doesn't need to change.
      // Otherwise, will be < 1 in order to reduce the size.
      scaleTransform = desiredFixedItemZoom / appliedFixedItemZoom;
      doScrollFix = document.body.style.transform && SHOULD_POSITION_FIXED_ELEMENTS_ON_SCROLL;
      anchorForFixedElems = document.documentElement;
      anchorRect = anchorForFixedElems.getBoundingClientRect();
      // Amount to move the fixed positioned items so that they appear in the correct place
      newOffsetLeft = - anchorRect.left / pageZoom;
      newOffsetTop = doScrollFix ? -anchorRect.top / pageZoom: 0;
      // To help restrict the width of toolbars
      winWidth = window.innerWidth;

      // Include last adjusted elements to ensure our adjustment styles are cleared if the element is no longer fixed
      elementsToAdjust.add(lastAdjustedElements).each(adjustElement);
      lastAdjustedElements = elementsToAdjust;
    }

    // Get a CSS selector matching all elements that can be position: fixed
    function getFixedPositionSelector() {
      if (!fixedSelector) {
        fixedSelector = getUnjoinedFixedPositionSelectors().join();
      }
      return fixedSelector;
    }

    function getUnjoinedFixedPositionSelectors() {

      function getUnjoinedSelectors(prop, val) {
        var styles = styleService.getAllMatchingStyles(prop, val);
        return styles.map(function (style) { return style.rule.selectorText; });
      }

      if (!unjoinedFixedSelectors) {
        unjoinedFixedSelectors = getUnjoinedSelectors('position', 'fixed');
      }
      return unjoinedFixedSelectors;
    }

    // Show or hide fixed position elements
    function setAllowMouseEvents(doAllowMouse) {
      var selector = getFixedPositionSelector(),
        supportsPointerEventsCss = !platform.browser.isIE || platform.browser.version > 10,
        applyCssProp = supportsPointerEventsCss ? 'pointerEvents' : 'none',
        applyCssValue = doAllowMouse ? '' : 'none';

      $(selector).css(applyCssProp, applyCssValue);
    }

    function refreshTimer() {
      refresh();
      autoRefreshTimer = setTimeout(refreshTimer, autoRefreshMs);
    }

    function isOriginalPlacementBelowToolbar(element, isShifted) {
      var top = element.getBoundingClientRect().top;
      //If we've already applied a shift, remove it
      if (isShifted === true) {
        top -= toolbarHeight;
      }
      return top >= toolbarHeight;
    }

    //This stylesheet is responsible for shifting down fixed elements that are above the toolbar
    function createPositionStyleSheet(fixedPosSelectors) {
      var $style,
        //Start with the data attribute selector for inline positioning
        shiftSelector = '[' + ATTR_SHIFT_INLINE_FIXED + '="true"]',
        //The rule responsible for shifting elements down the page
        rule = '{ margin-top: ' + toolbarHeight + 'px !important}';

      function updateStylesheet() {
        $style.text(shiftSelector + rule);
      }

      function addSelector(selector) {
        shiftSelector += ', ' + selector;
        updateStylesheet();
      }

      //If there isn't a toolbar on the page, don't worry about shifting fixed position elements
      if (!toolbarHeight) {
        return;
      }

      //Add sheet to document, with selector for inline fixed elements
      $style = $('<style>');
      $style.appendTo('head')
        .attr('id', POSITION_STYLESHEET_NAME);
      updateStylesheet();

      //Add each selector to the stylesheet, in document order, as soon as we know we should
      //This way we won't mistakenly add selectors that shouldn't be shifted down if they are descending from a shifted selector
      fixedPosSelectors.forEach(function evaluateSelectedElements(selector) {
        var elements = document.querySelectorAll(selector);
        if (!elements.length) {
          //If this selector doesn't currently apply to any elements, it's probably added dynamically during runtime, and is less likely to be
          //a fixed background (i.e. something we don't need to shift)
          //We could listen for class changes with the mutation observer, but I haven't seen a site that this breaks yet so I'm inclined not
          //to add additional strain
          addSelector(selector);
        }
        else if (!Array.prototype.every.call(elements, isOriginalPlacementBelowToolbar)) {
          //If at least one selected element is above the toolbar, add the selector
          addSelector(selector);
        }
      });

    }

    function listenForInlineFixedPositioning() {
      domObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          var target      = mutation.target,
            isShifted     = target.getAttribute(ATTR_SHIFT_INLINE_FIXED) === 'true',
            isShiftNeeded = target.style.position === 'fixed' && !isOriginalPlacementBelowToolbar(target, isShifted);
          if (isShifted !== isShiftNeeded) {
            target.setAttribute(ATTR_SHIFT_INLINE_FIXED, isShiftNeeded);
          }
        });
      });
      //This doesn't handle the case of inserting a node into the tree with an inline fixed position. It's a possible case
      //but not very likely, if it proves to be a problem we can add inserted nodes to the listener
      domObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });
    }

    /**
     * Basically, it gets any styles that declare position:fixed so we can later filter for
     * any elements that are dynamically fixed.
     * @return {[type]} [description]
     */
    function initializeModule() {
      styleService.init(function () {
        var selectors = getUnjoinedFixedPositionSelectors();
        if (selectors) {
          createPositionStyleSheet(selectors);
          if (!platform.browser.isIE || platform.browser.version > 10) {
            listenForInlineFixedPositioning();
          }
          lazyTurnOn();
        }
      });

      /**
       * Now that the html element has a new level of scale and width, reposition fixed elements, badge, and panel
       */
      events.on('zoom resize', function () {
        lazyTurnOn();
        refresh(true);
      });

      events.on('zoom/begin', function () {
        // Temporarily hide until smooth zooming ends
        // This is done because during smooth zoom, the fixed toolbars tend
        // to migrate into the middle of the page, which looks weird.
        // Better to hide and then reshow them in the right place, until
        // we come up with a more clever solution.
        $(fixedSelector).css('transform', 'translate(-9999px,-9999px)');
      });
    }

    // Initialize only when we really have to, because it's a very, very bad idea to
    // attach handlers to the window scroll event:
    // http://ejohn.org/blog/learning-from-twitter
    function lazyTurnOn() {
      var doTurnOn = getFixedPositionSelector() && document.body.style.transform !== '';

      if (!doTurnOn) {
        if (SHOULD_POSITION_FIXED_ELEMENTS_ON_SCROLL) {
          if (SC_DEV) {
            console.log('fixed-position-fixer: scroll listening off');
          }
          $(window).off('scroll', refresh);
        }
        clearTimeout(autoRefreshTimer);
        return;
      }
      // We used to turn the scroll listener off when the user went back to 1x, but nowadays
      // the sitecues transform stays on the body in that case, in order to avoid the Chrome jerk-back bug on zoom
      if (!isOn) {
        isOn = true;
        if (SHOULD_POSITION_FIXED_ELEMENTS_ON_SCROLL) {
          if (SC_DEV) {
            console.log('fixed-position-fixer: scroll listening on');
          }
          $(window).on('scroll', refresh);
        }

        if (autoRefreshMs) {
          autoRefreshTimer = setTimeout(refreshTimer, autoRefreshMs);
        }
      }

      refresh();
    }

    // init() and optionally provide toolbar height
    function init(toolbarHeightIfKnown) {
      if (toolbarHeightIfKnown) {
        toolbarHeight = toolbarHeightIfKnown;
      }
      if (SHOULD_POSITION_FIXED_ELEMENTS_ON_SCROLL || SHOULD_ZOOM_FIXED_ELEMENTS || toolbarHeight) {
        initializeModule();
      }
    }

    return {
      setAllowMouseEvents: setAllowMouseEvents,
      init: init
    };
  });
