sitecues.def('util/transform', function (transform, callback) {

  'use strict';

  function getNumberFromString (str) {
    return +(str.replace(/[^0-9\.\-]+/g, ''));
  }

  transform.getTranslate = function (transform) {

    var position  = {},
        transformValues,
        translateLeft,
        translateTop,
        splitter;

    if (!transform || transform === 'none' || transform === '' || transform.indexOf('translate') === -1) {

      position.left = 0;
      position.top  = 0;

    } else {

      splitter        = transform.indexOf(',') !== -1 ? ',' : ' ';
      transformValues = transform.split(splitter);
      translateLeft   = transformValues[0];

      if (transformValues[1].indexOf('scale') !== -1) {
        translateTop = transformValues[1].split('scale')[0];
      } else {
        translateTop = transformValues[1];
      }

      position.left   = getNumberFromString(translateLeft);
      position.top    = getNumberFromString(translateTop);

    }

    return position;

  };

  transform.getScale = function (transformStyle) {

    var transformValues,
        stringWithScale;

    if (transformStyle && transformStyle.indexOf('scale') !== -1) {

      transformValues = transformStyle.split('scale');

      if (transformValues[1].indexOf('rotate') !== -1) {
        stringWithScale = transformValues[1].split('rotate')[0];
      } else {
        stringWithScale = transformValues[1];
      }

      return getNumberFromString(stringWithScale);

    }

    return 1;
  };

  transform.getRotation = function (transformStyle) {

    var transformValues;

    if (transformStyle.indexOf('rotate') !== -1) {

      transformValues = transformStyle.split('rotate');

      return getNumberFromString(transformValues[1]);

    }

    return 0;
  };

  callback();

});