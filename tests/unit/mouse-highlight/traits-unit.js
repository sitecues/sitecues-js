//require('./test/bootstrap');

var modulePath = '../../../source/js/mouse-highlight/traits',
  traits = require(modulePath),
  fs = require('fs'),
  NUMBER_OF_NODES = 5;

// If we want to use the file system

fs.readFile('./data/html/test-picker.html', 'utf8', function(err, page) {
  var nodes = [];
  describe('traits', function() {
    before(function() {
      function addToDom(html, callback) {
        var jsdom = require('jsdom');
        jsdom.env({
          html: html,
          scripts: [],
          done: function(errors, window) {
            //console.log('abc ' + jquery(win.document).find('div')[0].innerHTML);
            callback(window);
          }
        });
      }

      var oldhtml = fs.readFileSync('./data/html/test-picker.html');
      addToDom(oldhtml, function(win) {
        var node, count = 0;
        while (count < NUMBER_OF_NODES) {
          node = jquery(win.document).find('#' + count)[0];
          nodes[count] = node;
          ++ count;
        }
      });
    });
    describe('#getTraitStack', function() {
      it('should return an array of traits with correct length.', function(done) {
        var traitStack = traits.getTraitStack(nodes);
        expect(traitStack.length).to.be.equal(NUMBER_OF_NODES);
        done();
      });
//      it('should return the correct |tag| trait for each node.', function(done) {
//        var traitStack = traits.getTraitStack(nodes);
//        expect(traitStack[1].tag).to.be.equal('p');
//        done();
//      });
    });
    after(function() {
      // Unload module from nodejs's cache
      var name = require.resolve(modulePath);
      delete require.cache[name];
    });
  });
});

