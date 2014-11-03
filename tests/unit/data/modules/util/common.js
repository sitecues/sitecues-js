exports.hasVertScroll = function () {};
exports.isEmptyBgImage = function (backgroundImageStyle) {
  if (backgroundImageStyle) {
    return false;
  } else {
    return true;
  }
};
exports.getElementComputedStyles = function () { return true; };
exports.isVisualMedia = function(selector) { return jquery(selector).is('img'); };
exports.isInSitecuesUI = function(element) { return element.id === 'sitecues-badge'; };
exports.isFormControl = function(selector) { return jquery(selector).is('input'); };
/*
 * Check if two Javascript objects are equal.
 * @param {type} obj1
 * @param {type} obj2
 * @returns {unresolved}
 */
exports.equals = function(obj1, obj2) {
  function _equals(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(jquery.extend(true, {}, obj1, obj2));
  }
  return _equals(obj1, obj2) && _equals(obj2, obj1);
};

exports.isEditable = function(element) {
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
}
exports.useJqueryAnimate = false;

exports.hasVisibleContent = function(node) {
  return true;
}

exports.isVisualRegion = function(node, style, parentStyle) {
  return parseFloat(style.borderRightWidth) || parseFloat(style.borderBottomWidth);
}

exports.hasOwnBackground = function(style, parentStyle) {
  var hasOwn = (style.backgroundImage && style.backgroundImage !== 'none') ||
    (style.backgroundColor && parentStyle.backgroundColor !== style.backgroundColor);
  return !!hasOwn;
}

exports.hasRaisedZIndex = function(style, parentStyle) {
  return false;
}

exports.getBulletWidth = function() { return 0; }