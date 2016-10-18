"use strict";

/**
 * In order to keep each module as clear as possible we take out some irrelevant code to the separate files.
 * The module represents HLB event handlers.
 * For example, we want to only allow scroll for HLB and its entities when HLB is open.
 * Stop event from bubbling up to window/document object.
 */
// TODO: Call this module scrolling.js
sitecues.define("hlb/event-handlers", [ "$" ], function($) {
  /////////////////////////
  // PRIVATE VARIABLES
  ////////////////////////
  //  Wheel event callback, must be scoped at the module level because
  //  we create this event callback every time the HLB opens because
  //  the callback requires a reference to the HLB element...s
  var wheelEventCallback, isCapturing;
  /**
   * [releaseWheelEvents disables the capturing of wheel events.  This is called once the HLB is closed.]
   */
  function releaseWheelEvents() {
    window.removeEventListener("wheel", wheelEventCallback);
    isCapturing = false;
  }
  /**
   * [captureWheelEvents captures wheel events while the HLB is open. ]
   * @param  {[jQuery Element]} $hlb [The HLB element]
   */
  function captureWheelEvents($hlb) {
    if (isCapturing) {
      return;
    }
    isCapturing = true;
    /**
     * [wheelHandler listens to all scroll events in the window and prevents scroll outside of HLB]
     * @param  {[DOM scroll event]} e [Object representing scrolling data]
     * TODO: Determine if this is the best way to handle this situation.  The reason we create a new
     * function every time we want to listen to wheel events is because the callback needs reference
     * to the HLB element. That is the problem that this approach solves, probably isn't ideal...
    */
    wheelEventCallback = function(event) {
      // Get the deltaY value when the user scrolls (how fast the user is scrolling)
      var deltaY = parseInt(event.deltaY || -event.wheelDeltaY);
      // parseInt() sanitizes by converting strange -0 value to 0
      // Sometimes there is no deltaY number, or a deltaY of "0"
      // (when the user is scrolling horizontally along X)
      if (!deltaY) {
        // We prevent the scroll event for horizontal scrolls
        return preventScroll(event);
      }
      /*

        Dimension Calculations:

                   /////////
                 ↑ /       / ↕ Scroll Top
          Scroll | XXXXXXXXX
          Height | X       X ↑
                 | X  HLB  X | Client Height
                 | X       X ↓
                 | XXXXXXXXX
                 ↓ /       / ↕ Scroll Bottom
                   /////////

      */
      // Get the dimensions
      var elem = $hlb[0], // The HLB Element
      scrollHeight = elem.scrollHeight, // The total height of the scrollable area
      scrollTop = elem.scrollTop, // Pixel height of invisible area above element (what has been scrolled)
      clientHeight = elem.clientHeight, // The height of the element in the window
      scrollBottom = scrollHeight - scrollTop - clientHeight, // The pixels height invisible area below element (what is left to scroll)
      scrollingDown = deltaY > 0, // If the user is scrolling downwards
      scrollingUp = deltaY < 0, // If the user is scrolling upwards
      scrolledToBottom = scrollBottom <= 1, // There are now more invisible pixels below the element
      scrolledToTop = elem.scrollTop <= 1;
      // There are now more invisible pixels above the element
      // Prevent any scrolling if the user is:
      //   a) Not scrolling on the HLB element directly.
      //   b) Not scrolling on a decendant of the HLB element.
      if ($hlb[0] !== event.target && !$.contains(elem, event.target)) {
        preventScroll(event);
      }
      // If the user is scrolling down, (but has not reached the bottom), and
      // is trying to scroll down more pixels that there are left to scroll...
      if (scrollingDown && deltaY >= scrollBottom) {
        // ...set the scroll to the bottom...
        elem.scrollTop = elem.scrollHeight;
        // ...and stop scrolling.
        preventScroll(event);
      }
      // If the user tries to scroll down past the bottom...
      if (scrolledToBottom && scrollingDown) {
        preventScroll(event);
      }
      // If the user is scrolling up, (but has not reached the top), and is
      // trying to scroll up more pixels that there are left to scroll...
      if (scrollingUp && scrollTop - -deltaY <= 0) {
        // ...set the scroll to the top...
        elem.scrollTop = 0;
        // ...and stop scrolling.
        preventScroll(event);
      }
      // If the user tries to scroll down past the bottom...
      if (scrolledToTop && scrollingUp) {
        preventScroll(event);
      }
      // Prevent the original scroll event
      function preventScroll() {
        event.preventDefault();
        event.returnValue = false;
        return false;
      }
    };
    // Trap the mousewheel events (wheel for all browsers except Safari, which uses mousewheel)
    window.addEventListener("wheel", wheelEventCallback);
  }
  return {
    releaseWheelEvents: releaseWheelEvents,
    captureWheelEvents: captureWheelEvents
  };
});

sitecues.define("hlb/constants", [], function() {
  var constants = {};
  // IDs
  constants.HLB_WRAPPER_ID = "sitecues-hlb-wrapper";
  // ID for element which wraps HLB and Dimmer elements
  constants.HLB_ID = "sitecues-hlb";
  // ID for $hlb
  constants.HLB_READY = "hlb/ready";
  //Event fired when HLB is created
  // Other
  constants.MAX_ZINDEX = 2147483647;
  return constants;
});

