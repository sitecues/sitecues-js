/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
sitecues.def('util/common', function (common, callback) {
  'use strict';

   // Define dependency modules.
  sitecues.use('jquery', function ($) {
    
    var kRegExpRGBString = /\d+(\.\d+)?%?/g
      , kRegExpHEXValidString = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;

    /*
     * Check if two Javascript objects are equal.
     * @param {type} obj1
     * @param {type} obj2
     * @returns {unresolved}
     */
    common.equals = function(obj1, obj2) {
        function _equals(obj1, obj2) {
            return JSON.stringify(obj1) === JSON.stringify($.extend(true, {}, obj1, obj2));
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

    /*
     * Check if current image value is not empty.
     * @imageValue A string that represents current image value.
     * @return true if image value contains some not-empty value.
     */
    common.isEmptyBgImage = function(imageValue) {
      return this.isEmpty(imageValue) || imageValue === 'none';
    };

    /**
      * Is the current element editable for any reason???
      * @param element
      * @returns {boolean} True if editable
      */
    common.isEditable = function ( element ) {
      if (element === document.body) {
        return false;  // Shortcut
      }
      var tag = element.localName
        , contentEditable
        ;
      
      if (!tag) {
        return false;
      }
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

    // Return true if the element is part of the sitecues user interface
    // Everything inside the <body> other than the page-inserted badge
    common.isInSitecuesUI = function(element) {
      var closest = $(element).closest('body,#sitecues-badge');
      return closest.length === 0 || $(closest).attr('id') === 'sitecues-badge';
    };

    // Event handlers.

    /**
     * Prevents default and stops propagation.
     * @param e Event Object
     */
    common.stopDefaultEventBehavior = function(e) {
      e.preventDefault();
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

    /**
     * Defines if the element given contains vertical scroll.
     * @param el HTMLObject
     */
    common.hasVertScroll = function(el) {
      return el.clientHeight < el.scrollHeight;
    };

    // Done.
    callback();
  });
});