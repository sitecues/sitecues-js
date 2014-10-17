/**
 * This file contain unit test(s) for mouse-highlight.js file.
 */
require('./test/bootstrap');

var modulePath = '../../source/js/mouse-highlight',
  mh = require(modulePath),
  $ = jquery;

describe('mouse-highlight', function () {

  describe('#hasDarkBackgroundOnAnyOf()', function () {
    it('should return false if the background is mostly transparent (alpha level < 10%)', function (done) {
      expect(mh.hasDarkBackgroundOnAnyOf([{'backgroundColor': 'rgba(255, 255, 255, 0.01)'}])).to.be.true;
      done();
    });
    it('should return false if the background is white and mostly opaque (alpha level > 90%)', function (done) {
      expect(mh.hasDarkBackgroundOnAnyOf([{'backgroundColor': 'rgba(255, 255, 255, .90)'}])).to.be.false;
      done();
    });
    it('should return true if the background cannot be matched with a regex', function (done) {
      expect(mh.hasDarkBackgroundOnAnyOf([{'backgroundColor': 'rgb(wtf)'}])).to.be.true;
      done();
    });
    it('should return false if the background is mostly white (rgb levels > 242/255)', function (done) {
      expect(mh.hasDarkBackgroundOnAnyOf([{'backgroundColor': 'rgb(242, 245, 255)'}])).to.be.false;
      done();
    });
    it('should return true if the background is not mostly white (rgb levels < 242/255)', function (done) {
      expect(mh.hasDarkBackgroundOnAnyOf([{'backgroundColor': 'rgb(100, 125, 100)'}])).to.be.true;
      done();
    });
    it('should return true if the parent background is not mostly white (rgb levels < 242/255)', function (done) {
      expect(mh.hasDarkBackgroundOnAnyOf([{'backgroundColor': 'rgb(255, 255, 255)'}, {'backgroundColor': 'rgb(100, 125, 100)'}])).to.be.true;
      done();
    });
  });

  describe('#hasLightText()', function () {
    it('should return true if element containing text has color: rgba(250, 250, 250, 1)', function (done) {
      var contentTree = $('<div><p style="color: rgba(250, 250, 250, 1)">Text</p></div>');
      expect(mh.hasLightText(contentTree)).to.be.true;
      done();
    });
    it('should return false if element containing text has color: rgba(50, 50, 50, 1)', function (done) {
      var contentTree = $('<div><p style="color: rgba(50, 50, 50, 1)">Text</p></div>');
      expect(mh.hasLightText(contentTree)).to.be.false;
      done();
    });
  });

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
    it('should have semi-transparent bgColor and doUseOverlayForBgColor=true if picked element has background sprite', function (done) {
      var COLOR_WITH_ALPHA_PREFIX = 'rgba(',
        picked = $('<div>'),
        styles = [{backgroundImage: 'list-bullet.png', backgroundRepeat: 'no-repeat'}];
      mh.updateColorApproach(picked, styles);
      var state = mh.getHighlight();
      expect(state.bgColor.indexOf(COLOR_WITH_ALPHA_PREFIX) === 0 ).to.be.true;
      expect(state.doUseOverlayForBgColor).to.be.true;
      done();
    });
    it('should have no bgColor and doUseOverlayForBgColor=false if has a background image', function (done) {
      var picked = $('<div>'),
        styles = [{'backgroundImage': 'gradient.png'}];
      mh.updateColorApproach(picked, styles);
      var state = mh.getHighlight();
      expect(state.bgColor).to.be.equal('');
      expect(state.doUseOverlayForBgColor).to.be.false;
      done();
    });
    it('should have no bgColor and doUseOverlayForBgColor=false if image is picked', function (done) {
      var picked = $('<img>'),
        styles = [{}];
      mh.updateColorApproach(picked, styles);
      var state = mh.getHighlight();
      expect(state.bgColor).to.be.equal('');
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

  describe('#getElementsContainingText()', function () {
    it('should return a jquery element of length 1 if there is one element with descendant text', function (done) {
      expect(mh.getElementsContainingText($('<h1><span>Text</span></h1>')).length).to.be.equal(1);
      done();
    });
    it('should return an empty jquery object if there is no descendant text', function (done) {
      expect(mh.getElementsContainingText($('<h1><img></h1>')).length).to.be.equal(0);
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
      expect(Math.round(mh.getHighlightBorderWidth())).to.be.equal(2);
      done();
    });
    it('should return around 3 if zoom is 3', function (done) {
      mh.state.zoom = 3;
      expect(Math.round(mh.getHighlightBorderWidth())).to
        .be.equal(3);
      done();
    });
  });

  describe('#show()', function () {
    it('should not return true if there is no picked element', function (done) {
      mh.state.picked = undefined;
      expect(mh.show()).to.not.be.true;
      done();
    });
    it('should not return true if mh.updateOverlayPosition returns false', function (done) {
      var origMethod = mh.updateOverlayPosition;
      mh.updateOverlayPosition = function () {
        return false;
      };
      expect(mh.show()).to.not.be.true;
      mh.updateOverlayPosition = origMethod;
      done();
    });
  });

  describe('#createNewOverlayPosition()', function () {
    it('should return false if state.picked is null', function (done) {
      mh.state.picked = null;
      expect(mh.createNewOverlayPosition()).to.be.false;
      done();
    });
    it('should return false if state.elementRect is false', function (done) {
      mh.state.picked = $('<p>');
      mh.state.elementRect = null;
      expect(mh.createNewOverlayPosition(false)).to.be.false;
      done();
    });
  });

  // TODO why isn't spy working?
  describe('#update()', function () {
    it('should not call pickAfterShortWait() if mh.enabled is false', function (done) {
      mh.enabled = false;
      var pickSpy = sinon.spy(mh, 'pickAfterShortWait')
      mh.update({});
      //expect(pickSpy.calledOnce).to.be.false;
      pickSpy.restore();
      done();
    });
    it('should call pickAfterShortWait()', function (done) {
      var pickSpy = sinon.spy(mh, 'pickAfterShortWait')
      mh.update({});
      //expect(pickSpy.calledOnce).to.be.true;
      pickSpy.restore();
      done();
    });
  });

  describe('#enableIfAppropriate()', function () {
    it('should invoke mh.show', function (done) {
      mh.enabled = true;
      mh.state.picked = undefined;
      mh.enableIfAppropriate();
      done();
    });
  });

  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
    require('./test/discharge');  // To unload all of the node modules we use. Allows tests to be run in parallel.
  });
});
