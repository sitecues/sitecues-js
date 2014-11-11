// Require the module file we want to test.
var DIMMER_MODULE_PATH = '../../../source/js/hlb/dimmer',
    HLB_PAGE_PATH      = './data/html/test-hlb.html',
    dimmer             = require(DIMMER_MODULE_PATH),
    win;

require('../test/domutils');

describe('dimmer', function() {

  before(function() {
    domutils.loadHtml(HLB_PAGE_PATH, function(newWindow) {
      win = newWindow;  // We are unable to change original window, so use the new one
    });
  });


  // describe('#onDimmerClosed', function () {

  //   it('Invokes jquery.remove because we rely upon jQuery to remove element from the DOM.', function (done) {

  //     var $dimmerElement = jquery(win.document.getElementById('sitecues-background-dimmer')),
  //         removeSpy      = sinon.spy($dimmerElement, 'remove');

  //     dimmer.onDimmerClosed();

  //     expect(removeSpy.calledOnce).to.be.true;

  //     removeSpy.restore();

  //     done();

  //   });

  // });

  describe('#dimBackgroundContent', function () {

    it('Sets $dimmerElement to an object so we can use the variable throughout the module', function (done) {

      var appendStub = sinon.stub(jquery.fn, 'append', function () {}),
          expected   = 'object',
          actual;

      dimmer.dimBackgroundContent(jquery(win.document.body));

      actual = typeof dimmer.getDimmerElement();

      expect(actual).to.be.equal(expected);

      appendStub.restore();

      done();

    });

    it('Invokes jquery.css because we rely upon jQuery to dim the background.', function (done) {

      var cssSpy     = sinon.stub(jquery.fn, 'css', function () {return this;}),
          appendStub = sinon.stub(jquery.fn, 'append', function () {});

      dimmer.dimBackgroundContent(jquery(win.document.body));

      expect(cssSpy.calledOnce).to.be.true;

      cssSpy.restore();
      appendStub.restore();

      done();

    });

    it('Invokes jquery.append becuse we rely upon jQuery to append elements to the DOM.', function (done) {

      var appendStub = sinon.stub(jquery.fn, 'append', function () {});

      dimmer.dimBackgroundContent(jquery(win.document.body));

      expect(appendStub.calledOnce).to.be.true;

      appendStub.restore();

      done();

    });

  });

  after(function() {
    delete require.cache[require.resolve(DIMMER_MODULE_PATH)];
  });

});

