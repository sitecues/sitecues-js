/**
 * This file contains helper methods for dealing with the string that is returned
 * when using Element.style.transform or Element.getAttribute('transform')
 *
 * TODO: Have a single method that returns an object with properties that map to the
 * values we would ever care about when dealing with transform styles.
 */

sitecues.def('util/transform', function (transform, callback) {

  'use strict';

  // Skips past non-numeric characters and get the next number as type 'number'
  // It will include a negative sign and decimal point if it exists in the string
  function getNumberFromString (str) {
    return typeof str === 'number' ? str : +(str.match(/[0-9\.\-]+/));
  }

  transform.getTransform = function (transform) {

    var hasTranslate = transform && transform.indexOf('translate') !== -1,
        hasScale     = transform && transform.indexOf('scale')     !== -1,
        hasRotate    = transform && transform.indexOf('rotate')    !== -1,

        translateTop  = 0,
        translateLeft = 0,
        scale         = 1,
        rotate        = 0,

        // IE9 sometimes does not include a translation that is seperated by a comma;
        translateSplitter,

        // We use String.prototype.split to extract the values we want, and we need a
        // variable to store the intermediary result.  I'm not a huge fan of this.
        transformValues;

    if (hasTranslate) {

      translateSplitter = transform.indexOf(',') !== -1 ? ',' : ' ';
      transformValues   = transform.split(translateSplitter);
      translateLeft     = transformValues[0];
      translateTop      = hasScale ? transformValues[1].split('scale')[0] : transformValues[1];

    }

    if (hasScale) {
      transformValues = transform.split('scale');
      scale           = hasRotate ? transformValues[1].split('rotate')[0] : transformValues[1];
    }

    if (hasRotate) {
      rotate = transform.split('rotate')[1];
    }

    return {
      'translate': {
        'left': getNumberFromString(translateLeft),
        'top' : getNumberFromString(translateTop)
      },
      'scale' : getNumberFromString(scale),
      'rotate': getNumberFromString(rotate)
    };

  };

  callback();

});