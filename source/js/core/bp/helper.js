// It is too similar to utils.js which is confusing
define(['core/platform', 'core/bp/constants'], function(platform, BP_CONST) {
  /**
   *** Getters ***
   */

  var elementByIdCache = {};

  function byId(id) {
    var result = elementByIdCache[id];
    if (!result) {
      result = document.getElementById(id);
      elementByIdCache[id] = result;
    }
    return result;
  }

  function invalidateId(id) {
    elementByIdCache[id] = undefined;
  }

  /**
   * getRect returns the bounding client rect for the given element.
   * It copies the values because this gets around Safari issue with where values otherwise appear undefined.
   * @param element
   * @returns {Object} rectangle
   */
  function getRect(element) {
    var rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * getRectById returns the bounding client rect for the given ID.
   * It copies the values because this gets around Safari issue with where values otherwise appear undefined.
   * @param id
   * @returns {Object} rectangle
   */
  function getRectById(id) {
    return getRect(byId(id));
  }

  /**
   *** Setters ***
   */

  // Leave this method here rather than take it out to 'util / common' to avoid extra modules deps.
  // In the end, we only want to load badge on the page w/o any other modules.
  function setAttributes(element, attrs) {
    for (var attrName in attrs) {
      if (attrs.hasOwnProperty(attrName)) {
        element.setAttribute(attrName, attrs[attrName]);
      }
    }
  }

  function getCurrentSVGElementTransforms() {

    var result = {};

    function mapTranslate(id) {
      var transformAttrValue = byId(id).getAttribute('transform') || '';
      result[id] = {
        'translateX': getNumberFromString(transformAttrValue) || 0
      };
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
      'translateX':getNumberFromString(sliderBarTransforms[0]),
      'scaleX'    :getNumberFromString(sliderBarScaleX),
      'scaleY'    :getNumberFromString(sliderBarScaleY)
    };

    return result;
  }

  function getNumberFromString(str) {
    return +(str.match(/[0-9\.\-]+/));
  }

  // Fix for events in SVG in IE:
  // IE sometimes gives us the <defs> element for the event, and we need the <use> element
  function getEventTarget(evt) {
    return evt.target.correspondingUseElement || evt.target;
  }

  function cancelEvent(evt) {
    evt.returnValue = false;
    evt.preventDefault();
    evt.stopImmediatePropagation();
    evt.stopPropagation();
    return false;
  }

  return {
    byId: byId,
    invalidateId: invalidateId,
    getRect: getRect,
    getRectById: getRectById,
    setAttributes: setAttributes,
    getCurrentSVGElementTransforms: getCurrentSVGElementTransforms,
    getNumberFromString: getNumberFromString,
    getEventTarget: getEventTarget,
    cancelEvent: cancelEvent
  };

});
