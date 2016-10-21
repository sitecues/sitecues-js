/**
 * This file contains helper methods for dealing with the string that is returned
 * when using Element#style.transform or Element.getAttribute('transform')
 * This module supports translateX, translateY, scale, scaleY and rotate.
 * In the case of scaleY it is get/set as a scale(1,y) value with a paired property scaleType = 'scaleY'
 */

define(
  [
    'run/inline-style/inline-style',
    'run/platform'
  ],
  function (
    inlineStyle,
    platform
  ) {
  'use strict';

  var SHOULD_USE_CSS_TRANSFORM_IN_SVG =
    !platform.browser.isMS &&       // MS does not support CSS in SVG
    !platform.browser.isSafari &&   // Safari CSS animations are actually slower
    !platform.browser.isFirefox;    // FF breaks getBoundingClientRect() when CSS transform is used

  // Skips past non-numeric characters and get the next number as type 'number'
  // It will include a negative sign and decimal point if it exists in the string
  function getNumberFromString(str) {
    return typeof str === 'number' ? str : +(str.match(/[0-9\.\-]+/));
  }

  function shouldUseCss(elem) {
    return SHOULD_USE_CSS_TRANSFORM_IN_SVG || !(elem instanceof SVGElement);
  }

  // Set @transform or CSS transform as appropriate
  // transformMap: {     // optional fields
  //   translateX: number
  //   translateY: number
  //   scale: number,
  //   scaleType: 'scaleX' || 'scaleY'
  //   rotate: number
  // }
  // scaleType can be 'scaleX' or 'scaleY'
  function setElemTransform(elem, transformMap) {
    var useCss = shouldUseCss(elem),
      transformString = getTransformString(transformMap, useCss);

    if (useCss) {  // Always use CSS, even in SVG
      inlineStyle(elem).transform = transformString;
    }
    else if (transformString) {
      elem.setAttribute('transform', transformString);
    }
    else {
      elem.removeAttribute('transform');
    }
  }

  // Always get style transform
  function getStyleTransformMap(elem) {
    return getTransformMap(inlineStyle(elem).transform);
  }

  function getElemTransformMap(elem) {
    return shouldUseCss(elem) ? getStyleTransformMap(elem) : getAttrTransformMap(elem);
  }

  function getAttrTransformMap(elem) {
    return getTransformMap(elem.getAttribute('transform'));
  }

  function getTransformMap(transformString) {

    var hasTranslate = transformString && transformString.indexOf('translate') !== -1,
      hasScale = transformString && transformString.indexOf('scale') !== -1,
      hasScaleY = hasScale && transformString.indexOf('scale(1,') !== -1,  // Only vertical scaling used (scaleY)
      hasRotate = transformString && transformString.indexOf('rotate') !== -1,

      translateY = 0,
      translateX = 0,
      scale = 1,
      rotate = 0,

      // We use String.prototype.split to extract the values we want, and we need a
      // variable to store the intermediary result.  I'm not a huge fan of this.
      rotateValues,
      transformValues;

    if (hasTranslate) {
      // translate is always first
      var separator = transformString.indexOf(',') > 0 ? ',' : ' ';  // Attributes split by space, CSS by comma
      transformValues = transformString.split(separator);
      translateX = transformValues[0] || 0;
      translateY = hasScale ? transformValues[1].split('scale')[0] : transformValues[1] || 0;

    }

    if (hasScale) {
      if (hasScaleY) {
        // Only vertical scaling used (scaleY)
        transformValues = transformString.split('scale(1,');
      }
      else {
        transformValues = transformString.split('scale');
      }
      scale = hasRotate ? transformValues[1].split('rotate')[0] : transformValues[1];
    }

    if (hasRotate) {
      rotate = transformString.split('rotate')[1];

      if (rotate.indexOf(',') !== -1) {
        rotateValues = rotate.split(',');
        rotate = rotateValues[0];
      }
    }

    return {
      translateX: getNumberFromString(translateX),
      translateY: getNumberFromString(translateY),
      scale: getNumberFromString(scale),
      scaleType: hasScaleY ? 'scaleY': 'scale',
      rotate: getNumberFromString(rotate)
    };

  }

  function getTransformString(transformMap, useCss) {
    var translateUnits = useCss ? 'px' : '',
      hasTranslate = transformMap.translateX || transformMap.translateY,
      translateCSS =
        hasTranslate ?
          'translate(' +
            (transformMap.translateX || 0) + translateUnits + ', ' +
            (transformMap.translateY || 0) + translateUnits + ') '
          : '',
      scale = transformMap.scale,
      hasScale = scale && scale !== 1,
      scaleType = transformMap.scaleType === 'scaleY' ? 'scale(1,' : 'scale(',
      scaleCSS = hasScale ? scaleType + scale + ') ' : '',
      rotate = transformMap.rotate,
      rotateUnits = useCss ? 'deg' : '',
      rotateCSS = rotate ? ' rotate(' + rotate + rotateUnits + ') ' : '';

    return translateCSS + scaleCSS + rotateCSS;
  }

  return {
    getTransformMap: getTransformMap,
    getElemTransformMap: getElemTransformMap,
    getStyleTransformMap: getStyleTransformMap,
    setElemTransform: setElemTransform,
    shouldUseCss: shouldUseCss
  };
});
