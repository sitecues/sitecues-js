/**
 * This file contain unit test(s) for custom.js file.
 */

require('../test/bootstrap');

// Require the module file we want to test.
var customPath = '../../../source/js/cursor/custom'
  , module = require(customPath)
  ;

// Let's use zoom values set in data.
require('../data/modules/zoom');

describe('cursor/custom', function () {

  describe('#init()', function () {

    it('should initialize cursor images', function(done) {
      
      // Reset images data.
      module.custom.data = {};

      module.custom.init();

      // Verify we generated right amount of images
      var numberOfTypes           = Object.keys(module.custom.TYPES).length
        , expectedAmountOfImages  = numberOfTypes * (((zoom.max + zoom.step) - zoom.min) / zoom.step)
        , actualAmountOfImages    = Object.keys(module.custom.data).length
        ;

      console.log('_____________________');
      console.log((((zoom.max + zoom.step) - zoom.min) / zoom.step));
      console.log('_____________________');


      expect(actualAmountOfImages).to.be.equal(expectedAmountOfImages);

      done();
    });

  it('should fecth correct image according to zoom level and cursor type given',function (done) {
      // Reset images data.
      var zoom      = 1
        , type      = 'default'
        , expected  = 'test_image'
        , image
        ;

      module.custom.data = {'default_1_0': expected};

      image = module.custom.getImage(type, zoom);

      expect(image).to.be.equal(expected);

      done();  
    });

  });

  after(function () {
    // Unload module from nodejs's cache
    var name = require.resolve(customPath);
    delete require.cache[name];
  });

});

require('../test/discharge');