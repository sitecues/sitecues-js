/**
 * This file contains helper methods for dealing with the string that is returned
 * when using Element.style.transform or Element.getAttribute('transform')
 *
 * TODO: Have a single method that returns an object with properties that map to the
 * values we would ever care about when dealing with transform styles.
 */

define([ 'core/platform' ], function(platform) {

  var SHOULD_USE_CSS_TRANSFORM_IN_SVG = !platform.browser.isIE;

  // Skips past non-numeric characters and get the next number as type 'number'
  // It will include a negative sign and decimal point if it exists in the string
  function getNumberFromString(str) {
    return typeof str === 'number' ? str : +(str.match(/[0-9\.\-]+/));
  }

  function shouldUseCss(elem) {
    return false; //SHOULD_USE_CSS_TRANSFORM_IN_SVG || !(elem instanceof SVGElement);
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
      elem.style[platform.transformProperty] = transformString;
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
    return getTransformMap(elem.style[platform.transformProperty]);
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
      hasRotate = transformString && transformString.indexOf('rotate') !== -1,

      translateY = 0,
      translateX = 0,
      scale = 1,
      rotate = 0,

      // IE9 sometimes does not include a translation that is seperated by a comma;
      translateSplitter,

      // We use String.prototype.split to extract the values we want, and we need a
      // variable to store the intermediary result.  I'm not a huge fan of this.
      rotateValues,
      transformValues;

    if (hasTranslate) {

      translateSplitter = transformString.indexOf(',') !== -1 ? ',' : ' ';
      transformValues = transformString.split(translateSplitter);
      translateX = transformValues[0] || 0;
      translateY = hasScale ? transformValues[1].split('scale')[0] : transformValues[1] || 0;

    }

    if (hasScale) {
      transformValues = transformString.split('scale');
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
    getAttrTransformMap: getAttrTransformMap,
    setElemTransform: setElemTransform,
    shouldUseCss: shouldUseCss
  };
});
