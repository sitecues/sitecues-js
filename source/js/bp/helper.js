// TODO suggest rename (if we still need to use this file)
// It is too similar to utils.js which is confusing
sitecues.def('bp/helper', function (helper, callback) {
  'use strict';
  sitecues.use('platform', 'bp/constants', function(platform, BP_CONST) {
    /**
     *** Getters ***
     */

    helper.byId = function (ID) {
      return document.getElementById(ID);
    };

    /**
     *** Setters ***
     */

    // Leave this method here rather than take it out to 'util/common' to avoid extra modules deps.
    // In the end, we only want to load badge on the page w/o any other modules.
    helper.setAttributes = function (element, attrs) {
      for (var attrName in attrs) {
        if (attrs.hasOwnProperty(attrName)) {
          element.setAttribute(attrName, attrs[attrName]);
        }
      }
    };

    helper.isWebkit = platform.browser.isWebkit;

    helper.isMoz = platform.browser.isMoz;

    helper.isIE  = platform.browser.isIE;

    helper.isIE9 = platform.browser.isIE && platform.browser.version === 9;

    helper.transformProperty = helper.isIE9 ? 'msTransform' : 'transform';

    helper.getCurrentSVGElementTransforms = function () {

      var result      = {},
          byId        = helper.byId,
          sliderBarId = BP_CONST.ZOOM_SLIDER_BAR_ID,
          smallAId    = BP_CONST.SMALL_A_ID,
          largeAId    = BP_CONST.LARGE_A_ID,
          speechId    = BP_CONST.SPEECH_ID,
          vertId      = BP_CONST.VERT_DIVIDER_ID,
          thumbId     = BP_CONST.ZOOM_SLIDER_THUMB_ID,

          // translate(19) scale(.65, 1) -> ['translate(19)' , '(.65, 1)']
          sliderBarTransforms = byId(sliderBarId).getAttribute('transform').split('scale'),
          splitter            = sliderBarTransforms[1].indexOf(',') >= 0 ? ',' : ' ', // IE fix
          sliderBarScale      = sliderBarTransforms[1].split(splitter),
          sliderBarScaleX     = sliderBarScale[0],
          sliderBarScaleY     = sliderBarScale.length > 1 ? sliderBarScale[1] : sliderBarScaleX;

      result[smallAId]    = {
        'translateX': helper.getNumberFromString(byId(smallAId).getAttribute('transform'))
      };

      result[largeAId]    = {
        'translateX': helper.getNumberFromString(byId(largeAId).getAttribute('transform'))
      };

      result[speechId]    = {
        'translateX': helper.getNumberFromString(byId(speechId).getAttribute('transform'))
      };

      result[vertId]      = {
        'translateX': helper.getNumberFromString(byId(vertId).getAttribute('transform'))
      };

      result[thumbId]     = {
        'translateX': helper.getNumberFromString(byId(thumbId).getAttribute('transform'))
      };

      result[sliderBarId] = {
        'translateX': helper.getNumberFromString(sliderBarTransforms[0]),
        'scaleX'    : helper.getNumberFromString(sliderBarScaleX),
        'scaleY'    : helper.getNumberFromString(sliderBarScaleY)
      };

      return result;

    };

    helper.getNumberFromString = function (str) {
      return +(str.replace(/[^0-9\.\-]+/g, ''));
    }

    callback();
  });
});