/**
 * HLB Positioning is responsible for positioning the HLB so that the HLB and the original element's midpoints
 * overlap or the HLB is as close to the original element while being encapsulated within the HLB_SAFE_AREA.
 * It is also responsible for calculating and setting the appropriate height/width of the HLB so that it is
 * encapsulated within the HLB_SAFE_AREA.
 */
define(
  [
    '$',
    'run/conf/preferences',
    'hlb/styling',
    'page/util/common',
    'page/util/element-classifier',
    'hlb/safe-area',
    'run/inline-style/inline-style'
  ],
  function (
    $,
    pref,
    hlbStyling,
    common,
    elemClassifier,
    hlbSafeArea,
    inlineStyle
  ) {
  'use strict';

  /////////////////////////
  // PRIVATE VARIABLES
  /////////////////////////

  var CHAR_WIDTH_LIMIT = 50,  // Amount of characters that fits horizontally in HLB

      originCSS,    // The HLB element's midpoint for animation
      translateCSS, // The HLB element's translation for final position
      isEditable = elemClassifier.isEditable,
      isVisualMedia = elemClassifier.isVisualMedia,
      isFormControl = elemClassifier.isFormControl;

  //////////////////////////////
  // PRIVATE FUNCTIONS
  //////////////////////////////

  /**
   * [getChildWidth returns the max-width for any child within the HLB.]
   * @param  {[DOM element]}    child       [Child element of the HLB]
   * @param  {[jQuery element]} $hlb [The HLB element]
   * @return {[Float]}                      [Max-width for child element]
   */
  function getChildWidth(child, $hlb) {

    var hlbBoundingRect   = $hlb[0].getBoundingClientRect(),
        childBoundingRect = child.getBoundingClientRect(),
        inheritedZoom     = getInheritedZoom($hlb),
        leftDiff          = childBoundingRect.left > hlbBoundingRect.left ? childBoundingRect.left - hlbBoundingRect.left : 0,
        leftSum           = 0,
        rightSum          = 0,
        sum;

    $(child).parentsUntil($hlb.parent()).addBack().each(function () {
      var computedStyle = getComputedStyle(this);
      // marginRight has been commented out to fix issue on faast.org when HLBing
      // "About" in the top navigation.  I thought marginRight pushes its content to the left,
      // but in that case apparently not.  The rule of what marginRight does may be dependent
      // on other factors which I do not know, but removing it does not appear to break anything
      // that this function originally fixed.
      // rightSum += parseFloat(computedStyle.marginRight);
      rightSum += parseFloat(computedStyle.paddingRight) +
        parseFloat(computedStyle.borderRightWidth);

      leftSum += parseFloat(computedStyle.marginLeft) +
        parseFloat(computedStyle.paddingLeft) +
          parseFloat(computedStyle.borderLeftWidth);
    });

    sum = leftSum + rightSum;

    if (leftDiff && leftDiff > leftSum) {
      leftDiff = leftDiff - leftSum;
    } else {
      leftDiff = 0;
    }

    return (hlbBoundingRect.width / inheritedZoom) - sum - leftDiff;

  }

  /**
   * [limitChildWidth computes and sets the max-width for all HLB child elements if needed.]
   * @param  {[jQuery Element]} $hlb [The HLB element]
   */
  function limitChildWidth($hlb) {

    var fixit,
        allHLBChildren,
        hlbClientWidth,
        childRect,
        hlbRect,
        scrollDiff,

        // document.createRange() is used instead of scrollWidth because of content on http://www.nvblindchildren.org/
        // If content is pushed outside of the HLB to the left, we must use document.createRange().
        hlbElementRangeRect = document.createRange(),
        hlbElementRangeWidth,
        hlbElementContentRangeWidth,
        borderLeftAndRight = (parseFloat($hlb.css('borderWidth')) || 0) * 2;

    hlbElementRangeRect.selectNode($hlb[0]);

    hlbElementRangeWidth = hlbElementRangeRect.getBoundingClientRect().width - borderLeftAndRight;

    hlbElementRangeRect.selectNodeContents($hlb[0]);

    hlbElementContentRangeWidth = hlbElementRangeRect.getBoundingClientRect().width - borderLeftAndRight;

    if ($hlb[0].clientWidth < Math.max(hlbElementRangeWidth, hlbElementContentRangeWidth)) {

      if (SC_DEV) {
        console.log('%cSPECIAL CASE: HLB child width limiting algorithm.', 'background:orange;');
      }

      allHLBChildren = $hlb.find('*');

      fixit = true;

      allHLBChildren.each(function () {
        inlineStyle(this).maxWidth = getChildWidth(this, $hlb) + 'px';
      });

    }

    hlbClientWidth = $hlb[0].clientWidth;

    // The following attempts to mitigate the vertical scroll bar by
    // setting the height of the element to the scroll height of the element.
    mitigateVerticalScroll($hlb);

    // Vertical scroll should only appear when HLB is as tall as the
    // safe area height and its scrollHeight is greater than its clientHeight
    addVerticalScroll($hlb);

    if (fixit && $hlb[0].clientWidth < hlbClientWidth) {

      if (SC_DEV) {
        console.log('%cSPECIAL CASE: HLB child width limiting algorithm because vertical scrollbar.', 'background:orange;');
      }

      scrollDiff = hlbClientWidth - $hlb[0].clientWidth;

      hlbRect = $hlb[0].getBoundingClientRect();

      allHLBChildren.each(function () {
        // Performing this check because http://www.nvblindchildren.org/give.html top navigation..
        childRect = this.getBoundingClientRect();
        if (childRect.left < hlbRect.left || childRect.right + scrollDiff > hlbRect.right) {
          inlineStyle(this).maxWidth = (parseFloat(getComputedStyle(this).maxWidth) - scrollDiff) + 'px';
        }
      });

    }

    fixOverflowWidth($hlb);
  }

  /**
   * [isEligibleForConstrainedWidth determines if the HLB is eligible for limiting its width to 50 characters]
   * @param  {[jQuery element]} $hlb [HLB element]
   * @return {[Boolean]}     [if true, limit the width]
   */
  function isEligibleForConstrainedWidth($hlb) {

    var allowWrapping = true;

    // Return true if there are no other elements in the HLB that will affect the positioning
    // of this element
    // hlbElement
    //   \
    //    Grandparent
    //        \
    //        Parent (no siblings)
    //          \
    //           I am a loner! :(


    function hasSiblings(element) {
      return element.parentNode.childElementCount > 1;
    }

    function isLonerElement(element) {
      var isLoner = true;
      $(element).closest($hlb).each(function(index, elemToCheckForSiblings) {
        isLoner = $hlb[0] === elemToCheckForSiblings || !hasSiblings(elemToCheckForSiblings);
        return isLoner;
      });
      return isLoner;
    }

    // Return true if there is CSS that will cause an elements position to be based on another element's position
    function hasPositioningCss(css) {
      return css.position !== 'static' || css.float !== 'none' || css.display !== 'table-cell';
    }

    // Returns false when an element is not wrappable or, if part of an HLB,
    // wrapping the HLB would be bad (would break the intended layout, for example).
    function testAllowWrapping(index, element) {
      var css = getComputedStyle(element);

      allowWrapping = (css.whiteSpace === 'normal' || css.whiteSpace === 'preWrap') &&
        (!hasPositioningCss(css) || isLonerElement(element)) &&
        !isVisualMedia(element) && !isFormControl(element) && !isEditable(element);

      // This fixed something on gwmicro, but broke other things.
      // if (css.display === 'table-cell') {
      //   allowWrapping = false;
      // }

      return allowWrapping; // Once false, the each() loop will stop as well
    }

    // Fixes case on www.reddit.com/r/science when opening HLB on "The New Reddit Journal of Science"
    // We use max-width: 50ch to limit the width.  In this particular case, the font-size of the element
    // is 0, which causes the units of width limiting to have no effect because they are multiples of 0.
    if (+$hlb.css('fontSize').charAt(0) === 0) {
      return;
    }

    // Easiest way to fix issue when HLBing
    // "Summary Table Voluntary Product Accessibility Template" on http://www.gwmicro.com/Window-Eyes/VPAT/
    if ($hlb.is('table')) {
      return;
    }

    $hlb.find('*').addBack().each(testAllowWrapping);

    return allowWrapping;

  }

  /**
   * [getExtraLeftPadding returns addition left-padding of the HLB]
   * @param  {[jQuery element]} $hlb [HLB element]
   * @return {[integer]}                    [The additional left-padding]
   */
  function getExtraLeftPadding($hlb) {
    return parseInt($hlb.css('paddingLeft')) - hlbStyling.defaultPadding;
  }

  /**
   * [midPointDiff computes the distance between the midpoints of 2 rects]
   * @return {[object]}         [x and y difference between the 2 midpoints]
   */
  function midPointDiff(rect1, rect2) {

    var br1x = rect1.left + rect1.width / 2,
        br1y = rect1.top + rect1.height / 2,
        br2x = rect2.left + rect2.width / 2,
        br2y = rect2.top + rect2.height / 2;

    return {
      'x': br1x - br2x,
      'y': br1y - br2y
    };

  }

  /**
   * [limitWidth limits the width of the HLB to X characters, if eligible]
   * @param  {[jQuery element]} $originalElement    [original element]
   * @param  {[jQuery element]} $hlb         [HLB element]
   * @param  {[Integer]}        characterWidthLimit [number of characters the HLB is restricted to horizontally]
   */
  function limitWidth($originalElement, $hlb, characterWidthLimit) {

    // If the HLB is eligible for limiting the width to
    // characterWidthLimit characters
    if (isEligibleForConstrainedWidth($hlb)) {

      if (SC_DEV) {
        console.log('%cSPECIAL CASE: 50 Character width limit.',  'background:orange;');
      }

      // 'ch' units are equal to the width of the "0" character
      inlineStyle($hlb[0]).maxWidth = characterWidthLimit + 'ch';
    }

  }

  /**
   * [mitigateVerticalScroll increases the height of the HLB to fit its content.]
   * @param  {[jQuery element]} $hlb [HLB]
   */
  function mitigateVerticalScroll($hlb) {
    var hlb = $hlb[0];
    // If the HLB has a vertical scrollbar and has a height less than the safe zone height
    if (common.hasVertScroll(hlb) &&
        scaleRectFromCenter($hlb).height < hlbSafeArea.getSafeZoneBoundingBox().height) {

      // Set to the scroll height minus 4 (half of the padding)
      // It is necessary to subtract the padding because scrollHeight includes padding.
      inlineStyle(hlb).height = (hlb.scrollHeight - parseInt(getComputedStyle(hlb).paddingBottom)) + 'px';
      // Now that we have set the height of the cloned element to the height of the scroll height...
      // we need to test that the element's height does not exceed the height of the safe area.
      constrainHeightToSafeArea($hlb);
    }
  }

  /**
   * [constrainPosition computes the distance between a rectangle and the
   * minimum distance it must travel to occupy another rectangle]
   * @param  {[DOM element]} element   [any element of a DOM]
   * @param  {[object]}      container [the bounding rect]
   * @return {[object]}                [x and y difference]
   */
  function constrainPosition(element) {

    var offset = {
          'x': 0,
          'y': 0
        },

        container = hlbSafeArea.getSafeZoneBoundingBox();

    if (element.left < container.left) {
      offset.x -= container.left - element.left;
    }
    if (element.top < container.top) {
      offset.y -= container.top - element.top;
    }
    if (element.left + element.width > container.right) {
      offset.x += (element.left + element.width) - container.right;
    }
    if (element.top + element.height > container.bottom) {
      offset.y += (element.top + element.height) - container.bottom;
    }
    return offset;
  }

  /**
   * [constrainHeightToSafeArea constrains the height of the HLB to the safe area.
   * If HLB is an image, then it keeps the aspect ratio.]
   * @param  {[jQuery element]} $hlb [HLB element]
   */
  function constrainHeightToSafeArea($hlb) {

    var hlb            = $hlb[0],
        hlbStyle       = inlineStyle(hlb),
        originalHeight = scaleRectFromCenter($hlb).height,
        safeZoneHeight = hlbSafeArea.getSafeZoneBoundingBox().height;

    // Would the scaled element's height be greater than the safe area height?
    if (originalHeight > safeZoneHeight) {

      // height is now the "safe zone" height, minus the padding/border
      hlbStyle.height = ((safeZoneHeight / getFinalScale($hlb) / getInheritedZoom($hlb)) -
          (hlbStyling.defaultBorder +
            hlbStyling.defaultBorder +
            parseInt($hlb.css('paddingTop')) +
            parseInt($hlb.css('paddingBottom'))
          )
        ) + 'px';

      // Keep aspect ratio if HLB is an image
      if (isVisualMedia(hlb)) {

        // We need to recalculate the bounding client rect of the HLB element, because we just changed it.
        hlbStyle.width = (hlb.getBoundingClientRect().width / getInheritedZoom($hlb) *
          (safeZoneHeight / originalHeight)) + 'px';
      }
    }
  }

  /**
   * [constrainWidthToSafeArea constrains the width of the HLB to the safe area.
   * If HLB is an image, then it keeps the aspect ratio.]
   * @param  {[jQuery element]} $hlb [HLB element]
   */
  function constrainWidthToSafeArea($hlb) {

    var hlb           = $hlb[0],
        hlbStyle      = inlineStyle(hlb),
        originalWidth = scaleRectFromCenter($hlb).width,
        safeZoneWidth = hlbSafeArea.getSafeZoneBoundingBox().width;

    // Would the scaled element's width be greater than the safe area width?
    if (originalWidth > safeZoneWidth) {

      // width is now the "safe zone" width, minus the padding/border
      hlbStyle.width = ((safeZoneWidth / getFinalScale($hlb) / getInheritedZoom($hlb)) -
        (hlbStyling.defaultBorder + hlbStyling.defaultPadding + getExtraLeftPadding($hlb) / 2) * 2) + 'px';

      // Keep aspect ratio if HLB is an image
      if (isVisualMedia(hlb)) {

        // We need to recalculate the bounding client rect of the HLB element, because we just changed it.
        hlbStyle.height = (hlb.getBoundingClientRect().height / getInheritedZoom($hlb) *
          (safeZoneWidth / originalWidth)) + 'px';
      }
    }
  }

  /**
   * [initializeSize sets the height and width of the HLB to the original element's bounding
   * box height and width.  Useful for images.]
   * @param  {[jQuery element]} $hlb      [The HLB]
   * @param  {[Object]} $initialHLBRect [The highlight rect or the $originalElement  bounding client rect.]
   */
  function initializeSize($hlb, initialHLBRect) {

    var zoom   = getPageZoom(),
        width  = (initialHLBRect.width  / zoom) + 'px',
        height = (initialHLBRect.height / zoom) + 'px';
    inlineStyle.set($hlb[0], {
      width  : width, //Preserve dimensional ratio
      height : height //Preserve dimensional ratio
    });

    // This fixes the HLB being too wide or tall (lots of whitespace) for www.faast.org/news
    // when HLBing "News" header.  Because we copy computedStyles, we sometimes get an HLB
    // that has a child that is much wider or taller than the highlight, causing the HLB
    // to increase in width and height for the purpose of avoiding scrollbars.
    // TODO: cache descendants because we use it alot
    inlineStyle.set($hlb.find('*').get(), {
      maxWidth : width
    });
  }

  /**
   * [scaleRectFromCenter helper function for calculating a bounding box if an element were to be scaled from 50%50%]
   * @param  {[jQuery element]} $hlb [HLB]
   * @return {[object]}                     [A simulated bounding client rect]
   */
  function scaleRectFromCenter($hlb) {

    var clonedNodeBoundingBox = $hlb[0].getBoundingClientRect(),
        zoomFactor = getFinalScale($hlb);

    // The bounding box of the cloned element if we were to scale it
    return {
      'left'  : clonedNodeBoundingBox.left   - ((clonedNodeBoundingBox.width  * zoomFactor - clonedNodeBoundingBox.width)  / 2),
      'top'   : clonedNodeBoundingBox.top    - ((clonedNodeBoundingBox.height * zoomFactor - clonedNodeBoundingBox.height) / 2),
      'width' : clonedNodeBoundingBox.width  * zoomFactor,
      'height': clonedNodeBoundingBox.height * zoomFactor
    };
  }

  /**
   * [addVerticalScroll Adds a vertical scrollbar, if necessary, and corrects any
   *  dimension/positioning problems resulting from adding the scrollbar]
   * @param {[jQuery element]} $hlb [HLB element]
   */
  function addVerticalScroll($hlb) {
    var hlb = $hlb[0];

    if (common.hasVertScroll(hlb)) {
      inlineStyle(hlb).overflowY = 'scroll';
      // Adding a vertical scroll may sometimes make content overflow the width
      fixOverflowWidth($hlb);
    }
  }

  /**
   * [fixOverflowWidth sets the width of the HLB to avoid horizontal scrollbars]
   * @param  {[jQuery element]} clonedNode [HLB]
   */
  function fixOverflowWidth($hlb) {

    var hlbElement = $hlb[0];

    // If there is a horizontal scroll bar
    if (hlbElement.clientWidth < hlbElement.scrollWidth) {

      if (SC_DEV) {
        console.log('%cSPECIAL CASE: Fix overflow width.',  'background:orange;');
      }

      inlineStyle.set(hlbElement, {
        'width'    : hlbElement.scrollWidth + hlbStyling.defaultPadding + 'px',
        'maxWidth' : 'none'
      });

      // Again, we can't be positive that the increase in width does not overflow the safe area.
      constrainWidthToSafeArea($hlb);
    }
  }

  /**
   * [fixNegativeMargins gives the $hlb extra paddingTop and paddingLeft for elements
   * that are positioned negatively. document.createRange() was attempted to avoid looping over
   * all children, but children with background images are not accounted for...like on
   * ctsenaterepublicans.com]
   * @param  {[jQuery Element]} $hlb [HLB element]
   */
  function fixNegativeMargins($hlb, initialHLBRect) {

    var hlbBoundingRect = $hlb[0].getBoundingClientRect(),
        hlbLeft         = hlbBoundingRect.left,
        hlbTop          = hlbBoundingRect.top,
        extraLeft       = 0,
        extraTop        = 0,
        paddingLeft,
        paddingTop,
        childLeft,
        childTop,
        hasBackgroundImage,
        childBoundingRect,
        originalHLBLeftPadding = parseFloat($hlb.css('paddingLeft')),
        originalHLBTopPadding  = parseFloat($hlb.css('paddingTop'));

    $hlb.find('*').each(function () {
      var thisStyle = inlineStyle(this);
      // These elements to not make sense to check because their
      // bounding rects are not consistent with their visual position
      if (!$(this).is('br, option') &&
          ($(this).css('marginLeft').indexOf('-') !== -1 ||
           $(this).css('marginTop').indexOf('-')  !== -1)) {

        childBoundingRect  = this.getBoundingClientRect();
        childLeft          = childBoundingRect.left;
        childTop           = childBoundingRect.top;
        hasBackgroundImage = thisStyle.backgroundImage !== 'none';
        paddingLeft        = hasBackgroundImage ? 0 : parseFloat(thisStyle.paddingLeft);
        paddingTop         = hasBackgroundImage ? 0 : parseFloat(thisStyle.paddingTop);

        if (childLeft + paddingLeft < hlbLeft && hlbLeft - childLeft - paddingLeft > extraLeft) {
          if (SC_DEV) {
            console.log('%cSPECIAL CASE: Negative Margin-Left Fix.',  'background:orange;');
          }
          extraLeft = hlbLeft - childLeft - paddingLeft;
        }

        if (childTop + paddingTop < hlbTop && hlbTop - childTop - paddingTop > extraTop) {
          if (SC_DEV) {
            console.log('%cSPECIAL CASE: Negative Margin-Top Fix.',  'background:orange;');
          }
          extraTop = hlbTop - childTop - paddingTop;
        }
      }

      // Negative margin effects boundingClientRect.
      // Removing padding on www.faast.org/news left column Device Loan Program uses negative left
      // margin, making the contents of the HLB move to the left, making the HLB have extra empty space
      // to the right of the HLB.  Ugh...
      // Subtract width from HLB if they use negative left margin
      if (extraLeft) {

        if (SC_DEV) {
          console.log('%cSPECIAL CASE: Reset HLB width to use padding for width...',  'background:orange;');
        }

        inlineStyle($hlb[0]).width = (initialHLBRect.width / getPageZoom()  - extraLeft) + 'px';

        fixOverflowWidth($hlb);
      }
    });

    inlineStyle.set($hlb[0], {
      'paddingTop' : extraTop  ? originalHLBTopPadding  + extraTop  + hlbStyling.defaultPadding + hlbStyling.defaultBorder : originalHLBTopPadding,
      'paddingLeft': extraLeft ? originalHLBLeftPadding + extraLeft + hlbStyling.defaultPadding + hlbStyling.defaultBorder : originalHLBLeftPadding
    });
  }

  //////////////////////////
  // PUBLIC FUNCTIONS
  //////////////////////////

  function getOriginCSS() {
    return originCSS;
  }

  function getTranslateCSS() {
    return translateCSS;
  }

  function setOriginCSS(val) {
    originCSS = val;
  }

  function setTranslateCSS(val) {
    translateCSS = val;
  }

  function getHlbZoom() {
    return 1.5;

//  TODO should we remove permanently or do we want to keep this?
//    var lensSizeSetting = conf.get('lensSize');
//    switch (lensSizeSetting) {
//      case '-': return 1.2;
//      case '+': return 2;
//      default: return 1.5;
//    }
  }

  // HLB transform scale necessary to provide the HLBExtraZoom size increase.
  // If zoom is on the body, then scaling needs to account for that since the HLB is outside of the body.
  function getFinalScale($hlb) {
    return getHlbZoom() *getStartingScale($hlb);
  }

  function getPageZoom() {
    return pref.get('zoom') || 1;
  }

  // HLB transform scale necessary to show HLB at same size as original highlighted content.
  function getStartingScale($hlb) {
    return $hlb.closest(document.body).length ? 1 : getPageZoom();
  }

  // Transform scale that affects HLB (was inherited from page zoom)
  // If the HLB is outside the body, this will be 1 (since the page zoom is on <body>)
  function getInheritedZoom($hlb) {
    return $hlb.closest(document.body).length ? getPageZoom() : 1;
  }

  function sizeHLB($hlb, $originalElement, initialHLBRect) {

    // Initialize height/width of the HLB
    if (SC_DEV) {
      console.log('INITIAL: %o',initialHLBRect);
    }

    initializeSize($hlb, initialHLBRect);

    // Constrain the height and width of the HLB to the height and width of the safe area.
    constrainHeightToSafeArea($hlb);
    constrainWidthToSafeArea($hlb);

    // Limit the width of the HLB to a maximum of CHAR_WIDTH_LIMIT characters.
    limitWidth($originalElement, $hlb, CHAR_WIDTH_LIMIT);

    limitChildWidth($hlb);

    fixOverflowWidth($hlb);

    fixNegativeMargins($hlb, initialHLBRect);

  }

  /**
   * [positionHLB positions the HLB.]
   */
  function positionHLB($hlb, initialHLBRect, inheritedZoom) {

    // The minimum distance we must move the HLB for it to fall within the safe zone
    var constrainedOffset,
        hlb = $hlb[0],
        HLBBoundingBoxAfterZoom = scaleRectFromCenter($hlb),
        HLBBoundingBox = hlb.getBoundingClientRect(),

        // These are used in the positioning calculation.
        // They are the differences in height and width before and after the HLB is scaled.
        expandedWidthOffset  = (HLBBoundingBoxAfterZoom.width  - HLBBoundingBox.width)  / 2,
        expandedHeightOffset = (HLBBoundingBoxAfterZoom.height - HLBBoundingBox.height) / 2,

        // The difference between the mid points of the hlb element and the original
        offset = midPointDiff(hlb.getBoundingClientRect(), initialHLBRect);

    // Update the dimensions for the HLB which is used for constraint calculations.
    // The offset of the original element and cloned element midpoints are used for positioning.
    HLBBoundingBoxAfterZoom.left   = HLBBoundingBox.left - offset.x - expandedWidthOffset;
    HLBBoundingBoxAfterZoom.top    = HLBBoundingBox.top  - offset.y - expandedHeightOffset;
    HLBBoundingBoxAfterZoom.right  = HLBBoundingBoxAfterZoom.left + HLBBoundingBoxAfterZoom.width;
    HLBBoundingBoxAfterZoom.bottom = HLBBoundingBoxAfterZoom.top  + HLBBoundingBoxAfterZoom.height;

    // Constrain the scaled HLB to the bounds of the "safe area".
    // This returns how much to shift the box so that it falls within the bounds.
    // Note: We have already assured that the scaled cloned element WILL fit into the "safe area",
    // but not that it is currently within the bounds.
    constrainedOffset = constrainPosition(HLBBoundingBoxAfterZoom);

    // Add the difference between the HLB position and the minimum amount of distance
    // it must travel to be completely within the bounds of the safe area to the difference
    // between the mid points of the hlb element and the original
    offset.x += constrainedOffset.x;
    offset.y += constrainedOffset.y;

    // translateCSS and originCSS are used during deflation
    translateCSS = 'translate(' + (-offset.x / inheritedZoom) + 'px, ' + (-offset.y / inheritedZoom) + 'px)';

    // This is important for animating from the center point of the HLB
    originCSS = ((-offset.x / inheritedZoom) + HLBBoundingBox.width  / 2 / inheritedZoom) + 'px ' +
                ((-offset.y / inheritedZoom) + HLBBoundingBox.height / 2 / inheritedZoom) + 'px';

    // Position the HLB without it being scaled (so we can animate the scale).
    var startAnimationZoom = getPageZoom() / inheritedZoom,
      hlbStyles = {
        transform: 'scale(' + startAnimationZoom + ') ' + translateCSS,
        transformOrigin: originCSS
      };

    inlineStyle.set(hlb, hlbStyles);
  }

  return {
    getOriginCSS: getOriginCSS,
    getTranslateCSS: getTranslateCSS,
    setOriginCSS: setOriginCSS,
    setTranslateCSS: setTranslateCSS,
    getFinalScale: getFinalScale,
    getStartingScale: getStartingScale,
    getInheritedZoom: getInheritedZoom,
    sizeHLB: sizeHLB,
    positionHLB: positionHLB
  };
});