/*
  This module styles the HLB by filtering attributes, styles, dom elements, sets background, sets default styles, computes some styles,
  and cloned child styles from the original element to the HLB.
 */
sitecues.def('hlb/styling', function (hlbStyling, callback) {
  
  'use strict';
  
  sitecues.use('jquery', 'platform', 'util/common',
  function ($, platform, common) {
    
    ///////////////////////////
    // PUBLIC PROPERTIES
    //////////////////////////
   
    hlbStyling.defaultPadding = 4;  // Default padding for HLB
    hlbStyling.defaultBorder  = 3;  // Default border for HLB
    
    // Transition property used for hlb animation (-webkit, -moz)
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
          'width',
          'height',
          // 'backgroundColor',
          // 'backgroundImage',
          // 'background',
          'webkitTextFillColor'
        ],
        
        // What child elements do we want to remove after a clone.
        HLBElementBlacklist   = [
          'script'          
        ],

        // Remove ID from HLB because the speech module sets the ID for TTS to work
        HLBAttributeBlacklist = [
          'id'
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
     * [filterElements removes HLBElementBlacklist elements from a DOM node]
     * @param  {[DOM element]} $hlbElement [HLB element]
     */
    function filterElements ($hlbElement) {
      $hlbElement.find(HLBElementBlacklist.join(',')).remove();
    }

    /**
     * [filterElements removes css styles in HLBCSSBlacklist from a DOM node]
     * @param  {[DOM element]} $hlbElement [HLB element]
     */
    function filterStyles ($hlbElement) {
      for (var i = 0; i < HLBCSSBlacklist.length; i += 1) {
        $hlbElement[0].style[HLBCSSBlacklist[i]] = '';
      }
    }

    function filterAttributes ($hlbElement) {
      for (var i = 0; i < HLBAttributeBlacklist.length; i += 1) {
        $hlbElement.removeAttr(HLBAttributeBlacklist[i]);
      }
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

    function isTransparent (style) {
      return style === 'rgba(0, 0, 0, 0)' || style === 'transparent';
    }

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
    
    //////////////////////////
    // PUBLIC FUNCTIONS
    //////////////////////////

    /**
     * [getHLBStyles gets the HLB styles.]
     * @param {[DOM element]} $originalElement [the original element]
     * @return {[Object]} [CSS style object to be used by jQuery.css()]
     */
    hlbStyling.getHLBStyles = function ($originalElement) {
      
      var originalElement             = $originalElement[0],
          elementComputedStyle        = getComputedStyle(originalElement),
          bulletWidth                 = getBulletWidth($originalElement, elementComputedStyle),
          calculatedHLBStyles         = {
            'padding-left' : hlbStyling.defaultPadding + bulletWidth
          },
          newBackgroundColor,
          newBackgroundImage;

      if (isTransparent(elementComputedStyle.backgroundColor)) {
        newBackgroundColor = getNonTransparentBackground($originalElement);
        if (newBackgroundColor) {
          calculatedHLBStyles['background-color'] = newBackgroundColor;
        } else {
          calculatedHLBStyles['background-color'] = '#ffffff';
        }
      }

      if (elementComputedStyle.backgroundImage === 'none') {
        newBackgroundImage = getNonEmptyBackgroundImage($originalElement);
        if (newBackgroundImage) {
          calculatedHLBStyles['background-image'] = newBackgroundImage;
        }
      }

      if ($originalElement.is('img')) {
        calculatedHLBStyles['background-color'] = '#000000';
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
    
      // Might be expensive to find *
      var originalElementsCSSText  = getComputedStyle($originalElement[0]).cssText,
          $originalElementChildren = $originalElement.find('*'),
          $hlbElementChildren      = $hlbElement.find('*'),
          hlbElementChild,
          originalElementChild,
          originalElementChildComputedStyle,
          i = 0;

      // Set the cssText of the HLB element
      $hlbElement[0].style.cssText = originalElementsCSSText;

      // Set the cssText of the HLB element's children
      for (; i < $originalElementChildren.length; i += 1) {

        hlbElementChild = $hlbElementChildren[i];
        
        originalElementChild = $originalElementChildren[i];
        originalElementChildComputedStyle = getComputedStyle(originalElementChild);

        hlbElementChild.style.cssText = originalElementChildComputedStyle.cssText;

        // Do not copy over the width and height because it causes horizontal scrollbars.
        if (!$(hlbElementChild).is('img')) {
          hlbElementChild.style.width  = '';
          hlbElementChild.style.height = '';
        }

        hlbElementChild.style.webkitTextFillColor = '';

      }
     
    };

    callback();
  
  });

});