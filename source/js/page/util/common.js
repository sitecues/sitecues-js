/**
 * This is module for common utilities that might need to be used across all of the different modules.
 */
define(
  [
    'page/util/element-classifier',
    'core/platform',
    'core/inline-style/inline-style'
  ],
  function (
    elemClassifier,
    platform,
    inlineStyle
  ) {
  'use strict';

  function isTransparentColor(color) {
    // NOTE: Doesn't check HSLA colors for transparency
    return color === 'transparent' || color.match(/^rgba.*0\)$/);
  }

  /**
   * @private
   */
  function isNonEmptyTextNode(node) {
    return node.nodeType === Node.TEXT_NODE && !isWhitespaceOrPunct(node);
  }

  function hasBorder(style) {
    return parseFloat(style.borderRightWidth) || parseFloat(style.borderBottomWidth);
  }

  /**
   * Checks if the text in a text node given has any characters that appear as text.
   * The picker uses this to determine if a text node has content worth highlighting --
   * we require at least one letter or number as punctuation marks are often used as decorative separators.
   * We use unicode ranges to ensure that characters from foreign alphabets are included,
   * otherwise the picker will not pick text from languages with non-roman alphabets.
   * This is a close approximation to that -- we kept the regex simple and the number of ranges smaller;
   * there may be some very rare characters where the regex is not perfect. That should generally be
   * ok, because it only needs one word character in a text node to make it pickable.
   */
  function isWhitespaceOrPunct(textNode) {
    var val = textNode.data,
      WORD_PATTERN = /[\w\u0100-\u024f\u0370-\u1fff\u2e80-\ufeff]/;

    return !val || !WORD_PATTERN.test(val);  // Only whitespace or punctuation
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

    return Boolean(isVisRegion);
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
    var maxX = innerWidth - 1,
      maxY = innerHeight - 1;

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

  function getBulletWidth(listElement, style) {

    var MONOSPACE_BULLET_TYPES = { circle: 1, square: 1, disc: 1, none: 1 },
      bulletType = style.listStyleType,
      ems = 2.5;  // Browsers seem to use max of 2.5 em for bullet width -- use as a default

    if (MONOSPACE_BULLET_TYPES.hasOwnProperty(bulletType)) {
      ems = 1.6; // Simple bullet
    }
    else if (bulletType === 'decimal') {
      var start = parseInt(listElement.getAttribute('start'), 10),
        end = (start || 1) + listElement.childElementCount - 1;
      ems = (0.9 + 0.5 * end.toString().length);
    }

    return getEmsToPx(style.fontSize, ems);
  }

  function getEmsToPx(fontSize, ems) {
    // Create a div to measure the number of px in an em with this font-size
    var measureDiv = document.createElement('div'),
      px;
    document.body.appendChild(measureDiv);
    inlineStyle.set(measureDiv, {
      fontSize   : fontSize,
      width      : ems + 'em',
      visibility : 'hidden'
    });
    // Multiply by zoom because our <div> is not affected by the document's current zoom level
    px = measureDiv.clientWidth;
    document.body.removeChild(measureDiv);
    return px;
  }

  function getComputedScale(elem) {
    var style = getComputedStyle(elem),
      transform = style.transform;
    return parseFloat(transform.substring(7)) || 1;
  }

  return {
    isWhitespaceOrPunct: isWhitespaceOrPunct,
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
    getEmsToPx: getEmsToPx,
    getComputedScale: getComputedScale
  };
});