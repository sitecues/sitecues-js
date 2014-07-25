var modulePath = '../../../source/js/mouse-highlight/traits',
  traits = require(modulePath),
  nodes = [],
  win;


require('../test/domutils');

// If we want to use the file system


describe('traits', function() {
  before(function() {
    function serializeNodeStack(start) {
      while (start !== win.document.body) {
        nodes.push(start);
        start = start.parentNode;
      }
    }

    domutils.loadHtml('./data/html/test-traits.html', function(newWindow) {
      win = newWindow;
      serializeNodeStack(win.document.getElementById('0'));
    });
  });
  describe('#getTraitStack', function() {
    it('should return an array of traits with correct length.', function(done) {
      var traitStack = traits.getTraitStack(nodes);
      expect(traitStack.length).to.be.equal(nodes.length);
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
    it('should return |isVisualMedia=true| for images.', function(done) {
      var traitStack = traits.getTraitStack(nodes);
      expect(traitStack[0].isVisualMedia).to.be.equal(true);
      done();
    });
    it('should return |isVisualMedia=false| for paragraphs.', function(done) {
      var traitStack = traits.getTraitStack(nodes);
      expect(traitStack[1].isVisualMedia).to.be.equal(false);
      done();
    });
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
        EXPECTED_PERCENT_OF_VIEWPORT_WIDTH = (VISUAL_WIDTH / VIEWPORT_WIDTH) * 100;
      expect(traitStack[1].percentOfViewportWidth).to.be.equal(EXPECTED_PERCENT_OF_VIEWPORT_WIDTH);
      done();
    });
    it('should return the correct |percentOfBodyWidth| trait for each node.', function(done) {
      var traitStack = traits.getTraitStack(nodes),
        EXPECTED_PERCENT_OF_BODY_WIDTH = 10;
      // Body width is hard coded in highlight-position mock as 100, node#1 is 10px wide,
      // therefore we expect the result to be 10% of the body width.
      expect(traitStack[1].percentOfBodyWidth).to.be.equal(EXPECTED_PERCENT_OF_BODY_WIDTH);
      done();
    });
  });
  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
  });
});


