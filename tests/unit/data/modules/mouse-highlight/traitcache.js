var FAKE_VIEW_SIZE = {
  height: 1000,
  width: 1200,
  zoom: 2
};

var FAKE_VIEW_POSITION = {
  x: 100,
  y: 200
};

var DEFAULT_FAKE_STYLES =
  'margin-left: 1px; margin-top: 2px; margin-right: 3px; margin-bottom: 4px;' +
  'border-left-width: 1px; border-top-width: 3px; border-right-width: 5px; border-bottom-width: 7px;' +
  'padding-left: 4px; padding-top: 2px; padding-right: 3px; padding-bottom: 1px;';

traitcache = {
  'updateCachedView': function () {},
  'getCachedViewSize': function() {
    return FAKE_VIEW_SIZE;
  },
  'getStyle': function(node) {
    var style = {},
      fakeStyleData = node.getAttribute('style'),
      fakeStylesFromDataAttribute = fakeStyleData ? fakeStyleData.split(';') : [];

    function camelize(a, b) {
      return b.toUpperCase();
    }

    // Add fake style to set
    function addFakeStyle(fakeStyleText) {
      if (!fakeStyleText) {
        return;
      }
      var styleTextItems = fakeStyleText.split(':'),
        propName = styleTextItems[0].trim(),
        camelizedName,
        value = styleTextItems[1].trim();
      style[propName] = value;
      propName.indexOf('-');
      camelizedName = propName.replace(/\-([a-z])/g, camelize);
      style[camelizedName] = value;
    }

    DEFAULT_FAKE_STYLES.split(';').forEach(addFakeStyle);
    fakeStylesFromDataAttribute.forEach(addFakeStyle);  // Will override defaults

    return style;
  },
  'getStyleProp': function(element, propName) {
    return this.getStyle(element)[propName];
  },
  'getScreenRect': function(element) {
    var rect = {
      top: parseInt(element.getAttribute('top')),
      left: parseInt(element.getAttribute('left')),
      width: parseInt(element.getAttribute('width')),
      height: parseInt(element.getAttribute('height'))
    };
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;
    return rect;
  },
  'getRect': function(element) {
    var rect = {
      top: parseInt(element.getAttribute('top')) + FAKE_VIEW_POSITION.y,
      left: parseInt(element.getAttribute('left')) + FAKE_VIEW_POSITION.x,
      width: parseInt(element.getAttribute('width')),
      height: parseInt(element.getAttribute('height'))
    };
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;
    return rect;
  },
  'getUniqueId': function(element) {
    return parseInt(element.id);
  }
};
