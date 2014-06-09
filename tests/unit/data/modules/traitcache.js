FAKE_VIEW_SIZE = {
  height: 1000,
  width: 1200,
  zoom: 2
};

FAKE_VIEW_POSITION = {
  x: 100,
  y: 200
};

traitcache = {
  updateCachedView: function () {},
  getCachedViewsize: function() {
      return FAKE_VIEW_SIZE;
    }
  },
  getStyle: function(node) {
    var style = {},
      fakeStyles = node.getAttribute('data-style').split(';');

    function camelize(a, b) {
      return b.toUpperCase();
    }

    function addFakeStyle(fakeStyleText) {
      var styleTextItems = fakeStyleText.split(':'),
        propName = styleTextItems[0],
        camelizedName,
        value = styleTextItems[1];
      style[propName] = value;
      propName.indexOf('-');
      camelizedName = propName.replace(/\-([a-z])/g, camelize);
      style[camelizedName] = value;
    }

    fakeStyles.forEach(addFakeStyle);
    return style;
  },
  getStyleProp: function(element, propName) {
  },
  getScreenRect: function(element) {
  },
  getRect: function(element) {
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
  getUniqueId: function(element) {
    return parseInt(element.id);
  }
}