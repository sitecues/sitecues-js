// Require the module file we want to test.
var modulePath = '../../../source/js/mouse-highlight/pick';
var pick = require(modulePath);

describe('pick', function() {
  describe('#find()', function() {
    it('abc.', function (done) {
//      var traitStack = [ ];
//      var divElement = document.createElement('div');
      done();
    });
  });
  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
  });
});

