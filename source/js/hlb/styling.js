/*
  This module styles the HLB by filtering attributes, styles, dom elements,
  sets background, sets default styles, computes some styles,
  and cloned child styles from the original element to the HLB.
 */
sitecues.def('hlb/styling', function (hlbStyling, callback) {

  'use strict';

  sitecues.use('jquery', 'platform', 'hlb/safe-area',
  function ($, platform, hlbSafeArea) {

    ///////////////////////////
    // PUBLIC PROPERTIES
    //////////////////////////

    // All HLB instances will use these default padding and border values.
    hlbStyling.defaultPadding = 4;
    hlbStyling.defaultBorder  = 3;

    // Transition property used for hlb animation (-webkit, -moz)
    // This is used to transition the transform property for HLB
    // inflation/deflation animation
    hlbStyling.transitionProperty = (function () {
      if (platform.browser.isChrome || platform.browser.isSafari) {
        return '-webkit-transform ';
      }
      if (platform.browser.isFirefox) {
        return '-moz-transform ';
      }
      if (platform.browser.isIE) {
        return '-ms-transform ';
      }
      return 'transform ';
    }());

    ///////////////////////////
    // PRIVATE VARIABLES
    ///////////////////////////

    var HLB_Z_INDEX = 2147483644,

        // How many ancestors do we move up the chain until we find a background image
        // to use for the $hlbElements background image.
        BACKGROUND_IMAGE_ANCESTOR_TRAVERSAL_COUNT = 1,

        // Default background color for HLB, if HLB is NOT an image.
        HLB_DEFAULT_BACKGROUND_COLOR = '#ffffff',

        // Default background color for HLB, if HLB is an image.
        HLB_IMAGE_DEFAULT_BACKGROUND_COLOR = '#000000',

        // Remove these HLB styles, but NOT from its children.
        HLBCSSBlacklist   = [
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
          'min-width'
        ],

        // What child elements of the HLB do we want to remove after a clone.
        HLBElementBlacklist   = [
          'script'
        ],

        // Remove ID from HLB because the speech module sets the ID for TTS to work
        HLBAttributeBlacklist = [
          'id',
          'class'
        ],

        // Default css styles for HLB
        defaultHLBStyles  = {
          'position'         : 'absolute',   // Doesn't interfere with document flow
          'left'             : '-1000px',    // Position off screen out of sight
          'top'              : '-1000px',    // Position off screen out of sight
          'zIndex'           : HLB_Z_INDEX,  // Max z-index for HLB overlay
          'border'           : hlbStyling.defaultBorder + 'px solid black',
          'padding'          : hlbStyling.defaultPadding,
          'margin'           : 0,            // Margin isn't necessary and only adds complexity
          'border-radius'    : '4px',        // Aesthetic purposes
          'box-sizing'       : 'content-box' // Default value.  If we do not force this property, then our positioning algorithm must be dynamic...
        };

    //////////////////////////
    // PRIVATE FUNCTIONS
    //////////////////////////

    /**
     * [filterElements removes HLBElementBlacklist elements from the HLB element, but not its children]
     * @param  {[DOM element]} $hlbElement [HLB element]
     */
    function filterElements ($hlbElement) {
      $hlbElement.find(HLBElementBlacklist.join(',')).remove();
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

    function filterChildStyles ($child, hlbWidthGreaterThanSafeAreaWidth) {

      var styles = {
        'webkitTextFillColor': ''
      };

      // Do not copy over the width and height because
      // it causes horizontal scrollbars, unless it is an image
      // in which case we preserve the dimensions.
      if (!$child.is('img')) {
        styles.width  = '';
        styles.height = '';
      }

      // Thought at one point this fixed something, so I am leaving it until there is nothing
      // wrong with the HLB so I can quickly uncomment to see its effects.
      //
      // TODO: Determine if this code is necessary.
      //
      // if ($child.css('display').indexOf('table') !== -1) {
      //   styles.display = 'inline-block';
      // }


      // NOTE: Fix implemented because of opening HLB on http://abclibrary.org/teenzone on the #customheader
      //       Fixes children overlapping children within the HLB.  Comment out the line below to
      //       experience this problem.
      // if (hlbWidthGreaterThanSafeAreaWidth) {
      //   if ($child.css('display') !== 'list-item') {
      //     styles.display = 'inline-block';
      //     styles.position = 'static';
      //   }
      // }

      $child.css(styles);
    }

    /**
     * [filterHLBChildren filters styles and attributes of the children of the HLB element]
     * @param  {[DOM element]} $child [Child of HLB element]
     * NOTE: Eventually we may want to abstract this like we do with filtering
     *       the HLB element.  (Create blacklists for attributes, styles)
     */
    function filterHLBChildren ($child, hlbWidthGreaterThanSafeAreaWidth) {

      filterChildStyles($child, hlbWidthGreaterThanSafeAreaWidth);

      // Ran into issues with children inheriting styles because of class and id CSS selectors.
      // Filtering children of these attributes solves the problem.
      // NOTE: Fix implemented because of opening HLB on http://abclibrary.org/teenzone on the #customheader
      //       Fixes content from overflowing horizontally within the HLB.  Comment out the line below to
      //       experience this problem.  There might be a better way...but I don't have the patience to
      //       find a better solution at the moment.  width:auto did nothing... width:100% worked somewhat...
      filterAttributes($child);

    }

    function getEmsToPx(fontSize, ems) {
      var measureDiv = $('<div/>')
         .appendTo(document.body)
         .css({
        'font-size': fontSize,
        'width': ems + 'em',
        'visibility': 'hidden'
      });
      var px = measureDiv.width();
      measureDiv.remove();
      return px;
    }

    function computeBulletWidth(element, style, bulletType) {
      var ems = 2.5;  // Browsers seem use max of 2.5 em for bullet width -- use as a default
      if ($.inArray(bulletType, ['circle', 'square', 'disc', 'none']) >= 0) {
        ems = 1; // Simple bullet
      } else if (bulletType === 'decimal') {
        var start = parseInt($(element).attr('start'), 10);
        var end = (start || 1) + element.childElementCount - 1;
        ems = 0.9 + 0.5 * end.toString().length;
      }
      return getEmsToPx(style['font-size'], ems);
    }

    function getBulletWidth ($element, elementComputedStyle) {

      //If the HLB is a list AND it has bullets...return their width
      if ($element.is('ul, ol') && elementComputedStyle['list-style-type'] !== 'none') {
        return computeBulletWidth($element, elementComputedStyle, elementComputedStyle['list-style-type']);
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
     * @param  {[DOM element]} $originalElement [The original element chosen by the picker]
     * @return {[String]}                       [CSS background-image property]
     */
    function getNonEmptyBackgroundImage ($originalElement, ancestorCount) {

      var newBackgroundImage,
          parents = $originalElement.parents();

      parents.each(function (count) {
        if (count > ancestorCount) {
          return false;
        }
        if ($(this).css('backgroundImage') !== 'none') {
          newBackgroundImage = $(this).css('backgroundImage');
          return false;
        }
      });

      return newBackgroundImage;

    }

    /**
     * [getNonTransparentBackground determines what background color will be used
     * for the HLB element. It moves up the ancestor chain of the original element
     * and returns the first background color it encounters that isn't transparent]
     * @param  {[DOM element]} $originalElement [The original element chosen by the picker]
     * @return {[String]}                       [CSS background-color property]
     */
    function getNonTransparentBackground ($originalElement) {

      var newBackgroundColor,
          parents = $originalElement.parents();

      parents.each(function () {
        if (!isTransparent($(this).css('backgroundColor'))) {
          newBackgroundColor = $(this).css('backgroundColor');
          return false;
        }
      });

      return newBackgroundColor;

    }

    /**
     * [isOriginalElementWideAsSafeArea determines if the scaled original element is as wide
     * as the safe area.]
     * @param  {[DOM element]}  $element [Original DOM element]
     * @return {Boolean}                 [True if scaled original element is as wide as the safe area]
     */
    function isOriginalElementWideAsSafeArea ($element) {

      var elementBoundingBox  = $element[0].getBoundingClientRect(),
          safeZoneBoundingBox = hlbSafeArea.getSafeZoneBoundingBox();

      if (elementBoundingBox.width * hlbSafeArea.HLBZoom >= safeZoneBoundingBox.width) {
        return true;
      }

      return false;

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
    function getHLBBackgroundColor ($originalElement, elementComputedStyle) {

      var newBackgroundColor;

      if (isTransparent(elementComputedStyle.backgroundColor)) {

        if ($originalElement.is('img')) {

          return HLB_IMAGE_DEFAULT_BACKGROUND_COLOR;

        } else {

          newBackgroundColor = getNonTransparentBackground($originalElement);

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
     * @param  {[jQuery element]} $originalElement [The original element chosen by the picker.]
     * @param  {[Object]} elementComputedStyle     [The original elements computed style]
     * @return {[String]}                          [The background image that will be used by the $hlbElement]
     */
    function getHLBBackgroundImage ($originalElement, elementComputedStyle) {

      var newBackgroundImage;

      if (elementComputedStyle.backgroundImage === 'none' &&
          isTransparent(elementComputedStyle.backgroundColor)) {

        newBackgroundImage = getNonEmptyBackgroundImage($originalElement, BACKGROUND_IMAGE_ANCESTOR_TRAVERSAL_COUNT);

        if (newBackgroundImage) {

          return newBackgroundImage;

        }

      }

      return elementComputedStyle.backgroundImage;

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

    //////////////////////////
    // PUBLIC FUNCTIONS
    //////////////////////////

    /**
     * [getHLBStyles gets the HLB styles.]
     * @param {[DOM element]} $originalElement [the original element]
     * @return {[Object]} [CSS style object to be used by jQuery.css()]
     */
    hlbStyling.getHLBStyles = function ($originalElement) {

      var originalElement      = $originalElement[0],
          elementComputedStyle = window.getComputedStyle(originalElement),

          calculatedHLBStyles  = {
            'padding-left'    : getHLBLeftPadding($originalElement, elementComputedStyle),
            'background-color': getHLBBackgroundColor($originalElement, elementComputedStyle),
            'background-image': getHLBBackgroundImage($originalElement, elementComputedStyle),
            'display'         : getHLBDisplay(elementComputedStyle)
          };

      return $.extend({},
        defaultHLBStyles,
        calculatedHLBStyles
      );

    };

    /**
     * [filter filters elements, attributes, and styles from the HLB]
     * @param  {[DOM element]} $hlbElement [HLB]
    */
    hlbStyling.filter = function ($hlbElement) {

      filterStyles($hlbElement);

      filterElements($hlbElement);

      filterAttributes($hlbElement);

    };

    /**
     * [cloneStyles clones the original elements styles and the styles of all of its children.]
     * @param  {[DOM element]} $originalElement [original element]
     * @param  {[DOM element]} $hlbElement [HLB element]
     */
    hlbStyling.cloneStyles = function ($originalElement, $hlbElement) {

      var hlbWidthGreaterThanSafeAreaWidth = isOriginalElementWideAsSafeArea($originalElement),
          $originalElementChildren         = $originalElement.find('*'),
          $hlbElementChildren              = $hlbElement.find('*'),
          hlbElementChild,
          i = 0;

      // Set the cssText of the HLB element, essentially copying all computed styles.
      $hlbElement[0].style.cssText = window.getComputedStyle($originalElement[0]).cssText;

      for (; i < $originalElementChildren.length; i += 1) {

        // Cache the HLB child.
        hlbElementChild = $hlbElementChildren[i];

        // Copy the original elements child styles to the HLB elements child.
        hlbElementChild.style.cssText = getComputedStyle($originalElementChildren[i]).cssText;

        // Filter the unnecessary HLB elements styles.
        filterHLBChildren($(hlbElementChild), hlbWidthGreaterThanSafeAreaWidth);

      }

    };

    if (sitecues.tdd) {
      exports.getHLBStyles = hlbStyling.getHLBStyles;
      exports.filter       = hlbStyling.filter;
      exports.cloneStyles  = hlbStyling.cloneStyles;
    }

    callback();

  });

});