// */
//   This module styles the HLB by filtering attributes, styles, dom elements,
//   sets background, sets default styles, computes some styles,
//   and cloned child styles from the original element to the HLB.
//  */
sitecues.define("hlb/styling", [ "$", "page/util/common", "run/conf/preferences", "hlb/constants", "run/inline-style/inline-style", "run/util/array-utility" ], function($, common, pref, constants, inlineStyle, arrayUtil) {
  ///////////////////////////
  // PUBLIC PROPERTIES
  //////////////////////////
  // All HLB instances will use these default padding and border values.
  var defaultPadding = 4;
  var defaultBorder = 3;
  // Transition property used for hlb animation (-webkit, -moz)
  // This is used to transition the transform property for HLB
  // inflation/deflation animation
  var transitionProperty = "transform ";
  ///////////////////////////
  // PRIVATE VARIABLES
  ///////////////////////////
  var // How many ancestors do we move up the chain until we find a background image
  // to use for the $hlb background image.
  BACKGROUND_IMAGE_ANCESTOR_TRAVERSAL_COUNT = 3, // Default background color for HLB, if HLB is NOT an image.
  HLB_DEFAULT_BACKGROUND_COLOR = "#fff", // Default text color for HLB
  HLB_DEFAULT_TEXT_COLOR = "#000", // Default background color for HLB, if HLB is an image.
  HLB_IMAGE_DEFAULT_BACKGROUND_COLOR = "#000", // Remove these styles from the HLB, but NOT its children.
  HLBCSSBlacklist = [ "padding", "margin", "left", "top", "right", "bottom", "box-shadow", "transform", "-webkit-transform", "-moz-transform", "-ms-transform", "-webkit-transform-origin", "-moz-transform-origin", "-ms-transform-origin", "transition", "-webkit-transition", "width", "height", "-webkit-text-fill-color", "min-height", "min-width", "max-height", "max-width", "-ms-scroll-limit-y-max" ], // What child elements of the HLB do we want to remove after a clone.
  HLBElementBlacklist = [ "script", "iframe" ], // Remove ID from HLB because the speech module sets the ID for TTS to work
  HLBAttributeBlacklist = [ "id", "class" ], // Default css styles for HLB
  defaultHLBStyles = {
    position: "absolute",
    // Doesn't interfere with document flow
    zIndex: constants.MAX_ZINDEX,
    // Max z-index for HLB overlay
    border: defaultBorder + "px solid #000",
    padding: defaultPadding,
    margin: 0,
    // Margin isn't necessary and only adds complexity
    borderRadius: "4px",
    // Aesthetic purposes
    boxSizing: "content-box",
    // Default value.  If we do not force this property, then our positioning algorithm must be dynamic...
    visibility: "visible",
    maxWidth: "none",
    maxHeight: "none",
    opacity: 1
  };
  //////////////////////////
  // PRIVATE FUNCTIONS
  //////////////////////////
  /**
   * [filterElements removes HLBElementBlacklist elements from the HLB element, but not its children]
   * @param  {[DOM element]} $hlb [HLB element]
   */
  function filterBlacklistedElements($hlb) {
    $hlb.find(HLBElementBlacklist.join(",")).remove();
  }
  /**
   * [filterHiddenElements removes elements from the HLB that the picker deems unwanted.]
   * @param  {[jQuery Element]} $hlb    [HLB element]
   * @param  {[jQuery Element]} $picked [Element picked by picker]
   * @param  {[Array]} hiddenElements [Array of elements to remove]
   */
  function filterHiddenElements($hlb, $picked, hiddenElements) {
    var pickedElementIsListItem = $picked.is("li"), pickedDescendants = $picked.find("*").get(), hlbDescendants = (pickedElementIsListItem ? $hlb.children().find("*") : $hlb.find("*")).get();
    if (true) {
      if (pickedDescendants.length !== hlbDescendants.length) {
        console.warn("There is not a 1:1 mapping for filterHiddenElements!");
      }
    }
    pickedDescendants.forEach(function(element, index) {
      if (hiddenElements.get(element)) {
        $(hlbDescendants[index]).remove();
      }
    });
  }
  /**
   * [filterElements removes css styles in HLBCSSBlacklist from the HLB element, but not its children]
   * @param  {[DOM element]} $hlb [HLB element]
   */
  function filterStyles($hlb) {
    for (var i = 0; i < HLBCSSBlacklist.length; i += 1) {
      inlineStyle.removeProperty($hlb[0], HLBCSSBlacklist[i]);
    }
  }
  /**
   * [filterAttributes removes html attributes in HLBAttributeBlacklist]
   * @param  {[DOM element]} $hlb [HLB element]
  */
  function filterAttributes($hlb) {
    for (var i = 0; i < HLBAttributeBlacklist.length; i += 1) {
      $hlb.removeAttr(HLBAttributeBlacklist[i]);
    }
  }
  /**
   * [getDescendantStyles computes HLB child element styles]
   * @param  {[jQuery element]} $descendant                    [The current HLB element child we are styling]
   * @param  {[Boolean]} hlbWidthGreaterThanSafeAreaWidth [True if the HLB width >= safe area width]
   * @param  {[Object]} foundationDescendantStyle        [CSS styles returned from window.getComputedStyle]
   * @return {[Object]}                                   [Styles to be consumed by jQuery.css]
   */
  function getDescendantStyles($descendant, foundationDescendantStyle) {
    // Defaut css styles for all HLB descendants
    var styles = {
      webkitTextFillColor: "",
      textDecoration: "none",
      bottom: 0,
      // Added because bug found on TexasAT, first LI (About TATN) of ".horizontal rootGroup"
      height: "auto",
      // Added to fix cases where text overlapped vertically, like on eeoc
      "min-width": ""
    }, fontSize = parseFloat(foundationDescendantStyle.fontSize), lineHeight = parseFloat(foundationDescendantStyle.lineHeight), textDecoration = foundationDescendantStyle.textDecoration;
    // NOTE: Copying cssText directly is not sufficient for copying textDecorations.
    //       ts.dev.sitecues.com/hlb/styling/text-decoration.html
    if (textDecoration.indexOf("underline") !== -1) {
      styles.textDecoration = "underline";
    } else {
      if (textDecoration.indexOf("overline") !== -1) {
        styles.textDecoration = "overline";
      } else {
        if (textDecoration.indexOf("line-through") !== -1) {
          styles.textDecoration = "line-through";
        }
      }
    }
    // Implemented to fix http://www.windoweyesforoffice.com/sitecues/index.php when HLBing
    // Window-Eyes in header.  Applause: #1224073
    if (fontSize > lineHeight) {
      if (true) {
        console.log("%cSPECIAL CASE: Increasing line height.", "background:orange;");
      }
      styles.lineHeight = fontSize + "px";
    }
    // This fixes a problem with the HLB on TexasAT home page when opening the entire "News & Events"
    // ALSO...it fixes another problem that used a different fix.  I removed the old fix
    // and will re-enable it if hlb content overlaps
    //       // NOTE: Fix implemented because of opening HLB on http://abclibrary.org/teenzone on the #customheader
    //                Fixes children overlapping children within the HLB.  Comment out the line below to
    //                experience this problem.
    if ("absolute" === foundationDescendantStyle.position) {
      styles.position = "static";
      styles.display = "inline-block";
    }
    // Implemented to fix very long link that wasn't wrapping in the HLB on www.faast.org/news
    if ($descendant.is("a")) {
      styles.wordWrap = "break-word";
    }
    return styles;
  }
  function getBulletWidth($element, elementComputedStyle) {
    //If the HLB is a list AND it has bullets...return their width
    if ("none" !== elementComputedStyle.listStyleType || "none" !== elementComputedStyle.listStyleImage) {
      return common.getBulletWidth($element[0], elementComputedStyle);
    }
    return 0;
  }
  /**
   * [isTransparent determines if a particular style is transparent]
   * @param  {[CSS style property]}  style [Used for background color]
   * @return {Boolean}       [True if transparent, false otherwise]
   */
  function isTransparent(style) {
    return style.indexOf("rgba") !== -1 && (style.indexOf(".") !== -1 || "0" === style.charAt(style.length - 2)) || "transparent" === style;
  }
  /**
   * [getNonEmptyBackgroundImage determines what background image will be used
   * for the HLB element.  It moves up the ancestor chain of the original element
   * and returns the first background image it encounters.]
   * @param  {[DOM element]} $picked [The picked element chosen by the picker]
   * @return {[String]}                       [CSS background-image property]
   */
  function getNonEmptyBackgroundImage($picked, ancestorCount) {
    var backgroundStyles = {}, $parents = $picked.parents();
    $parents.each(function(index) {
      if (index >= ancestorCount) {
        return false;
      }
      var $ancestor = $(this);
      if ("none" !== $ancestor.css("backgroundImage")) {
        backgroundStyles.backgroundImage = $ancestor.css("backgroundImage");
        backgroundStyles.backgroundRepeat = $ancestor.css("backgroundRepeat");
        backgroundStyles.backgroundAttachment = "local";
        backgroundStyles.$ancestor = $ancestor;
        return false;
      }
    });
    return backgroundStyles;
  }
  /**
   * [getNonTransparentBackground determines what background color will be used
   * for the HLB element. It moves up the ancestor chain of the original element
   * and returns the first background color it encounters that isn't transparent]
   * @param  {[DOM element]} $picked [The original element chosen by the picker]
   * @return {[String]}                       [CSS background-color property]
   */
  function getNonTransparentBackground($picked) {
    var newBackgroundColor, parents = $picked.parents();
    parents.each(function() {
      if (!isTransparent($(this).css("backgroundColor"))) {
        newBackgroundColor = $(this).css("backgroundColor");
        return false;
      }
    });
    return newBackgroundColor;
  }
  /**
   * [getHLBBackgroundColor
       If the $hlbElement has a transparent background color, we should find one
       by looking up the entire ancestor chain and use the first non-transparent
       color we find.  Otherwise, if the $hlbElement is not an image, we default
       to a white background color.  If it is an image, however, the background
       color is black.]
   * @param  {[jQuery element]} $originalElement     [The original element chosen by picker]
   * @param  {[Object]} elementComputedStyle         [The original elements computed styles]
   * @return {[String]}                              [The HLB background color]
   */
  function getHLBBackgroundColor($picked, elementComputedStyle) {
    var newBackgroundColor;
    if (isTransparent(elementComputedStyle.backgroundColor)) {
      if ($picked.is("img")) {
        return HLB_IMAGE_DEFAULT_BACKGROUND_COLOR;
      } else {
        newBackgroundColor = getNonTransparentBackground($picked);
        if (newBackgroundColor) {
          return newBackgroundColor;
        } else {
          return HLB_DEFAULT_BACKGROUND_COLOR;
        }
      }
    }
    return elementComputedStyle.backgroundColor;
  }
  /**
   * [getHLBBackgroundImage determines the background image to be used by the $hlbElement]
   * @param  {[jQuery element]} $picked   [The picked element chosen by the picker.]
   * @param  {[Object]} elementComputedStyle     [The original elements computed style]
   * @return {[String]}                          [The background image that will be used by the $hlbElement]
   */
  function getHLBBackgroundImage($picked, elementComputedStyle) {
    var newBackgroundImage;
    // If the original element doesnt have a background image and the original element has a transparent background...
    if ("none" === elementComputedStyle.backgroundImage && isTransparent(elementComputedStyle.backgroundColor)) {
      newBackgroundImage = getNonEmptyBackgroundImage($picked, BACKGROUND_IMAGE_ANCESTOR_TRAVERSAL_COUNT);
      if (newBackgroundImage) {
        return newBackgroundImage;
      }
    }
    return {
      backgroundImage: elementComputedStyle.backgroundImage,
      backgroundRepeat: elementComputedStyle.backgroundRepeat,
      backgroundAttachment: "local"
    };
  }
  /**
   * [getHLBLeftPadding is required to visually encapsulate bullet points within the HLB if the
   * $hlb is itself a <ul> or <ol> that uses bullet points.
   * @param  {[jQuery element]} $foundation   [The original element chosen by the picker.]
   * @param  {[Object]} computedStyle  [The original elements computed style]
   * @return {[Integer]}                      [The HLB left-padding]
   */
  function getHLBLeftPadding($foundation, computedStyle) {
    return defaultPadding + getBulletWidth($foundation, computedStyle);
  }
  /**
   * [getHLBDisplay determines $hlbElement will use for its CSS display]
   * @param  {[Object]} computedStyle [The original elements computed styles]
   * @return {[String]}                      [The display the $hlbElement will use]
   * NOTE:
      // If the original elements display type is a table, force a display type of
      // block because it allows us to set the height.  I believe display table
      // is mutually exclusive to minimum height/minimum width.
      //
      // http://stackoverflow.com/questions/8739838/displaytable-breaking-set-width-height
      //
      // I found the issue on the eBank site that we maintain.  Make the HLB open a table
      // and open the developer console and attempt to alter the height/width attributes.
      //
      // TODO: actually prove these beliefs
   */
  function getHLBDisplay(computedStyle) {
    if ("table" === computedStyle.display) {
      return "block";
    }
    return computedStyle.display;
  }
  /**
   * [shouldRemovePadding determines if children of our HLB have padding that should be
   * removed because the highlight clips padding.]
   * @param  {[jQuery Element]} $child [Child element of the HLB]
   * @param  {[Object]} initialHLBRect [highlight rectangle]
   * @return {[Boolean]}               [True: Remove Padding. False: Do Nothing]
   */
  function shouldRemovePadding($child, initialHLBRect) {
    var childBoundingClientRect = $child[0].getBoundingClientRect(), childLeftPadding = parseFloat($child.css("paddingLeft")), childRightPadding = parseFloat($child.css("paddingRight")), childTopPadding = parseFloat($child.css("paddingTop")), childBottomPadding = parseFloat($child.css("paddingBottom"));
    if ($child.is("br, option") || 0 === childBoundingClientRect.width) {
      return;
    }
    if (childBoundingClientRect.left < initialHLBRect.left && childLeftPadding > 0 || childBoundingClientRect.right > initialHLBRect.right && childRightPadding > 0 || childBoundingClientRect.top < initialHLBRect.top && childTopPadding > 0 || childBoundingClientRect.bottom > initialHLBRect.bottom && childBottomPadding > 0) {
      if (true) {
        console.log("%cSPECIAL CASE: Removing child padding.", "background:orange;");
      }
      return true;
    }
  }
  /**
   * [getChildPadding computes and returns the padding for a child element of the HLB.  Taking into account the
   * initialHLBRect, clipping padding is something to be done to preserve that HLB size.]
   * @param  {[jQuery Element]} $child [Child element of the HLB]
   * @param  {[Object]} initialHLBRect [highlight rectangle]
   * @return {[Object]}                [Padding styles for a child element]
   */
  function getChildPadding($child, initialHLBRect) {
    var childBoundingClientRect = $child[0].getBoundingClientRect(), childLeftPadding = parseFloat($child.css("paddingLeft")), childRightPadding = parseFloat($child.css("paddingRight")), childTopPadding = parseFloat($child.css("paddingTop")), childBottomPadding = parseFloat($child.css("paddingBottom")), paddingStyles = {}, zoom = pref.get("zoom") || 1;
    if (childBoundingClientRect.left < initialHLBRect.left && childLeftPadding > 0) {
      paddingStyles.paddingLeft = childLeftPadding - (initialHLBRect.left - childBoundingClientRect.left) / zoom;
    }
    if (childBoundingClientRect.right > initialHLBRect.right && childRightPadding > 0) {
      paddingStyles.paddingRight = childRightPadding - (childBoundingClientRect.right - initialHLBRect.right) / zoom;
    }
    if (childBoundingClientRect.top < initialHLBRect.top && childTopPadding > 0) {
      paddingStyles.paddingTop = childTopPadding - (initialHLBRect.top - childBoundingClientRect.top) / zoom;
    }
    if (childBoundingClientRect.bottom > initialHLBRect.bottom && childBottomPadding > 0) {
      paddingStyles.paddingBottom = childBottomPadding - (childBoundingClientRect.bottom - initialHLBRect.bottom) / zoom;
    }
    return paddingStyles;
  }
  /**
   * [initializeHLBElementStyles initializes the HLB elements styles by directly copying
   *  the styles from the original element.]
   * @param  {[jQuery element]} $foundation [The original element chosen by the picker]
   * @param  {[jQuery element]} $hlb      [The HLB element]
   */
  function initializeHLBElementStyles($foundation, $hlb) {
    inlineStyle($hlb[0]).cssText = getComputedStyleCssText($foundation[0]);
  }
  /**
   * [initializeHLBDescendantStyles initializes the styles of the children of the HLB element.
   *   Step 1: Copy computed styles of original element children to hlb element children.
   *   Step 2: Remove padding if element is cropped by the initialHLBRect (mouse highlight rect)
   *   Step 3: Compute child styles that must override a direct copy of computed styles.
   *   Step 4: Set child styles.
   *   Step 5: Filter child attributes.
   * ]
    * @param  {[jQuery element]} $foundation [The original element chosen by the picker]
    * @param  {[jQuery element]} $hlb      [The HLB element]
    */
  function initializeHLBDescendantStyles($foundation, $hlb, initialHLBRect, hiddenElements) {
    var foundationDescendantStyle, computedChildStyles, foundation = $foundation[0], hlb = $hlb[0], removeMargins = true, foundationNodes = [ foundation ], hlbNodes = [ hlb ];
    // Iterate through each node in the foundation, in document order, and exclude elements we've identified as hidden
    // This is important because it's very expensive to call getComputedStyleCssText for each node in the tree in Firefox
    while (foundationNodes.length) {
      var foundationNode = foundationNodes.pop(), hlbNode = hlbNodes.pop();
      if (hiddenElements.get(foundationNode)) {
        continue;
      }
      initializeCloneStyle(foundationNode, hlbNode);
      foundationNodes = foundationNodes.concat(arrayUtil.from(foundationNode.children));
      hlbNodes = hlbNodes.concat(arrayUtil.from(hlbNode.children));
    }
    function initializeCloneStyle(originalNode, cloneNode) {
      var $original = $(originalNode), $clone = $(cloneNode);
      // Cache the HLB child computed style
      foundationDescendantStyle = getComputedStyle(originalNode);
      // Copy the original elements child styles to the HLB elements child.
      inlineStyle(cloneNode).cssText = getComputedStyleCssText(originalNode);
      if (shouldRemovePadding($original, initialHLBRect)) {
        inlineStyle.set(cloneNode, getChildPadding($original, initialHLBRect));
      }
      // Compute styles that are more complicated than copying cssText.
      computedChildStyles = getDescendantStyles($original, foundationDescendantStyle);
      // Added to fix HLB sizing when selecting last 2 paragraphs on http://www.ticc.com/
      if (shouldRemoveHorizontalMargins($original, $foundation)) {
        if (true) {
          console.log("%cSPECIAL CASE: Removing left and right margins.", "background:orange;");
        }
        computedChildStyles.marginLeft = 0;
        computedChildStyles.marginRight = 0;
      } else {
        removeMargins = false;
      }
      // Set the childs css.
      inlineStyle.set(cloneNode, computedChildStyles);
      // Ran into issues with children inheriting styles because of class and id CSS selectors.
      // Filtering children of these attributes solves the problem.
      filterAttributes($clone);
    }
  }
  /**
   * [shouldRemoveHorizontalMargins determines if left-margin and right-margin can be removed from
   * a child in the HLB element.]
   * @param  {[jQuery Element]} $foundationDescendant [One of the children of the picked element.]
   * @param  {[jQuery Element]} $foundation      [The element that is the model for the HLB (typically same as $pickedElement.]
   * @return {[Boolean]}
   */
  function shouldRemoveHorizontalMargins($foundationDescendant, $foundation) {
    var $children = $foundationDescendant.parent().children(), $parents = $foundationDescendant.parentsUntil($foundation), parentCount = $parents.length, childCount = $children.length, hasOverlap = false, boundingRects = [], i = 0, j = 0;
    if (1 === childCount) {
      return true;
    }
    for (;i < parentCount; i += 1) {
      if ($parents[i].getBoundingClientRect().left < $foundationDescendant[0].getBoundingClientRect().left) {
        return false;
      }
    }
    for (i = 0; i < childCount; i += 1) {
      boundingRects.push($children[i].getBoundingClientRect());
    }
    for (i = 0; i < childCount; i += 1) {
      for (;j < childCount; j += 1) {
        if (i !== j) {
          if (!(boundingRects[i].top >= boundingRects[j].bottom || boundingRects[i].bottom <= boundingRects[j].top)) {
            hasOverlap = true;
          }
        }
      }
    }
    return !hasOverlap;
  }
  //////////////////////////
  // PUBLIC FUNCTIONS
  //////////////////////////
  /**
   * [setHLBChildTextColor determines and sets a text color for all HLB children so that they are in
   * contrast with the background colors behind them.]
   * @param {[jQuery element]} $hlb [The HLB element]
   * NOTE: This function was created to fix a bug found on TexasAT home page navigation (Home, Sitemap, Contact Us)
   */
  function setHLBChildTextColor($hlb) {
    var children;
    // If the $hlb uses a background image then assume text is readable.
    // TODO: improve this entire mechanism.
    if ("none" !== $hlb.css("backgroundImage")) {
      return;
    }
    children = $hlb.find("*");
    // For every HLB child...
    children.each(function() {
      var textColor = $(this).css("color"), backgroundColor = $(this).css("backgroundColor"), forceTextColor = false;
      // If the HLB child has a transparent background, or the background is the same color as the text,
      // then we have to determine if we need to set the HLB childs text color by traversing the ancestor
      // chain for.
      if (isTransparent(backgroundColor) || textColor === backgroundColor) {
        //  Check every ancestor up to and including the HLB element
        $(this).parentsUntil($hlb.parent()).each(function() {
          var parentBackgroundColor = $(this).css("backgroundColor");
          // If we run into a parent who has a non-transparent background color
          if (!isTransparent(parentBackgroundColor)) {
            // Set the childs text color if the current text color and the first non-transparent
            // background color are exactly the same.
            if (textColor === parentBackgroundColor) {
              forceTextColor = true;
              return false;
            } else {
              return false;
            }
          }
        });
        if (forceTextColor) {
          inlineStyle(this).color = HLB_DEFAULT_TEXT_COLOR;
        }
      }
    });
  }
  /**
   * [getHLBStyles gets the HLB styles.]
   * @param {[DOM element]} $foundation [the original element]
   * @return {[Object]} [CSS style object to be used by jQuery.css()]
   */
  function getHLBStyles($picked, $foundation, highlight) {
    var originalElement = $foundation[0], originalElementRect = originalElement.getBoundingClientRect(), elementComputedStyle = window.getComputedStyle(originalElement), backgroundStyles = getHLBBackgroundImage($picked, elementComputedStyle), backgroundColor = getHLBBackgroundColor($picked, elementComputedStyle), calculatedHLBStyles = {
      paddingLeft: getHLBLeftPadding($foundation, elementComputedStyle),
      display: getHLBDisplay(elementComputedStyle),
      left: originalElementRect.left + window.scrollLeft,
      top: originalElementRect.top + window.scrollTop
    }, borderStyles = {
      borderColor: highlight.hasDarkBackgroundColor ? highlight.highlightBorderColor : "#000"
    }, animationOptimizationStyles = {
      willChange: "transform",
      backfaceVisibility: "hidden"
    };
    // If the background color is the same as the text color, use default text and background colors
    if (backgroundColor === $foundation.css("color")) {
      calculatedHLBStyles.color = HLB_DEFAULT_TEXT_COLOR;
      calculatedHLBStyles.backgroundColor = HLB_DEFAULT_BACKGROUND_COLOR;
    } else {
      calculatedHLBStyles.backgroundColor = backgroundColor;
    }
    // If the original element uses a background image, preserve original padding.
    // This was implemented to fix SC-1830
    // If the background image repeats, there is no need to preserve the padding.
    if ("none" !== $foundation.css("backgroundImage") && "repeat" !== $foundation.css("backgroundRepeat")) {
      calculatedHLBStyles.paddingLeft = $foundation.css("paddingLeft");
      calculatedHLBStyles.paddingTop = $foundation.css("paddingTop");
      calculatedHLBStyles.paddingBottom = $foundation.css("paddingBottom");
      calculatedHLBStyles.paddingRight = $foundation.css("paddingRight");
    } else {
      if (backgroundStyles.$ancestor) {
        var $ancestor = backgroundStyles.$ancestor;
        // If the background image repeats, there is no need to preserve the padding.
        if ("repeat" !== $ancestor.css("backgroundRepeat")) {
          calculatedHLBStyles.paddingLeft = $ancestor.css("paddingLeft");
          calculatedHLBStyles.paddingTop = $ancestor.css("paddingTop");
          calculatedHLBStyles.paddingBottom = $ancestor.css("paddingBottom");
          calculatedHLBStyles.paddingRight = $ancestor.css("paddingRight");
        }
      }
    }
    delete backgroundStyles.$ancestor;
    return $.extend({}, defaultHLBStyles, borderStyles, calculatedHLBStyles, backgroundStyles, animationOptimizationStyles);
  }
  /**
   * [filter filters elements, attributes, and styles from the HLB]
   * @param  {[DOM element]} $hlb [HLB]
   */
  function filter($hlb, $picked, hiddenElements) {
    filterStyles($hlb);
    filterHiddenElements($hlb, $picked, hiddenElements);
    filterBlacklistedElements($hlb);
    filterAttributes($hlb);
  }
  /**
   * [initializeStyles clones the original elements styles and the styles of all of its children.]
   * @param  {[DOM element]} $foundation [sanitized picked element]
   * @param  {[DOM element]} $hlb [The HLB]
   */
  function initializeStyles($foundation, $hlb, initialHLBRect, hiddenElements) {
    initializeHLBElementStyles($foundation, $hlb);
    initializeHLBDescendantStyles($foundation, $hlb, initialHLBRect, hiddenElements);
  }
  /**
   * [getComputedStyleCssText returns the cssText of an element]
   * @param  {[DOM element]} element [DOM element]
   * @return {[String]}              [Computed styles for an DOM element]
   * NOTE: Fixes bug described here: [https://bugzilla.mozilla.org/show_bug.cgi?id=137687]
   */
  function getComputedStyleCssText(element) {
    var style = window.getComputedStyle(element), cssText = "";
    if ("" !== style.cssText) {
      return style.cssText;
    }
    for (var i = 0; i < style.length; i++) {
      cssText += style[i] + ": " + style.getPropertyValue(style[i]) + "; ";
    }
    return cssText;
  }
  return {
    defaultBorder: defaultBorder,
    defaultPadding: defaultPadding,
    transitionProperty: transitionProperty,
    setHLBChildTextColor: setHLBChildTextColor,
    getHLBStyles: getHLBStyles,
    filter: filter,
    initializeStyles: initializeStyles,
    getComputedStyleCssText: getComputedStyleCssText
  };
});

