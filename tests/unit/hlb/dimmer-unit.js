// Require the module file we want to test.
var DIMMER_MODULE_PATH = '../../../source/js/hlb/dimmer',
    HLB_PAGE_PATH      = '../pages/hlb.html',
    dimmer             = require(DIMMER_MODULE_PATH),
    win;

require('../test/domutils');

describe('dimmer', function() {
  
  before(function() {
    domutils.loadHtml(HLB_PAGE_PATH, function(newWindow) {
      win = newWindow;  // We are unable to change original window, so use the new one
    });
  });

  describe('#onDimmerClick()', function () {
    
    it('Invokes sitecues.emit', function (done) {

      var emitSpy = sinon.spy(sitecues, 'emit');

      dimmer.onDimmerClick();

      expect(emitSpy.calledOnce).to.be.true;

      emitSpy.restore();

      done();
    
    });
 
  });

  describe('#onDimmerReady', function () {
  
    it('Invokes jquery.css', function (done) {

      var $dimmerElement = jquery(win.document.getElementById('hlbDimmerElement')),
          cssSpy = sinon.spy($dimmerElement, 'css');

      dimmer.setDimmerElement($dimmerElement);

      dimmer.onDimmerReady();

      expect(cssSpy.calledOnce).to.be.true;

      cssSpy.restore();

      done();

    });
  });

  describe('#onDimmerClosed', function () {
    
    it('Invokes jquery.remove', function (done) {
      
      var $dimmerElement = jquery(win.document.getElementById('hlbDimmerElement')),
          removeSpy = sinon.spy($dimmerElement, 'remove');

      dimmer.setDimmerElement($dimmerElement);

      dimmer.onDimmerClosed();

      expect(removeSpy.calledOnce).to.be.true;

      removeSpy.restore();

      done();      
    
    });
  });

  describe('#dimBackgroundContent', function () {
    
    it('Sets $dimmerElement to an object', function (done) {
      
      var expected = 'object', 
          actual,
          appendStub = sinon.stub(jquery.fn, 'append', function () {});

      dimmer.dimBackgroundContent(jquery(win.document.body));

      actual = typeof dimmer.getDimmerElement();

      expect(actual).to.be.equal(expected);
     
      appendStub.restore();
     
      done();
    
    });
    
    it('Invokes jquery.css', function (done) {
      var cssSpy = sinon.stub(jquery.fn, 'css', function () {return this;}),
          appendStub = sinon.stub(jquery.fn, 'append', function () {});

      dimmer.dimBackgroundContent(jquery(win.document.body));

      expect(cssSpy.calledOnce).to.be.true;

      cssSpy.restore();
      appendStub.restore();

      done();

    });
    
    it('Invokes jquery.append', function (done) {

      var appendStub = sinon.stub(jquery.fn, 'append', function () {});

      dimmer.dimBackgroundContent(jquery(win.document.body));

      expect(appendStub.calledOnce).to.be.true;

      appendStub.restore();

      done();
    
    });
  
  });

  describe('#removeDimmer', function () {
    
    it('Invokes jquery.css', function (done) {

      var $dimmerElement = jquery(win.document.getElementById('hlbDimmerElement2')),
          cssSpy = sinon.spy($dimmerElement, 'css'),
          addEventListenerStub = sinon.stub(win.document.getElementById('hlbDimmerElement2'), 'addEventListener', function () {});

      dimmer.setDimmerElement($dimmerElement);

      dimmer.removeDimmer();

      expect(cssSpy.calledOnce).to.be.true;

      cssSpy.restore();
      addEventListenerStub.restore();

      done();

    });

  });


  after(function() {
    delete require.cache[require.resolve(DIMMER_MODULE_PATH)];
  });

});

