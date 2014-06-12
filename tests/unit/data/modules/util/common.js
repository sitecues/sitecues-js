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
  'isVisualMedia': function(element) { return element.tagName === 'IMG'; },

  'isInSitecuesUI': function(element) { return element.id === 'sitecues-badge'; }
};