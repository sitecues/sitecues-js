exports.get = function(prop) {
  if (prop === 'zoom') {
    return 1.5;  // Needs to be a number
  }
  return 'test';
};
exports.set = function () {
  return 'test';
};
exports.data = function () {
  return 'test';
};
console.log('Conf Loaded');