// TODO suggest rename (if we still need to use this file)
// It is too similar to utils.js which is confusing
sitecues.def('bp/helper', function (helper, callback) {
  'use strict';
  sitecues.use('platform', 'bp/constants', function(platform, BP_CONST) {
    /**
     *** Getters ***
     */

    var elementByIdCache = {};

    helper.byId = function (id) {
      var result = elementByIdCache[id];
      if (!result) {
        result = document.getElementById(id);
        elementByIdCache[id] = result;
      }
      return result;
    };

    helper.invalidateId = function (id) {
      elementByIdCache[id] = undefined;
    };

    /**
     * getRect returns the bounding client rect for the given element.
     * It copies the values because this gets around Safari issue with where values otherwise appear undefined.
     * @param element
     * @returns {Object} rectangle
     */
    helper.getRect = function(element) {
      var rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height
      };
    };

    /**
     * getRectById returns the bounding client rect for the given ID.
     * It copies the values because this gets around Safari issue with where values otherwise appear undefined.
     * @param id
     * @returns {Object} rectangle
     */
    helper.getRectById = function(id) {
      return helper.getRect(helper.byId(id));
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

    helper.isWebKit = platform.browser.isWebKit;

    helper.isSafari = platform.browser.isSafari;

    helper.isChrome = platform.browser.isChrome;

    helper.isMoz = platform.browser.isMoz;

    helper.isIE  = platform.browser.isIE;

    helper.isIE9 = platform.browser.isIE && platform.browser.version === 9;

    helper.getCurrentSVGElementTransforms = function () {

      var result      = {},
        byId        = helper.byId;

      function mapTranslate(id) {
        result[id] = {
          'translateX': helper.getNumberFromString(helper.byId(id).getAttribute('transform'))
        }
      }

      // Everything except slider
      mapTranslate(BP_CONST.SMALL_A_ID);
      mapTranslate(BP_CONST.LARGE_A_ID);
      mapTranslate(BP_CONST.SPEECH_ID);
      mapTranslate(BP_CONST.VERT_DIVIDER_ID);
      mapTranslate(BP_CONST.ZOOM_SLIDER_THUMB_ID);

      // Slider bar is special because it stretches

      var
        sliderBar   = byId(BP_CONST.ZOOM_SLIDER_BAR_ID),
        // translate(19) scale(.65, 1) -> ['translate(19)' , '(.65, 1)']
        sliderBarTransforms = sliderBar.getAttribute('transform').split('scale'),
        splitter            = sliderBarTransforms[1].indexOf(',') >= 0 ? ',' : ' ', // IE fix
        sliderBarScale      = sliderBarTransforms[1].split(splitter),
        sliderBarScaleX     = sliderBarScale[0],
        sliderBarScaleY     = sliderBarScale.length > 1 ? sliderBarScale[1] : sliderBarScaleX;

      result[BP_CONST.ZOOM_SLIDER_BAR_ID] = {
        'translateX': helper.getNumberFromString(sliderBarTransforms[0]),
        'scaleX'    : helper.getNumberFromString(sliderBarScaleX),
        'scaleY'    : helper.getNumberFromString(sliderBarScaleY)
      };

      return result;

    };

    helper.getNumberFromString = function (str) {
      return +(str.match(/[0-9\.\-]+/));
    };

    // Fix for events in SVG in IE:
    // IE sometimes gives us the <defs> element for the event, and we need the <use> element
    helper.getEventTarget = function(evt) {
      return evt.target.correspondingUseElement || evt.target;
    };

    callback();
  });
});