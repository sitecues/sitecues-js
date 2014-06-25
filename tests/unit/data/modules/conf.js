conf = {
  'get': function(prop) {
    if (prop === 'zoom') {
      return 1.5;  // Needs to be a number
    }
    return 'test';
  },
  'set': function () {
    return 'test';
  },
  'data': function () {
    return 'test';
  }
};

console.log('Conf Loaded');