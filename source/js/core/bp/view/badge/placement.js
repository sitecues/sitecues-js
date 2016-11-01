/**
 * PLACEMENT -- on screen and in DOM
 *
 * --- What? ---
 *
 * Ensure that the BP always has both:
 * - The right parent (this switches depending on BP state)
 * - Correct size and position (must originate from in-page badge)
 *
 * --- When? ---
 *
 * 1. At initialization time (goes inside badge)
 * 2. Before expansion (goes inside html)
 * 3. After shrinking (goes back inside badge)
 *
 * --- Where? ---
 *
 * There are three important elements at work here:
 *
 * 1. Badge element (#sitecues-badge) --
 *    This is a badge that is placed in the page by the site owner.
 *    Element:
 *      - Old way: use an <img> -- still supported for now
 *      - New way: use an empty container that we will fill with the sitecues badge
 *    Position:      whatever site owner chooses
 *    Parent:        whatever site owner chooses
 *    Display type:  whatever site owner chooses
 *    Accessibility: Uses role="button" and placed in the tab order of the page via tabindex="0"
 *
 * 2. BP element (#scp-bp-container)
 *    Container that moves around the page and parents all of the BP content
 *    Element:      <div> inserted by bp.js
 *    Position:     absolute (TODO will be static when it goes inside parent?)
 *    Parent: it switches parents depending on whether it is small or not:
 *    - Parented by the badge when it's small (badge state) -- this allows it to scale and move with the page
 *      Special default badge case: always parented by badge (which is outside of the <body>) and doesn't switch on expansion.
 *      (Note: if the #sitecues-badge is an <img> we make it a previous sibling of that, because <img>s can't parent)
 *      TODO previous sibling is breaking page layout
 *    - Parented by the <html> element when it's not small so that it doesn't change size or position while it's being used.
 *    Display type: block
 *    Accessibility: treated as application dialog; receives focus in keyboard mode
 *
 *  3. SVG Element (#scp-svg)
 *    This is all the BP content. We need this element to change it's width/height as appropriate (TODO when?)
 *    Element: <svg> inserted by bp.js
 *    Position: static
 *    Parent: #scp-bp-container
 *    Accessibility: uses ARIA to describe controls
 */
