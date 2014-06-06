//require('./test/bootstrap');

// Require the module file we want to test.
var modulePath = '../../../source/js/mouse-highlight/traitcache';
var traitcache = require(modulePath);
require('./../data/modules/conf');

// Used by two of the tests
getComputedStyle = function() {
  return { borderTop: '3px' };
};

describe('traitcache', function() {
  describe('#getUniqueId()', function() {
    it('should provide a number.', function (done) {
      var divElement = document.createElement('div'),
        id = traitcache.getUniqueId(divElement);
      expect(typeof id).to.be.equal('number');
      done();
    });
    it('should always provide the same id for a given element.', function (done) {
      var divElement = document.createElement('div'),
        id = traitcache.getUniqueId(divElement),
        id2 = traitcache.getUniqueId(divElement);
      expect(id).to.be.equal(id2);
      done();
    });
    it('should provide different ids for different elements.', function (done) {
      var divElement = document.createElement('div'),
        divElement2 = document.createElement('div'),
        id = traitcache.getUniqueId(divElement),
        id2 = traitcache.getUniqueId(divElement2);
      expect(id).to.not.be.equal(id2);
      done();
    });
  });

  describe('#checkViewHasChanged()', function() {
    it('should store the view size parameters.', function (done) {
      traitcache.checkViewHasChanged();
      var viewSize = traitcache.getCachedViewSize();
      expect(viewSize.height).to.be.equal(window.innerHeight);
      expect(viewSize.width).to.be.equal(window.innerWidth);
      expect(viewSize.zoom).to.be.equal(conf.get('zoom'));
      done();
    });
  });

  describe('#getStyle()', function() {
    it('should return computed style.', function (done) {
      var divElement = document.createElement('div'),
        style,
        style2;

      style = traitcache.getStyle(divElement);
      style2 = getComputedStyle(divElement);
      expect(JSON.stringify(style)).to.be.equal(JSON.stringify(style2));
      style = traitcache.getStyle(divElement);
      expect(JSON.stringify(style)).to.be.equal(JSON.stringify(style2));
      done();
    });
  });
  describe('#getStyleProp()', function() {
    it('should return valid style properties.', function (done) {
      var divElement = document.createElement('div'),
        borderTop;

      borderTop = traitcache.getStyleProp(divElement, 'borderTop');
      expect(borderTop).to.be.equal('3px');
      borderTop = traitcache.getStyleProp(divElement, 'borderTop');
      expect(borderTop).to.be.equal('3px'); // Second iteration exercises caching mechanism
      done();
    });
  });
  describe('#getRect()', function() {
    it('should always return the correct rectangle.', function (done) {
      var divElement = document.createElement('div'),
        rect, rect2;
      divElement.getBoundingClientRect = function() {
        return { top: 1, left: 1, width: 1, height: 1, bottom: 2, right: 2 };
      }
      window.pageXOffset = 10;
      window.pageYOffset = 10;
      traitcache.checkViewHasChanged(); // Need to do this so getRect() can compute absolute cooordinates
      rect = traitcache.getRect(divElement);
      rect2 = traitcache.getRect(divElement);
      expect(rect.left).to.be.equal(11);
      expect(rect.top).to.be.equal(11);
      expect(rect.width).to.be.equal(1);
      expect(rect.height).to.be.equal(1);
      expect(rect.right).to.be.equal(12);
      expect(rect.bottom).to.be.equal(12);
      expect(rect).to.be.equal(rect2); // Tests caching mechanism
      done();
    });
  });
  describe('#getScreenRect()', function() {
    it('should always return the correct rectangle.', function (done) {
      var divElement = document.createElement('div'),
        rect, rect2;
      divElement.getBoundingClientRect = function () {
        return { top: 1, left: 1, width: 1, height: 1, bottom: 2, right: 2 };
      }
      window.pageXOffset = 10;
      window.pageYOffset = 10;
      traitcache.checkViewHasChanged(); // Need to do this so getRect() can compute absolute cooordinates
      rect = traitcache.getScreenRect(divElement);
      rect2 = traitcache.getScreenRect(divElement);
      expect(rect.left).to.be.equal(1);
      expect(rect.top).to.be.equal(1);
      expect(rect.width).to.be.equal(1);
      expect(rect.height).to.be.equal(1);
      expect(rect.right).to.be.equal(2);
      expect(rect.bottom).to.be.equal(2);
      expect(JSON.stringify(rect)).to.be.equal(JSON.stringify(rect2)); // Tests caching mechanism
      done();
    });
  });
  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
  });
});

