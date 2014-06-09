//require('./test/bootstrap');

var modulePath = '../../../source/js/mouse-highlight/traits',
  traits = require(modulePath);

// If we want to use the file system

describe('traits', function() {
  describe('#getTraitStack', function() {
    it('should return an array of traits with correct length.', function(done) {
      // Prepare objects for test
      var nodes = [
          document.createElement('span'),
          document.createElement('p'),
          document.createElement('li'),
          document.createElement('ol')
        ],
        traitStack = traits.getTraitStack(nodes);
        expect(traitStack.length).to.be.equal(nodes.length);
      done();
    });
    it('should return an the traits results.', function(done) {
      // Prepare objects for test
      var nodes = [
          document.createElement('span'),
          document.createElement('p'),
          document.createElement('li'),
          document.createElement('ol')
        ],
        traitStack = traits.getTraitStack(nodes);
      expect(traitStack.length).to.be.equal(nodes.length);
      done();
    });
  });
  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
  });
});

fs.readFile('./data/html/test-page.html', 'utf8', function(err, file) {
  page = file;

});
