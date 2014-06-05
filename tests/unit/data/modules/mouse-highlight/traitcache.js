traitcache = {
  getCachedViewSize: function() {
  },
  getStyle: function(node) {
    return window.getComputedStyle(node);
  },
  getRect: function(node) {
    var rect = {
      left: parseFloat(node.getAttribute('data-left')),
      top: parseFloat(node.getAttribute('data-top')),
      width: parseFloat(node.getAttribute('data-width')),
      height: parseFloat(node.getAttribute('data-height'))
    };
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;
    return rect;
  }
};
