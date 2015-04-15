require('./test/bootstrap');

//// Require the module file we want to test.
var modulePath = '../../source/js/audio',
  audio, // Module
  platform = require('./data/modules/platform');

describe('audio', function() {
  beforeEach(function() {
    audio = require(modulePath);  // Start fresh each time so that we can test different platforms
  });
  afterEach(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
  });
});

