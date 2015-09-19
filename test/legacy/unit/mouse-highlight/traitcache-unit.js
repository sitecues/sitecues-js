// Require the module file we want to test.
var modulePath = '../../../source/js/mouse-highlight/traitcache';
var traitcache = require(modulePath);
var conf = require('../data/modules/conf');
// manually create and restore the sandbox
var sandbox;

describe('traitcache', function() {
  beforeEach(function() {
    // Override getComputedStyle() for tests
    sandbox = sinon.sandbox.create();
    sandbox.stub(window, 'getComputedStyle', function(element) {
            return element.tagName === 'DIV' ? {'borderTop': '3px'} : {'borderTop': '5px'};
          });
  });
  describe('#getUniqueId()', function() {
    it('should provide a unique ID number for a given HTML element.', function (done) {
      var divElement = document.createElement('div'),
        id = traitcache.getUniqueId(divElement);
      expect(typeof id).to.be.equal('number');
      done();
    });
    it('should always provide the same id for the same given HTML element.', function (done) {
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

  describe('#resetCache()', function() {
    it('should store the view size parameters.', function (done) {
      traitcache.resetCache();
      var viewSize = traitcache.getCachedViewSize();
      expect(viewSize.height).to.be.equal(window.innerHeight);
      expect(viewSize.width).to.be.equal(window.innerWidth);
      expect(viewSize.zoom).to.be.equal(conf.get('zoom'));
      done();
    });
  });

  describe('#getStyle()', function() {
    it('should return computed style for HTML element.', function (done) {
      var divElement = document.createElement('div'),
        actualStyle, expectedStyle;

      actualStyle = traitcache.getStyle(divElement);
      expectedStyle = { 'borderTop': '3px' };
      expect(JSON.stringify(actualStyle)).to.be.equal(JSON.stringify(expectedStyle));
      done();
    });
    it('should return same result when retrieving from cache.', function (done) {
      var divElement = document.createElement('div'),
        fetchedStyle, fetchedCachedStyle;

      fetchedStyle = traitcache.getStyle(divElement);
      fetchedCachedStyle = traitcache.getStyle(divElement);  // Second call will exercise cache
      expect(JSON.stringify(fetchedCachedStyle)).to.be.equal(JSON.stringify(fetchedStyle));
      done();
    });
  });
  describe('#getStyleProp()', function() {
    it('should return valid style properties for HTML element.', function (done) {
      var divElement = document.createElement('div'),
        borderTop;

      borderTop = traitcache.getStyleProp(divElement, 'borderTop');
      expect(borderTop).to.be.equal('3px');
      done();
    });
    it('should return correct style property for second HTML element queried.', function (done) {
      var divElement = document.createElement('div'),
        pElement = document.createElement('p'),
        borderTopP;

      traitcache.getStyleProp(divElement, 'borderTop');
      borderTopP = traitcache.getStyleProp(pElement, 'borderTop');

      expect(borderTopP).to.be.equal('5px');
      done();
    });
    it('should return same result when retrieving from cache.', function (done) {
      var divElement = document.createElement('div'),
        borderTop = traitcache.getStyleProp(divElement, 'borderTop'),
        borderTopFromCache = traitcache.getStyleProp(divElement, 'borderTop');

      expect(borderTopFromCache).to.be.equal(borderTop); // Second iteration exercises caching mechanism
      done();
    });
  });
  describe('#getRect()', function() {
    it('should return the correct rectangle for HTML element, in document-relative coordinates.', function (done) {
      var divElement = document.createElement('div'),
        actualRect,
        FAKE_RECT = { top: 1, left: 1, width: 1, height: 1, bottom: 2, right: 2 },
        FAKE_SCROLL_X = 10,
        FAKE_SCROLL_Y = 10;
      divElement.getBoundingClientRect = function() {
        return FAKE_RECT;
      };
      window.pageXOffset = FAKE_SCROLL_X;
      window.pageYOffset = FAKE_SCROLL_Y;
      traitcache.resetCache(); // Initialization necessary
      actualRect = traitcache.getRect(divElement);
      expect(actualRect.left).to.be.equal(FAKE_RECT.left + FAKE_SCROLL_X);
      expect(actualRect.top).to.be.equal(FAKE_RECT.top + FAKE_SCROLL_Y);
      expect(actualRect.width).to.be.equal(FAKE_RECT.width);
      expect(actualRect.height).to.be.equal(FAKE_RECT.height);
      expect(actualRect.right).to.be.equal(FAKE_RECT.right + FAKE_SCROLL_X);
      expect(actualRect.bottom).to.be.equal(FAKE_RECT.bottom + FAKE_SCROLL_Y);
      done();
    });
  });
  describe('#getScreenRect()', function() {
    it('should return the correct rectangle, in screen-relative coordinates.', function (done) {
      var divElement = document.createElement('div'),
        actualRect,
        FAKE_RECT = { top: 1, left: 1, width: 1, height: 1, bottom: 2, right: 2 },
        FAKE_SCROLL_X = 10,
        FAKE_SCROLL_Y = 10;

      // Prepare objects for testing
      divElement.getBoundingClientRect = function () {
        return FAKE_RECT;
      };
      window.pageXOffset = FAKE_SCROLL_X;
      window.pageYOffset = FAKE_SCROLL_Y;

      traitcache.resetCache(); // Necessary initialization
      actualRect = traitcache.getScreenRect(divElement);
      expect(JSON.stringify(actualRect)).to.be.equal(JSON.stringify(FAKE_RECT));
      done();
    });
    it('should return the same results when retrieved from cache.', function (done) {
      var divElement = document.createElement('div'),
        fetchedRect, fetchedCachedRect,
        FAKE_RECT = { top: 1, left: 1, width: 1, height: 1, bottom: 2, right: 2 },
        FAKE_SCROLL_X = 10,
        FAKE_SCROLL_Y = 10;

      divElement.getBoundingClientRect = function () {
        return FAKE_RECT;
      };
      window.pageXOffset = FAKE_SCROLL_X;
      window.pageYOffset = FAKE_SCROLL_Y;
      traitcache.resetCache(); // Necessary initialization
      fetchedRect = traitcache.getScreenRect(divElement);
      fetchedCachedRect = traitcache.getScreenRect(divElement);
      expect(JSON.stringify(fetchedCachedRect)).to.be.equal(JSON.stringify(fetchedRect));
      done();
    });
  });
  afterEach(function() {
    sandbox.restore();
  });
  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
    require('../test/discharge');  // To unload all of the node modules we use. Allows tests to be run in parallel.
  });
});


