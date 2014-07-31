/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
sitecues.def('util/common', function (common, callback) {
  'use strict';

   // Define dependency modules.
  sitecues.use('jquery', 'platform', function ($, platform) {

    common.transitionEndEvent = (function() {
      if (platform.browser.isChrome || platform.browser.isSafari) {
        return 'webkitTransitionEnd';
      }
      return 'transitionend';
    }());

    common.useJqueryAnimate = platform.browser.isIE && platform.ieVersion.isIE9;

    /*
     * Check if two Javascript objects are equal.
     * TODO check if this is the best implementation for us and write in a clearer way
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

    /**
     * Checks if the element is a form control
     */
    common.isFormControl = function(selector) {
      var FORM_ELEMENTS = 'input,textarea,select,button';
      return $(selector).is(FORM_ELEMENTS);
    };

    /**
     * Returns true if the element may use spacebar presses for its own purposes when focused.
     * For example, a video is likely to use spacebar to pause/play the video, and an input
     * uses the spacebar to insert spaces into the text.
     * @param selector
     * @returns {*|boolean}
     */
    // Define set of elements that need the spacebar but are not editable
    var NON_EDITABLE_SPACEBAR_ELEMENTS = 'video,embed,object,iframe,frame,audio,button,select,[tabindex],[onkeypress],[onkeydown]';
    common.isSpacebarConsumer = function(element) {
      return $(element).is(NON_EDITABLE_SPACEBAR_ELEMENTS) || isEditable(element);
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
    function isEditable(element) {
      if (document.designMode === 'on') {
        return true; // Another kind of editor
      }
      return $(element).is('input,textarea,[contenteditable="true"],[contenteditable=""]')
    }

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

    if (SC_UNIT) {
      $.extend(exports, common);
    }

    // Done.
    callback();
  });
});
