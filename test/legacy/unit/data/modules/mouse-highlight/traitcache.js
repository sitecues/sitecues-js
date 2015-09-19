/* global traitcache: true */

var FAKE_VIEW_SIZE = {
  height: 500,
  width: 1000,
  zoom: 2
};

var FAKE_VIEW_POSITION = {
  x: 100,
  y: 200
};

var DEFAULT_FAKE_STYLES =
  'margin-left: 2px; margin-top: 2px; margin-right: 2px; margin-bottom: 2px;' +
  'border-left-width: 1px; border-top-width: 1px; border-right-width: 1px; border-bottom-width: 1px;' +
  'padding-left: 3px; padding-top: 3px; padding-right: 3px; padding-bottom: 3px;';

var traitcache = {
  "resetCache": function () {},
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
      top: parseInt(element.getAttribute('data-top')),
      left: parseInt(element.getAttribute('data-left')),
      width: parseInt(element.getAttribute('data-width')),
      height: parseInt(element.getAttribute('data-height'))
    };
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;
    return rect;
  },
  'getRect': function(element) {
    var rect = {
      top: parseInt(element.getAttribute('data-top')) + FAKE_VIEW_POSITION.y,
      left: parseInt(element.getAttribute('data-left')) + FAKE_VIEW_POSITION.x,
      width: parseInt(element.getAttribute('data-width')),
      height: parseInt(element.getAttribute('data-height'))
    };
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;
    return rect;
  },
  'getUniqueId': function(element) {
    return parseInt(element.id);
  },
  'isHidden': function(element) {
    return false;
  }
};

for (var prop in traitcache) {
  if (traitcache.hasOwnProperty(prop)) {
    exports[prop] = traitcache[prop];
  }
}
