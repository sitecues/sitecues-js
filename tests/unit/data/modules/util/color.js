exports.isDarkColor = function(colorValue, optionalThreshold) {
  return false;
};

exports.isOnDarkBackground = function(current, optionalThreshold) {
  return false;
}

exports.getColorString = function(rgba) {
  return 'black';
};

exports.getRgbaIfLegalColor = function(color) {
  return {r: 0, g: 0, b: 0, a: 1 };
};

exports.getRgba = function(color) {
  return {r: 0, g: 0, b: 0, a: 1 };
};

// From http://www.w3.org/TR/2006/WD-WCAG20-20060427/complete.html#luminosity-contrastdef
exports.getLuminanceFromColorName = function(colorName) {
  return 0.5;
};

exports.getLuminance = function(rgb) {
  return 0.5;
};

exports.getContrastRatio = function(color1, color2) {
  return 5;
};

exports.rgbToHsl = function(r, g, b) {
  return { h: 0, s: 0, l: 0 };
};

// Get the current background color
exports.getDocumentBackgroundColor = function() {
  return {r: 255, g: 255, b: 255};
};
