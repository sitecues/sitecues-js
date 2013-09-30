/**
 * This file contain unit test(s) for mouse-highlight.js file.
 */
require('./test/bootstrap');

var mh = require('../../source/js/mouse-highlight').mh,
    $ = jquery;
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
      expect(mh.isInterestingBackground({'backgroundColor':'rgb(100, 125, 100)'})).to.be.true;
      done();
    });
  });
  describe('#updateColorApproach()', function () {
    it('should make state.doUseBgColor=true and state.doUseOverlayForBgColor=true if state.picked.length > 1', function (done) {
      mh.state.picked = [1,2,3];
      mh.updateColorApproach();
      expect(mh.state.doUseBgColor).to.be.true;
      expect(mh.state.doUseOverlayForBgColor).to.be.true;
      done();
    });
    it('should make state.doUseBgColor=false and state.doUseOverlayForBgColor=false if state.picked.length <= 1 && $(state.picked).is(VISUAL_MEDIA_ELEMENTS) || !common.isEmptyBgImage(style.backgroundImage)', function (done) {
      mh.state.picked = [$('<img>')];
      mh.updateColorApproach({'backgroundImage':true});
      expect(mh.state.doUseBgColor).to.be.false;
      expect(mh.state.doUseOverlayForBgColor).to.be.false;
      done();
    });
    it('should make state.doUseBgColor=true and state.doUseOverlayForBgColor=false if state.picked.length <= 1 && the picked element is not media or interesting background', function (done) {
      mh.state.picked = [$('<p>')];
      mh.updateColorApproach({'backgroundImage':false});
      expect(mh.state.doUseBgColor).to.be.true;
      expect(mh.state.doUseOverlayForBgColor).to.be.false;
      done();
    });
  });
  describe('#getHighlightVisibilityFactor()', function () {
    it('should return 2.3 if speech is enabled and zoom is less than 2.3', function (done) {
      mh.state.zoom = 1.0;
      expect(mh.getHighlightVisibilityFactor()).to.be.equal(2.3);
      done();
    });
    it('should return zoom value if zoom > 2.3', function (done) {
      mh.state.zoom = 2.7;
      expect(mh.getHighlightVisibilityFactor()).to.be.equal(mh.state.zoom);
      done();
    });
  });
  describe('#getHighlightBorderWidth()', function () {
    it('should return 1.9 if zoom is < 2.3 (2.3 - .4)', function (done) {
      mh.state.zoom = 1;
      expect(mh.getHighlightBorderWidth()).to.be.equal(2.3 - .4);
      done();
    });
    it('should return zoom - 4 if zoom is > 2.3', function (done) {
      mh.state.zoom = 2.6;
      expect(mh.getHighlightBorderWidth()).to.be.equal(mh.state.zoom - .4);
      done();
    });
  });
  describe('#show()', function () {
    it('should return false if there is no picked element', function (done) {
      mh.state.picked = undefined;
      expect(mh.show()).to.be.false;
      done();
    });
    it('should return false if mh.updateOverlayPosition returns false', function (done) {
      var origMethod = mh.updateOverlayPosition;
      mh.updateOverlayPosition = function () {return false;};
      expect(mh.show()).to.be.false;
      mh.updateOverlayPosition = origMethod;
      done();
    });
  });
  describe('#updateOverlayColor()', function () {
    it('should return false if state.doUseBgColor is false', function (done) {
      mh.state.doUseBgColor = false;
      mh.state.picked = $('<img>');
      expect(mh.updateOverlayColor()).to.be.false;
      done();
    });
  });
  describe('#updateOverlayPosition()', function () {
    it('should return false if state.picked is false', function (done) {
      mh.state.picked = false;
      expect(mh.updateOverlayPosition()).to.be.false;
      done();
    });
    /*
    it('should return false if the function is passed false and state.elementRect is false', function (done) {
      mh.state.picked = $('<p>');
      mh.state.elementRect = false;
      expect(mh.updateOverlayPosition(false)).to.be.false;
      done();
    });
    it('should return true if the element.left === state.elementRect.left and element.right === state.elementRect.right and if the function is passed false', function (done) {
      mh.state.picked = $('<p>');
      mh.state.elementRect = mh.state.picked.get(0).getBoundingClientRect();
      expect(mh.updateOverlayPosition(false)).to.be.true;
      done()
    });
    */
  });
  describe('#update()', function () {
    it('should return false if mh.enabled is false', function (done) {
      mh.enabled = false;
      expect(mh.update()).to.be.false;
      mh.enabled = true;
      done();
    });
    it('should return false if mh.isSticky is true and event.shiftKey is false', function (done) {
      mh.isSticky = true;
      expect(mh.update({'shiftKey':false})).to.be.false;
      mh.isSticky = false
      done();
    });
    it('should return false if $(document.activeElement).is("body") returns false', function (done) {
      document.activeElement = false;
      expect(mh.update()).to.be.false;
      done();
    });
    it('should return false if document does not have focus', function (done) {
      var origMethod = document.hasFocus;
      document.hasFocus = function () {return false;};
      expect(mh.update()).to.be.false;
      document.hasFocus = origMethod;
      done();
    });
  });
  describe('#enable()', function () {
    it('should invoke mh.show', function (done) {
      var spy = sinon.spy(mh, 'show');
      mh.enable();
      expect(spy.calledOnce).to.be.true;
      spy.restore();
      done();
    });
  });
  describe('#disable()', function () {
    it('should invoke mh.hide', function (done) {
      var spy = sinon.spy(mh, 'hide');
      mh.disable();
      expect(spy.calledOnce).to.be.true;
      spy.restore();
      done();
    });
  });
  describe('#hide()', function () {
    it('should set state.savedCss to null if there is a picked element and there is savedCss', function (done) {
      mh.state.savedCss = {'backgroundColor':'blue'};
      mh.state.picked = $('<p>');
      mh.hide();
      expect(mh.state.savedCss).to.be.equal(null)
      done();
    });
  });
  describe('#hideAndResetState()', function () {
    it('should invoke mh.hide and mh.resetState', function (done) {
      var hideSpy = sinon.spy(mh, 'hide'),
          resetStateSpy = sinon.spy(mh, 'resetState');
      mh.hideAndResetState();
      expect(hideSpy.calledOnce).to.be.true;
      expect(resetStateSpy.calledOnce).to.be.true;
      hideSpy.restore();
      resetStateSpy.restore();
      done();
    });
  });
  describe('#resetState()', function () {
    it('should set mh.showTimer to 0 it is truthy', function (done) {
      mh.showTimer = 1;
      mh.resetState();
      expect(mh.showTimer).to.be.equal(0);
      done();
    });
    it('should set mh.pickTimer to 0 it is truthy', function (done) {
      mh.pickTimer = 1;
      mh.resetState();
      expect(mh.pickTimer).to.be.equal(0);
      done();
    });
    it('should set the state to the initial state of when the module loaded', function (done) {
      mh.state = mh.INIT_STATE;
      mh.state.newProp = true;
      mh.resetState();
      expect(JSON.stringify(mh.state) === JSON.stringify(mh.INIT_STATE)).to.be.true;
      done()
    });
  });
}); 