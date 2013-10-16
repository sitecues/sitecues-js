/**
 * This file contain unit test(s) for custom.js file.
 */

require('../test/bootstrap');

// Require the module file we want to test.
var module = require("../../../source/js/cursor/custom");
// Let's use zoom values set in data.
require("../data/modules/zoom");

describe('cursor/custom', function() {

   describe('#init()', function() {

       it('should initialize cursor images', function(done) {
         // Reset images data.
         module.custom.data = {};
         
         module.custom.init();
         // Verify we generated right amount of images
         var numberOfTypes = Object.keys(module.custom.TYPES).length;
         var expectedAmountOfImages = numberOfTypes * (((zoom.max + zoom.step) - zoom.min) / zoom.step);
         var actualAmountOfImages = Object.keys(module.custom.data).length;
         expect(actualAmountOfImages).to.be.equal(expectedAmountOfImages);

          done();
        });
    
      it('should fecth correct image according to zoom level and cursor type given', function(done) {
         // Reset images data.
         var zoom = 1;
         var type = 'default';
         var expected = 'test_image';
         module.custom.data = {'default_1_0': expected};

         var image = module.custom.getImage(type, zoom);
         expect(image).to.be.equal(expected);

         done();
     });
  });
});

require('../test/discharge');