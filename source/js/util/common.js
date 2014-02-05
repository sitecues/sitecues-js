/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
sitecues.def('util/common', function (common, callback, log) {
  'use strict';

  common.kMinRectWidth = 4;
  common.kMinRectHeight = 4;

   // Define dependency modules.
  sitecues.use('jquery', 'jquery/cookie', 'conf', 'platform', function ($, cockie, conf, platform) {
    
    var kRegExpRGBString = /\d+(\.\d+)?%?/g
      , kRegExpHEXValidString = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i
      , kUrlValidString = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
      , bodyVertScrollbarWidth
      , rightAlignObjs
      // https://developer.mozilla.org/en-US/docs/Web/CSS/line-height
      , lineHeightValues = {'normal': 1.2}
      ;

    var validNonVisualElements = ['document', 'body', 'html', 'head'];
    var nonWordWrappableElements = ['table', 'thead', 'tbody', 'tr', 'td', 'img'];
    var nodeTypes = {
        'elementNode': 1,
        'textNode':    3
    }

    // Make sure 'trim()' has cross-browser support.
    if (typeof String.prototype.trim !== 'function') {
      String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
      };
    }

    common.getLineHeight = function(item) {
      // Values possible from computed style: normal | <number>px
      var lineHeight = $(item).css('line-height');
      if (lineHeightValues.hasOwnProperty(lineHeight)) {
        var fontSize = $(item).css('font-size');
        var lineHeight = Math.floor(parseInt(fontSize.replace('px','')) * 1.5);
        return lineHeight;
      }
      return parseFloat(lineHeight);
    }

    /**
     * Get the element's styles to be used further.
     * @param element The DOM element which styles we want to get.
     * @return elementComputedStyles An object of all element computed styles.
     */
    common.getElementComputedStyles = function (element, prop, doTransform) {
      if(!element){
        return;
      }
      // By default, return entire CSS object.
      var currentProperty
        , propertyName
        , propertyParts = []
        , elementComputedStyles = {}
        , computedStyles = window.getComputedStyle(element, null) || element.currentStyle
        , i
        ;

      // If a specific property value is requested then skip the entire CSS object iteration.
      if (prop) {
        propertyParts = prop.split('-');
        // camelCase name: 'marginTop'
        if (propertyParts.length < 2) {
          return computedStyles[prop];
        }
        
        // dash-like name: 'margin-top'
        for (i = 1; i < propertyParts.length; i++) {
          propertyName += this.capitaliseFirstLetter(propertyParts[i]); // in format 'marginTop'
        }
        return computedStyles[propertyName];
      }

      $.each(computedStyles, function (index) {
        currentProperty = computedStyles[index]; // in format 'margin-top'
        propertyParts = currentProperty.split('-');
        propertyName = propertyParts[0];
        for (var i = 1; i < propertyParts.length; i++) {
          propertyName += common.capitaliseFirstLetter(propertyParts[i]); // in format 'marginTop'
        }
        if (doTransform) {
          // in format 'marginTop'
          elementComputedStyles[propertyName] = computedStyles[propertyName];
        } else {
          // in format 'margin-top'
          elementComputedStyles[currentProperty] = computedStyles[propertyName];
        } 
        
      });
      return elementComputedStyles;
    };

    /**
     * Calcualate the width of a single x-char based on current styles.
     * @param {Object} currentStyle
     * @returns {Number} Amount of pixels single x-char takes.
     */
    common.getXCharWidth = function(currentStyle) {
        var fontStyle = {
            'font-family': currentStyle['font-family'],     // font-family: "Arial, Helvetica, sans-serif"
            'font-size':   currentStyle['font-size'],       // font-size: "19.230770111083984px"
            'font-style':  currentStyle['font-style'],      // font-style: "normal"
            'font-variant':currentStyle['font-variant'],    // font-variant: "normal"
            'font-weight': currentStyle['font-weight']      // font-weight: "500"
        };

        $('body').append('<div id="testwidth"><span>x</span></div>');
        var xCharWidth = $('#testwidth span').css($.extend({'width': '1ch'}, fontStyle)).width();
        $('#testwidth').remove();

        return xCharWidth;
    }

    /**
     * Remove all the attributes from the DOM element given.
     */
    common.removeAttributes = function(element) {
      element.each(function () {
        // Copy the attributes to remove:
        // if we don't do this it causes problems iterating over the array we're removing elements from.
        var attributes = $.map(this.attributes, function (item) {
          return item.name;
        });
        // Now use jQuery to remove the attributes.
        $.each(attributes, function (i, item) {
          // Check is the attribute is a valid DOM attribute.
          if (element.attr(item)) {
            element.removeAttr(item);
          }
        });
      });
    };

    /**
     * Capitalizes the first letter of the string given as an argument.
     */
    common.capitaliseFirstLetter = function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    /*
     * Check if two Javascript objects are equal.
     * @param {type} obj1
     * @param {type} obj2
     * @returns {unresolved}
     */
    common.equals = function(obj1, obj2) {
        function _equals(obj1, obj2) {
            return JSON.stringify(obj1)
                === JSON.stringify($.extend(true, {}, obj1, obj2));
        }
        return _equals(obj1, obj2) && _equals(obj2, obj1);
    }

    /**
     * Checks if the value given is empty or not.
     */
    common.isEmpty = function(val) {
      return !val || val.trim() === '';
    };

    /**
     * Checks if the element has media contents which can be rendered.
     */ 
    common.isVisualMedia = function(selector) {
      var VISUAL_MEDIA_ELEMENTS = 'img,canvas,video,embed,object,iframe,frame,audio';
      return $(selector).is(VISUAL_MEDIA_ELEMENTS);
    };

    /**
     * Checks if the current element has non-auto clip property value.
     */
   common.isClipElement = function(element) {
        // TODO: should we use common.getElementComputedStyles() ?
        return $(element).css('clip') !== 'auto' || $(element).css('overflow') !== 'visible';
    };

    /*
     * @param {HTMLObject Array} el DOM node (array)
     * @returns {Boolean} True if the element is related to canvas.
     */  
    common.isCanvasElement = function (el) {
       return el[0].localName === "canvas" || el.find('canvas').length > 0;
     };

    /**
     * Detect if the current element containts wrappable content.
     * @param {type} el DOM node
     * @returns {Boolean}t ture if the content is wrappable.
     */
    common.isWordWrappableElement = function(el) {
         var localName = el.localName;
         var nodeType  = el.nodeType;

         var hasWordWrappableElementTag = $.inArray(localName, nonWordWrappableElements) < 0;
         var hasVisualElementTag = $.inArray(localName, validNonVisualElements) < 0;

         var isTextNode    = nodeType === nodeTypes['textNode'];
         var isElementNode = nodeType === nodeTypes['elementNode'];
         
         var isNotDirectChildOfNonVisualElement = $.inArray($(el).parent()[0].localName, validNonVisualElements) < 0;
         var isAssumedToBeTextNode = true;

         // todo: Alternatively, we may try BFS and compare the benchmarks.
         (function _recurse(children) {
             if (!isAssumedToBeTextNode || children.length === 0) {
                 return;
             }
             children.each(function() {
                 if (($.inArray($(this)[0].localName, nonWordWrappableElements) >= 0)
                    // List item that has bg image.
                     || (($(this)[0].localName === 'li') && !common.isEmptyBgImage($(this).css('background-image')))) {
                     isAssumedToBeTextNode = false;
                     return;
                 }
                 if ($(this).children().length > 0) {
                     return _recurse($(this).children());
                 }

             });
         }($(el).children()));

         return hasWordWrappableElementTag
             && hasVisualElementTag
             && isNotDirectChildOfNonVisualElement
             && ((isElementNode && isAssumedToBeTextNode) || isTextNode);
    }

    common.isValidNonVisualElement = function(el) {
         return $.inArray(el.localName, validNonVisualElements) >= 0;
     }

     common.isValidBoundingElement = function(el) {
         var $el = el && $(el);
         var isValidBoundingElement =
                el && el.localName && el.localName !== 'script'
                && $el.is(':visible')
                && $el.height() > 5 && $el.width() > 5;
        return isValidBoundingElement? true: false;
     }

    /*
     * Check if current image value is not empty.
     * @imageValue A string that represents current image value.
     * @return true if image value contains some not-empty value.
     */
    common.isEmptyBgImage = function(imageValue) {
      return this.isEmpty(imageValue) || imageValue === 'none';
    };

    // For now it is just a stub
    // todo: fill in with logic
    common.isAddedBySitecues = function (el) {
        return false;
    };

     /**
      * Checks if the element has a visible border(based on left and top border widths.
      */
    common.hasVisibleBorder = function(style) {
       return parseFloat(style['border-left-width']) || parseFloat(style['border-top-width']);
     };

    common.hasNonEmptyZIndex = function(el) {
        return (($(el).css('z-index') !== 'auto' && $(el).css('z-index') !== '')
                || (el.style['z-index'] !== 'auto' && el.style['z-index'] !== ''))
    };

    /**
      * Is the current element editable for any reason???
      * @param element
      * @returns {boolean} True if editable
      */
    common.isEditable = function ( element ) {
      var tag = element.localName
        , contentEditable
        ;
      
      if (!tag) {
        return false;
      }
      tag = tag.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return true;
      }
      if (element.getAttribute('tabIndex') || element.getAttribute('onkeydown') || element.getAttribute('onkeypress')) {
        return true; // Be safe, looks like a keyboard-accessible interactive JS widget
      }
      // Check for rich text editor
      contentEditable = element.getAttribute('contenteditable');
      if (contentEditable && contentEditable.toLowerCase() !== 'false') {
        return true; // In editor
      }
      if (document.designMode === 'on') {
        return true; // Another kind of editor
      }
      return false;
    };

    /**
     * Checks if the color value given of a light tone or not.
     */
    common.isLightTone = function (colorValue) {
      var RGBColor = this.getRGBColor(colorValue);
      // http://en.wikipedia.org/wiki/YIQ
      var yiq = ((RGBColor.r*299)+(RGBColor.g*587)+(RGBColor.b*114))/1000;

      return  yiq >= 128;
    }

    /*
     * Converts both colors to the same [RGB] format and then find out if they are contrast.
     * @param colorOne String/CSSPrimitiveValue represents one of the colors to compare
     * @param colorTwo String/CSSPrimitiveValue represents the other color to compare
     * @return Boolean true if colors are contrast; false otherwise
     */
    common.getIsContrastColors = function(colorOne, colorTwo){
      var colorOneTone = this.isLightTone(colorOne);
      var colorTwoTone = this.isLightTone(colorTwo);
      // Now that we have both colors tones, define if they are contrast or not.
      return (colorOneTone === colorTwoTone) ? false : true;
    };

    /*
     * Converts color given RGB format.
     * @param colorValue String/CSSPrimitiveValue
     * @return Object of RGB format {r: numericValue, g: numericValue, b: numericValue}
     */
    common.getRGBColor = function(colorValue) {
      // Sring
      if ( {}.toString.call( colorValue ) === '[object String]' ) {
        return Rgb(colorValue);
      }
      // CSSPrimitiveValue
      var resultRGBColor = { r: 255, g: 255, b:255 }
        , valueType
        , rgb
        ;
      try {
        valueType = colorValue.primitiveType;
        if (valueType === CSSPrimitiveValue.CSS_RGBCOLOR) {
          rgb = colorValue.getRGBColorValue();
          resultRGBColor.r = rgb.red.getFloatValue (CSSPrimitiveValue.CSS_NUMBER);
          resultRGBColor.g = rgb.green.getFloatValue (CSSPrimitiveValue.CSS_NUMBER);
          resultRGBColor.b = rgb.blue.getFloatValue (CSSPrimitiveValue.CSS_NUMBER);

        }
      } catch (e) {
        // Just temporary logging, to make sure code always works as expected.
        sitecues.log.warn('Attempt to get RGB color failed.');
      }
      return resultRGBColor;
    };
    
    /*
     * Calculates opposite color to the one given as parameter.
     * @param colorValue String/CSSPrimitiveValue
     * @return String that represents RGB value. Format : 'rgb(numericValueR, numericValueG, numericValueB)'
     */
    common.getRevertColor = function(colorValue) {
      var RGBColor = this.getRGBColor(colorValue);
      return 'rgb(' + (255 - RGBColor.r) + ', ' + (255 - RGBColor.g) + ', ' + (255 - RGBColor.b) + ')';
    };

    /*
     * Using image object element it gets its average color by means of the canvas.
     * @param imgEl An object.
     * @return rgb A string which represents the average image color in RGB format.
     */
    common.isInSitecuesUI = function(element) {
      var isInBadge = false,
          isInBody = false,
          badge = $('#sitecues-badge');

      $.each($(element).parents().andSelf(), function(i, parent) {
        var $parent = $(parent);
        if ($parent.is(document.body)) {
          isInBody = true;
          return null;
        }
        if ($parent.is(badge)) {
          isInBadge = true;
          return null;
        }
      });

      return isInBadge || !isInBody;
    };
 
    common.getAverageRGB = function(imgEl) {
      var blockSize = 5, // only visit every 5 pixels
      defaultRGB = {r:0, g:0, b:0}, // for non-supporting envs
      canvas = document.createElement('canvas'),
      context = canvas.getContext && canvas.getContext('2d'),
      data, width, height,
      i = -4,
      length,
      rgb = {r:0, g:0, b:0},
      count = 0;

      if (!context) {
        return defaultRGB;
      }

      height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
      width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

      context.drawImage(imgEl, 0, 0);

      try {
        data = context.getImageData(0, 0, width, height);
      } catch(e) {
        /* security error, img on diff domain */
        // alert('x');
        return defaultRGB;
      }

      length = data.data.length;

      while ( (i += blockSize * 4) < length ) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i+1];
        rgb.b += data.data[i+2];
      }

      // ~~ used to floor values
      rgb.r = Math.floor(rgb.r/count);
      rgb.g = Math.floor(rgb.g/count);
      rgb.b = Math.floor(rgb.b/count);

      return rgb;
    };

    /*
     * Returns an object of RGB components converted from a string containing either RGB or HEX string.
     */
    function Rgb(rgb){
      if (!(this instanceof Rgb)){
        return new Rgb(rgb);
      }
      var defaultColor = [255, 255, 255]
        , c = rgb.match(kRegExpRGBString)
        ;
      // RGB
      if (c) {
        c = c.map(function(itm){
          // Take care of plain numbers as well as percentage values
          if (itm.indexOf('%') !== -1){
            itm = parseFloat(itm)*2.55;
          }
          return parseInt(itm,10);
        });
      } else if ((kRegExpHEXValidString).test(rgb)) {
        // Valid HEX
        c = [];
        c[0] = hexToR(rgb);
        c[1] = hexToG(rgb);
        c[2] = hexToB(rgb);
      } else {
        c = defaultColor;
      }
      this.r = c[0];
      this.g = c[1];
      this.b = c[2];
    }

    function hexToR (h) {
      return parseInt((cutHex(h)).substring(0,2),16);
    }
    function hexToG (h) {
      return parseInt((cutHex(h)).substring(2,4),16);
    }
    function hexToB (h) {
      return parseInt((cutHex(h)).substring(4,6),16);
    }
    function cutHex (h) {
      return (h.charAt(0)==='#') ? h.substring(1,7):h;
    }
    
    /*
     * Sets a cookie.  Basically just wraps the jQuery cookie plugin.
     * 
     * Note: This will always set a site-wide cookie ("path=/").
     * 
     * @param name  The name of the cookie (be brief!), required
     * @param value The value of the cookie (be brief!), required
     * @param days  The expiration of the cookie in days, optional
     *              if not set this will be a session cookie.
     */
    common.setCookie = function(name, value, days) {
      if(days) {
        $.cookie(name, value, { expires: days, path: '/' });
      } else {
        $.cookie(name, value, { path: '/' });
      }
    };

    /*
     * Retrieves the value of cookie. Basically just wraps the jQuery 
     * cookie plugin.
     */
    common.getCookie = function(name) {
      return $.cookie(name);
    };

    // Event handlers.

    /**
     * Prevents default event behavior.
     * @param e Event Object
     */
    common.preventDefault = function(e) {
      e = e || window.event; // cross-browser event
      if (e.preventDefault){
        e.preventDefault();
      }
      e.cancelBubble = true; // IE variant
      e.returnValue = false;
    };
    
    /**
     * Prevents default and stops propogation.
     * @param e Event Object
     */
    common.stopDefaultEventBehavior = function(e) {
      this.preventDefault(e);
      e.stopPropagation();
    };

    /**
     * Defines wheel scroll direction: if wheel is up.
     * @param e Event Object
     */
    common.wheelUp = function(e) {
      var evt = e || window.event
      , delta = evt.originalEvent.detail < 0 || evt.originalEvent.wheelDelta > 0 ? 1 : -1
      ;
      return delta > 0;
    };

     /** 
     * Defines wheel scroll direction: if wheel is down.
     * @param e Event Object
     */
    common.wheelDown = function(e) {
      return !this.wheelUp(e);
    };

    /**
     * @param e EventObject
     * @param el HTMLObject
     * @param step Number the number of pixels set as scroll interval
     * @param isUp Boolean True if scroll direction is up
     */
    common.smoothlyScroll = function(e, el, step, isUp) {
      this.stopDefaultEventBehavior(e);
      step = step || 1;
      step = isUp? -step : step;
      el.scrollTop += step;
      return false;
    };

  /* Validates whether the given value is a valid URL
   * @urlString A string
   */

    common.validateUrl = function(urlString) {
      return kUrlValidString.test(urlString);
    };

  /**
   * Create an SVG fragment for insertion into a web page -- ordinary methods don't work.
   * See http://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element
   */
    common.createSVGFragment = function(svgMarkup, className) {
              var temp = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
              temp.innerHTML= '<svg xmlns="http://www.w3.org/2000/svg" class="' + className + '">'+svgMarkup+'</svg>';
              var frag = document.createDocumentFragment();
              var child = temp.firstChild;
              while (child) {
                      frag.appendChild(child);
                      child = child.nextSibling;
              }
              return frag;
      }


    ////////////////////////////////////////////////////////////////////////////////
    //// START: Logic for fixed right alignment ignoring the vertical scrollbar,
    ////////////////////////////////////////////////////////////////////////////////

    // Body vertical scrollbar width, in pixels.
    // TODO: Determine actual body vertical scrollbar width in current tab.
    bodyVertScrollbarWidth = 15;

    // The tracked objects.
    rightAlignObjs = [];

    // TODO: remove one of two dubs below: either bodyHasVertScrollbar or hasVertScroll.
    // Returns true if the body has a vertical scrollbar.
    function bodyHasVertScrollbar () {
      // See if the document width is within some delta of the window inner width.
      var result = ((window.innerWidth - $(document.documentElement).outerWidth()) > 3);
      log.info('bodyHasVertScrollbar = ' + result);
      return result;
    }
    /**
     * Defines if the element given contains vertical scroll.
     * @param el HTMLObject
     */
    common.hasVertScroll = function(el) {
      return el.clientHeight < el.scrollHeight;
    };

    common.bodyHasVertScrollbar = bodyHasVertScrollbar;

    // Applies the CSS object for the right alignment styles.
    function applyDynamicPlacementCSS (accessors) {

      //console.log( $(document).get(0).getClientBoundingRect() );

      // Why is this fired so many times?
      // log('________ applyDynamicPlacementCSS ________');
      // log(accessors.obj);
      // log('               doc elem outer width: ' +$(document.documentElement).outerWidth() );
      // log('                accessors get width: ' +accessors.getWidth() );
      // log('                body vert scrollbar: ' +bodyHasVertScrollbar() );
      // log('         accessors get right offset: ' +accessors.getRightOffset() );
      // log('accessors body vert scrollbar width: ' +bodyVertScrollbarWidth );
      if (!platform.browser.isIE) {
        var css = {
          left: (document.documentElement.clientWidth / conf.get('zoom') - 
            accessors.getWidth() / conf.get('zoom') -
            (bodyHasVertScrollbar() ?
              accessors.getRightOffset() : bodyVertScrollbarWidth + accessors.getRightOffset()
          )) + 'px'
        };
      } else {
        var css = {
          left: (document.documentElement.clientWidth - 
            accessors.getWidth() -
            (bodyHasVertScrollbar() ?
              accessors.getRightOffset() : bodyVertScrollbarWidth + accessors.getRightOffset()
          )) + 'px'
        };
      }
      // Apply the dynamic placement CSS.
      accessors.setCss(css);
    }

    /**
     * Right aligns an element while ignoring vertical scrollbar jitter.
     * @param accessors the element accessors:
     *                    obj:              the tracked object (used on remove)
     *                    getWidth():       get the element width, in pixels
     *                    setCss(jCssObj):  set the css of the element, using a JQuery CSS object
     *                    getRightOffset(): get the right offset the element, in pixels
     */
    common.addRightAlignIgnoreScrollbar = function(accessors) {
      rightAlignObjs.push(accessors);
      applyDynamicPlacementCSS(accessors);
    };

    /**
     * Removes a right aligned element from tracking.
     * @param obj the object to remove
     */
    common.removeRightAlignIgnoreScrollbar = function(obj) {
      for (var i = 0; i < rightAlignObjs.length; i++) {
        if (rightAlignObjs[i] && (rightAlignObjs[i].obj === obj)) {
          rightAlignObjs = rightAlignObjs.slice(0, i).concat(rightAlignObjs.slice(i + 1));
          i--;
        }
      }
    };

    // Only update the right alignments when the window width changes.
    $(window).on('resizeEnd', function() {
      // console.log('RESIZE END________________________________________________');
      for (var i = 0; i < rightAlignObjs.length; i++) {
        applyDynamicPlacementCSS(rightAlignObjs[i]);
      }
      sitecues.emit('resizeEndEnd');
    });

    ////////////////////////////////////////////////////////////////////////////////
    //// END: Logic for fixed right alignment ignoring the vertical scrollbar,
    ////////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////////
    //// START: Logic for mouse-highlight intellegent selection,
    ////////////////////////////////////////////////////////////////////////////////

 common.getBulletRect = function(element, style) {
      var bulletType = style['list-style-type'];
      if ((bulletType === 'none' && style['list-style-image'] === 'none') || style['list-style-position'] !== 'outside') {
        return null; // inside, will already have bullet incorporated in bounds
      }
      if (style['display'] !== 'list-item') {
        if ($(element).children(":first").css('display') !== 'list-item') {
          return null; /// Needs to be list-item or have list-item child
        }
      }
      var bulletWidth = getBulletWidth(element, style, bulletType);
      var boundingRect = this.getBoundingRectMinusPadding(element);
      return {
        top: boundingRect.top,
        height: boundingRect.height,
        left: boundingRect.left - bulletWidth,
        width: bulletWidth
      };
    }

    common.getSpriteRect = function(element, style) {
        // Check special case for sprites, often used for fake bullets
        if (style['background-image'] === 'none' || style['background-repeat'] !== 'no-repeat')
          return null;

        // Background sprites tend to be to the left side of the element
        var backgroundLeft = style['background-position']
        var left = backgroundLeft ? parseFloat(backgroundLeft) : 0;
        var rect = element.getBoundingClientRect();
        rect.left += left;
        rect.width = common.kMinRectWidth - left;   // Don't go all the way to the right -- that's likely to overrun a float
        return rect.width > 0 ? rect : null;
      }

     common.getOverflowRect = function(element, style) {
        var overflowX = style['overflow-x'] === 'visible' && element.scrollWidth - element.clientWidth > 1;
        var overflowY = style['overflow-y'] === 'visible' && element.scrollHeight - element.clientHeight >= this.getLineHeight(element);
        if (!overflowX && !overflowY) {
          return null;
        }

        // Check for descendant with visibility: hidden -- those break our overflow check.
        // Example: google search results with hidden drop down menu
        // For now, we will not support overflow in this case.
        var hasVisibilityHiddenDescendant = false;
        $(element).find('*').each(function() {
          if ($(this).css('visibility') === 'hidden') {
            hasVisibilityHiddenDescendant = true;
            return false;
          }
        });
        if (hasVisibilityHiddenDescendant) {
          return null;
        }

        // Overflow is visible: add right and bottom sides of overflowing content
        var rect = element.getBoundingClientRect();
        var newRect = {
          left: rect.left,
          top: rect.top,
          width: overflowX ? element.scrollWidth : rect.width,
          height: overflowY ? element.scrollHeight : rect.height
        };
        return newRect;
      }

      common.getClippedRect = function(unclippedRect, clipRect) {
        if (!clipRect) {
          // Ensure right and bottom are set as well
          unclippedRect.right = unclippedRect.left + unclippedRect.width;
          unclippedRect.bottom = unclippedRect.top + unclippedRect.height;
          return unclippedRect;
        }
        var left   = Math.max( unclippedRect.left, clipRect.left);
        var right  = Math.min( unclippedRect.left + unclippedRect.width, clipRect.left + clipRect.width);
        var top    = Math.max( unclippedRect.top, clipRect.top );
        var bottom = Math.min( unclippedRect.top + unclippedRect.height, clipRect.top + clipRect.height);
        return {
          left: left,
          top: top,
          bottom: bottom,
          right: right,
          width: right - left,
          height: bottom - top
        };
      }

        // Get clip rectangle from ancestors in the case any of them are clipping us
        common.getAncestorClipRect = function($selector) {
                var kMaxAncestorsToCheck = 5;
                var allClipRects = [];
                $selector.each(function() {
                        // Get ancestor clip rect -- do up to kMaxAncestorsToCheck ancestors (beyond that, it's unlikely to clip)
                        var ancestors = $selector.parents();
                        var clipRect = null;
                        ancestors.each(function(index) {
                                if (index >= kMaxAncestorsToCheck)
                                    return false;
                                if (common.isClipElement(this)) {
                                        var newClipRect = this.getBoundingClientRect();
                                        clipRect = clipRect ? this.getClippedRect(clipRect, newClipRect) : newClipRect;
                                }
                        });
                        allClipRects.push(clipRect);
                });
                common.combineIntersectingRects(allClipRects, 9999);
                return allClipRects[0];
        }


      /**
       * Combine intersecting rects. If they are withing |extraSpace| pixels of each other, merge them.
       */
      common.combineIntersectingRects = function(rects, extraSpace) {
        function intersects(r1, r2) {
          return !( r2.left - extraSpace > r1.left + r1.width + extraSpace
            || r2.left + r2.width + extraSpace < r1.left - extraSpace
            || r2.top - extraSpace > r1.top + r1.height + extraSpace
            || r2.top + r2.height + extraSpace < r1.top - extraSpace
            );
        }

        function merge(r1, r2) {
          var left = Math.min(r1.left, r2.left);
          var top = Math.min(r1.top, r2.top);
          var right = Math.max(r1.left + r1.width, r2.left + r2.width);
          var bottom = Math.max(r1.top + r1.height, r2.top + r2.height);
          return {
            left: left,
            top: top,
            width: right - left,
            height: bottom - top,
            right: right,
            bottom: bottom
          };
        }

        // TODO O(n^2), not ideal.
        // Probably want to use well-known algorithm for merging adjacent rects
        // into a polygon, such as:
        // http://stackoverflow.com/questions/643995/algorithm-to-merge-adjacent-rectangles-into-polygon
        // http://www.raymondhill.net/puzzle-rhill/jigsawpuzzle-rhill-3.js
        // http://stackoverflow.com/questions/13746284/merging-multiple-adjacent-rectangles-into-one-polygon
        for (var index1 = 0; index1 < rects.length - 1; index1 ++) {
          var index2 = index1 + 1;
          while (index2 < rects.length) {
            if (intersects(rects[index1], rects[index2])) {
              rects[index1] = merge(rects[index1], rects[index2]);
              rects.splice(index2, 1);
            }
            else {
              index2++;
            }
          }
        }
      }

     /**
      * Helper methods.
      */
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

     function getBulletWidth(element, style, bulletType) {
       var ems = 2.5;  // Browsers seem use max of 2.5 em for bullet width -- use as a default
       if ($.inArray(bulletType, ['circle', 'square', 'disc', 'none']) >= 0)
         ems = 1; // Simple bullet
       else if (bulletType === 'decimal') {
         var start = parseInt($(element).attr('start'));
         var end = (start || 1) + element.childElementCount - 1;
         ems = .9 + .5 * end.toString().length;
       }
       return getEmsToPx(style['font-size'], ems);
     }

    ////////////////////////////////////////////////////////////////////////////////
    //// END: Logic for mouse-highlight intellegent selection,
    ////////////////////////////////////////////////////////////////////////////////

    // Done.
    callback();
  });
});