sitecues.define("hlb/safe-area", [], function() {
  /////////////////////////
  // PRIVATE VARIABLES
  ////////////////////////
  /////////////////////////
  // PUBLIC PROPERTIES
  ////////////////////////
  // Default fraction of viewport hypotenuse that will define the safe area
  var HLB_SAFE_AREA = .05;
  /////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////
  /**
   * [getUnsafePixels returns the amount of pixels from the
   * edge of the viewport that defines the safe zone]
   * @return {number} [pixels]
   */
  function getUnsafePixels() {
    var hypotenuse = Math.sqrt(Math.pow(window.innerHeight, 2) + Math.pow(window.innerWidth, 2));
    return hypotenuse * HLB_SAFE_AREA;
  }
  /////////////////////////
  // PUBLIC METHODS
  ////////////////////////
  // Returns a rectangle the represents the area in which the HLB is allowed to occupy
  function getSafeZoneBoundingBox() {
    var unsafePixels = getUnsafePixels();
    return {
      left: unsafePixels,
      top: unsafePixels,
      width: window.innerWidth - 2 * unsafePixels,
      height: window.innerHeight - 2 * unsafePixels,
      right: window.innerWidth - unsafePixels,
      bottom: window.innerHeight - unsafePixels
    };
  }
  return {
    getSafeZoneBoundingBox: getSafeZoneBoundingBox
  };
});

