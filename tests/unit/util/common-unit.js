require('../test/bootstrap');

//// Require the module file we want to test.
var modulePath = '../../../source/js/util/common',
  common = require(modulePath);  // Start fresh each time so that we can test different platforms

describe('common', function() {
  describe('#isVisualMedia()', function() {
    it('should return true for img', function(done) {
      var node = document.createElement('img'),
        isVisualMedia  = common.isVisualMedia(node);
      expect(isVisualMedia).to.be.equal(true);
      done();
    });
    it('should return true for canvas', function(done) {
      var node = document.createElement('canvas'),
        isVisualMedia  = common.isVisualMedia(node);
      expect(isVisualMedia).to.be.equal(true);
      done();
    });
    it('should return true for video', function(done) {
      var node = document.createElement('video'),
        isVisualMedia  = common.isVisualMedia(node);
      expect(isVisualMedia).to.be.equal(true);
      done();
    });
    it('should return false for div', function(done) {
      var node = document.createElement('div'),
        isVisualMedia  = common.isVisualMedia(node);
      expect(isVisualMedia).to.be.equal(false);
      done();
    });
  });
  describe('#isFormControl()', function() {
    it('should return false for img', function(done) {
      var node = document.createElement('img'),
        isFormControl  = common.isFormControl(node);
      expect(isFormControl).to.be.equal(false);
      done();
    });
    it('should return true for input', function(done) {
      var node = document.createElement('input'),
        isFormControl  = common.isFormControl(node);
      expect(isFormControl).to.be.equal(true);
      done();
    });
    it('should return true for textarea', function(done) {
      var node = document.createElement('textarea'),
        isFormControl  = common.isFormControl(node);
      expect(isFormControl).to.be.equal(true);
      done();
    });
    it('should return false for select', function(done) {
      var node = document.createElement('select'),
        isFormControl  = common.isFormControl(node);
      expect(isFormControl).to.be.equal(true);
      done();
    });
    it('should return false for button', function(done) {
      var node = document.createElement('button'),
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

