/**
 * This file contain unit tests that check the windows cursors get are DataURL strings
 * on an public object.
 */

require('../../test/bootstrap');

// Require the module file we want to test.
var macjs = '../../../../source/js/cursor/images/mac.js';
var module = require(macjs);
var platform = require('../../data/modules/platform');
var dataURLStart = 'data:image/svg+xml,%';


describe('#mac osImages', function () {

  describe('at pixel ratio 1', function () {


    before(function(){
      // Is this right? Doesnt see to make a difference when I change this. Anna?
      platform.pixel.ratio = 1;
    });

    it('should set pointer_1_1 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_1_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_1_2 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_1_2.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_1_3 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_1_3.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_1_4 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_1_4.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_1_5 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_1_5.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_1_6 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_1_6.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_1_7 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_1_7.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_1_8 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_1_8.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_1_9 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_1_9.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_2_0 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_2_0.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_2_1 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_2_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_2_2 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_2_2.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_2_3 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_2_3.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_2_4 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_2_4.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should set pointer_2_5 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_2_5.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_2_6 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_2_6.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should set pointer_2_7 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_2_7.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should set pointer_2_8 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_2_8.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_2_9 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_2_9.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should set pointer_3_0 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_3_0.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set pointer_3_1 as a data-url string', function(done) {
      expect(module.mac.urls.pointer_3_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_1_1 as a data-url string', function(done) {
      expect(module.mac.urls.default_1_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_1_2 as a data-url string', function(done) {
      expect(module.mac.urls.default_1_2.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_1_3 as a data-url string', function(done) {
      expect(module.mac.urls.default_1_3.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_1_4 as a data-url string', function(done) {
      expect(module.mac.urls.default_1_4.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_1_5 as a data-url string', function(done) {
      expect(module.mac.urls.default_1_5.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_1_6 as a data-url string', function(done) {
      expect(module.mac.urls.default_1_6.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_1_7 as a data-url string', function(done) {
      expect(module.mac.urls.default_1_7.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_1_8 as a data-url string', function(done) {
      expect(module.mac.urls.default_1_8.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should set default_1_9 as a data-url string', function(done) {
      expect(module.mac.urls.default_1_9.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_2_0 as a data-url string', function(done) {
      expect(module.mac.urls.default_2_0.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_2_1 as a data-url string', function(done) {
      expect(module.mac.urls.default_2_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_2_2 as a data-url string', function(done) {
      expect(module.mac.urls.default_2_2.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_2_3 as a data-url string', function(done) {
      expect(module.mac.urls.default_2_3.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_2_4 as a data-url string', function(done) {
      expect(module.mac.urls.default_2_4.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_2_5 as a data-url string', function(done) {
      expect(module.mac.urls.default_2_5.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_2_6 as a data-url string', function(done) {
      expect(module.mac.urls.default_2_6.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_2_7 as a data-url string', function(done) {
      expect(module.mac.urls.default_2_7.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_2_8 as a data-url string', function(done) {
      expect(module.mac.urls.default_2_8.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_2_9 as a data-url string', function(done) {
      expect(module.mac.urls.default_2_9.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_3_0 as a data-url string', function(done) {
      expect(module.mac.urls.default_3_0.substr(0,20)).to.equal(dataURLStart);
      done();
    });

    it('should set default_3_1 as a data-url string', function(done) {
      expect(module.mac.urls.default_3_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });


  });

  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(macjs);
    delete require.cache[name];
  });
    
});

require('../../test/discharge');
