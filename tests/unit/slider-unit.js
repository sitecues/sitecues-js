/**
 * This file contains unit tests for core.js:sitecues.status().
 */

require('./test/libs');

var sliderPath    = '../../source/js/slider';

// Require the module files we want to test
var mod = {
  // ui-manager.js puts "ui" object on the sitecues namespace.
  // This is where slider objects are referenced in functional testing
  slider    : require(sliderPath)
};

describe('sitecues', function() {
  describe('#slider{}', function() {

    it('global slider interface should be an object', function (done) {
      expect(mod.slider.globalSliderInterface).to.be.an('object');
      done();
    });
    
    it('sliders stack[] should be an array', function (done) {
      expect(mod.slider.globalSliderInterface.stack).to.be.an('array');
      done();
    });

    it('should place a sliders[] array on the sitecues namespace', function (done) {
      expect(sitecues.sliders).to.be.an('array');
      done();
    });
    
    it('should instantiate slider object from class', function (done) {
      var div     = document.createElement('div'),
          slider  = mod.slider.globalSliderInterface.build({ container: div });
      expect(slider).to.be.an('object');
      done();
    });

    it('should get pixel values from ', function (done) {
      // This slider was already defined in the above test 'should instantiate slider object from class'
      var slider = sitecues.sliders[0];
      zoom.min = 1;
      zoom.step = .1;
      zoom.range = 2;
      slider.trackOffsetLeft = 0;
      slider.trackClientWidth = 200;
      var actual = slider.reportThumbDragPixelsPerZoomStep().toFixed(4);
      expect(actual).to.equal("10.0000");
      done();
    });

  });

  after(function() {
      // Unload module from nodejs's cache
      var name = require.resolve(sliderPath);
      delete require.cache[name];
   });

});
