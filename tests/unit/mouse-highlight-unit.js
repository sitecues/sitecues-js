/**
 * This file contain unit test(s) for mouse-highlight.js file.
 */
require('./test/bootstrap');

var fs = require('fs'),
    page,
    mh = require('../../source/js/mouse-highlight'),
    $ = jquery;
// Require the module file we want to test.

describe('mouse-highlight', function() {
  
  describe('#isInterestingBackground()', function () {
    it('should return false if the backgroundColor is transparent', function(done) {

    });
    it('should return false if the background is mostly transparent (alpha level < 10%)', function(done) {

    });
    it('should return true if the background is mostly solid (alpha level > 10%)', function(done) {

    });
    it('should return false if the background is mostly white (rgb levels > 242/255', function(done) {

    });
  });
  describe('#hasInterestingBackgroundOnAnyOf()', function () {
    it('should return false if any backgroundColor is transparent', function(done) {

    });
    it('should return false if any background is mostly transparent (alpha level < 10%)', function(done) {

    });
    it('should return true if any background is mostly solid (alpha level > 10%)', function(done) {

    });
    it('should return false if any background is mostly white (rgb levels > 242/255', function(done) {

    });    
  });
/*
  describe('#hasInterestingBackgroundImage()', function () {

  });
  describe('#updateColorApproach()', function () {

  });
  describe('#getHighlightVisibilityFactor()', function () {

  });
  describe('#getHighlightBorderColor()', function () {

  });
  describe('#getHighlightBorderWidth()', function () {

  });
  describe('#getTransparentBackgroundColor()', function () {

  });
  describe('#getOpaqueBackgroundColor()', function () {

  });
*/
  describe('#show()', function () {
    it('should return false if there is no picked element', function (done) {

    });
    it('should return false if mh.updateOverlayPosition returns true', function () {

    });
  });
  describe('#updateOverlayColor()', function () {
    it('should ')
  });
  describe('#updateOverlayPosition()', function () {

  });
  describe('#update()', function () {

  });
  describe('#refresh()', function () {

  });
  describe('#updateZoom()', function () {

  });
  describe('#enable()', function () {

  });
  describe('#verbalCue()', function () {

  });
  describe('#disable()', function () {

  });
  describe('#hideAndResetState()', function () {

  });
  describe('#hide()', function () {

  });
  describe('#resetState()', function () {

  });
  describe('#getPicked()', function () {

  });
  describe('#toggleStickyMH()', function () {

  });
  
}); 