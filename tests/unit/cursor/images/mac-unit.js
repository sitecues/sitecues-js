/**
 * This file contain unit test(s) for cursor.js file.
 */

require('../../test/bootstrap');

// Require the module file we want to test.
var macjs = '../../../../source/js/cursor/images/mac.js';
var module = require(macjs);

var dataURLStart = 'data:image/svg+xml,%';


describe('images/mac.js', function () {

  describe('mac.js at pixel ratio 1', function () {


    before(function(){
      // Is this right? Doesnt see to make a difference when I change this. Anna?
      platform.pixel.ratio = 1;
    });

    it('should create an object filled with cursor urls.', function(done) {
      expect(module.mac.urls).to.be.an('object');
      done();
    });


    it('should create url for pointer_1_1', function(done) {
      // console.log('\n'+ module.mac.urls.pointer_1_1 +'\n');
      expect(module.mac.urls.pointer_1_1).to.be.a('string');
      done();
    });
    it('should url for pointer_1_1 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_1_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });

  
    it('should create url for pointer_1_2', function(done) {
      expect(module.mac.urls.pointer_1_2).to.be.a('string');
      done();
    });
    it('should url for pointer_1_2 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_1_2.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_1_3', function(done) {
      expect(module.mac.urls.pointer_1_3).to.be.a('string');
      done();
    });
    it('should url for pointer_1_3 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_1_3.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_1_4', function(done) {
      expect(module.mac.urls.pointer_1_4).to.be.a('string');
      done();
    });
    it('should url for pointer_1_4 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_1_4.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_1_5', function(done) {
      expect(module.mac.urls.pointer_1_5).to.be.a('string');
      done();
    });
    it('should url for pointer_1_5 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_1_5.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_1_6', function(done) {
      expect(module.mac.urls.pointer_1_6).to.be.a('string');
      done();
    });
    it('should url for pointer_1_6 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_1_6.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_1_7', function(done) {
      expect(module.mac.urls.pointer_1_7).to.be.a('string');
      done();
    });
    it('should url for pointer_1_7 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_1_7.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_1_8', function(done) {
      expect(module.mac.urls.pointer_1_8).to.be.a('string');
      done();
    });
    it('should url for pointer_1_8 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_1_8.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_1_9', function(done) {
      expect(module.mac.urls.pointer_1_9).to.be.a('string');
      done();
    });
    it('should url for pointer_1_9 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_1_9.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_2_0', function(done) {
      expect(module.mac.urls.pointer_2_0).to.be.a('string');
      done();
    });
    it('should url for pointer_2_0 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_2_0.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_2_1', function(done) {
      expect(module.mac.urls.pointer_2_1).to.be.a('string');
      done();
    });
    it('should url for pointer_2_1 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_2_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_2_2', function(done) {
      expect(module.mac.urls.pointer_1_2).to.be.a('string');
      done();
    });
    it('should url for pointer_2_2 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_2_2.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_2_3', function(done) {
      expect(module.mac.urls.pointer_2_3).to.be.a('string');
      done();
    });
    it('should url for pointer_2_3 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_2_3.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_2_4', function(done) {
      expect(module.mac.urls.pointer_2_4).to.be.a('string');
      done();
    });
    it('should url for pointer_2_4 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_2_4.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_2_5', function(done) {
      expect(module.mac.urls.pointer_2_5).to.be.a('string');
      done();
    });
    it('should url for pointer_2_5 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_2_5.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_2_6', function(done) {
      expect(module.mac.urls.pointer_2_6).to.be.a('string');
      done();
    });
    it('should url for pointer_2_6 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_2_6.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_2_7', function(done) {
      expect(module.mac.urls.pointer_2_7).to.be.a('string');
      done();
    });
    it('should url for pointer_2_7 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_2_7.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_2_8', function(done) {
      expect(module.mac.urls.pointer_2_8).to.be.a('string');
      done();
    });
    it('should url for pointer_2_8 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_2_8.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_2_9', function(done) {
      expect(module.mac.urls.pointer_2_9).to.be.a('string');
      done();
    });
    it('should url for pointer_2_9 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_2_9.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_3_0', function(done) {
      expect(module.mac.urls.pointer_3_0).to.be.a('string');
      done();
    });
    it('should url for pointer_3_0 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_3_0.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for pointer_3_1', function(done) {
      expect(module.mac.urls.pointer_3_1).to.be.a('string');
      done();
    });
    it('should url for pointer_3_1 should be a dataurl', function(done) {
      expect(module.mac.urls.pointer_3_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_1_1', function(done) {
      // console.log('\n'+ module.mac.urls.default_1_1 +'\n');
      expect(module.mac.urls.default_1_1).to.be.a('string');
      done();
    });
    it('should url for default_1_1 should be a dataurl', function(done) {
      expect(module.mac.urls.default_1_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });



  
    it('should create url for default_1_2', function(done) {
      expect(module.mac.urls.default_1_2).to.be.a('string');
      done();
    });
    it('should url for default_1_2 should be a dataurl', function(done) {
      expect(module.mac.urls.default_1_2.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_1_3', function(done) {
      expect(module.mac.urls.default_1_3).to.be.a('string');
      done();
    });
    it('should url for default_1_3 should be a dataurl', function(done) {
      expect(module.mac.urls.default_1_3.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_1_4', function(done) {
      expect(module.mac.urls.default_1_4).to.be.a('string');
      done();
    });
    it('should url for default_1_4 should be a dataurl', function(done) {
      expect(module.mac.urls.default_1_4.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_1_5', function(done) {
      expect(module.mac.urls.default_1_5).to.be.a('string');
      done();
    });
    it('should url for default_1_5 should be a dataurl', function(done) {
      expect(module.mac.urls.default_1_5.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_1_6', function(done) {
      expect(module.mac.urls.default_1_6).to.be.a('string');
      done();
    });
    it('should url for default_1_6 should be a dataurl', function(done) {
      expect(module.mac.urls.default_1_6.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_1_7', function(done) {
      expect(module.mac.urls.default_1_7).to.be.a('string');
      done();
    });
    it('should url for default_1_7 should be a dataurl', function(done) {
      expect(module.mac.urls.default_1_7.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_1_8', function(done) {
      expect(module.mac.urls.default_1_8).to.be.a('string');
      done();
    });
    it('should url for default_1_8 should be a dataurl', function(done) {
      expect(module.mac.urls.default_1_8.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_1_9', function(done) {
      expect(module.mac.urls.default_1_9).to.be.a('string');
      done();
    });
    it('should url for default_1_9 should be a dataurl', function(done) {
      expect(module.mac.urls.default_1_9.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_2_0', function(done) {
      expect(module.mac.urls.default_2_0).to.be.a('string');
      done();
    });
    it('should url for default_2_0 should be a dataurl', function(done) {
      expect(module.mac.urls.default_2_0.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_2_1', function(done) {
      expect(module.mac.urls.default_2_1).to.be.a('string');
      done();
    });
    it('should url for default_2_1 should be a dataurl', function(done) {
      expect(module.mac.urls.default_2_1.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_2_2', function(done) {
      expect(module.mac.urls.default_1_2).to.be.a('string');
      done();
    });
    it('should url for default_2_2 should be a dataurl', function(done) {
      expect(module.mac.urls.default_2_2.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_2_3', function(done) {
      expect(module.mac.urls.default_2_3).to.be.a('string');
      done();
    });
    it('should url for default_2_3 should be a dataurl', function(done) {
      expect(module.mac.urls.default_2_3.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_2_4', function(done) {
      expect(module.mac.urls.default_2_4).to.be.a('string');
      done();
    });
    it('should url for default_2_4 should be a dataurl', function(done) {
      expect(module.mac.urls.default_2_4.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_2_5', function(done) {
      expect(module.mac.urls.default_2_5).to.be.a('string');
      done();
    });
    it('should url for default_2_5 should be a dataurl', function(done) {
      expect(module.mac.urls.default_2_5.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_2_6', function(done) {
      expect(module.mac.urls.default_2_6).to.be.a('string');
      done();
    });
    it('should url for default_2_6 should be a dataurl', function(done) {
      expect(module.mac.urls.default_2_6.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_2_7', function(done) {
      expect(module.mac.urls.default_2_7).to.be.a('string');
      done();
    });
    it('should url for default_2_7 should be a dataurl', function(done) {
      expect(module.mac.urls.default_2_7.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_2_8', function(done) {
      expect(module.mac.urls.default_2_8).to.be.a('string');
      done();
    });
    it('should url for default_2_8 should be a dataurl', function(done) {
      expect(module.mac.urls.default_2_8.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_2_9', function(done) {
      expect(module.mac.urls.default_2_9).to.be.a('string');
      done();
    });
    it('should url for default_2_9 should be a dataurl', function(done) {
      expect(module.mac.urls.default_2_9.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_3_0', function(done) {
      expect(module.mac.urls.default_3_0).to.be.a('string');
      done();
    });
    it('should url for default_3_0 should be a dataurl', function(done) {
      expect(module.mac.urls.default_3_0.substr(0,20)).to.equal(dataURLStart);
      done();
    });


    it('should create url for default_3_1', function(done) {
      expect(module.mac.urls.default_3_1).to.be.a('string');
      done();
    });
    it('should url for default_3_1 should be a dataurl', function(done) {
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
