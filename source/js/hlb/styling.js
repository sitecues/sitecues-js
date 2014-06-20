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
      
      // if ($child.css('display').indexOf('table') !== -1) {
      //   styles.display = 'inline-block';
      // }


      // NOTE: Fix implemented because of opening HLB on http://abclibrary.org/teenzone on the #customheader
      //       Fixes children overlapping children within the HLB.  Comment out the line below to 
      //       experience this problem. 
      if (hlbWidthGreaterThanSafeAreaWidth) {
        styles.display = 'inline-block';
        styles.position = 'static';
      }
      
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
    function getNonEmptyBackgroundImage ($originalElement) {

      var newBackgroundImage,
          parents = $originalElement.parents();

      parents.each(function () {
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

    function isOriginalElementWideAsSafeArea ($element) {
    
      var elementBoundingBox  = $element[0].getBoundingClientRect(),
          safeZoneBoundingBox = hlbSafeArea.getSafeZoneBoundingBox();

      if (elementBoundingBox.width * hlbSafeArea.HLBZoom >= safeZoneBoundingBox.width) {
        return true;
      }

      return false;

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
          elementComputedStyle = getComputedStyle(originalElement),
          bulletWidth          = getBulletWidth($originalElement, elementComputedStyle),
          
          // <ul> and <ol> that use bullet points require padding to visually encapsulate
          // the bullet points within the HLB element 
          calculatedHLBStyles  = {
            'padding-left' : hlbStyling.defaultPadding + bulletWidth
          },

          newBackgroundColor,
          newBackgroundImage;

      // Determine HLB background color.  Default to white background
      // if no other valid background color is found.
      if (isTransparent(elementComputedStyle.backgroundColor)) {
        newBackgroundColor = getNonTransparentBackground($originalElement);
        if (newBackgroundColor) {
          calculatedHLBStyles['background-color'] = newBackgroundColor;
        } else {
          calculatedHLBStyles['background-color'] = '#ffffff';
        }
      }

      // Determine HLB background image.
      if (elementComputedStyle.backgroundImage === 'none') {
        newBackgroundImage = getNonEmptyBackgroundImage($originalElement);
        if (newBackgroundImage) {
          calculatedHLBStyles['background-image'] = newBackgroundImage;
        }
      }

      // If the HLB is an image, the background color is black.
      if ($originalElement.is('img')) {
        calculatedHLBStyles['background-color'] = '#000000';
      }

      // If the HLB display is table, the display is block 
      // so we are able to restrict height.
      if ($originalElement.css('display') === 'table') {
        calculatedHLBStyles.display = 'block';
      }

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
      $hlbElement[0].style.cssText = getComputedStyle($originalElement[0]).cssText;

      for (; i < $originalElementChildren.length; i += 1) {

        // Cache the HLB child.
        hlbElementChild = $hlbElementChildren[i];
        
        // Copy the original elements child styles to the HLB elements child. 
        hlbElementChild.style.cssText = getComputedStyle($originalElementChildren[i]).cssText;

        // Filter the unnecessary HLB elements styles.
        filterHLBChildren($(hlbElementChild), hlbWidthGreaterThanSafeAreaWidth);

      }
     
    };

    callback();
  
  });

});