/**
 * HLB Positioning is responsible for positioning the HLB so that the HLB and the original element's midpoints
 * overlap or the HLB is as close to the original element while being encapsulated within the HLB_SAFE_AREA.
 * It is also responsible for calculating and setting the appropriate height/width of the HLB so that it is
 * encapsulated within the HLB_SAFE_AREA.
 */
sitecues.define("hlb/positioning", [ "$", "run/conf/pref", "hlb/styling", "page/util/common", "page/util/element-classifier", "hlb/safe-area", "run/inline-style/inline-style" ], function($, pref, hlbStyling, common, elemClassifier, hlbSafeArea, inlineStyle) {
  /////////////////////////
  // PRIVATE VARIABLES
  /////////////////////////
  var // Amount of characters that fits horizontally in HLB
  originCSS, // The HLB element's midpoint for animation
  translateCSS, CHAR_WIDTH_LIMIT = 50, // The HLB element's translation for final position
  isEditable = elemClassifier.isEditable, isVisualMedia = elemClassifier.isVisualMedia, isFormControl = elemClassifier.isFormControl;
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
    var sum, hlbBoundingRect = $hlb[0].getBoundingClientRect(), childBoundingRect = child.getBoundingClientRect(), inheritedZoom = getInheritedZoom($hlb), leftDiff = childBoundingRect.left > hlbBoundingRect.left ? childBoundingRect.left - hlbBoundingRect.left : 0, leftSum = 0, rightSum = 0;
    $(child).parentsUntil($hlb.parent()).addBack().each(function() {
      var computedStyle = getComputedStyle(this);
      // marginRight has been commented out to fix issue on faast.org when HLBing
      // "About" in the top navigation.  I thought marginRight pushes its content to the left,
      // but in that case apparently not.  The rule of what marginRight does may be dependent
      // on other factors which I do not know, but removing it does not appear to break anything
      // that this function originally fixed.
      // rightSum += parseFloat(computedStyle.marginRight);
      rightSum += parseFloat(computedStyle.paddingRight) + parseFloat(computedStyle.borderRightWidth);
      leftSum += parseFloat(computedStyle.marginLeft) + parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.borderLeftWidth);
    });
    sum = leftSum + rightSum;
    if (leftDiff && leftDiff > leftSum) {
      leftDiff -= leftSum;
    } else {
      leftDiff = 0;
    }
    return hlbBoundingRect.width / inheritedZoom - sum - leftDiff;
  }
  /**
   * [limitChildWidth computes and sets the max-width for all HLB child elements if needed.]
   * @param  {[jQuery Element]} $hlb [The HLB element]
   */
  function limitChildWidth($hlb) {
    var fixit, allHLBChildren, hlbClientWidth, childRect, hlbRect, scrollDiff, hlbElementRangeWidth, hlbElementContentRangeWidth, // document.createRange() is used instead of scrollWidth because of content on http://www.nvblindchildren.org/
    // If content is pushed outside of the HLB to the left, we must use document.createRange().
    hlbElementRangeRect = document.createRange(), borderLeftAndRight = 2 * (parseFloat($hlb.css("borderWidth")) || 0);
    hlbElementRangeRect.selectNode($hlb[0]);
    hlbElementRangeWidth = hlbElementRangeRect.getBoundingClientRect().width - borderLeftAndRight;
    hlbElementRangeRect.selectNodeContents($hlb[0]);
    hlbElementContentRangeWidth = hlbElementRangeRect.getBoundingClientRect().width - borderLeftAndRight;
    if ($hlb[0].clientWidth < Math.max(hlbElementRangeWidth, hlbElementContentRangeWidth)) {
      if (true) {
        console.log("%cSPECIAL CASE: HLB child width limiting algorithm.", "background:orange;");
      }
      allHLBChildren = $hlb.find("*");
      fixit = true;
      allHLBChildren.each(function() {
        inlineStyle(this).maxWidth = getChildWidth(this, $hlb) + "px";
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
      if (true) {
        console.log("%cSPECIAL CASE: HLB child width limiting algorithm because vertical scrollbar.", "background:orange;");
      }
      scrollDiff = hlbClientWidth - $hlb[0].clientWidth;
      hlbRect = $hlb[0].getBoundingClientRect();
      allHLBChildren.each(function() {
        // Performing this check because http://www.nvblindchildren.org/give.html top navigation..
        childRect = this.getBoundingClientRect();
        if (childRect.left < hlbRect.left || childRect.right + scrollDiff > hlbRect.right) {
          inlineStyle(this).maxWidth = parseFloat(getComputedStyle(this).maxWidth) - scrollDiff + "px";
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
      return "static" !== css.position || "none" !== css.float || "table-cell" !== css.display;
    }
    // Returns false when an element is not wrappable or, if part of an HLB,
    // wrapping the HLB would be bad (would break the intended layout, for example).
    function testAllowWrapping(index, element) {
      var css = getComputedStyle(element);
      allowWrapping = ("normal" === css.whiteSpace || "preWrap" === css.whiteSpace) && (!hasPositioningCss(css) || isLonerElement(element)) && !isVisualMedia(element) && !isFormControl(element) && !isEditable(element);
      // This fixed something on gwmicro, but broke other things.
      // if (css.display === 'table-cell') {
      //   allowWrapping = false;
      // }
      return allowWrapping;
    }
    // Fixes case on www.reddit.com/r/science when opening HLB on "The New Reddit Journal of Science"
    // We use max-width: 50ch to limit the width.  In this particular case, the font-size of the element
    // is 0, which causes the units of width limiting to have no effect because they are multiples of 0.
    if (0 === +$hlb.css("fontSize").charAt(0)) {
      return;
    }
    // Easiest way to fix issue when HLBing
    // "Summary Table Voluntary Product Accessibility Template" on http://www.gwmicro.com/Window-Eyes/VPAT/
    if ($hlb.is("table")) {
      return;
    }
    $hlb.find("*").addBack().each(testAllowWrapping);
    return allowWrapping;
  }
  /**
   * [getExtraLeftPadding returns addition left-padding of the HLB]
   * @param  {[jQuery element]} $hlb [HLB element]
   * @return {[integer]}                    [The additional left-padding]
   */
  function getExtraLeftPadding($hlb) {
    return parseInt($hlb.css("paddingLeft")) - hlbStyling.defaultPadding;
  }
  /**
   * [midPointDiff computes the distance between the midpoints of 2 rects]
   * @return {[object]}         [x and y difference between the 2 midpoints]
   */
  function midPointDiff(rect1, rect2) {
    var br1x = rect1.left + rect1.width / 2, br1y = rect1.top + rect1.height / 2, br2x = rect2.left + rect2.width / 2, br2y = rect2.top + rect2.height / 2;
    return {
      x: br1x - br2x,
      y: br1y - br2y
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
      if (true) {
        console.log("%cSPECIAL CASE: 50 Character width limit.", "background:orange;");
      }
      // 'ch' units are equal to the width of the "0" character
      inlineStyle($hlb[0]).maxWidth = characterWidthLimit + "ch";
    }
  }
  /**
   * [mitigateVerticalScroll increases the height of the HLB to fit its content.]
   * @param  {[jQuery element]} $hlb [HLB]
   */
  function mitigateVerticalScroll($hlb) {
    var hlb = $hlb[0];
    // If the HLB has a vertical scrollbar and has a height less than the safe zone height
    if (common.hasVertScroll(hlb) && scaleRectFromCenter($hlb).height < hlbSafeArea.getSafeZoneBoundingBox().height) {
      // Set to the scroll height minus 4 (half of the padding)
      // It is necessary to subtract the padding because scrollHeight includes padding.
      inlineStyle(hlb).height = hlb.scrollHeight - parseInt(getComputedStyle(hlb).paddingBottom) + "px";
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
      x: 0,
      y: 0
    }, container = hlbSafeArea.getSafeZoneBoundingBox();
    if (element.left < container.left) {
      offset.x -= container.left - element.left;
    }
    if (element.top < container.top) {
      offset.y -= container.top - element.top;
    }
    if (element.left + element.width > container.right) {
      offset.x += element.left + element.width - container.right;
    }
    if (element.top + element.height > container.bottom) {
      offset.y += element.top + element.height - container.bottom;
    }
    return offset;
  }
  /**
   * [constrainHeightToSafeArea constrains the height of the HLB to the safe area.
   * If HLB is an image, then it keeps the aspect ratio.]
   * @param  {[jQuery element]} $hlb [HLB element]
   */
  function constrainHeightToSafeArea($hlb) {
    var hlb = $hlb[0], hlbStyle = inlineStyle(hlb), originalHeight = scaleRectFromCenter($hlb).height, safeZoneHeight = hlbSafeArea.getSafeZoneBoundingBox().height;
    // Would the scaled element's height be greater than the safe area height?
    if (originalHeight > safeZoneHeight) {
      // height is now the "safe zone" height, minus the padding/border
      hlbStyle.height = safeZoneHeight / getFinalScale($hlb) / getInheritedZoom($hlb) - (hlbStyling.defaultBorder + hlbStyling.defaultBorder + parseInt($hlb.css("paddingTop")) + parseInt($hlb.css("paddingBottom"))) + "px";
      // Keep aspect ratio if HLB is an image
      if (isVisualMedia(hlb)) {
        // We need to recalculate the bounding client rect of the HLB element, because we just changed it.
        hlbStyle.width = hlb.getBoundingClientRect().width / getInheritedZoom($hlb) * (safeZoneHeight / originalHeight) + "px";
      }
    }
  }
  /**
   * [constrainWidthToSafeArea constrains the width of the HLB to the safe area.
   * If HLB is an image, then it keeps the aspect ratio.]
   * @param  {[jQuery element]} $hlb [HLB element]
   */
  function constrainWidthToSafeArea($hlb) {
    var hlb = $hlb[0], hlbStyle = inlineStyle(hlb), originalWidth = scaleRectFromCenter($hlb).width, safeZoneWidth = hlbSafeArea.getSafeZoneBoundingBox().width;
    // Would the scaled element's width be greater than the safe area width?
    if (originalWidth > safeZoneWidth) {
      // width is now the "safe zone" width, minus the padding/border
      hlbStyle.width = safeZoneWidth / getFinalScale($hlb) / getInheritedZoom($hlb) - 2 * (hlbStyling.defaultBorder + hlbStyling.defaultPadding + getExtraLeftPadding($hlb) / 2) + "px";
      // Keep aspect ratio if HLB is an image
      if (isVisualMedia(hlb)) {
        // We need to recalculate the bounding client rect of the HLB element, because we just changed it.
        hlbStyle.height = hlb.getBoundingClientRect().height / getInheritedZoom($hlb) * (safeZoneWidth / originalWidth) + "px";
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
    var zoom = getPageZoom(), width = initialHLBRect.width / zoom + "px", height = initialHLBRect.height / zoom + "px";
    inlineStyle.set($hlb[0], {
      width: width,
      //Preserve dimensional ratio
      height: height
    });
    // This fixes the HLB being too wide or tall (lots of whitespace) for www.faast.org/news
    // when HLBing "News" header.  Because we copy computedStyles, we sometimes get an HLB
    // that has a child that is much wider or taller than the highlight, causing the HLB
    // to increase in width and height for the purpose of avoiding scrollbars.
    // TODO: cache descendants because we use it alot
    inlineStyle.set($hlb.find("*").get(), {
      maxWidth: width
    });
  }
  /**
   * [scaleRectFromCenter helper function for calculating a bounding box if an element were to be scaled from 50%50%]
   * @param  {[jQuery element]} $hlb [HLB]
   * @return {[object]}                     [A simulated bounding client rect]
   */
  function scaleRectFromCenter($hlb) {
    var clonedNodeBoundingBox = $hlb[0].getBoundingClientRect(), zoomFactor = getFinalScale($hlb);
    // The bounding box of the cloned element if we were to scale it
    return {
      left: clonedNodeBoundingBox.left - (clonedNodeBoundingBox.width * zoomFactor - clonedNodeBoundingBox.width) / 2,
      top: clonedNodeBoundingBox.top - (clonedNodeBoundingBox.height * zoomFactor - clonedNodeBoundingBox.height) / 2,
      width: clonedNodeBoundingBox.width * zoomFactor,
      height: clonedNodeBoundingBox.height * zoomFactor
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
      inlineStyle(hlb).overflowY = "scroll";
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
      if (true) {
        console.log("%cSPECIAL CASE: Fix overflow width.", "background:orange;");
      }
      inlineStyle.set(hlbElement, {
        width: hlbElement.scrollWidth + hlbStyling.defaultPadding + "px",
        maxWidth: "none"
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
    var paddingLeft, paddingTop, childLeft, childTop, hasBackgroundImage, childBoundingRect, hlbBoundingRect = $hlb[0].getBoundingClientRect(), hlbLeft = hlbBoundingRect.left, hlbTop = hlbBoundingRect.top, extraLeft = 0, extraTop = 0, originalHLBLeftPadding = parseFloat($hlb.css("paddingLeft")), originalHLBTopPadding = parseFloat($hlb.css("paddingTop"));
    $hlb.find("*").each(function() {
      var thisStyle = inlineStyle(this);
      // These elements to not make sense to check because their
      // bounding rects are not consistent with their visual position
      if (!$(this).is("br, option") && ($(this).css("marginLeft").indexOf("-") !== -1 || $(this).css("marginTop").indexOf("-") !== -1)) {
        childBoundingRect = this.getBoundingClientRect();
        childLeft = childBoundingRect.left;
        childTop = childBoundingRect.top;
        hasBackgroundImage = "none" !== thisStyle.backgroundImage;
        paddingLeft = hasBackgroundImage ? 0 : parseFloat(thisStyle.paddingLeft);
        paddingTop = hasBackgroundImage ? 0 : parseFloat(thisStyle.paddingTop);
        if (childLeft + paddingLeft < hlbLeft && hlbLeft - childLeft - paddingLeft > extraLeft) {
          if (true) {
            console.log("%cSPECIAL CASE: Negative Margin-Left Fix.", "background:orange;");
          }
          extraLeft = hlbLeft - childLeft - paddingLeft;
        }
        if (childTop + paddingTop < hlbTop && hlbTop - childTop - paddingTop > extraTop) {
          if (true) {
            console.log("%cSPECIAL CASE: Negative Margin-Top Fix.", "background:orange;");
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
        if (true) {
          console.log("%cSPECIAL CASE: Reset HLB width to use padding for width...", "background:orange;");
        }
        inlineStyle($hlb[0]).width = initialHLBRect.width / getPageZoom() - extraLeft + "px";
        fixOverflowWidth($hlb);
      }
    });
    inlineStyle.set($hlb[0], {
      paddingTop: extraTop ? originalHLBTopPadding + extraTop + hlbStyling.defaultPadding + hlbStyling.defaultBorder : originalHLBTopPadding,
      paddingLeft: extraLeft ? originalHLBLeftPadding + extraLeft + hlbStyling.defaultPadding + hlbStyling.defaultBorder : originalHLBLeftPadding
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
  }
  // HLB transform scale necessary to provide the HLBExtraZoom size increase.
  // If zoom is on the body, then scaling needs to account for that since the HLB is outside of the body.
  function getFinalScale($hlb) {
    return getHlbZoom() * getStartingScale($hlb);
  }
  function getPageZoom() {
    return pref.get("zoom") || 1;
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
    if (true) {
      console.log("INITIAL: %o", initialHLBRect);
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
    var constrainedOffset, hlb = $hlb[0], HLBBoundingBoxAfterZoom = scaleRectFromCenter($hlb), HLBBoundingBox = hlb.getBoundingClientRect(), // These are used in the positioning calculation.
    // They are the differences in height and width before and after the HLB is scaled.
    expandedWidthOffset = (HLBBoundingBoxAfterZoom.width - HLBBoundingBox.width) / 2, expandedHeightOffset = (HLBBoundingBoxAfterZoom.height - HLBBoundingBox.height) / 2, // The difference between the mid points of the hlb element and the original
    offset = midPointDiff(hlb.getBoundingClientRect(), initialHLBRect);
    // Update the dimensions for the HLB which is used for constraint calculations.
    // The offset of the original element and cloned element midpoints are used for positioning.
    HLBBoundingBoxAfterZoom.left = HLBBoundingBox.left - offset.x - expandedWidthOffset;
    HLBBoundingBoxAfterZoom.top = HLBBoundingBox.top - offset.y - expandedHeightOffset;
    HLBBoundingBoxAfterZoom.right = HLBBoundingBoxAfterZoom.left + HLBBoundingBoxAfterZoom.width;
    HLBBoundingBoxAfterZoom.bottom = HLBBoundingBoxAfterZoom.top + HLBBoundingBoxAfterZoom.height;
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
    translateCSS = "translate(" + -offset.x / inheritedZoom + "px, " + -offset.y / inheritedZoom + "px)";
    // This is important for animating from the center point of the HLB
    originCSS = -offset.x / inheritedZoom + HLBBoundingBox.width / 2 / inheritedZoom + "px " + (-offset.y / inheritedZoom + HLBBoundingBox.height / 2 / inheritedZoom) + "px";
    // Position the HLB without it being scaled (so we can animate the scale).
    var startAnimationZoom = getPageZoom() / inheritedZoom, hlbStyles = {
      transform: "scale(" + startAnimationZoom + ") " + translateCSS,
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

/**
 * BackgroundDimmer can dim all content in the page behind a given z-index.
 */
sitecues.define("hlb/dimmer", [ "$", "hlb/constants", "run/inline-style/inline-style" ], function($, constants, inlineStyle) {
  //////////////////////////////
  // PRIVATE VARIABLES
  /////////////////////////////
  var DIMMER_ID = "sitecues-background-dimmer", DIMMER_MIN_OPACITY = 0, DIMMER_MAX_OPACITY = .65, requestFrameFn = window.requestAnimationFrame;
  //////////////////////////////
  // PUBLIC FUNCTIONS
  /////////////////////////////
  /**
   * dimBackgroundContent creates the background dimmer element, positions it, and transitions opacity
   * @param  {number}        inflationSpeed      The duration of the opacity transition
   * @param  {Object} (optional) $parentOfDimmer  A selector describing the node that should parent the dimmer
   */
  function dimBackgroundContent(inflationSpeed, $foreground) {
    function createDimmerElement() {
      var documentElement = document.documentElement, width = Math.max(documentElement.scrollWidth, window.innerWidth), height = Math.max(documentElement.scrollHeight, window.innerHeight), // Draw a rectangle that does not capture any mouse events
      useCss = {
        display: "block",
        position: "absolute",
        zIndex: constants.MAX_ZINDEX,
        top: 0,
        left: 0,
        width: width + "px",
        height: height + "px",
        backgroundColor: "#000",
        pointerEvents: "none",
        willChange: "opacity"
      }, newDimmer = $("<sc>");
      inlineStyle.set(newDimmer[0], useCss);
      newDimmer = newDimmer.attr("id", DIMMER_ID)[0];
      animateOpacity(newDimmer, DIMMER_MIN_OPACITY, DIMMER_MAX_OPACITY, inflationSpeed);
      return newDimmer;
    }
    var dimmerElement = getDimmerElement() || createDimmerElement();
    // If created before, will ensure it's moved before the current hlb wrapper
    $(dimmerElement).insertBefore($foreground);
  }
  function animateOpacity(dimmerElement, startOpacity, endOpacity, speed, onCompleteFn) {
    var startTime = Date.now();
    function nextFrame() {
      var timeElapsed = Date.now() - startTime, percentComplete = timeElapsed > speed ? 1 : timeElapsed / speed, currentOpacity = startOpacity + (endOpacity - startOpacity) * percentComplete;
      inlineStyle(dimmerElement).opacity = currentOpacity;
      if (percentComplete < 1) {
        requestFrameFn(nextFrame);
      } else {
        if (onCompleteFn) {
          onCompleteFn();
        }
      }
    }
    nextFrame();
  }
  /**
   * [undimBackgroundContent transitions the opacity of the dimmer to DIMMER_MIN_OPACITY]
   * @param  {[integer]} deflationSpeed [The duration of the opacity transition]
   */
  function undimBackgroundContent(deflationSpeed) {
    var dimmer = getDimmerElement();
    if (dimmer) {
      // Still there
      animateOpacity(dimmer, DIMMER_MAX_OPACITY, DIMMER_MIN_OPACITY, deflationSpeed, onDimmerClosed);
    }
  }
  /**
   * [onDimmerClosed removes the dimmer element from the DOM]
   */
  function onDimmerClosed() {
    $(getDimmerElement()).remove();
  }
  function getDimmerElement() {
    return document.getElementById(DIMMER_ID);
  }
  return {
    dimBackgroundContent: dimBackgroundContent,
    undimBackgroundContent: undimBackgroundContent
  };
});

/*
  This module animates the HLB.  Depending on the browser, the mechanism
  of animation is either CSS3 Transitions or jQuery.animate.
 */
sitecues.define("hlb/animation", [ "hlb/dimmer", "page/util/common", "hlb/positioning", "run/platform", "$", "hlb/constants", "mini-core/native-global", "run/inline-style/inline-style" ], function(dimmer, common, hlbPositioning, platform, $, constants, nativeGlobal, inlineStyle) {
  var INFLATION_SPEED = 400, // Default inflation duration
  INFLATION_SPEED_FAST = 0, // Inflation duration when retargeting -- need > 0 so that animation end fires correctly
  DEFLATION_SPEED = 150, // Default deflation duration
  getStartingScale = hlbPositioning.getStartingScale;
  /**
   * [transitionInHLB animates the inflation of the HLB and background dimmer]
   * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
   */
  function transitionInHLB(doShowQuickly, data) {
    // Dim the background!
    dimmer.dimBackgroundContent(INFLATION_SPEED, $("#" + constants.HLB_WRAPPER_ID));
    var $hlb = data.$hlb, speed = doShowQuickly ? INFLATION_SPEED_FAST : INFLATION_SPEED, startingScale = getStartingScale($hlb);
    inlineStyle($hlb[0]).transformOrigin = data.originCSS;
    animateCss($hlb[0], startingScale, hlbPositioning.getFinalScale($hlb), speed, data.translateCSS, data.onHLBReady);
  }
  /**
   * [transitionOutHLB animates and removes the HLB and background dimmer]
   * @param  {[Object]} data [The information passed by the HLB module to perform the animation]
   */
  function transitionOutHLB(data) {
    var $hlb = data.$hlb;
    // Un-dim the background!
    dimmer.undimBackgroundContent(DEFLATION_SPEED);
    // Do we bother animating the deflation?
    // Sometimes, if the user presses the spacebar extremely fast, the HLB is toggled
    // to close during the HLB inflation animation (transitionInHLB). Because this is
    // possible, it is also possible that the value of transform:scale is 1 by the time
    // we want to deflate, and thus the transition end event cannot be used as a callback
    // mechanism (because there is nothing to animate if scale is already 1).  Therefore,
    // we check to see if the HLB scale is greater than one, and if so, we animate the
    // deflation, otherwise, we just skip the deflation step
    if (!isHLBZoomed($hlb)) {
      data.onHLBClosed();
      return;
    }
    animateCss($hlb[0], getCurrentScale($hlb), getStartingScale($hlb), DEFLATION_SPEED, data.translateCSS, data.onHLBClosed);
  }
  function animateCss(hlbElement, startScale, endScale, speed, translateCSS, onCompleteFn) {
    var fromCss = {}, toCss = {
      transform: "scale(" + endScale + ") " + translateCSS
    };
    inlineStyle(hlbElement).transitionProperty = "none";
    // Clear any existing transition
    if (!speed) {
      // No animation -- do it immediately and return
      inlineStyle.set(hlbElement, toCss);
      onCompleteFn();
      return;
    }
    // Animate fromCss -> toCss
    fromCss.transform = "scale(" + startScale + ") " + translateCSS;
    inlineStyle.set(hlbElement, fromCss);
    function onTransitionEnd() {
      hlbElement.removeEventListener(platform.transitionEndEvent, onTransitionEnd);
      onCompleteFn();
    }
    // Allow the from CSS to register so that setting the toCss actually animates there
    // rather than just setting the toCss and ignoring the fromCss
    nativeGlobal.setTimeout(function() {
      toCss.transition = "transform " + speed + "ms ease-in-out";
      inlineStyle.set(hlbElement, toCss);
      hlbElement.addEventListener(platform.transitionEndEvent, onTransitionEnd);
    }, 0);
  }
  function getCurrentScale($hlb) {
    return common.getComputedScale($hlb[0]);
  }
  /**
   * [isHLBZoomed determines if the $hlb is scaled greater than one.
   * This is useful for the transitionOutHLB function.]
   * @return {Boolean} [if true, $hlb is scaled > zoom]
   * @example "matrix(1.5, 0, 0, 1.5, 1888.0610961914063, 2053.21875)"
   * @example "matrix(1, 0, 0, 1, 1888.0610961914063, 2053.21875)"
   */
  function isHLBZoomed($hlb) {
    // If there isn't any transform, then it isn't scaled.
    var scale = getCurrentScale($hlb);
    return scale > hlbPositioning.getStartingScale($hlb);
  }
  return {
    transitionInHLB: transitionInHLB,
    transitionOutHLB: transitionOutHLB
  };
});

/**
 * This is the box that appears when the user asks to read the highlighted text in a page.
 * Documentation: https://equinox.atlassian.net/wiki/display/EN/HLB3
 */
sitecues.define("hlb/hlb", [ "$", "hlb/event-handlers", "hlb/positioning", "hlb/styling", "run/conf/preferences", "run/platform", "page/util/element-classifier", "hlb/animation", "page/util/geo", "run/metric/metric", "hlb/constants", "run/events", "run/inline-style/inline-style" ], function($, eventHandlers, hlbPositioning, hlbStyling, pref, platform, elemClassifier, hlbAnimation, geo, metric, constants, events, inlineStyle) {
  /////////////////////////
  // PRIVATE VARIABLES
  ////////////////////////
  // Magic. Fixes problems where mouse highlight was SO accurate, that a simple rounding of a pixel
  // would unnecessarily wrap text. Seemed to be more prevalent on IE, fixes stuff for EEOC.
  // Value of 2 instead of 1 fixes wrapping text on this page for all headers:
  // http://www.windoweyesforoffice.com/sitecues/index.php
  var $picked, // The object chosen by the picker.
  $foundation, // The sanitized input, used as the basis for creating an $hlb.
  $hlb, // The cloned object, based on the $foundation.
  $hlbWrapper, // Container for both the HLB and background dimmer.
  initialHLBRect, // The highlight rect, if it exists, otherwise use the $foundation bounding client rect.
  inheritedZoom, EXTRA_HIGHLIGHT_PADDING = 2, // TODO: Figure out why this is needed and compute it.
  MOUSE_SAFETY_ZONE = 50, // Number of pixels the mouse is allowed to go outside the HLB, before it closes.
  FORMS_SELECTOR = "input, textarea, select", // Amount of zoom inherited from page's scale transform.
  removeTemporaryFoundation = false, // Did we create our own foundation? (becomes true for lonely elements)
  preventDeflationFromMouseout = false, // State tracking: should the HLB ignore mouse movement?
  isListeningToMouseEvents = false, // State tracking: are event listeners currently attached?
  isHLBClosing = false, // State tracking: is the HLB currently deflating?
  isSticky = false, // DEBUG: prevents the HLB from deflating on mouseout.
  foundations = {
    // Keys are tag names of "lonely" elements, which rely upon another element being present to work.
    // Values are functions that return a foundation (like the relied upon element).
    li: getValidListElement,
    fieldset: getValidFieldsetElement,
    input: getValidFormElement
  }, state = {};
  if (true) {
    // Boolean that determines if we log HLB information (only works in SC_DEV mode)
    var loggingEnabled = false;
  }
  //////////////////////////////
  // PRIVATE FUNCTIONS
  /////////////////////////////
  /**
   * [mapForm maps input values from one set of elements to another]
   * @param  {[jQuery element]} from [The HLB or The Foundation]
   * @param  {[jQuery element]} to   [The HLB or The Foundation]
   */
  function mapForm($from, $to, isHLBClosing) {
    // Get descendants of The HLB / The Foundation that may have a value.
    var i, $currentFromInput, $currentToInput, cloneIndex, fromInputType, $fromInputs = $from.find(FORMS_SELECTOR).addBack(FORMS_SELECTOR), $toInputs = $to.find(FORMS_SELECTOR).addBack(FORMS_SELECTOR), len = $fromInputs.length;
    for (i = 0; i < len; i += 1) {
      $currentFromInput = $fromInputs.eq(i);
      $currentToInput = $toInputs.eq(i);
      fromInputType = $currentFromInput.prop("type");
      cloneIndex = $currentToInput[0].getAttribute("data-sc-cloned");
      //If we're closing the HLB, and the current form element is part of a cloned foundation
      if (isHLBClosing && cloneIndex) {
        //Remove the index property from the HLB element
        $currentFromInput[0].removeAttribute("data-sc-cloned");
        //Query the DOM for the original form element, so we can copy the HLB form value back into the appropriate field
        $currentToInput = $('[data-sc-cloned="' + cloneIndex + '"]');
        //Remove the index from the original form element
        $currentToInput[0].removeAttribute("data-sc-cloned");
      }
      if ("radio" === fromInputType || "checkbox" === fromInputType) {
        $currentToInput.prop("checked", $currentFromInput.prop("checked"));
      } else {
        if (platform.browser.isSafari) {
          // In Safari, text inputs opening up in HLB show their contents flush to the bottom
          // instead of vertically centered, unless we tweak the value of the input just after the styles are set
          $currentToInput.val($currentFromInput.val() + " ");
        }
        $currentToInput.val($currentFromInput.val());
      }
    }
  }
  function copyFormDataToPage() {
    // Copy any form input the user may have entered in the HLB back into the page.
    mapForm($hlb, $foundation, true);
  }
  // Return truthy value if a button is pressed on a mouse event.
  // There are three properties for mouse buttons, and they all work differently -- both
  // in terms of browsers and on mousemove events in particular.
  function isButtonDown(mouseEvent) {
    return "undefined" === typeof mouseEvent.buttons ? mouseEvent.which : mouseEvent.buttons;
  }
  /**
   * [onTargetChange is enabled when the HLB is READY.
   * Deflates the HLB if allowed.]
   * @param  {[DOM mousemove event]} event [Mousemove event.]
   */
  function onTargetChange(event) {
    var HLBBoundingBox, newTarget = event.target, mouseX = event.clientX, mouseY = event.clientY, isMouseDown = isButtonDown(event);
    // The mouse has never been within the HLB bounds or
    // debugging is enabled.
    if (preventDeflationFromMouseout || isSticky) {
      return;
    }
    // Mouse is currently hovering over the HLB
    if ($hlb[0] === newTarget) {
      return;
    }
    // Is the left mouse button pressed?
    // The user is click + dragging text to copy.
    if (isMouseDown) {
      return;
    }
    HLBBoundingBox = $hlb[0].getBoundingClientRect();
    // If the mouse coordinates are not within the bounds of
    // the HLB + MOUSE_SAFETY_ZONE, then deflate the HLB.
    if (mouseX < HLBBoundingBox.left - MOUSE_SAFETY_ZONE || mouseX > HLBBoundingBox.right + MOUSE_SAFETY_ZONE || mouseY < HLBBoundingBox.top - MOUSE_SAFETY_ZONE || mouseY > HLBBoundingBox.bottom + MOUSE_SAFETY_ZONE) {
      closeHLB(event);
    }
  }
  /**
   * [turnOnHLBEventListeners turns on HLB event handlers for deflation and scroll]
   */
  function turnOnHLBEventListeners() {
    if (isListeningToMouseEvents) {
      return;
    }
    isListeningToMouseEvents = true;
    // Register mouse mousemove handler for deflating the HLB
    $(document).on("mousemove", onTargetChange);
    // Register mousemove handler on the HLB element to turn on the ability to exit the HLB by mouse
    // This event handler is unique in that it unregisters itself once executed.
    $hlb.on("mousemove", onHLBHover);
    // Register an event handler for closing the HLB by clicking outside of it.
    $("body").on("click", onClick);
    // Make sure mousewheel scrolls HLB but not page
    eventHandlers.captureWheelEvents($hlb);
  }
  /**
   * [onHLBReady executes once the HLB is ready (completed inflation animation).
   * Adds the appropriate event listeners and emits hlb/ready]
   */
  function onHLBReady() {
    // Focus input or textarea
    if (elemClassifier.isEditable($hlb[0])) {
      $hlb.focus();
    }
    // Let the rest of the application know that the hlb is ready
    // Listeners: hpan.js, invert.js, highlight.js, speech.js
    events.emit(constants.HLB_READY, $hlb, state.highlight);
  }
  /**
   * [turnOffHLBEventListeners turns off HLB event handlers for deflation and scroll]
   */
  function turnOffHLBEventListeners() {
    if (!isListeningToMouseEvents) {
      return;
    }
    // UNTrap the mousewheel events (we don't want the event to even think when the user scrolls without the HLB)
    eventHandlers.releaseWheelEvents();
    $hlb[0].removeEventListener(platform.transitionEndEvent, onHLBReady);
    // Turn off the ability to deflate the HLB with mouse
    $(document).off("mousemove", onTargetChange);
    // Register mouse mousemove handler for deflating the HLB
    $("body").off("click", onClick);
    isListeningToMouseEvents = false;
  }
  /**
   * [closeHLB prepares and deflates the HLB.]
   */
  function closeHLB(event) {
    copyFormDataToPage();
    // Set this to true to prevent toggleHLB();
    isHLBClosing = true;
    turnOffHLBEventListeners();
    hlbAnimation.transitionOutHLB({
      $hlb: $hlb,
      $hlbWrapper: $hlbWrapper,
      originCSS: hlbPositioning.getOriginCSS(),
      translateCSS: hlbPositioning.getTranslateCSS(),
      onHLBClosed: function() {
        onHLBClosed(event);
      },
      transitionProperty: hlbStyling.transitionProperty
    });
  }
  function targetHLB(highlight, isRetargeting) {
    state.highlight = highlight;
    if (!highlight.fixedContentRect) {
      return;
    }
    // Highlight is present -- guaranteed to have
    // at least one picked element and fixedContentRect outlining the highlight
    $picked = highlight.picked;
    // Set module scoped variable so the rest of the program has reference.
    initialHLBRect = getInitialHLBRect(highlight);
    // Disable mouse highlighting so we don't copy over the highlighting styles from the picked element.
    // It MUST be called before getFoundation().
    events.emit("mh/pause");
    // Sanitize the input, by accounting for "lonely" elements.
    $foundation = getFoundation($picked);
    // Turn off listeners for the old HLB. createHLB() will add new ones.
    turnOffHLBEventListeners();
    createHLB(highlight, isRetargeting);
  }
  /**
   * [toggleHLB closes or creates a new HLB]
   */
  function toggleHLB(highlight) {
    // Sadly, the HLB animation system does not currently
    // know how to reverse an animation, so we cannot
    // toggle if currently deflating. :(
    if (isHLBClosing) {
      return;
    }
    if ($hlb) {
      closeHLB();
    } else {
      targetHLB(highlight);
    }
  }
  /**
   * This is called when the user presses a key that moves the mouse highlight
   * has changed while the HLB opens
   */
  function retargetHLB(highlight) {
    copyFormDataToPage();
    // Make sure we don't lose any of the form entry from the current HLB
    $hlb.remove();
    targetHLB(highlight, true);
  }
  /**
   * [getInitialHLBRect returns the initial width and height for our HLB when we first create it.
   * Preferably we utilize the highlight rectangle calculated by the picker.]
   * @param  {[object]} highlight [Information about the highlight --
   *          see https://equinox.atlassian.net/wiki/display/EN/Internal+sitecues+API#InternalsitecuesAPI-Highlight]
   * @return {[Object]}   [Dimensions and position]
   */
  function getInitialHLBRect(highlight) {
    return geo.expandOrContractRect(highlight.fixedContentRect, EXTRA_HIGHLIGHT_PADDING);
  }
  /**
   * [createHLB initializes, positions, and animates the HLB]
   * @param isRetargeting -- true if HLB is moving from one place to another, false if brand new HLB mode
   */
  function createHLB(highlight, isRetargeting) {
    // clone, style, filter, emit hlb/did-create,
    // prevent mousemove deflation, disable scroll wheel
    initializeHLB(highlight);
    hlbPositioning.sizeHLB($hlb, $foundation, initialHLBRect);
    hlbPositioning.positionHLB($hlb, initialHLBRect, inheritedZoom);
    // Now that we have extracted all the information from the foundation,
    // it is time to ask whether or not a temporary element has been used
    // and remove it if true.
    if (removeTemporaryFoundation) {
      $foundation.remove();
      removeTemporaryFoundation = false;
    }
    var viewData = {
      $hlb: $hlb,
      $hlbWrapper: $hlbWrapper,
      originCSS: hlbPositioning.getOriginCSS(),
      translateCSS: hlbPositioning.getTranslateCSS(),
      onHLBReady: onHLBReady,
      transitionProperty: hlbStyling.transitionProperty
    };
    // .setTimeout MIGHT be necessary for the browser to complete the rendering and positioning
    // of the HLB.  Before we scale, it absolutely must be positioned correctly.
    // Note: Interestingly enough, this timeout is unnecessary if we comment out the
    // background dimmer in transitionInHLB(), because the operation took long enough
    // for the browser to update/render the DOM.  This is here for safety (until proven otherwise).
    // If we use a .setTimeout, we have to solve the problem of functions being added to the stack before
    // the timeout completes...its a pain.
    hlbAnimation.transitionInHLB(isRetargeting, viewData);
  }
  function getEditableItems() {
    function isEditable(index, element) {
      return elemClassifier.isEditable(element);
    }
    return $foundation.find("input,textarea").addBack().filter(isEditable);
  }
  /**
   * [initializeHLB is the first step in the creation process for the HLB.
   * This function is responsible for cloning the original element, mapping form data,
   * cloning child styles, filtering attributes, styles, and elements, and setting the
   * HLB with default styles and computed styles.]
   */
  function initializeHLB(highlight) {
    // Create and append the HLB and DIMMER wrapper element to the DOM
    $hlbWrapper = getOrCreateHLBWrapper();
    if (platform.browser.isIE && getEditableItems().length) {
      // TODO try to remove this hack:
      // IE + text fields -- avoid bug where textfield was locked
      if (true && loggingEnabled) {
        console.log("SPECIAL CASE: HLB inside <body>");
      }
      $hlbWrapper.appendTo("body");
      inheritedZoom = pref.get("zoom") || 1;
    } else {
      $hlbWrapper.insertAfter("body");
      inheritedZoom = 1;
    }
    // Prevents mouse movement from deflating the HLB until mouse is inside HLB
    preventDeflationFromMouseout = true;
    // Clone, style, filter
    cloneHLB(highlight);
    turnOnHLBEventListeners();
    // Listeners: speech.js
    events.emit("hlb/did-create", $hlb, highlight);
    new metric.LensOpen().send();
  }
  /**
   * [cloneHLB clones elements and styles from the foundation to the HLB.]
   */
  function cloneHLB(highlight) {
    var hlbStyles;
    // The cloned element (HLB)
    $hlb = $($foundation[0].cloneNode(true));
    var hlb = $hlb[0];
    // Copies form values from the foundation to the HLB
    // Need to do this on a timeout in order to enable Safari input fix hack
    // Commenting out .setTimeout fixes problem on TexasAT
    // .setTimeout(function() {
    mapForm($foundation, $hlb);
    // }, 0);
    // Clone styles of HLB and children of HLB, so layout is preserved
    hlbStyling.initializeStyles($foundation, $hlb, initialHLBRect, highlight.hiddenElements);
    // Remove any elements and styles we dont want on the cloned element (such as <script>, id, margin)
    // Filtering must happen after initializeStyles() because we map all children of the original element
    // to the children of the HLB.  There is a possibility that filter will remove one of those children making
    // it much more difficult to map...
    hlbStyling.filter($hlb, $picked, highlight.hiddenElements);
    // This step must occur after filtering, because some of the HLB default styles (such as padding),
    // are filtered as well.  For example, if we want to HLB an element that has 20px of padding, we filter
    // the padding styles (blacklist) and apply default styles.
    hlbStyles = hlbStyling.getHLBStyles($picked, $foundation, highlight);
    // Set the styles for the HLB and append to the wrapping element
    inlineStyle.set(hlb, hlbStyles);
    $hlb.appendTo($hlbWrapper);
    // Fixes problem with TexasAT home page when opening the top nav (Home, Sitemap, Contact Us) in HLB
    hlbStyling.setHLBChildTextColor($hlb);
    // Set the ID of the hlb.
    hlb.id = constants.HLB_ID;
  }
  /**
   * [getValidListElement if the element chosen is an <li>, then we must wrap it with a <ul>
      We must also append this newly created <ul> to the DOM so the HLB
      module can utilize styles and positioning of the "original element"
      Basically, we create a new original element.]
   * @param  {[jQuery element]} originalElement [The element chosen by the picker]
   * @return {[jQuery element]}                 [The element the HLB will use to create itself]
   */
  function getValidListElement($picked) {
    var i, pickedElement = $picked[0], pickedElementComputedStyle = window.getComputedStyle(pickedElement), pickedElementBoundingBox = pickedElement.getBoundingClientRect(), // TODO: Seth: Why not use jQuery's .clone() ??
    pickedElementClone = pickedElement.cloneNode(true), $pickedAndDescendants = $picked.find("*").addBack(), $pickedCloneAndDescendants = $(pickedElementClone).find("*").addBack(), $foundation = $("<ul>").append(pickedElementClone);
    // ARCHITECTURE PROBLEM: This function does not take into account any elements in the DOM tree
    // between the "lonely" picked element and its "guardian" ul or ol ancestor.
    // Google search results currently have this structure.
    // https://www.google.com/#q=cats
    // Setting this to true will remove the $foundation from the DOM before inflation.
    // This is a very special case where the foundation element is not the same as the picked element.
    // NOTE: This is setting a module scoped variable so the rest of the program as access.
    removeTemporaryFoundation = true;
    // It is important to clone the styles of the parent <ul> of the original element, because it may
    // have important styles such as background images, etc.
    inlineStyle($foundation[0]).cssText = hlbStyling.getComputedStyleCssText($picked.parents("ul, ol")[0]);
    // Create, position, and style this element so that it overlaps the element chosen by the picker.
    inlineStyle.set($foundation[0], {
      position: "absolute",
      left: (pickedElementBoundingBox.left + window.pageXOffset) / inheritedZoom,
      top: (pickedElementBoundingBox.top + window.pageYOffset) / inheritedZoom,
      opacity: 0,
      padding: 0,
      margin: 0,
      width: pickedElementBoundingBox.width / inheritedZoom,
      listStyleType: pickedElementComputedStyle.listStyleType || "none"
    });
    $foundation.insertAfter("body");
    // Map all picked elements children CSS to cloned children CSS
    for (i = 0; i < $pickedAndDescendants.length; i += 1) {
      inlineStyle($pickedCloneAndDescendants[i]).cssText = hlbStyling.getComputedStyleCssText($pickedAndDescendants[i]);
    }
    return $foundation;
  }
  // Implemented to fix issue on http://www.gwmicro.com/Support/Email_Lists/ when HLBing Subscription Management
  function getValidFieldsetElement($picked) {
    var i, pickedElement = $picked[0], pickedElementsBoundingBox = pickedElement.getBoundingClientRect(), // TODO: Seth: Why not use jQuery's .clone() ??
    pickedElementClone = pickedElement.cloneNode(true), $pickedAndDescendants = $picked.find("*").addBack(), $pickedCloneAndDescendants = $(pickedElementClone).find("*").addBack(), $foundation = $("<sc>").append(pickedElementClone);
    // Setting this to true will remove the $foundation from the DOM before inflation.
    // This is a very special case where the foundation is not the same as the picked element.
    // NOTE: This is setting a module scoped variable so the rest of the program as access.
    removeTemporaryFoundation = true;
    // Create, position, and style this element so that it overlaps the element chosen by the picker.
    inlineStyle.set($foundation[0], {
      position: "absolute",
      left: (pickedElementsBoundingBox.left + window.pageXOffset) / inheritedZoom,
      top: (pickedElementsBoundingBox.top + window.pageYOffset) / inheritedZoom,
      opacity: 0,
      padding: 0,
      margin: 0,
      width: pickedElementsBoundingBox.width / inheritedZoom
    });
    $foundation.insertAfter("body");
    // Map all picked elements children CSS to cloned children CSS
    for (i = 0; i < $pickedAndDescendants.length; i += 1) {
      inlineStyle($pickedCloneAndDescendants[i]).cssText = hlbStyling.getComputedStyleCssText($pickedAndDescendants[i]);
    }
    return $foundation;
  }
  function setCloneIndexOnFormDescendants($picked) {
    var i, $formDescendants = $picked.find(FORMS_SELECTOR).addBack(FORMS_SELECTOR);
    for (i = 0; i < $formDescendants.length; i++) {
      $formDescendants[i].setAttribute("data-sc-cloned", i + 1);
    }
  }
  // Implemented to fix issue on http://www.gwmicro.com/Support/Email_Lists/ when HLBing Subscription Management
  function getValidFormElement($picked) {
    var i, pickedElement = $picked[0], pickedElementsBoundingBox = pickedElement.getBoundingClientRect();
    //Set data attributes on each of the form input elements
    //This allows us to query the DOM for the original elements
    //when we want to give them the values entered into the HLB
    setCloneIndexOnFormDescendants($picked);
    var pickedElementClone = pickedElement.cloneNode(true), $pickedAndDescendants = $picked.find("*").addBack(), $pickedCloneAndDescendants = $(pickedElementClone).find("*").addBack(), $submitButton = $(), // TODO why? This was duplicating the button: $picked.closest('form').find('input[type="submit"],button[type="submit"]'),
    submitButtonClone = $submitButton.clone(true), $foundation = $("<form>").append(pickedElementClone, submitButtonClone);
    // Setting this to true will remove the $foundation from the DOM before inflation.
    // This is a very special case where the foundation is not the same as the picked element.
    // NOTE: This is setting a module scoped variable so the rest of the program as access.
    removeTemporaryFoundation = true;
    // Create, position, and style this element so that it overlaps the element chosen by the picker.
    inlineStyle.set($foundation[0], {
      position: "absolute",
      left: (pickedElementsBoundingBox.left + window.pageXOffset) / inheritedZoom,
      top: (pickedElementsBoundingBox.top + window.pageYOffset) / inheritedZoom,
      opacity: 0,
      padding: 0,
      margin: 0,
      width: pickedElementsBoundingBox.width / inheritedZoom
    });
    $foundation.insertAfter("body");
    // Map all picked elements children CSS to cloned children CSS
    for (i = 0; i < $pickedAndDescendants.length; i += 1) {
      inlineStyle($pickedCloneAndDescendants[i]).cssText = hlbStyling.getComputedStyleCssText($pickedAndDescendants[i]);
    }
    return $foundation;
  }
  /**
   * [getFoundation creates and returns a valid element for the HLB.
   *  SC-1629 - Lonely bullets
   *  It is possible that the picker chooses an element for the HLB that is invalid input, therefore,
   *  return the valid input for the HLB given the invalid input/valid input from the picker.]
   * @param  {[DOM element]} pickedElement   [The element chosen by the picker]
   * @return {[DOM element]}                 [The new element create from the element chosen by the picker]
   */
  function getFoundation($picked) {
    var tag;
    for (tag in foundations) {
      if (Object.prototype.hasOwnProperty.call(foundations, tag)) {
        if ($picked.is(tag)) {
          if (true && loggingEnabled) {
            console.log("%cSPECIAL CASE: Lonely " + tag + ".", "background:orange;");
          }
          return foundations[tag]($picked);
        }
      }
    }
    if (true && loggingEnabled) {
      console.log("%cTAG: " + $picked[0].tagName, "background:orange;");
    }
    return $picked;
  }
  /**
   * [onHLBHover is registered as a "mousemove" event handler when the HLB is ready, and unregisters
   * itself immediately after the mouse moves within the HLB element.  The purpose of this function
   * is to handle the case where the HLB is positioned outside of the mouse coordinates and allows the
   * deflation of the HLB by moving the mouse outside of the HLB area as well as enabling scrolling of the HLB.]
   */
  function onHLBHover() {
    // We only need to know if the mouse has been in the HLB, so remove it once we are certain.
    $hlb.off("mousemove");
    // Any mouse detection within the HLB turns on the ability to exit HLB by moving mouse
    preventDeflationFromMouseout = false;
  }
  function isElementInsideHlb(element) {
    return $hlb[0] === element || $.contains($hlb[0], element);
  }
  function onClick(event) {
    if ($hlb && !isElementInsideHlb(event.target)) {
      // If click is outside of HLB, close it
      // (Need to doublecheck this because HLB can sometimes be inside of <body>)
      toggleHLB();
    }
  }
  /**
   * [onHLBClosed executes once the HLB is deflated (scale = 1).  This function is
   * responsible for setting the state of the application to what it was before
   * any HLB existed.]
   */
  function onHLBClosed(event) {
    // Finally, remove the wrapper element for the HLB and dimmer
    removeHLBWrapper();
    hlbPositioning.setTranslateCSS(void 0);
    hlbPositioning.setOriginCSS(void 0);
    // Clean up "module scoped" vars
    isHLBClosing = false;
    // Listeners: hpan.js, highlight.js, speech.js
    events.emit("hlb/closed", event);
    $foundation = void 0;
    $hlb = void 0;
    $picked = void 0;
    if (true && loggingEnabled) {
      console.log("%c--------------- HLB DESTROYED -----------------", "color:orange; background:purple; font-size: 9pt");
    }
  }
  /**
   * [getHLBWrapper adds the sitecues HLB and DIMMER wrapper outside of the body.]
   */
  function getOrCreateHLBWrapper() {
    var $wrapper = $hlbWrapper || $("<sc>", {
      id: constants.HLB_WRAPPER_ID
    });
    inlineStyle.set($wrapper[0], {
      padding: 0,
      margin: 0,
      top: 0,
      left: 0,
      position: "absolute",
      overflow: "visible"
    });
    return $wrapper;
  }
  /**
   * [removeHLBWrapper removes the sitecues HLB and DIMMER wrapper]
   */
  function removeHLBWrapper() {
    if ($hlbWrapper) {
      $hlbWrapper.remove();
      $hlbWrapper = null;
    }
  }
  //////////////////////////////////
  // PUBLIC FUNCTIONS
  //////////////////////////////////
  // Return the current DOM element for the HLB or falsey value if there is no HLB
  function getElement() {
    return $hlb && $hlb[0];
  }
  // Public methods.
  if (true) {
    console.log("%cToggle HLB logging by executing : sitecues.toggleHLBLogging();", "background:black;color:white;font-size: 11pt");
    /**
     * [toggleStickyHLB enables/disables HLB deflation]
     * @return {[Boolean]} [True if deflation is disabled.  False if deflation is enabled.]
     */
    sitecues.toggleStickyHLB = function() {
      isSticky = !isSticky;
      return isSticky;
    };
    sitecues.toggleHLBLogging = function() {
      loggingEnabled = !loggingEnabled;
      return loggingEnabled;
    };
  }
  return {
    getElement: getElement,
    toggleHLB: toggleHLB,
    retargetHLB: retargetHLB
  };
});

sitecues.define("hlb", function() {});
//# sourceMappingURL=hlb.js.map