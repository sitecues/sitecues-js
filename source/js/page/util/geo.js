/**
* Methods for giving us coordinates and sizes, where jQuery was not giving us what we needed.
*/
define([], function () {
  'use strict';

  /**
   * Is the point inside the rectangle or within proximity pixels
   * @access public
   * @param x
   * @param y
   * @param rect
   * @param proximity (optional) Number of pixels of extra proximity allowed
   * @returns {boolean}
   */
  function isPointInRect(x, y, rect, proximity) {
    proximity = proximity || 0;
    var right = rect.left + rect.width,
      bottom = rect.top + rect.height;
    return x >= rect.left - proximity && x < right + proximity && y >= rect.top - proximity && y <= bottom + proximity;
  }

  /**
   * Is the point inside any of the supplied rectangles or within proximity pixels
   * @access public
   * @param x
   * @param y
   * @param rects
   * @param proximity (optional) Number of pixels of extra proximity allowed
   * @returns {boolean}
   */
  function isPointInAnyRect(x, y, rects, proximity) {
    for (var count = 0; count < rects.length; count++) {
      if (rects[count] && isPointInRect(x, y, rects[count], proximity)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Expand or contract rectangle
   * @access public
   * @param rect  Original rectangle
   * @param delta  Positive value to expand rectangle, or negative to contract
   * @returns Object new rectangle
   */
  function expandOrContractRect(rect, delta) {
    var newRect = {
      left: rect.left - delta,
      top: rect.top - delta,
      width: rect.width + 2*delta,
      height: rect.height + 2*delta
    };
    newRect.right = newRect.left + newRect.width;
    newRect.bottom = newRect.top + newRect.height;
    return newRect;
  }

  /**
   * Expand or contract an array of rects
   * @access public
   * @param [] rects
   * @param delta
   */
  function expandOrContractRects(rects, delta) {
    var numRects = rects.length,
      index = 0;
    for (; index < numRects; index ++ ) {
      rects[index] = expandOrContractRect(rects[index], delta);
    }
  }

  return {
    isPointInRect: isPointInRect,
    isPointInAnyRect: isPointInAnyRect,
    expandOrContractRect: expandOrContractRect,
    expandOrContractRects: expandOrContractRects
  };
});