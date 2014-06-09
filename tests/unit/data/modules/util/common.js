common = {
  'isEmptyBgImage': function (backgroundImageStyle) {
    if (backgroundImageStyle) {
      return false;
    } else {
      return true;
    }
  },
  'getElementComputedStyles': function () {
    return true;
  },
  'isVisualMedia': function(element) { return element.localName === 'img' || element.localName === 'canvas'; }
};