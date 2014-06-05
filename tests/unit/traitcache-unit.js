/**
 * This file contain unit test(s) for ui-manager.js file: toggle, innerToggle
 */

require('./test/bootstrap');

// Require the module file we want to test.
var traitcachePath = '../../source/js/mouse-highlight/traitcache';
var traitcache = require(traitcachePath);

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

  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(traitcachePath);
    delete require.cache[name];
  });
});

//getStyleProp
//getStyle
//getCachedViewSize
//getRect
//getScreenRect
