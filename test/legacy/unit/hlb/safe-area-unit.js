// Require the module file we want to test.
var HLB_SAFE_AREA_MODULE_PATH = '../../../source/js/hlb/safe-area',
    HLB_PAGE_PATH             = './data/html/test-hlb.html',

    hlbSafeArea = require(HLB_SAFE_AREA_MODULE_PATH),
    win;

require('../test/domutils');

describe('hlbSafeArea', function() {

  before(function() {
    domutils.loadHtml(HLB_PAGE_PATH, function(newWindow) {
      win = newWindow;
    });
  });

  describe('#getSafeZoneBoundingBox()', function () {

    it('Returns an object with left, top, height, width, right, and bottom properties', function (done) {

      var result   = hlbSafeArea.getSafeZoneBoundingBox();

      expect(result.hasOwnProperty('left')).to.be.true;
      expect(result.hasOwnProperty('right')).to.be.true;
      expect(result.hasOwnProperty('top')).to.be.true;
      expect(result.hasOwnProperty('bottom')).to.be.true;
      expect(result.hasOwnProperty('width')).to.be.true;
      expect(result.hasOwnProperty('height')).to.be.true;

      done();

    });

  });

  after(function() {
    delete require.cache[require.resolve(HLB_SAFE_AREA_MODULE_PATH)];
  });

});

