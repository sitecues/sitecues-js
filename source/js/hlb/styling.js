// */
//   This module styles the HLB by filtering attributes, styles, dom elements,
//   sets background, sets default styles, computes some styles,
//   and cloned child styles from the original element to the HLB.
//  */
sitecues.def('hlb/styling', function (hlbStyling, callback) {

  'use strict';

  sitecues.use('jquery', 'platform', 'util/common', 'conf',
  function ($, platform, common, conf) {


    ///////////////////////////
    // PUBLIC PROPERTIES
    //////////////////////////

    // All HLB instances will use these default padding and border values.
    hlbStyling.defaultPadding = 4;
    hlbStyling.defaultBorder  = 3;

    // Transition property used for hlb animation (-webkit, -moz)
    // This is used to transition the transform property for HLB
    // inflation/deflation animation
    hlbStyling.transitionProperty = platform.cssPrefix + 'transform ';

    ///////////////////////////
    // PRIVATE VARIABLES
    ///////////////////////////

    var HLB_Z_INDEX = 2147483644,

        // How many ancestors do we move up the chain until we find a background image
        // to use for the $hlbElements background image.
        BACKGROUND_IMAGE_ANCESTOR_TRAVERSAL_COUNT = 0,

        // Default background color for HLB, if HLB is NOT an image.
        HLB_DEFAULT_BACKGROUND_COLOR = '#ffffff',

        // Default text color for HLB
        HLB_DEFAULT_TEXT_COLOR = '#000000',

        // Default background color for HLB, if HLB is an image.
        HLB_IMAGE_DEFAULT_BACKGROUND_COLOR = '#000000',

        // Remove these HLB styles, but NOT from its children.
        HLBCSSBlacklist = [
          'padding',
          'margin',
          'left',
          'top',
          'right',
          'bottom',
          'transform',
          'webkitTransform',
          'mozTransform',
          'transition',
          'webkitTransition',
          'width',
          'height',
          'webkitTextFillColor',
          'min-height',
          'min-width',
          'max-height',
          'max-width',
          'msScrollLimitYMax' // Necessary to scroll the HLB in IE
        ],

        // What child elements of the HLB do we want to remove after a clone.
        HLBElementBlacklist = [
          'script',
          'iframe'
        ],

        // Remove ID from HLB because the speech module sets the ID for TTS to work
        HLBAttributeBlacklist = [
          'id',
          'class'
        ],

        // Default css styles for HLB
        defaultHLBStyles  = {
          'position'         : 'absolute',   // Doesn't interfere with document flow
          'zIndex'           : HLB_Z_INDEX,  // Max z-index for HLB overlay
          'border'           : hlbStyling.defaultBorder + 'px solid black',
          'padding'          : hlbStyling.defaultPadding,
          'margin'           : 0,            // Margin isn't necessary and only adds complexity
          'border-radius'    : '4px',        // Aesthetic purposes
          'box-sizing'       : 'content-box', // Default value.  If we do not force this property, then our positioning algorithm must be dynamic...
          'visibility'       : 'visible',
          'max-width'        : 'none',
          'max-height'       : 'none',
          'opacity'          : 1
        };

    //////////////////////////
    // PRIVATE FUNCTIONS
    //////////////////////////

    /**
     * [filterElements removes HLBElementBlacklist elements from the HLB element, but not its children]
     * @param  {[DOM element]} $hlbElement [HLB element]
     */
    function filterBlacklistedElements ($hlbElement) {
      $hlbElement.find(HLBElementBlacklist.join(',')).remove();
    }

    /**
     * [filterHiddenElements removes elements from the HLB that the picker deems unwanted.]
     * @param  {[jQuery Element]} $hlbElement    [HLB element]
     * @param  {[jQuery Element]} $pickedElement [Element picked by picker]
     * @param  {[Array]} hiddenElements [Array of elements to remove]
     */
    function filterHiddenElements ($hlbElement, $pickedElement, hiddenElements) {

      var hiddenElementsLength   = hiddenElements.length,
          hiddenElementsRemoved  = 0,
          pickedElementIsListItem = $pickedElement.is('li'),
          $pickedElementChildren = $pickedElement.find('*'),
          $hlbElementChildren    = pickedElementIsListItem ? $hlbElement.children().find('*') : $hlbElement.find('*'),
          currentChild           = 0,
          currentElementToRemove = 0;

      if (SC_DEV) {
        if ($pickedElementChildren.length !== $hlbElementChildren.length) {
          console.warn('There is not a 1:1 mapping for filterHiddenElements!');
        }
        if (hiddenElementsLength) {
          console.log('%cSPECIAL CASE: Filtering hidden elements.',  'background:orange;');
        }
      }

      // I really dislike nested for loops...
      if (hiddenElementsLength) {
        for (; currentChild < $pickedElementChildren.length; currentChild += 1) {
          for (; currentElementToRemove < hiddenElementsLength; currentElementToRemove += 1) {
            if ($pickedElementChildren[currentChild] === hiddenElements[currentElementToRemove]) {
              $hlbElementChildren[currentChild].remove();
              hiddenElementsRemoved += 1;
              if (hiddenElementsRemoved === hiddenElementsLength) {
                return;
              }
            }
          }
          currentElementToRemove = 0;
        }
      }

    }

    /**
     * [filterElements removes css styles in HLBCSSBlacklist from the HLB element, but not its children]
     * @param  {[DOM element]} $hlbElement [HLB element]
     */
    function filterStyles ($hlbElement) {
      for (var i = 0; i < HLBCSSBlacklist.length; i += 1) {
        $hlbElement[0].style[HLBCSSBlacklist[i]] = '';
      }
    }

    /**
     * [filterAttributes removes html attributes in HLBAttributeBlacklist]
     * @param  {[DOM element]} $hlbElement [HLB element]
    */
    function filterAttributes ($hlbElement) {
      for (var i = 0; i < HLBAttributeBlacklist.length; i += 1) {
        $hlbElement.removeAttr(HLBAttributeBlacklist[i]);
      }
    }

    /**
     * [getChildStyles computes HLB child element styles]
     * @param  {[jQuery element]} $child                    [The current HLB element child we are styling]
     * @param  {[Boolean]} hlbWidthGreaterThanSafeAreaWidth [True if the HLB width >= safe area width]
     * @param  {[Object]} originalElementsChildStyle        [CSS styles returned from window.getComputedStyle]
     * @return {[Object]}                                   [Styles to be consumed by jQuery.css]
     */
    function getChildStyles ($child, originalElementsChildStyle) {

          // Defaut css styles for all HLB children
      var styles = {
            'webkitTextFillColor': '',
            'textDecoration'     : 'none',
            'bottom'             : 0,      // Added because bug found on TexasAT, first LI (About TATN) of ".horizontal rootGroup"
            'height'             : 'auto', // Added to fix cases where text overlapped vertically, like on eeoc
            'min-width'          : ''
          },
          fontSize       = parseFloat(originalElementsChildStyle.fontSize),
          lineHeight     = parseFloat(originalElementsChildStyle.lineHeight),
          textDecoration = originalElementsChildStyle.textDecoration;

      // NOTE: Copying cssText directly is not sufficient for copying textDecorations.
      //       ts.dev.sitecues.com/hlb/styling/text-decoration.html
      if (textDecoration.indexOf('underline') !== -1) {

        styles.textDecoration = 'underline';

      } else if (textDecoration.indexOf('overline') !== -1) {

        styles.textDecoration = 'overline';

      } else if (textDecoration.indexOf('line-through') !== -1) {

        styles.textDecoration = 'line-through';

      }

      // Implemented to fix http://www.windoweyesforoffice.com/sitecues/index.php when HLBing
      // Window-Eyes in header.  Applause: #1224073
      if (fontSize > lineHeight) {
        if (SC_DEV) {
          console.log('%cSPECIAL CASE: Increasing line height.',  'background:orange;');
        }
        styles.lineHeight = fontSize + 'px';
      }

      // This fixes a problem with the HLB on TexasAT home page when opening the entire "News & Events"
      // ALSO...it fixes another problem that used a different fix.  I removed the old fix
      // and will re-enable it if hlb content overlaps
      //       // NOTE: Fix implemented because of opening HLB on http://abclibrary.org/teenzone on the #customheader
      //                Fixes children overlapping children within the HLB.  Comment out the line below to
      //                experience this problem.
      if (originalElementsChildStyle.position === 'absolute') {
        styles.position = 'static';
        styles.display  = 'inline-block';
      }

      // Implemented to fix very long link that wasn't wrapping in the HLB on www.faast.org/news
      if ($child.is('a')) {
        styles.wordWrap = 'break-word';
      }

      return styles;

    }

    function getBulletWidth ($element, elementComputedStyle) {

      //If the HLB is a list AND it has bullets...return their width
      if (elementComputedStyle.listStyleType !== 'none' || elementComputedStyle.listStyleImage !== 'none') {
        return common.getBulletWidth($element[0], elementComputedStyle);
      }

      return 0;
    }

    /**
     * [isTransparent determines if a particular style is transparent]
     * @param  {[CSS style property]}  style [Used for background color]
     * @return {Boolean}       [True if transparent, false otherwise]
     */
    function isTransparent (style) {
      return style === 'rgba(0, 0, 0, 0)' || style === 'transparent';
    }

    /**
     * [getNonEmptyBackgroundImage determines what background image will be used
     * for the HLB element.  It moves up the ancestor chain of the original element
     * and returns the first background image it encounters.]
     * @param  {[DOM element]} $pickedElement [The picked element chosen by the picker]
     * @return {[String]}                       [CSS background-image property]
     */
    function getNonEmptyBackgroundImage ($pickedElement, ancestorCount) {

      var backgroundStyles = {},
          parents = $pickedElement.parents();

      parents.each(function (count) {
        if (count > ancestorCount) {
          return false;
        }

        if ($(this).css('backgroundImage') !== 'none') {
          backgroundStyles.backgroundImage      = $(this).css('backgroundImage');
          backgroundStyles.backgroundRepeat     = $(this).css('backgroundRepeat');
          backgroundStyles.backgroundAttachment = 'local';
          backgroundStyles.count                = count;
          return false;
        }
      });

      return backgroundStyles;

    }

    /**
     * [getNonTransparentBackground determines what background color will be used
     * for the HLB element. It moves up the ancestor chain of the original element
     * and returns the first background color it encounters that isn't transparent]
     * @param  {[DOM element]} $pickedElement [The original element chosen by the picker]
     * @return {[String]}                       [CSS background-color property]
     */
    function getNonTransparentBackground ($pickedElement) {

      var newBackgroundColor,
          parents = $pickedElement.parents();

      parents.each(function () {
        if (!isTransparent($(this).css('backgroundColor'))) {
          newBackgroundColor = $(this).css('backgroundColor');
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
    function getHLBBackgroundColor ($pickedElement, elementComputedStyle) {

      var newBackgroundColor;

      if (isTransparent(elementComputedStyle.backgroundColor)) {

        if ($pickedElement.is('img')) {

          return HLB_IMAGE_DEFAULT_BACKGROUND_COLOR;

        } else {

          newBackgroundColor = getNonTransparentBackground($pickedElement);

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
     * @param  {[jQuery element]} $pickedElement   [The picked element chosen by the picker.]
     * @param  {[Object]} elementComputedStyle     [The original elements computed style]
     * @return {[String]}                          [The background image that will be used by the $hlbElement]
     */
    function getHLBBackgroundImage ($pickedElement, elementComputedStyle) {

      var newBackgroundImage;

      // If the original element doesnt have a background image and the original element has a transparent background...
      if (elementComputedStyle.backgroundImage === 'none' &&
          isTransparent(elementComputedStyle.backgroundColor)) {

        newBackgroundImage = getNonEmptyBackgroundImage($pickedElement, BACKGROUND_IMAGE_ANCESTOR_TRAVERSAL_COUNT);

        if (newBackgroundImage) {

          return newBackgroundImage;

        }

      }

      return {
        'backgroundImage'     : elementComputedStyle.backgroundImage,
        'backgroundRepeat'    : elementComputedStyle.backgroundRepeat,
        'backgroundAttachment': 'local'
      };

    }

    /**
     * [getHLBLeftPadding is required to visually encapsulate bullet points within the HLB if the
     * $hlbElement is itself a <ul> or <ol> that uses bullet points.
     * @param  {[jQuery element]} $originalElement [The original element chosen by the picker.]
     * @param  {[Object]} elementComputedStyle     [The original elements computed style]
     * @return {[Integer]}                         [The HLB left-padding]
     */
    function getHLBLeftPadding ($originalElement, elementComputedStyle) {

      return hlbStyling.defaultPadding + getBulletWidth($originalElement, elementComputedStyle);

    }

    /**
     * [getHLBDisplay determines $hlbElement will use for its CSS display]
     * @param  {[Object]} elementComputedStyle [The original elements computed styles]
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
    function getHLBDisplay (elementComputedStyle) {

      if (elementComputedStyle.display === 'table') {
        return 'block';
      }

      return elementComputedStyle.display;

    }

     /**
     * [shouldRemovePadding determines if children of our HLB have padding that should be
     * removed because the mouse-highlight clips padding.]
     * @param  {[jQuery Element]} $child [Child element of the HLB]
     * @param  {[Object]} initialHLBRect [Mouse-highlight rectangle]
     * @return {[Boolean]}               [True: Remove Padding. False: Do Nothing]
     */
    function shouldRemovePadding ($child, initialHLBRect) {

      var childBoundingClientRect = $child[0].getBoundingClientRect(),
          childLeftPadding        = parseFloat($child.css('paddingLeft')),
          childRightPadding       = parseFloat($child.css('paddingRight')),
          childTopPadding         = parseFloat($child.css('paddingTop')),
          childBottomPadding      = parseFloat($child.css('paddingBottom'));

      if ($child.is('br, option') || childBoundingClientRect.width === 0) {
        return;
      }

      if ((childBoundingClientRect.left   < initialHLBRect.left   && childLeftPadding   > 0) ||
          (childBoundingClientRect.right  > initialHLBRect.right  && childRightPadding  > 0) ||
          (childBoundingClientRect.top    < initialHLBRect.top    && childTopPadding    > 0) ||
          (childBoundingClientRect.bottom > initialHLBRect.bottom && childBottomPadding > 0)
        ) {

        if (SC_DEV) {
          console.log('%cSPECIAL CASE: Removing child padding.',  'background:orange;');
        }
        return true;
      }

    }

    /**
     * [getChildPadding computes and returns the padding for a child element of the HLB.  Taking into account the
     * initialHLBRect, clipping padding is something to be done to preserve that HLB size.]
     * @param  {[jQuery Element]} $child [Child element of the HLB]
     * @param  {[Object]} initialHLBRect [Mouse-highlight rectangle]
     * @return {[Object]}                [Padding styles for a child element]
     */
    function getChildPadding ($child, initialHLBRect) {

      var childBoundingClientRect = $child[0].getBoundingClientRect(),
          childLeftPadding        = parseFloat($child.css('paddingLeft')),
          childRightPadding       = parseFloat($child.css('paddingRight')),
          childTopPadding         = parseFloat($child.css('paddingTop')),
          childBottomPadding      = parseFloat($child.css('paddingBottom')),
          paddingStyles           = {},
          zoom                    = conf.get('zoom');

      if ((childBoundingClientRect.left < initialHLBRect.left && childLeftPadding > 0)) {
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
     * @param  {[jQuery element]} $originalElement [The original element chosen by the picker]
     * @param  {[jQuery element]} $hlbElement      [The HLB element]
     */
    function initializeHLBElementStyles ($originalElement, $hlbElement) {

      $hlbElement[0].style.cssText = hlbStyling.getComputedStyleCssText($originalElement[0]);

    }

     /**
     * [initializeHLBChildrenStyles initializes the styles of the children of the HLB element.
     *   Step 1: Copy computed styles of original element children to hlb element children.
     *   Step 2: Remove padding if element is cropped by the initialHLBRect (mouse highlight rect)
     *   Step 3: Compute child styles that must override a direct copy of computed styles.
     *   Step 4: Set child styles.
     *   Step 5: Filter child attributes.
     * ]
      * @param  {[jQuery element]} $originalElement [The original element chosen by the picker]
      * @param  {[jQuery element]} $hlbElement      [The HLB element]
      */

    function initializeHLBChildrenStyles ($originalElement, $hlbElement, initialHLBRect) {

      var $originalElementChildren = $originalElement.find('*'),
          $hlbElementChildren      = $hlbElement.find('*'),
          $hlbElementChild,
          hlbElementChild,
          $originalElementChild,
          originalElementChild,
          originalElementsChildStyle,
          computedChildStyles,
          removeMargins = true,
          i = 0;

      for (; i < $originalElementChildren.length; i += 1) {

        // Cache the HLB child.
        hlbElementChild      = $hlbElementChildren[i];
        originalElementChild = $originalElementChildren[i];

        $hlbElementChild      = $(hlbElementChild);
        $originalElementChild = $(originalElementChild);

        // Cache the HLB child computed style
        originalElementsChildStyle = getComputedStyle(originalElementChild);

        // Copy the original elements child styles to the HLB elements child.
        hlbElementChild.style.cssText = hlbStyling.getComputedStyleCssText(originalElementChild);

        if (shouldRemovePadding($originalElementChild, initialHLBRect)) {
          $hlbElementChild.css(getChildPadding($originalElementChild, initialHLBRect));
        }

        // Compute styles that are more complicated than copying cssText.
        computedChildStyles = getChildStyles($hlbElementChild, originalElementsChildStyle);

        // Added to fix HLB sizing when selecting last 2 paragraphs on http://www.ticc.com/
        if (shouldRemoveHorizontalMargins($originalElementChild, $originalElement)) {
          if (SC_DEV) {
            console.log('%cSPECIAL CASE: Removing left and right margins.',  'background:orange;');
          }
          computedChildStyles.marginLeft  = 0;
          computedChildStyles.marginRight = 0;
        } else {
          removeMargins = false;
        }

        // Set the childs css.
        $hlbElementChild.css(computedChildStyles);

        // Ran into issues with children inheriting styles because of class and id CSS selectors.
        // Filtering children of these attributes solves the problem.
        filterAttributes($hlbElementChild);

      }
    }

    /**
     * [shouldRemoveHorizontalMargins determines if left-margin and right-margin can be removed from
     * a child in the HLB element.]
     * @param  {[jQuery Element]} $originalElementChild [One of the children of the picked element.]
     * @param  {[jQuery Element]} $originalElement      [The element that is the model for the HLB (typically same as $pickedElement.]
     * @return {[Boolean]}
     */
    function shouldRemoveHorizontalMargins ($originalElementChild, $originalElement) {

      var $children     = $originalElementChild.parent().children(),
          $parents      = $originalElementChild.parentsUntil($originalElement),
          parentCount   = $parents.length,
          childCount    = $children.length,
          hasOverlap    = false,
          boundingRects = [],
          i             = 0,
          j             = 0;

      if (childCount === 1) {
        return true;
      }

      for (; i < parentCount; i += 1) {
        if ($parents[i].getBoundingClientRect().left < $originalElementChild[0].getBoundingClientRect().left) {
          return false;
        }
      }

      for (i = 0; i < childCount; i += 1) {
        boundingRects.push($children[i].getBoundingClientRect());
      }

      for (i = 0; i < childCount; i += 1) {
        for (; j < childCount; j += 1) {
          if (i !== j) {
            if (!(boundingRects[i].top    >= boundingRects[j].bottom ||
                  boundingRects[i].bottom <= boundingRects[j].top)) {
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
     * @param {[jQuery element]} $hlbElement [The HLB element]
     * NOTE: This function was created to fix a bug found on TexasAT home page navigation (Home, Sitemap, Contact Us)
     */
    hlbStyling.setHLBChildTextColor = function ($hlbElement) {

      var children;

      // If the $hlbElement uses a background image then assume text is readable.
      // TODO: improve this entire mechanism.
      if ($hlbElement.css('backgroundImage') !== 'none') {
        return;
      }

      children = $hlbElement.find('*');

      // For every HLB child...
      children.each(function () {

        var textColor       = $(this).css('color'),
            backgroundColor = $(this).css('backgroundColor'),
            forceTextColor  = false;

        // If the HLB child has a transparent background, or the background is the same color as the text,
        // then we have to determine if we need to set the HLB childs text color by traversing the ancestor
        // chain for.
        if (isTransparent(backgroundColor) || textColor === backgroundColor) {

          //  Check every ancestor up to and including the HLB element
          $(this).parentsUntil($hlbElement.parent()).each(function () {

            var parentBackgroundColor = $(this).css('backgroundColor');

            // If we run into a parent who has a non-transparent background color
            if (!isTransparent(parentBackgroundColor)) {

              // Set the childs text color if the current text color and the first non-transparent
              // background color are exactly the same.
              if(textColor === parentBackgroundColor) {

                forceTextColor = true;
                return false;

              } else {
                return false;
              }

            }

          });

          if (forceTextColor) {
            $(this).css('color', HLB_DEFAULT_TEXT_COLOR);
          }

        }

      });

    };

    /**
     * [getHLBStyles gets the HLB styles.]
     * @param {[DOM element]} $originalElement [the original element]
     * @return {[Object]} [CSS style object to be used by jQuery.css()]
     */
    hlbStyling.getHLBStyles = function ($pickedElement, $originalElement) {

      var originalElement       = $originalElement[0],
          originalElementOffset = $originalElement.offset(),
          elementComputedStyle  = window.getComputedStyle(originalElement),
          backgroundStyles      = getHLBBackgroundImage($pickedElement, elementComputedStyle),
          backgroundColor       = getHLBBackgroundColor($pickedElement, elementComputedStyle),
          calculatedHLBStyles   = {
            'padding-left' : getHLBLeftPadding($originalElement, elementComputedStyle),
            'display'      : getHLBDisplay(elementComputedStyle),
            'left'         : originalElementOffset.left,
            'top'          : originalElementOffset.top
          },
          $parent;

      // If the background color is the same as the text color, use default text and background colors
      if (backgroundColor === $originalElement.css('color')) {
        calculatedHLBStyles.color           = HLB_DEFAULT_TEXT_COLOR;
        calculatedHLBStyles.backgroundColor = HLB_DEFAULT_BACKGROUND_COLOR;
      } else {
        calculatedHLBStyles.backgroundColor = backgroundColor;
      }

      // If the original element uses a background image, preserve original padding.
      // This was implemented to fix SC-1830
      // If the background image repeats, there is no need to preserve the padding.
      if ($originalElement.css('backgroundImage') !== 'none' && $originalElement.css('backgroundRepeat') !== 'repeat') {

        calculatedHLBStyles.paddingLeft   = $originalElement.css('paddingLeft');
        calculatedHLBStyles.paddingTop    = $originalElement.css('paddingTop');
        calculatedHLBStyles.paddingBottom = $originalElement.css('paddingBottom');
        calculatedHLBStyles.paddingRight  = $originalElement.css('paddingRight');

      } else if (backgroundStyles.count >= 0) {

        $parent = $($(originalElement).parents()[backgroundStyles.count]);

        // If the background image repeats, there is no need to preserve the padding.
        if ($parent.css('backgroundRepeat') !== 'repeat') {

          calculatedHLBStyles.paddingLeft   = $parent.css('paddingLeft');
          calculatedHLBStyles.paddingTop    = $parent.css('paddingTop');
          calculatedHLBStyles.paddingBottom = $parent.css('paddingBottom');
          calculatedHLBStyles.paddingRight  = $parent.css('paddingRight');

        }


        delete backgroundStyles.count;

      }

      return $.extend({},
        defaultHLBStyles,
        calculatedHLBStyles,
        backgroundStyles
      );

    };

    /**
     * [filter filters elements, attributes, and styles from the HLB]
     * @param  {[DOM element]} $hlbElement [HLB]
     */
    hlbStyling.filter = function ($hlbElement, $pickedElement, hiddenElements) {

      filterStyles($hlbElement);

      filterHiddenElements($hlbElement, $pickedElement, hiddenElements);

      filterBlacklistedElements($hlbElement);

      filterAttributes($hlbElement);

    };

    /**
     * [initializeStyles clones the original elements styles and the styles of all of its children.]
     * @param  {[DOM element]} $originalElement [original element]
     * @param  {[DOM element]} $hlbElement [HLB element]
     */
    hlbStyling.initializeStyles = function ($originalElement, $hlbElement, initialHLBRect) {

      initializeHLBElementStyles($originalElement, $hlbElement);

      initializeHLBChildrenStyles($originalElement, $hlbElement, initialHLBRect);

    };


    /**
     * [getComputedStyleCssText returns the cssText of an element]
     * @param  {[DOM element]} element [DOM element]
     * @return {[String]}              [Computed styles for an DOM element]
     * NOTE: Fixes bug described here: [https://bugzilla.mozilla.org/show_bug.cgi?id=137687]
     */
    hlbStyling.getComputedStyleCssText = function (element) {

      var style   = window.getComputedStyle(element),
          cssText = '';

      if (style.cssText !== '') {
        return style.cssText;
      }

      for (var i = 0; i < style.length; i++) {
        cssText += style[i] + ': ' + style.getPropertyValue(style[i]) + '; ';
      }

      return cssText;
    };

    if (SC_UNIT) {
      exports.getHLBStyles                       = hlbStyling.getHLBStyles;
      exports.filter                             = hlbStyling.filter;
      exports.initializeStyles                   = hlbStyling.initializeStyles;
      exports.getChildStyles                     = getChildStyles;
      exports.getNonEmptyBackgroundImage         = getNonEmptyBackgroundImage;
      exports.getNonTransparentBackground        = getNonTransparentBackground;
      exports.getHLBBackgroundColor              = getHLBBackgroundColor;
      exports.getHLBBackgroundImage              = getHLBBackgroundImage;
      exports.initializeHLBChildrenStyles        = initializeHLBChildrenStyles;
      exports.setHLBChildTextColor               = hlbStyling.setHLBChildTextColor;
      exports.HLB_DEFAULT_BACKGROUND_COLOR       = HLB_DEFAULT_BACKGROUND_COLOR;
      exports.HLB_IMAGE_DEFAULT_BACKGROUND_COLOR = HLB_IMAGE_DEFAULT_BACKGROUND_COLOR;
    }

    callback();

  });

});