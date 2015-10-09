/**
 * This file contains helper methods for dealing with the string that is returned
 * when using Element.style.transform or Element.getAttribute('transform')
 *
 * TODO: Have a single method that returns an object with properties that map to the
 * values we would ever care about when dealing with transform styles.
 */

define([ 'core/platform' ], function(platform) {

  var useCssInSvg = !platform.browser.isIE;

  // Skips past non-numeric characters and get the next number as type 'number'
  // It will include a negative sign and decimal point if it exists in the string
  function getNumberFromString(str) {
    return typeof str === 'number' ? str : +(str.match(/[0-9\.\-]+/));
  }

  function getComputedScale(elem) {
    var style = getComputedStyle(elem),
      transform = style[platform.transformProperty];
    return parseFloat(transform.substring(7)) || 1;
  }

  // Always get style transform
  function getStyleTransform(elem) {
    return getTransform(elem.style[platform.transformProperty]);
  }

  // Get @transform or CSS transform as appropriate
  function getElemTransform(elem) {
    var transformString;
    if (useCssInSvg && elem instanceof SVGElement) {
      transformString = elem.style[platform.transformProperty];
    }
    if (!transformString) {
      transformString = elem.getAttribute('transform');
    }

    return getTransform(transformString);
  }

  function getTransform(transform) {

    var hasTranslate = transform && transform.indexOf('translate') !== -1,
      hasScale = transform && transform.indexOf('scale') !== -1,
      hasRotate = transform && transform.indexOf('rotate') !== -1,

      translateTop = 0,
      translateLeft = 0,
      scale = 1,
      rotate = 0,
      rotateX = 0,
      rotateY = 0,

    // IE9 sometimes does not include a translation that is seperated by a comma;
      translateSplitter,

    // We use String.prototype.split to extract the values we want, and we need a
    // variable to store the intermediary result.  I'm not a huge fan of this.
      rotateValues,
      transformValues;

    if (hasTranslate) {

      translateSplitter = transform.indexOf(',') !== -1 ? ',' : ' ';
      transformValues = transform.split(translateSplitter);
      translateLeft = transformValues[0] || 0;
      translateTop = hasScale ? transformValues[1].split('scale')[0] : transformValues[1] || 0;

    }

    if (hasScale) {
      transformValues = transform.split('scale');
      scale = hasRotate ? transformValues[1].split('rotate')[0] : transformValues[1];
    }

    if (hasRotate) {

      rotate = transform.split('rotate')[1];

      if (rotate.indexOf(',') !== -1) {
        rotateValues = rotate.split(',');
        rotate = rotateValues[0];
        rotateX = rotateValues[1];
        rotateY = rotateValues[2];
      }
    }

    return {
      'translate': {
        'left': getNumberFromString(translateLeft),
        'top': getNumberFromString(translateTop)
      },
      'scale': getNumberFromString(scale),
      'rotate': getNumberFromString(rotate),
      'rotateX': getNumberFromString(rotateX),
      'rotateY': getNumberFromString(rotateY)
    };

  }

  function setStyleTransform(elem, left, top, transformScale, rotate) {
    var newTransformString = getTransformString(left + 'px', top + 'px', transformScale, rotate && rotate + 'deg');
    elem.style[platform.transformProperty] = newTransformString;
  }

  // Set @transform or CSS transform as appropriate
  function setElemTransform(elem, left, top, transformScale, rotate) {
//    elem.removeAttribute('transform');
    if (useCssInSvg || elem instanceof SVGElement) {  // Always use CSS, even in SVG
      setStyleTransform(elem, left, top, transformScale, rotate);
    }
    else {
      elem.setAttribute('transform', getTransformString(left, top, transformScale, rotate));
    }
  }

  function getTransformString(left, top, scale, rotate) {

    var translateCSS = 'translate(' + left + ' , ' + top + ') ',
      scaleCSS = scale > 1 ? ' scale(' + scale + ') ' : '',
      rotateCSS = rotate ? ' rotate(' + rotate + ') ' : '';

    return translateCSS + scaleCSS + rotateCSS;

  }

  return {
    useCssInSvg: useCssInSvg,
    getComputedScale: getComputedScale,
    getTransform: getTransform,
    getStyleTransform: getStyleTransform,
    getElemTransform: getElemTransform,
    setStyleTransform: setStyleTransform,
    setElemTransform: setElemTransform,
    getTransformString: getTransformString
  };


});
