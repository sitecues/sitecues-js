// Require the module file we want to test.
var HLB_SAFE_AREA_MODULE_PATH = '../../../source/js/hlb/safe-area',
    HLB_PAGE_PATH             = '../pages/hlb.html',
    
    hlbSafeArea     = require(HLB_SAFE_AREA_MODULE_PATH),
    win;

require('../test/domutils');

describe('hlbSafeArea', function() {
  
  before(function() {   
    domutils.loadHtml(HLB_PAGE_PATH, function(newWindow) {
      win = newWindow;  // We are unable to change original window, so use the new one
    });
  });

  describe('#getSafeZoneBoundingBox()', function () {

    it('Returns an object', function (done) {

      var expected = 'object', 
          actual   = typeof hlbSafeArea.getSafeZoneBoundingBox();

      expect(actual).to.be.equal(expected);

      done();
    
    });

  });

  after(function() {
    delete require.cache[require.resolve(HLB_SAFE_AREA_MODULE_PATH)];
  });

});

