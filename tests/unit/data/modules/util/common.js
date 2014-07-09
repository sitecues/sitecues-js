exports.hasVertScroll = function () {};
exports.isEmptyBgImage = function (backgroundImageStyle) {
  if (backgroundImageStyle) {
    return false;
  } else {
    return true;
  }
};
exports.getElementComputedStyles = function () { return true; };
exports.isVisualMedia = function(element) { return element.tagName === 'IMG'; };
exports.isInSitecuesUI = function(element) { return element.id === 'sitecues-badge'; };
exports.isFormControl = function(element) { return element.tagName === 'INPUT' };
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
