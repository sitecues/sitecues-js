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

        // Used in calculating background for HLB (we dont want a transparent background)
        transparentColorNamesSet = [
          'transparent',
          'rgba(0, 0, 0, 0)'
        ],
       
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
          'backgroundColor',
          'backgroundImage',
          'background'
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
          'background-color' : '#ffffff',    
          'margin'           : 0,            // Margin isn't necessary and only adds complexity
          'border-radius'    : '4px',        // Aesthetic purposes
          'box-sizing'       : 'content-box' // Default value.  If we do not force this property, then our positioning algorithm must be dynamic...
        };
   
    //////////////////////////
    // PRIVATE FUNCTIONS
    //////////////////////////
   
    /**
     * [getNewBackground gets a new background for the hlb if necessary]
     * @param  {[DOM element]} originalElement [element chosen by picker to be the new hlb]
     * @param  {[string]} oldBgColor      [originalElements background color]
     * @param  {[string]} oldBgImage      [originalElements background image]
     * @return {[object]}                 [new background image and/or background color to be used by hlb]
     */
    function getNewBackground (originalElement, oldBgColor, oldBgImage) {
      
      var bgColorObj = {},
          bgImageObj = {},
          parents    = $(originalElement).parents().toArray();
      
      // If no background color is defined or it is transparent...
      if (!oldBgColor || $.inArray(oldBgColor, transparentColorNamesSet) >= 0) {
        bgColorObj = getNewBgColor(originalElement, parents);
      }
      
      // If no background image is defined or oringal element is an li, or the background image is empty...
      if (!oldBgImage || $(originalElement).is('li') || common.isEmptyBgImage(oldBgImage)) {
        bgImageObj = getNewBgImage(originalElement, parents);
      }

      return $.extend({}, bgColorObj, bgImageObj);

    }
    /**
     * Get new background color of highlight box when it appears.
     * Returns the either parent's background color or default one(if we haven't fetched a suitible background color from parent).
     * @param parents Array
     * @return Object
     */
    function getNewBgColor (originalElement, parents) {
      
      // Set a variable for the default background in case we don't find one.
      var bgColor = 'rgb(255, 255, 255)',
          imageObj,
          rgb,
          bgImage,
          url,
          thisNodeColor;
      
      // Special treatment for images since they might have text on transparent background.
      // We should make sure text is readable anyways.
      if (!common.isEmptyBgImage($(originalElement).css('backgroundImage'))) { //if original element has a background image...
      
        // Create image object using bg image URL.
        imageObj = new Image();
        imageObj.onload = function() {
          rgb = common.getAverageRGB(this);
          bgColor = 'rgb(' + rgb.r + ',' + rgb.b + ',' + rgb.g + ')';
        };
        bgImage = $(originalElement).css('backgroundImage');
      
        // RegExp below will take out bg image URL from the string.
        // Example: 'url(http://example.com/foo.png)' will evaluate to 'http://example.com/foo.png'.
        url = bgImage.match(/\(([^)]+)\)/)[1];
        if (common.validateUrl(url)) {
          imageObj.src = url;
        }
      } else if ($(originalElement).is('img')) {
        rgb = common.getAverageRGB($(originalElement)[0]);
        bgColor = 'rgb(' + rgb.r + ',' + rgb.b + ',' + rgb.g + ')';
      } else {
      
        // Not an image, doesn't have bg image so just iterate over el  ement's parents.
        $(parents).each(function () {
      
          // Iterate through the parents looking for a background color.
          thisNodeColor = $(this).css('backgroundColor');
          
          // See if the background color is a default or transparent color(if no, then $.inArray() returns '-1' value).
          if ($.inArray(thisNodeColor, transparentColorNamesSet) < 0) {
            
            // Found a background color specified in this node, no need to check further up the tree.
            bgColor = thisNodeColor;
            return false;
          }
        });
      }

      // Return the default background color if we haven't fetched a suitible background color from parent.
      return {
        'bgColor': bgColor
      };

    }
    
    function getCurrentTextColor (element, computedStyle) {
      
      var color = computedStyle.color,
          thisNodeColor;
      
      if ($.inArray(color, transparentColorNamesSet) > 0) {
        
        color = 'rgb(0, 0, 0)';
        
        $(element).parents().each(function () {
          
          // Iterate through the parents looking for a background color.
          thisNodeColor = $(this).css('backgroundColor');
          
          // See if the background color is a default or transparent color(if no, then $.inArray() returns '-1' value).
          if ($.inArray(thisNodeColor, transparentColorNamesSet) < 0) {
              
              // Found a background color specified in this node, no need to check further up the tree.
              color = thisNodeColor;
              return false;
          }
        });
      }
    
      return color;
    
    }

    /**
     * Get new background image of highlight box when it appears.
     * Returns either parent's background image or the default one if we haven't returned a parent's background.
     * @param parents Array
     * @param itemNode HTML node Object
     * @return Object
     */
    function getNewBgImage (originalElement, parents) {
      
      // Some elements such as inputs don't require background.
      // todo: if other elements are tested below then better to arrange an array.
      var bgImage,
          bgPos, 
          bgRepeat,
          thisNodeImage;

      if (!$(originalElement).is('input') && !$(originalElement).is('textarea')) {
        
        $(parents).each(function () {
          
          // Iterate through the parents looking for a background image.
          // todo: fix list items bullet background being considered as background image because they are.
          if ($(this)[0].tagName.toLowerCase() !== 'li') {
            thisNodeImage = $(this).css('backgroundImage');
            if (!common.isEmptyBgImage(thisNodeImage)) {
              
              // It's an easy case: we just retrieve the parent's background image.
              bgImage  = thisNodeImage;
              bgPos    = $(this).css('backgroundPosition');
              bgRepeat = $(this).css('backgroundRepeat');
              return false;
            }
          }
        });

        return {
          'bgImage'  : bgImage,
          'bgPos'    : bgPos,
          'bgRepeat' : bgRepeat
        };

      }
    }  

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
            'padding-left' : hlbStyling.defaultPadding + bulletWidth,
          },
          backgroundHLBStyles = hlbStyling.getBgStyle($originalElement, elementComputedStyle);

      // Extend computed styles with computed background style
      return $.extend({}, 
        defaultHLBStyles, 
        calculatedHLBStyles, 
        backgroundHLBStyles
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
          i = 0;

      // Set the cssText of the HLB element
      $hlbElement[0].style.cssText = originalElementsCSSText;

      // Set the cssText of the HLB element's children
      for (; i < $originalElementChildren.length; i += 1) {
        $hlbElementChildren[i].style.cssText = getComputedStyle($originalElementChildren[i]).cssText;

        // Do not copy over the width and height because it causes horizontal scrollbars.
        $hlbElementChildren[i].style.width   = '';
        $hlbElementChildren[i].style.height  = '';
      }
     
    };

    /**
     * [getBgStyle computes the background the HLB will use.]
     * @param  {[DOM element]} originalElement         [the original element]
     * @param  {[Object]} originalElementComputedStyle [original elements computed style]
     * @return {[Object]}                              [CSS styles for background]
     */
    hlbStyling.getBgStyle = function (originalElement, originalElementComputedStyle) {
    
      var oldBgColor = originalElementComputedStyle.backgroundColor,
          oldBgImage = originalElementComputedStyle.backgroundImage,
          newBg      = getNewBackground(originalElement, oldBgColor, oldBgImage),
          newBgColor = newBg.bgColor ? newBg.bgColor : oldBgColor,
          newStyles  = {},
          color,
          isContrastColors;
      
      // If color and background color are not contrast then either set background image or invert background color.
      if (!common.isEmptyBgImage(oldBgImage) && oldBgImage.indexOf('url') === -1) {
        newStyles['background-repeat']   = originalElementComputedStyle['background-repeat'];
        newStyles['background-image']    = oldBgImage;
        newStyles['background-position'] = originalElementComputedStyle['background-position'];
        newStyles['background-color']    = common.getRevertColor(newBgColor);
      }
      
      // If background color is not contrast to text color, invert background one.
      color            = getCurrentTextColor(originalElement, originalElementComputedStyle);
      isContrastColors = common.getIsContrastColors(color, newBgColor);
      
      // EQ-1011: always use black for images.
      if ($(originalElement).is('img')) {
        newStyles['background-color'] = '#000';
        return newStyles;
      }
      if (!isContrastColors && common.isCanvasElement($(originalElement))) {
      
        // Favor a white background with dark text when original background was white.
        if (common.isLightTone(newBgColor)) {
          newBgColor = 'rgb(255, 255, 255)';
          newStyles.color = common.getRevertColor(color);
        }
      }
      
      newStyles['background-color'] = newBgColor;
      
      return newStyles;
    
    };

    callback();
  
  });

});