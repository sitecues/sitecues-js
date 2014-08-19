exports.initializeSize            = function () {};
exports.constrainHeightToSafeArea = function () {};
exports.constrainWidthToSafeArea  = function () {};
exports.limitWidth                = function () {};
exports.mitigateVerticalScroll    = function () {};
exports.addVerticalScroll         = function () {};
exports.fixOverflowWidth          = function () {};
exports.scaleRectFromCenter       = function () {
  return {
    'width' : 0,
    'height': 0,
    'left'  : 0,
    'right' : 0,
    'top'   : 0,
    'bottom': 0
  };
};
exports.constrainPosition         = function () {
  return {
    'x': 0,
    'y': 0
  };
};
exports.midPointDiff              = function () {
  return {
    'x': 0,
    'y': 0
  };
};