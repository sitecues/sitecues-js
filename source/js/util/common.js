/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
sitecues.def('util/common', function (common, callback) {
  'use strict';

   // Define dependency modules.
  sitecues.use('jquery', 'platform', function ($, platform) {

    // Windows 8 (aug 24, 2014) does not properly animate the HLB when using CSS Transitions.
    // Very strange behavior, might be worth filing a browser bug repport.
    // UPDATE: (sept 15, 2014) IE10 appears to regress in Win8.1, CSS transition animations for HLB not working.
    // UPDATE: (oct  06, 2014) Firefox appears to regress when window.pageYOffset is 0.  Animation of HLB
    //                         flies out from outside the viewport (top-left)
    common.useJqueryAnimate = (function () {

      return (platform.browser.isIE      && platform.browser.version === 9) ||
             (platform.browser.isIE      && platform.os.isWin8)             ||
             (platform.browser.isSafari  && window.pageYOffset === 0) ||
             (platform.browser.isFirefox && window.pageYOffset === 0);

    }());

    common.transitionEndEvent = platform.browser.isWebKit ? 'webkitTransitionEnd' : 'transitionend';

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
    };

    /**
     * Checks if the value given is empty or not.
     */
    common.isEmpty = function(node) {
      var val = node.data;
      return !val || /^\W*$/.test(val);  // Only whitespace or punctuation
    };

    /* ----------------------- PRIVATE ----------------------- */
    function isNonEmptyTextNode(node) {
      return node.nodeType === 3 /* Text node */ && !common.isEmpty(node);
    }

    // Return true if there is a visual sub-box of content
    common.isVisualRegion = function(element, style, parentStyle) {
      if (element === document.documentElement || element === document.body) {
        return false; // False for entire document because we are looking for sub-boxes of content
      }

      var isVisualRegion =
        hasBorder(style) ||
        common.hasRaisedZIndex(style, parentStyle) ||
        common.hasOwnBackground(element, style, parentStyle);

      return !!isVisualRegion;
    };

    function hasBorder(style) {
      return parseFloat(style.borderRightWidth) || parseFloat(style.borderBottomWidth);
    };

    common.hasRaisedZIndex = function(style, parentStyle) {
      return parseFloat(style.zIndex) > parseFloat(parentStyle.zIndex);
    };

    function isTransparentColor(color) {
      return color === 'transparent' || color.match(/^rgba.*0\)$/);
    }

    common.isSprite = function(style) {
      return style.backgroundImage !== 'none' && (style.backgroundRepeat === 'no-repeat'
        || parseFloat(style.backgroundPositionX) === 0 || parseFloat(style.backgroundPositionY) === 0);
    };

    common.hasOwnBackground = function(elem, style, parentStyle) {
      if (!style) {
        return false;
      }

      // 1. Background images (sprites don't count -- often used for things like bullets)
      if (style.backgroundImage !== 'none' && !common.isSprite(style)) {
        return true;
      }
      // 2. Background colors
      return common.hasOwnBackgroundColor(elem, style, parentStyle);
    };

    common.hasOwnBackgroundColor = function(elem, style, parentStyle) {
      var bgColor = style.backgroundColor;
      if (parentStyle && !isTransparentColor(bgColor)) {
        var parent = elem.parentNode;
        while (isTransparentColor(parentStyle.backgroundColor)) {
          if (parent === document.documentElement) {
            // Only transparent colors above = treated as white
            // Therefore current opaque bg is only treated as different if it's not white
            return bgColor !== 'rgb(255, 255, 255)';
          }
          parent = parent.parentNode;
          parentStyle = getComputedStyle(parent);
        }
        return parentStyle.backgroundColor !== bgColor;
      }
    };

    common.hasVisibleContent = function(current) {
      var children,
        index,
        MAX_CHILDREN_TO_CHECK = 10,
        numChildrenToCheck;

      if (common.isVisualMedia(current) || common.isFormControl(current)) {
        var mediaRect = current.getBoundingClientRect(),
          MIN_RECT_SIDE = 5;
        return (mediaRect.width >= MIN_RECT_SIDE && mediaRect.height >= MIN_RECT_SIDE);
      }

      // Check to see if there are non-empty child text nodes.
      // If there are, we say we're not over whitespace.
      children = current.childNodes;

      // Shortcut: could not have text children because all children are elements
      if (current.childElementCount === children.length) {
        return false;
      }

      numChildrenToCheck = Math.min(children.length, MAX_CHILDREN_TO_CHECK);;

      // Longer check: see if any children are non-empty text nodes, one by one
      for (index = 0; index < numChildrenToCheck; index++) {
        if (isNonEmptyTextNode(children[index])) {
          return true;
        }
      }
      return false;
    };

    /**
     * Checks if the element has media contents which can be rendered.
     */
    common.isVisualMedia = function(selector) {
      var VISUAL_MEDIA_ELEMENTS = 'img,picture,canvas,video,embed,object,iframe,frame,audio';
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
    var NON_EDITABLE_SPACEBAR_ELEMENTS = 'video,embed,object,iframe,frame,audio,button,input,select,[tabindex],[onkeypress],[onkeydown]';
    common.isSpacebarConsumer = function(element) {
      return $(element).is(NON_EDITABLE_SPACEBAR_ELEMENTS) || common.isEditable(element);
    };

    /**
     * Is the current element editable for any reason???
     * @param element
     * @returns {boolean} True if editable
     */
    var EDITABLE_INPUT_TYPES = [ 'text', 'email', 'password', 'search', 'tel', 'url', 'color', 'date', 'datetime', 'datetime-local',
      'month','number','time','week' ];
    common.isEditable = function(element) {
      if (element.localName === 'input') {
        var type = element.getAttribute('type');
        return !type || EDITABLE_INPUT_TYPES.indexOf(type) >= 0;
      }
      return document.designMode === 'on' || $(element).is(
        'textarea,[contenteditable="true"],[contenteditable=""]');
    }

    /*
     * Check if current image value is not empty.
     * @imageValue A string that represents current image value.
     * @return true if image value contains some not-empty value.
     */
    common.isEmptyBgImage = function(imageValue) {
      return !imageValue || imageValue === 'none';
    };

    // Return true if the element is part of the sitecues user interface
    // Everything inside the <body> other than the page-inserted badge
    common.isInSitecuesUI = function(node) {
      // Check for nodeType of 1, which is an element
      // If not, use the parent of the node
      var element = node.nodeType === 1 ? node : node.parentNode;
      return ! $.contains(document.body, element) || // Is not in the <body>
        $(element).closest('#sitecues-badge,#scp-bp-container').length;
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
    };

    /*
     * A version of elementFromPoint() that restricts the point to the viewport
     */
    common.elementFromPoint = function(x, y) {
      var maxX = window.innerWidth - 1,
        maxY = window.innerHeight - 1;

      x = Math.min(maxX, Math.max(0, x));
      y = Math.min(maxY, Math.max(0, y));
      return document.elementFromPoint(x, y);
    };

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

    common.getTransform = function($jquery) {
      var transform = $jquery.css('transform') || $jquery.css('webkitTransform');
      return parseFloat(transform.substring(7)) || 1;
    };

    function getEmsToPx(fontSize, ems) {
      // Create a div to measure the number of px in an em with this font-size
      var measureDiv = $('<div/>')
           .appendTo(document.body)
           .css({
          fontSize: fontSize,
          width: ems + 'em',
          visibility: 'hidden'
        }),
        // Multiply by zoom because our <div> is not affected by the document's current zoom level
        px = measureDiv[0].clientWidth;
      measureDiv.remove();
      return px;
    }

    common.getBulletWidth = function(listElement, style) {
      var bulletType = style.listStyleType,
        ems = 2.5;  // Browsers seem use max of 2.5 em for bullet width -- use as a default
      if ($.inArray(bulletType, ['circle', 'square', 'disc', 'none']) >= 0) {
        ems = 1.6; // Simple bullet
      } else if (bulletType === 'decimal') {
        var start = parseInt($(listElement).attr('start'), 10),
          end = (start || 1) + listElement.childElementCount - 1;
        ems = (0.9 + 0.5 * end.toString().length);
      }
      return getEmsToPx(style.fontSize, ems);
    };

    // Draw a rectangle that does not capture any mouse events
    // Implemented via zero-area element and CSS outline
    // Useful because IE9/10 does not have pointer-events: none
    // For example, if drawing a horizontal box we draw a line that is 0px high:
    //
    //       ---------------
    //
    // Then we fill in the outline around it using CSS:
    //
    //      OOOOOOOOOOOOOOOOO
    //      O---------------O
    //      OOOOOOOOOOOOOOOOO
    //
    common.drawRect = function(absRect, color, optionalParent) {
      var useCss = {
          position: 'absolute',
          outlineColor: color,
          outlineStyle: 'solid'
        },
        useOutlineWidth;

      if (absRect.width > absRect.height) {   // Wider than tall: draw horizontal line
        useOutlineWidth = absRect.height / 2;
        useCss.width = absRect.width - 2 * useOutlineWidth + 'px';
        useCss.height = 0;
      }
      else {   // Taller than wide: draw vertical line
        useOutlineWidth = absRect.width / 2;
        useCss.height = absRect.height - 2 * useOutlineWidth + 'px';
        useCss.width = 0;
      }

      useCss.left = (absRect.left + useOutlineWidth) + 'px';
      useCss.top = (absRect.top + useOutlineWidth) + 'px';
      useCss.outlineWidth = Math.round(useOutlineWidth) + 'px'; // Must round otherwise we get an outline in the middle

      return $('<div>')
        .css(useCss)
        .appendTo(optionalParent || 'html');
    };

    // Return truthy value if a button is pressed on a mouse event.
    // There are three properties for mouse buttons, and they all work differently -- both
    // in terms of browsers and on mousemove events in particular.
    // DANGER! Does not work in IE9 -- always returns falsey value.
    // If we need it in IE9 we'll need to globally track mousedown and mouseup events.
    common.isButtonDown = function(mouseEvent) {
      return (typeof mouseEvent.buttons === 'undefined' ? mouseEvent.which : mouseEvent.buttons);
    };

    // Done.
    callback();
  });
});