define(
  [
    'core/bp/model/state',
    'core/bp/constants',
    'core/bp/helper',
    'core/platform',
    'core/events',
    'core/inline-style/inline-style'
  ],
  function (
    state,
    BP_CONST,
    helper,
    platform,
    events,
    inlineStyle
  ) {
  'use strict';

  var BADGE_PARENT = BP_CONST.BADGE_MODE,
      HTML_PARENT  = BP_CONST.PANEL_MODE,
      currentBPParent,
      badgeElement,
      badgeRect = {},
      badgeGeometry,
      bpElement,
      svgElement,
      currentZoom = 1,
      isInitialized,

      // The width/height of the <SVG>
      // Note: this currently stays the same in badge vs panel sizes even though the panel stretches,
      // because of transparent space to the right/bottom of the visible BP
      svgAspectRatio,
      documentElement = document.documentElement,

      SHOULD_FIX_USE_ELEMENTS;

  // Allow animations just before panel expands
  function disableAnimations() {
    svgElement.removeAttribute('class');
  }

  // Reparent panel container to badgeElement so that page badge grows and moves
  // in-place inside the page where it is attached.
  // Also, position and size the bpContainer and set height and width of the SVG
  function switchToBadgeParent() {
    var styles = {
      transform: ''
    };
    // Remove transform/translate so that badge is fully returned to origin state
    inlineStyle.set(bpElement, styles);

    badgeElement.appendChild(bpElement);

    currentBPParent = BADGE_PARENT;

    repositionBPOverBadge();
    fitSVGtoBadgeRect();
  }

  // Reparent panel container to <html> so that panel stays constant size and position during zooming/panning
  function switchToHtmlParent() {

    if (bpElement.parentElement === documentElement) {
      return;
    }

    // HTML_PARENT
    // Case 3. Insert outside body (as a child of <html>)
    documentElement.insertBefore(bpElement, documentElement.childNodes[0]);

    currentBPParent = HTML_PARENT;

    // The BP must be positioned over the #sitecues-badge
    repositionBPOverBadge();
    fitSVGtoBadgeRect();
  }

  // Edge and IE11 on Windows 10 fix
  // Once the BP is moved, these browsers are not re-recognizing the @xlink:href on <use> elements
  // if they are moved. However, toggling a space in front of the attribute value fixes the issue.
  function fixUseElementsInIE() {

    if (SHOULD_FIX_USE_ELEMENTS) {

      var useElements = svgElement.getElementsByTagName('use'),
        numUseElements = useElements.length,
        useIndex = 0,
        useElement;
      for (; useIndex < numUseElements; useIndex++) {
        useElement = useElements[useIndex];
        // Toggle space in front of href attribute to get
        // IE to 'wake up' and understand it again
        var href = useElement.getAttribute('xlink:href'),
          newHref = href.charAt(0) === ' ' ? href.substr(1) : ' ' + href;
        useElement.setAttribute('xlink:href', newHref);
      }
    }
  }

  // Move the BP object so that the top, left sits exactly over the badge rectangle top, left
  // This is only called when the BP is small (about to expand or finished collapsing)
  function repositionBPOverBadge() {

    // Current badge rectangle in screen coordinates
    var newBadgeRect   = helper.getRect(badgeElement),

        // Get the amount of zoom being applied to the badge
        appliedZoom = getAppliedBPZoom(),

        badgeComputedStyle = window.getComputedStyle(badgeElement),

        // Adjust for padding
        paddingLeft = getPadding('Left'),
        paddingTop  = getPadding('Top'),

        isToolbarBadge = state.get('isToolbarBadge');

    function getPadding(property) {
      return parseFloat(badgeComputedStyle['padding' + property]) * appliedZoom;
    }

    // Used for setting the bpContainer left, top, width, and height
    function setBPProperty(prop) {
      var styles = {};
      styles[prop] = (badgeRect[prop] / appliedZoom) + 'px';
      inlineStyle.set(bpElement, styles);
    }

    // If the badge is currently dimensionless, use the cached badge dimensions
    if (rectHasNoArea(newBadgeRect)) {
      // We saved the badge rect when it was a child of the documentElement, so we multiply by the current zoom
      newBadgeRect.height = badgeGeometry.cachedRect.height * appliedZoom;
      newBadgeRect.width  = badgeGeometry.cachedRect.width  * appliedZoom;
    }

    if (currentBPParent === BADGE_PARENT) {

      // Not a toolbar badge and in body (inside of #sitecues-badge)
      // It's already inside of the #sitecues-badge, which is in the right place on the page,
      // and we only need transform translate to move it from there for padding and vertical offset.
      // By being a child of #sitecues-badge, it will automatically be positioned within that.
      newBadgeRect.left = 0;
      newBadgeRect.top  = 0;

    }

    // Adjust for top whitespace in SVG badge (it's there because it turns into an outline on expansion)
    if (!isToolbarBadge) {
      newBadgeRect.top -= BP_CONST.BADGE_VERTICAL_OFFSET;
    }

    badgeRect.left   = newBadgeRect.left + paddingLeft;
    badgeRect.top    = newBadgeRect.top  + paddingTop;

    // A toolbar badge's size remains the same for the lifetime of the page, so we use the cached version of size in that case
    if (!badgeRect.width || !isToolbarBadge) {
      badgeRect.width  = newBadgeRect.width  - paddingLeft - getPadding('Right');
      badgeRect.height = newBadgeRect.height - paddingTop  - getPadding('Bottom');
    }

    // Set left and top for positioning.
    setBPProperty('width');
    setBPProperty('height');
    var styles = {
      top  : 0,
      left : 0,
      transform: 'translate(' + badgeRect.left / appliedZoom + 'px,' + badgeRect.top / appliedZoom + 'px)'
    };
    inlineStyle.set(bpElement, styles);
  }

  // This makes the collapsed svg large enough so that even with
  // all the whitespace it stretches to cover the badge
  // So it should be the actual svg width / badge width
  function fitSVGtoBadgeRect() {

    var svgWidth  = badgeRect.width * getRatioOfSVGToVisibleBadgeSize(badgeRect) / getAppliedBPZoom(),
        svgHeight = svgWidth / svgAspectRatio;

    inlineStyle.set(svgElement, {
      width  : svgWidth + 'px',
      height : svgHeight + 'px'
    });

    // Do not animate the adjustment of the SVG to fit the size of the badge
    // We only animate large-scale size changes (badge->panel or panel->badge)
    disableAnimations();

    // Oh, IE (Edge, we know you're still really IE).
    fixUseElementsInIE();
  }

  function getWaveHeight() {
    return helper.getRectById(BP_CONST.WAVE_3_ID).height;
  }

  function getRatioOfSVGToVisibleBadgeSize(badgeRect) {
    // This is the ratio of the height allotted by the badge to the visible height.
    // It is what we need to multiply the SVG height by to get the final desired height.
    var ratioOfSVGToVisibleBadgeSize = state.get('ratioOfSVGToVisibleBadgeSize');

    if (ratioOfSVGToVisibleBadgeSize) {
      return ratioOfSVGToVisibleBadgeSize;
    }

    // First get the height for the third wave in the speech button, useful for measurements
    // It is the tallest and rightmost element
    var badgeRectWidth   = badgeRect.width,
        waveHeight;

    // Set default height and width, because this normalizes cross browser inconsistencies
    // for SVG sizing.  Basically, if no height or width are set explicitly, then the viewBox
    // attribute effects the values of the boundingClient height and width of the SVG in Chrome,
    // but not IE.  Therefore, setting these values allows getRatioOfSVGToVisibleBadgeSize() to return the proper
    // values no matter the browser.
    inlineStyle.set(svgElement, {
      width  : badgeRectWidth + 'px',
      height : badgeRectWidth / svgAspectRatio + 'px'
    });
    waveHeight = getWaveHeight() || badgeGeometry.waveHeight;

    ratioOfSVGToVisibleBadgeSize = badgeRect.height / waveHeight;

    state.set('ratioOfSVGToVisibleBadgeSize', ratioOfSVGToVisibleBadgeSize);

    return ratioOfSVGToVisibleBadgeSize;
  }

  function addClipRectStyleFix () {
    var badgeRect    = helper.getRect(badgeElement),

        // A magic number to fix SC-2759.  Underlying issue is probably
        // rectangle calculations are a bit off...
        // TODO: Figure out why we are using magic numbers
        EXTRA_PIXELS_HEIGHT = 5,
        EXTRA_PIXELS_WIDTH  = 10;

    if (rectHasNoArea(badgeRect)) {
      badgeRect = badgeGeometry.cachedRect;
    }
    inlineStyle(bpElement).clip = 'rect(0,' + (badgeRect.width  + EXTRA_PIXELS_WIDTH) + 'px,' + (badgeRect.height + EXTRA_PIXELS_HEIGHT) + 'px,0)';
  }

  function onZoomChange(zoomLevel) {
    currentZoom = zoomLevel;
  }

  function getAppliedBPZoom() {
    var isBPInBody  = state.get('isPageBadge') && currentBPParent === BADGE_PARENT;
    return isBPInBody ? currentZoom : 1;
  }

  function executeWhileElementIsRendered(element, fn) {
    var isReparented,
        inlineTransform = inlineStyle(element).transform,
        nextSibling     = element.nextSibling,
        parent          = element.parentElement,
        rect            = helper.getRect(element);

    // If the element isn't displayed, translate it out of the viewport and attach it to the document element.
    // This way we can be confident that an ancestor of the element isn't hiding it
    // This doesn't guarantee that a stylesheet isn't hiding the element, but it is sufficient for our current purposes
    if (rectHasNoArea(rect)) {
      inlineStyle(element).transform = 'translate(-99999px,-99999px)';
      documentElement.appendChild(element);
      isReparented = true;
    }

    fn();

    if (isReparented) {
      inlineStyle(element).transform = inlineTransform;
      if (nextSibling) {
        parent.insertBefore(element, nextSibling);
      }
      else {
        parent.appendChild(element);
      }
    }
  }

  // This method caches the dimensions of the badge, and if it is not currently visible
  // temporarily appends the badge directly to the document element to prevent its ancestors from hiding it.
  // This ensures that we have a fallback size reference when we need to reposition the bp SVG.
  // Otherwise, if we collapse the panel when the badge element has no area
  // the panel will disappear entirely!
  function initBadgeGeometry() {
    badgeElement.appendChild(bpElement);

    events.emit('bp/did-insert-bp-element');

    executeWhileElementIsRendered(badgeElement, function () {
      var cachedRect = helper.getRect(badgeElement),
          contentBox = Object.create(cachedRect),
          computedStyle = getComputedStyle(badgeElement),
          paddingTop    = parseFloat(computedStyle.paddingTop),
          paddingBottom = parseFloat(computedStyle.paddingBottom),
          paddingRight  = parseFloat(computedStyle.paddingRight),
          paddingLeft   = parseFloat(computedStyle.paddingLeft);

      contentBox.width  -= paddingLeft + paddingRight;
      contentBox.height -= paddingTop  + paddingBottom;

      inlineStyle.set(bpElement, {
        width  : contentBox.width,
        height : contentBox.height
      });

      inlineStyle.set(svgElement, {
        width  : contentBox.width + 'px',
        height : (contentBox.width / svgAspectRatio) + 'px'
      });

      badgeGeometry = {
        cachedRect : cachedRect,
        waveHeight : getWaveHeight()
      };
    });

  }

  function rectHasNoArea(rect) {
    return !rect.width || !rect.height;
  }

  /**
   * [init initializes the placement of the bpElement, svgElement, and badgeElement]
   * @param  {[DOM element]} badge       [Either placeholder or badge we create with ID 'sitecues-badge']
   * @param  {[DOM element]} bpContainer [SVG container <div> with ID 'scp-bp-container']
   * @param  {[DOM element]} svg         [SVG with ID 'scp-svg']
   */
  function init(badge, bpContainer, svg) {

    if (isInitialized) {
      return;
    }

    isInitialized = true;

    SHOULD_FIX_USE_ELEMENTS = platform.browser.isMS && platform.os.majorVersion >= 10;

    // Compute the aspect ratio (the width:height ratio required for the <svg>)
    var viewBoxRect = svg.viewBox.baseVal;

    // Set module scoped variables.
    badgeElement = badge;
    bpElement    = bpContainer;
    svgElement   = svg;

    svgAspectRatio = viewBoxRect.width / viewBoxRect.height;

    //Store initial badge dimensions and SVG scale while we know they're available
    initBadgeGeometry();

    // Initially, BP must always be contained by #sitecues-badge
    switchToBadgeParent();

    // For some reason, without this fix elements around the badge
    // do not get mouse events because the sizing of something is off.
    // See SC-2759.
    addClipRectStyleFix();

    // Listen for change events for page badges
    if (state.get('isPageBadge')) {

      // Page badges must switch back and forth dynamically
      events.on('bp/will-expand', switchToHtmlParent);
      events.on('bp/did-shrink', switchToBadgeParent);
      events.on('zoom', onZoomChange);
    }
    else {
      window.addEventListener('resize', repositionBPOverBadge);
    }
  }

  return {
    init: init
  };
});
