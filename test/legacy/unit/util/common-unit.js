require('../test/bootstrap');

//// Require the module file we want to test.
var modulePath = '../../../source/js/util/common',
  common = require(modulePath);  // Start fresh each time so that we can test different platforms

function createElement(tagName) {
  var node = document.createElement(tagName);
  // ---- Fix localName (bug in mocha) ----
  Object.defineProperty(node, 'localName', {
    value: tagName
  });

  return node;
}

describe('common', function() {
  describe('#isVisualMedia()', function() {
    it('should return true for img', function(done) {
      var node = createElement('img'),
        isVisualMedia  = common.isVisualMedia(node);
      expect(isVisualMedia).to.be.equal(true);
      done();
    });
    it('should return true for canvas', function(done) {
      var node = createElement('canvas'),
        isVisualMedia  = common.isVisualMedia(node);
      expect(isVisualMedia).to.be.equal(true);
      done();
    });
    it('should return true for video', function(done) {
      var node = createElement('video'),
        isVisualMedia  = common.isVisualMedia(node);
      expect(isVisualMedia).to.be.equal(true);
      done();
    });
    it('should return true for audio', function(done) {
      var node = createElement('audio'),
        isVisualMedia  = common.isVisualMedia(node);
      expect(isVisualMedia).to.be.equal(true);
      done();
    });
    it('should return false for div', function(done) {
      var node = createElement('div'),
        isVisualMedia  = common.isVisualMedia(node);
      expect(isVisualMedia).to.be.equal(false);
      done();
    });
  });
  describe('#isSpacebarConsumer()', function() {
    it('should return true for video', function(done) {
      var node = createElement('video'),
        isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return true for textarea', function(done) {
      var node = createElement('textarea'),
        isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return true for input', function(done) {
      var node = createElement('input'),
        isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return true for button', function(done) {
      var node = createElement('button'),
        isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return true for document with designMode', function(done) {
      Object.defineProperty(document, 'designMode', {
        value: 'on',
        writable: true
      });
      var node = createElement('div'),
        isSpacebarConsumer;
      isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);

      document.designMode = undefined;

      done();
    });
    it('should return false for div without contenteditable', function(done) {
      var node = createElement('div'),
        isSpacebarConsumer  = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(false);
      done();
    });
    it('should return false for div with contenteditable="false"', function(done) {
      var node = createElement('div'),
        isSpacebarConsumer  = common.isSpacebarConsumer(node);
      node.setAttribute('contenteditable', 'false');
      expect(isSpacebarConsumer).to.be.equal(false);
      done();
    });
    it('should return true for div with contenteditable="true"', function(done) {
      var node = createElement('div'),
        isSpacebarConsumer;
      node.setAttribute('contenteditable', 'true');
      isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return true for div with contenteditable=""', function(done) {
      var node = createElement('div'),
        isSpacebarConsumer;
      node.setAttribute('contenteditable', '');
      isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return true for div with contenteditable=""', function(done) {
      var node = createElement('div'),
        isSpacebarConsumer;
      node.setAttribute('contenteditable', '');
      isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return true for embed', function(done) {
      var node = createElement('embed'),
        isSpacebarConsumer;
      isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return true for object', function(done) {
      var node = createElement('object'),
        isSpacebarConsumer;
      isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return true for iframe', function(done) {
      var node = createElement('iframe'),
        isSpacebarConsumer;
      isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return true for frame', function(done) {
      var node = createElement('frame'),
        isSpacebarConsumer;
      isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return false for text node', function(done) {
      var node = document.createTextNode('text'),
        isSpacebarConsumer;
      isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(false);
      done();
    });
    it('should return true for element with tabindex', function(done) {
      var node = createElement('span'),
        isSpacebarConsumer;
      node.setAttribute('tabindex', '0');
      isSpacebarConsumer = common.isSpacebarConsumer(node);
      expect(isSpacebarConsumer).to.be.equal(true);
      done();
    });
    it('should return false for body', function(done) {
      var isSpacebarConsumer = common.isSpacebarConsumer(document.body);
      expect(isSpacebarConsumer).to.be.equal(false);
      done();
    });
  });
  describe('#isEditable()', function() {
    it('should return true for textarea', function(done) {
      var node = createElement('textarea'),
        isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(true);
      done();
    });
    it('should return true for input with no type', function(done) {
      var node = createElement('input'),
        isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(true);
      done();
    });
    it('should return true for input with type=text', function(done) {
      var node = createElement('input'),
        isEditable;
      node.setAttribute('type', 'text');
      isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(true);
      done();
    });
    it('should return true for input with type=url', function(done) {
      var node = createElement('input'),
        isEditable;
      node.setAttribute('type', 'url');
      isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(true);
      done();
    });
    it('should return false for input with type=button', function(done) {
      var node = createElement('input'),
        isEditable;
      node.setAttribute('type', 'button');
      isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(false);
      done();
    });
    it('should return false for input with type=checkbox', function(done) {
      var node = createElement('input'),
        isEditable;
      node.setAttribute('type', 'checkbox');
      isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(false);
      done();
    });
    it('should return false for input with type=radio', function(done) {
      var node = createElement('input'),
        isEditable;
      node.setAttribute('type', 'radio');
      isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(false);
      done();
    });
    it('should return false for button', function(done) {
      var node = createElement('button'),
        isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(false);
      done();
    });
    it('should return true for document with designMode', function(done) {
      Object.defineProperty(document, 'designMode', {
        value: 'on',
        writable: true
      });
      var node = createElement('div'),
        isEditable;
      isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(true);

      document.designMode = undefined;

      done();
    });
    it('should return false for div without contenteditable', function(done) {
      var node = createElement('div'),
        isEditable  = common.isEditable(node);
      expect(isEditable).to.be.equal(false);
      done();
    });
    it('should return false for div with contenteditable="false"', function(done) {
      var node = createElement('div'),
        isEditable  = common.isEditable(node);
      node.setAttribute('contenteditable', 'false');
      expect(isEditable).to.be.equal(false);
      done();
    });
    it('should return true for div with contenteditable="true"', function(done) {
      var node = createElement('div'),
        isEditable;
      node.setAttribute('contenteditable', 'true');
      isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(true);
      done();
    });
    it('should return true for div with contenteditable=""', function(done) {
      var node = createElement('div'),
        isEditable;
      node.setAttribute('contenteditable', '');
      isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(true);
      done();
    });
    it('should return true for div with contenteditable=""', function(done) {
      var node = createElement('div'),
        isEditable;
      node.setAttribute('contenteditable', '');
      isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(true);
      done();
    });
    it('should return false for text node', function(done) {
      var node = document.createTextNode('text'),
        isEditable;
      isEditable = common.isEditable(node);
      expect(isEditable).to.be.equal(false);
      done();
    });
  });
  describe('#isFormControl()', function() {
    it('should return false for img', function(done) {
      var node = createElement('img'),
        isFormControl  = common.isFormControl(node);
      expect(isFormControl).to.be.equal(false);
      done();
    });
    it('should return true for input', function(done) {
      var node = createElement('input'),
        isFormControl  = common.isFormControl(node);
      expect(isFormControl).to.be.equal(true);
      done();
    });
    it('should return true for textarea', function(done) {
      var node = createElement('textarea'),
        isFormControl  = common.isFormControl(node);
      expect(isFormControl).to.be.equal(true);
      done();
    });
    it('should return false for select', function(done) {
      var node = createElement('select'),
        isFormControl  = common.isFormControl(node);
      expect(isFormControl).to.be.equal(true);
      done();
    });
    it('should return false for button', function(done) {
      var node = createElement('button'),
        isFormControl  = common.isFormControl(node);
      expect(isFormControl).to.be.equal(true);
      done();
    });
  });
  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
  });
});

