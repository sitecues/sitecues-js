/**
 * This file contain unit test(s) for mouse-highlight.js file.
 */
require('./test/bootstrap');

var mh = require('../../source/js/mouse-highlight').mh,
    $ = jquery;
    console.log(mh.getPicked)
// Require the module file we want to test.

describe('mouse-highlight', function() {
  
  describe('#isInterestingBackground()', function () {
    it('should return false if the backgroundColor is transparent', function(done) {
      expect(mh.isInterestingBackground({'backgroundColor':'transparent'})).to.be.false;
      done();
    });
    it('should return false if the background is mostly transparent (alpha level < 10%)', function(done) {
      expect(mh.isInterestingBackground({'backgroundColor':'rgba(255, 255, 255, .01)'})).to.be.false;
      done();
    });
    it('should return true if the background cannot be matched with a regex', function(done) {
      expect(mh.isInterestingBackground({'backgroundColor':'rgb(wtf)'})).to.be.true;
      done();
    });
    it('should return false if the background is mostly white (rgb levels > 242/255', function(done) {
      expect(mh.isInterestingBackground({'backgroundColor':'rgb(255, 255, 255)'})).to.be.false;
      done();
    });
    it('should return true if the background is not mostly white (rgb levels < 242/255', function(done) {
      expect(mh.isInterestingBackground({'backgroundColor':'rgb(100, 125, 100)'})).to.be.false;
      done();
    });
  });
  describe('#hasInterestingBackgroundOnAnyOf()', function () {
    it('should return false if any backgroundColor is transparent', function(done) {
      var collection = [];
    });
    it('should return false if any background is mostly transparent (alpha level < 10%)', function(done) {

    });
    it('should return true if any background cannot be matched with a regex', function(done) {

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
 /* describe('#show()', function () {
    it('should return false if there is no picked element', function (done) {

    });
    it('should return false if mh.updateOverlayPosition returns true', function (done) {

    });
  });
  describe('#updateOverlayColor()', function () {
    it('should return false if state.doUseBgColor is false', function (done) {

    });
  });
  describe('#updateOverlayPosition()', function () {
    it('should return false if state.picked is false', function (done) {

    });
    it('should return false if the function is passed false and state.elementRect is false', function (done) {

    });
    it('should return true if the element.left === state.elementRect.left and element.right === state.elementRect.right and if the function is passed false', function (done) {

    });
    it('should return false if positioning.getAllBoundingBoxes returns an empty array', function (done) {

    });
  });
  describe('#update()', function () {
    it('should return false if mh.enabled is false', function (done) {

    });
    it('should return false if mh.isSticky is true and event.shiftKey is false', function (done) {

    });
    it('should return false if $(document.activeElement).is("body") returns false', function (done) {

    });
    it('should return false if document does not have focus', function (done) {

    });
    it('should invoke mh.updateOverlayPosition once if event.target === state.target', function (done) {

    });
  });
  describe('#refresh()', function () {
    it('should invoke $.on if mh.enabled is true', function (done) {

    });
    it('should invoke $.off if mh.enabled is false', function (done) {

    });
  });
  describe('#enable()', function () {
    it('should invoke $.on and mh.show', function (done) {

    });
  });
  describe('#disable()', function () {
    it('should invoke $.off and mh.hide', function (done) {

    });
  });
  describe('#hideAndResetState()', function () {
    it('should invoke mh.hide and mh.resetState', function (done) {

    });
  });
  describe('#hide()', function () {
    it('should reset styles of picked element if there is any saved CSS', function (done) {

    });
    it('should set state.savedCss to null if there is a picked element and there is savedCss', function (done) {

    });
    it('should remove and elements from the dome with a class of HIGHLIGHT_OUTLINE_CLASS and HIGHLIGHT_PADDING_CLASS', function (done) {

    });
  });
  describe('#resetState()', function () {
    it('should set mh.timer to 0 if mh.timer is truthy', function (done) {

    });
    it('should set the state to the initial state of when the module loaded', function (done) {

    });
  });
  describe('#getPicked()', function () {
    it('should return the value of state.picked', function (done) {

    });
  });*/
}); 