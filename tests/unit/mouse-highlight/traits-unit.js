var modulePath = '../../../source/js/mouse-highlight/traits',
  traits = require(modulePath),
  fs = require('fs'),
  NUMBER_OF_NODES = 5;

// If we want to use the file system

var nodes = [];

describe('traits', function() {
  before(function() {
    function addToDom(html, callback) {
      var jsdom = require('jsdom');
      jsdom.env({
        html: html,
        scripts: [],
        done: function(errors, window) {
          callback(window);
        }
      });
    }

    function fixNode(node) {
      if (node.nodeType !== 1 /* Element */) {
        return node;
      }

      // Fix localName
      node = jquery.extend({}, node, { localName: node.tagName.toLowerCase() });
      node.localName = node.tagName.toLowerCase();

      // Fix childCount and childElementCount
      var childNodes = node.childNodes,
        index, numChildren, numElementChildren;
      if (!childNodes) {
        return;
      }

      index = 0;
      numChildren = childNodes.length;
      numElementChildren = 0;

      node.childCount = numChildren;
      for (; index < numChildren; index ++) {
        if (childNodes[index].nodeType === 1 /* Element */) {
          ++ numElementChildren;
        }
      }
      node.childElementCount = numElementChildren;
      return node;
    }

    var oldhtml = fs.readFileSync('./data/html/test-picker.html');
    addToDom(oldhtml, function(win) {
      var node, count = 0;
      while (count < NUMBER_OF_NODES) {
        node = jquery(win.document).find('#' + count)[0];
        nodes[count] = fixNode(node);
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
    it('should return the correct |tag| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes);
      expect(traitStack[1].tag).to.be.equal('p');
      done();
    });
    it('should return the correct |childCount| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes);
      expect(traitStack[2].childCount).to.be.equal(3);
      done();
    });
//      it('should return |isVisualMedia=true| for images.', function(done) {
//        var traitStack = traits.getTraitStack(nodes);
//        expect(traitStack[0].isVisualMedia).to.be.equal(true);
//        done();
//      });
//      it('should return |isVisualMedia=false| for paragraphs.', function(done) {
//        var traitStack = traits.getTraitStack(nodes);
//        expect(traitStack[1].isVisualMedia).to.be.equal(false);
//        done();
//      });
    it('should return the correct |role| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes);
      expect(traitStack[4].role).to.be.equal('region');
      done();
    });
    it('should return the correct |rect| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes),
        EXPECTED_RECT = '{"top":200,"left":100,"width":10000,"height":20000,"right":10100,"bottom":20200}';
      expect(JSON.stringify(traitStack[4].rect)).to.be.equal(EXPECTED_RECT);
      done();
    });
    it('should return the correct |unzoomedRect| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes),
        EXPECTED_RECT = '{"width":5000,"height":10000,"top":100,"bottom":10100,"left":50,"right":5050}';
      expect(JSON.stringify(traitStack[4].unzoomedRect)).to.be.equal(EXPECTED_RECT);
      done();
    });
    it('should return the correct |topPadding| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes);
      expect(traitStack[2].topPadding).to.be.equal(5);
      done();
    });
    it('should return the correct |leftBorder| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes);
      expect(traitStack[2].leftBorder).to.be.equal(4);
      done();
    });
    it('should return the correct |rightMargin| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes);
      expect(traitStack[2].rightMargin).to.be.equal(3);
      done();
    });
    it('should return the correct |visualWidth| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes);
      expect(traitStack[1].visualWidth).to.be.equal(6);
      done();
    });
    it('should return the correct |percentOfViewportWidth| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes),
        VISUAL_WIDTH = 6,
        VIEWPORT_WIDTH = 1000,
        EXPECTED_PERCENT_OF_VIEWPORT_WIDTH = (VISUAL_WIDTH / VIEWPORT_WIDTH) * 100
      expect(traitStack[1].percentOfViewportWidth).to.be.equal(EXPECTED_PERCENT_OF_VIEWPORT_WIDTH);
      done();
    });
  });
  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
  });
});


