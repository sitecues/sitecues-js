/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
define(['page/util/element-classifier', 'core/platform'], function (elemClassifier, platform) {

  /**
   * Checks if the text in a text node given is empty or not.
   */
   //TODO: Clarify intended purpose of function: if non-empty strings containing punctuation characters
  // should return true consider renaming
  function isEmpty(textNode) {
    var val = textNode.data;
    return !val || /^\W*$/.test(val);  // Only whitespace or punctuation
  }

  // Return true if there is a visual sub-box of content
  function isVisualRegion(element, style, parentStyle) {
    if (element === document.documentElement || element === document.body) {
      return false; // False for entire document because we are looking for sub-boxes of content
    }

    var isVisRegion =
      hasBorder(style) ||
      hasRaisedZIndex(style, parentStyle) ||
      hasOwnBackground(element, style, parentStyle);

    return !!isVisRegion;
  }

  function hasRaisedZIndex(style, parentStyle) {
    return parseFloat(style.zIndex) > parseFloat(parentStyle.zIndex);
  }

  function isSprite(style) {
    var coor = style.backgroundPosition.split(' ');
    return style.backgroundImage !== 'none' && (style.backgroundRepeat === 'no-repeat' ||
      parseFloat(coor[0]) === 0 || parseFloat(coor[1]) === 0);
  }

  //TODO: Consider refactoring signature to take just the element as a parameter
  function hasOwnBackground(elem, style, parentStyle) {
    if (!style) {
      return false;
    }

    // 1. Background images (sprites don't count -- often used for things like bullets)
    if (style.backgroundImage !== 'none' && !isSprite(style)) {
      return true;
    }
    // 2. Background colors
    return hasOwnBackgroundColor(elem, style, parentStyle);
  }

  function hasOwnBackgroundColor(elem, style, parentStyle) {
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
    return false;
  }

  function hasVisibleContent(current) {
    var children,
      index,
      MAX_CHILDREN_TO_CHECK = 10,
      numChildrenToCheck;

    if (elemClassifier.isVisualMedia(current) || elemClassifier.isFormControl(current)) {
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

    numChildrenToCheck = Math.min(children.length, MAX_CHILDREN_TO_CHECK);

    // Longer check: see if any children are non-empty text nodes, one by one
    for (index = 0; index < numChildrenToCheck; index++) {
      if (isNonEmptyTextNode(children[index])) {
        return true;
      }
    }
    return false;
  }

  /*
   * Check if current image value is not empty.
   * @imageValue A string that represents current image value.
   * @return true if image value contains some not-empty value.
   */
  function isEmptyBgImage(imageValue) {
    return !imageValue || imageValue === 'none';
  }

  /**
   * Create an SVG fragment for insertion into a web page -- ordinary methods don't work.
   * See http://stackoverflow.com/questions/3642035/jquerys-append-not-working-with-svg-element
   */
  function createSVGFragment(svgMarkup, className) {
    var temp = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    temp.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="' + className + '">'+svgMarkup+'</svg>';
    var frag = document.createDocumentFragment();
    var child = temp.firstChild;
    while (child) {
            frag.appendChild(child);
            child = child.nextSibling;
    }
    return frag;
  }

  /*
   * A version of elementFromPoint() that restricts the point to the viewport
   */
  function elementFromPoint(x, y) {
    var maxX = window.innerWidth - 1,
      maxY = window.innerHeight - 1;

    x = Math.min(maxX, Math.max(0, x));
    y = Math.min(maxY, Math.max(0, y));
    return document.elementFromPoint(x, y);
  }

  /**
   * Defines if the element given contains vertical scroll.
   * @param el HTMLObject
   */
  function hasVertScroll(el) {
    return el.clientHeight < el.scrollHeight;
  }

  var MONOSPACE_BULLET_TYPES = { circle: 1, square: 1, disc: 1, none: 1 };
  function getBulletWidth(listElement, style) {
    var bulletType = style.listStyleType,
      ems = 2.5;  // Browsers seem use max of 2.5 em for bullet width -- use as a default
    if (MONOSPACE_BULLET_TYPES.hasOwnProperty(bulletType)) {
      ems = 1.6; // Simple bullet
    } else if (bulletType === 'decimal') {
      var start = parseInt(listElement.getAttribute('start'), 10),
        end = (start || 1) + listElement.childElementCount - 1;
      ems = (0.9 + 0.5 * end.toString().length);
    }
    return getEmsToPx(style.fontSize, ems);
  }

  /**
   * @private
   */
  function isNonEmptyTextNode(node) {
    return node.nodeType === 3 /* Text node */ && !isEmpty(node);
  }

  function hasBorder(style) {
    return parseFloat(style.borderRightWidth) || parseFloat(style.borderBottomWidth);
  }

    //Doesn't check HSLA colors for transparency
  function isTransparentColor(color) {
    return color === 'transparent' || color.match(/^rgba.*0\)$/);
  }

  function getEmsToPx(fontSize, ems) {
    // Create a div to measure the number of px in an em with this font-size
    var measureDiv = document.createElement('div'),
      measureStyle = measureDiv.style,
      px;
    document.body.appendChild(measureDiv);
    measureStyle.fontSize = fontSize;
    measureStyle.width = ems + 'em';
    measureStyle.visibility = 'hidden';
    // Multiply by zoom because our <div> is not affected by the document's current zoom level
    px = measureDiv.clientWidth;
    document.body.removeChild(measureDiv);
    return px;
  }

  function getComputedScale(elem) {
    var style = getComputedStyle(elem),
      transform = style[platform.transformProperty];
    return parseFloat(transform.substring(7)) || 1;
  }

  return {
    getEmsToPx: getEmsToPx,
    isEmpty: isEmpty,
    isVisualRegion: isVisualRegion,
    hasRaisedZIndex: hasRaisedZIndex,
    isSprite: isSprite,
    hasOwnBackground: hasOwnBackground,
    hasOwnBackgroundColor: hasOwnBackgroundColor,
    hasVisibleContent: hasVisibleContent,
    isEmptyBgImage: isEmptyBgImage,
    createSVGFragment: createSVGFragment,
    elementFromPoint: elementFromPoint,
    hasVertScroll: hasVertScroll,
    getBulletWidth: getBulletWidth,
    getComputedScale: getComputedScale
  };

});
