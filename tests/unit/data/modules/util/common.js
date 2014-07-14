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