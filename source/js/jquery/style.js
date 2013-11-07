// http://stackoverflow.com/questions/2655925/jquery-css-applying-important-styles
// todo: rename
sitecues.def('jquery/style', function (style, callback, log) {
  'use strict';
  
  var toClass = {}.toString
    , isStyleFuncSupported
    ;
  
  sitecues.use('jquery', 'platform', function (jQuery, platform) {

  // For those who need them (< IE 9), add support for CSS functions
    isStyleFuncSupported = CSSStyleDeclaration.prototype.getPropertyValue !== null;
    
    if (!isStyleFuncSupported) {
      
      CSSStyleDeclaration.prototype.getPropertyValue = function (a) {
        return this.getAttribute(a);
      };
      
      CSSStyleDeclaration.prototype.setProperty = function (styleName, value, priority) {
        
        this.setAttribute(styleName, value);
        
        priority = typeof priority !== 'undefined' ? priority : '';
        
        if (priority !== '') {
          // Add priority manually
          var rule = new RegExp(RegExp.escape(styleName) + '\\s*:\\s*' + RegExp.escape(value) + '(\\s*;)?', 'gmi');
          this.cssText = this.cssText.replace(rule, styleName + ': ' + value + ' !' + priority + ';');
        } 
      };

      CSSStyleDeclaration.prototype.removeProperty = function (a) {
        return this.removeAttribute(a);
      };

      CSSStyleDeclaration.prototype.getPropertyPriority = function (styleName) {
        var rule = new RegExp(RegExp.escape(styleName) + '\\s*:\\s*[^\\s]*\\s*!important(\\s*;)?', 'gmi');
        return rule.test(this.cssText) ? 'important' : '';
      };
    }

    // Escape regex chars with \
    RegExp.escape = function(text) {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    /*
     * The style function.
     * @param cssStyle: either a string representing a property name;
     *        or may be an Object containing CSS in key=>value structure.
     *        Example: {'width': '10px', 'margin-left': '15px'}
     * @param value: A string, value for a property given as 1st parameter.
     * @param priority: A string, pass 'important' if you want to set style like '10px !important'
     * @return this: HTML Object, a node a call performed on.
     */ 
    jQuery.fn.style = function (cssStyle, value, priority) {
      
      // DOM node
      var node = this.get(0)
        , style
        , type
        ;
      
      // Ensure we have a DOM node 
      if (typeof node === 'undefined') {
        return;
      }
      
      // CSSStyleDeclaration
      style = this.get(0).style;
      type  = toClass.call(cssStyle).slice(8, -1) || '';
      
      if (type === 'Object') {
        jQuery.each(cssStyle, function(property, value) {
          setCssStyle(style, property, value, priority);
        });
      } 
      if (type === 'String') {
        setCssStyle(style, cssStyle, value, priority);
      }

      return this;
    };
        
    /**
     * Sets property-value style with given priority.
     * @param style: CSSStyleDeclaration Object
     * @param property: A string contains name of the property we want to set value for.
     * @param value: A string contains value of the property we want to set value for.
     * @param priority: A string contains the piority of the property value we want to set.
     */
    function setCssStyle (style, property, value, priority) {
      // Setter
      if (style && property !== undefined) {
        
        if (value !== undefined) {
          
          // Set style property
          priority = priority !== undefined ? priority : '';
          
          if (platform.browser.isIE && property === 'cursor') {
            return;
          }

          try { 
            style.setProperty(property, value + '', priority);
          } catch (e) {
            
          }

          return;
        }
      }
    }

    callback();

  });

});