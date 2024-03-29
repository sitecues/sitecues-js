/**
 * This file contain unit test(s) for highlight.js file.
 */
require('./../test/bootstrap');

var modulePath = '../../../source/js/highlight/highlight',
  mh = require(modulePath),
  $ = jquery;

describe('highlight', function () {

  describe('#getMaxZIndex()', function () {
    it('should return the largest z-index in array of styles', function (done) {
      expect(mh.getMaxZIndex([{ zIndex: 10 }, { zIndex: 100 }, { zIndex: 20 }])).to.be.equals(100);
      done();
    });
  });

  describe('#updateColorApproach()', function () {
    it('should have semi-transparent bgColor and doUseOverlayForBgColor=true if multiple items picked', function (done) {
      var COLOR_WITH_ALPHA_PREFIX = 'rgba(',
        picked = $('<p>').add($('<p>')),
        styles = [{}];
      mh.updateColorApproach(picked, styles);
      var state = mh.getHighlight();
      expect(state.bgColor.indexOf(COLOR_WITH_ALPHA_PREFIX) === 0 ).to.be.true;
      expect(state.doUseOverlayForBgColor).to.be.true;
      done();
    });
    it('should have semi-transparent bgColor doUseOverlayForBgColor=true if button is picked', function (done) {
      var COLOR_WITH_ALPHA_PREFIX = 'rgba(',
        picked = $('<button>'),
        styles = [{}];
      mh.updateColorApproach(picked, styles);
      var state = mh.getHighlight();
      expect(state.bgColor.indexOf(COLOR_WITH_ALPHA_PREFIX) === 0 ).to.be.true;
      expect(state.doUseOverlayForBgColor).to.be.true;
      done();
    });
    it('should have semi-transparent bgColor and doUseOverlayForBgColor=false if picked element has background sprite', function (done) {
      var COLOR_WITH_ALPHA_PREFIX = 'rgba(',
        picked = $('<div>'),
        styles = [{backgroundImage: 'list-bullet.png', backgroundRepeat: 'no-repeat'}];
      mh.updateColorApproach(picked, styles);
      var state = mh.getHighlight();
      expect(state.bgColor.indexOf(COLOR_WITH_ALPHA_PREFIX) === 0 ).to.be.true;
      expect(state.doUseOverlayForBgColor).to.be.false;
      done();
    });
    it('should use semi-transparent bgColor and doUseOverlayForBgColor=false if picked element has ancestor with background image', function (done) {
      var picked = $('<p>'),
        styles = [{}, { backgroundImage: 'gradient.png' }],
        COLOR_WITH_ALPHA_PREFIX = 'rgba(';
      mh.updateColorApproach(picked, styles);
      var state = mh.getHighlight();
      expect(state.bgColor.indexOf(COLOR_WITH_ALPHA_PREFIX) === 0 ).to.be.true;
      expect(state.doUseOverlayForBgColor).to.be.false;
      done();
    });
    it('should use semi-transparent bgColor and doUseOverlayForBgColor=false if picked element has light text', function (done) {
      var picked = $('<p>'),
        styles = [{}, { }],
        COLOR_WITH_ALPHA_PREFIX = 'rgba(';

      mh.updateColorApproach(picked, styles);

      var state = mh.getHighlight();
      expect(state.bgColor.indexOf(COLOR_WITH_ALPHA_PREFIX) === 0 ).to.be.true;
      expect(state.doUseOverlayForBgColor).to.be.false;
      done();
    });
    it('should use semi-transparent bgColor and doUseOverlayForBgColor=false if picked element has dark bg color', function (done) {
      var COLOR_WITH_ALPHA_PREFIX = 'rgba(',
        picked = $('<p>'),
        styles = [{'backgroundColor': 'rgb(30,30,30)'}];
      mh.updateColorApproach(picked, styles);
      var state = mh.getHighlight();
      expect(state.bgColor.indexOf(COLOR_WITH_ALPHA_PREFIX) === 0 ).to.be.true;
      expect(state.doUseOverlayForBgColor).to.be.false;
      done();
    });
  });

  describe('#getElementsContainingOwnText()', function () {
    it('should return a jquery element of length 1 if there is one element with descendant text', function (done) {
      expect(mh.getElementsContainingOwnText($('<h1><span>Text</span></h1>')).length).to.be.equal(1);
      done();
    });
    it('should return an empty jquery object if there is no descendant text', function (done) {
      expect(mh.getElementsContainingOwnText($('<h1><img></h1>')).length).to.be.equal(0);
      done();
    });
  });

  describe('#getHighlightVisibilityFactor()', function () {
    it('should return 2.1 if zoom is less than 2.3 and speech is enabled', function (done) {
      mh.state.zoom = 1.1;
      expect(mh.getHighlightVisibilityFactor()).to.be.equal(2.1);
      done();
    });
    it('should return 2.88 if zoom = 2.6', function (done) {
      mh.state.zoom = 2.6;
      expect(parseFloat(mh.getHighlightVisibilityFactor().toFixed(2))).to.be.equal(2.88);
      done();
    });
  });

  describe('#getHighlightBorderWidth()', function () {
    it('should return around 2 if zoom is 1 and speech is on', function (done) {
      mh.state.zoom = 1;
      expect(Math.round(mh.getHighlightBorderWidth())).to.be.equal(3);
      done();
    });
    it('should return around 14 if zoom is 3', function (done) {
      mh.state.zoom = 3;
      expect(Math.round(mh.getHighlightBorderWidth())).to
        .be.equal(14);
      done();
    });
  });

  describe('#resumeAppropriately()', function () {
    it('should invoke mh.show', function (done) {
      mh.enabled = true;
      mh.state.picked = undefined;
      mh.resumeAppropriately();
      done();
    });
  });

  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
    require('./../test/discharge');  // To unload all of the node modules we use. Allows tests to be run in parallel.
  });
});
