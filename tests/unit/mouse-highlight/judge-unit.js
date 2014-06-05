//require('./test/bootstrap');

// Require the module file we want to test.
var modulePath = '../../../source/js/mouse-highlight/judge';
var judge = require(modulePath);

describe('judge', function() {
  describe('#getJudgementStack()', function() {
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

