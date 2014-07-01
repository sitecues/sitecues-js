// Require the module file we want to test.
var HLB_POSITIONING_MODULE_PATH = '../../../source/js/hlb/positioning',
    HLB_STYLING_MODULE_PATH = '../data/modules/hlb/styling',
    HLB_SAFE_AREA_MODULE_PATH = '../data/modules/hlb/safe-area',
    COMMON_MODULE_PATH = '../data/modules/util/common',
    HLB_PAGE_PATH   = '../pages/hlb.html',
    
    common          = require(COMMON_MODULE_PATH),
    hlbPositioning  = require(HLB_POSITIONING_MODULE_PATH),
    hlbStyling      = require(HLB_STYLING_MODULE_PATH),
    hlbSafeArea     = require(HLB_SAFE_AREA_MODULE_PATH),
    win;

require('../test/domutils');

describe('hlbPositioning', function() {
  
  before(function() {   
    domutils.loadHtml(HLB_PAGE_PATH, function(newWindow) {
      win = newWindow;  // We are unable to change original window, so use the new one
    });
  });

  describe('#isEligibleForConstrainedWidth()', function () {
  
    it('Returns true if element passed is a paragraph', function (done) {
        
        var $hlbElement = jquery('<p>');

        expect(hlbPositioning.isEligibleForConstrainedWidth($hlbElement)).to.be.true;

        done();

    });
  
    it('Returns false if element passed is a div', function (done) {
        
        var $hlbElement = jquery('<div>');

        expect(hlbPositioning.isEligibleForConstrainedWidth($hlbElement)).to.be.false;

        done();

    });
  
  });
  
  describe('#fixOverflowWidth()', function () {
   
    it('Invokes hlbSafeArea.getSafeZoneBoundingBox if $hlbElement clientWidth is less than the scrollWidth', 
  
      function (done) {
  
        var $hlbElement = jquery(win.document.getElementById('overflowWidth')),
            getSafeZoneBoundingBoxSpy = sinon.spy(hlbSafeArea, 'getSafeZoneBoundingBox');

        $hlbElement[0].clientWidth = 1;
        $hlbElement[0].scrollWidth = 2;

        hlbPositioning.fixOverflowWidth($hlbElement);

        expect(getSafeZoneBoundingBoxSpy.calledOnce).to.be.true;

        getSafeZoneBoundingBoxSpy.restore();

        done();

    });
  
  });

  describe('#getExtraLeftPadding()', function () {

    it('Returns a number', function (done) {

      var $hlbElement = jquery(win.document.body),
          expected    = 'number',
          actual;

      actual = typeof hlbPositioning.getExtraLeftPadding($hlbElement);

      expect(actual).to.be.equal(expected);

      done();

    });

  });

  describe('#midPointDiff()', function () {
    
    it('Returns an object', function (done) {
    
      var $rectOne = jquery(win.document.body),
          $rectTwo = jquery(win.document.body),
          expected = 'object',
          result   = hlbPositioning.midPointDiff($rectOne, $rectTwo),
          actual   = typeof result;

      expect(actual).to.be.equal(expected);
      
      done();    
    
    });
  
    it('Returns an object whose properties have values of 0', function (done) {
      
      var $rectOne = jquery(win.document.body),
          $rectTwo = jquery(win.document.body),
          expected = 0,
          result   = hlbPositioning.midPointDiff($rectOne, $rectTwo),
          actual   = result.x + result.y;

      expect(actual).to.be.equal(expected);
      
      done();       
    
    });

  });

  describe('#limitWidth()', function () {
  
    it('Invokes jquery.css if $hlbElement is a paragraph', function (done) {
      
      var $hlbElement = jquery('<p>'),
          cssSpy = sinon.spy(jquery.fn, 'css');

      hlbPositioning.limitWidth($hlbElement, $hlbElement, 1);

      expect(cssSpy.calledOnce).to.be.true;
      
      cssSpy.restore();
     
      done(); 
    
    });
  
  });

  describe('#mitigateVerticalScroll()', function () {
    
    it('Invokes jquery.css if common.hasVertScroll returns true and' +
       'height of $hlbElement is less than the height of the safe area', 
      function (done) {
        var $hlbElement = jquery('<p>'),
            hasVertScrollStub = sinon.stub(common, 'hasVertScroll', function () {return true;}),
            cssSpy = sinon.spy(jquery.fn, 'css'),
            scaleRectFromCenterStub = sinon.stub(hlbPositioning.hlbPositioning, 'scaleRectFromCenter', function () {
              return {
                'height': 0
              };
            }),
            getSafeZoneBoundingBoxStub = sinon.stub(hlbSafeArea, 'getSafeZoneBoundingBox', function () {
              return {
                'height': 10
              };
            }),
            constrainHeightToSafeAreaStub = sinon.stub(hlbPositioning.hlbPositioning, 'constrainHeightToSafeArea', function () {});

        hlbPositioning.mitigateVerticalScroll($hlbElement);

        expect(cssSpy.calledOnce).to.be.true;

        hasVertScrollStub.restore();
        cssSpy.restore();
        scaleRectFromCenterStub.restore();
        getSafeZoneBoundingBoxStub.restore();
        constrainHeightToSafeAreaStub.restore();

        done();
    });

  });

  describe('#constrainPosition()', function () {
    
    it('Returns an object', function (done) {

      var parameter = {
        'left'  : 0,
        'right' : 0,
        'top'   : 0,
        'bottom': 0,
        'width' : 0,
        'height': 0
      },
     
      expected = 'object',
      actual;

      actual = typeof hlbPositioning.constrainPosition(parameter);

      expect(actual).to.be.equal(expected);

      done();
    
    });
    
    it('Returns an object whose properties add up to 0 if the parameter (rect) ' + 
      'passed is inside the the safe area rect',
      function (done) {

        var parameter = {
          'left'  : 10,
          'right' : 20,
          'top'   : 10,
          'bottom': 20,
          'width' : 10,
          'height': 10
        },

        constrainPositionStub = sinon.stub(hlbSafeArea, 'getSafeZoneBoundingBox', function () {
          return {
            'left'  : 0,
            'right' : 100,
            'top'   : 0,
            'bottom': 100,
            'width' : 100,
            'height': 100
          };
        }),
       
        expected = 0,

        result = hlbPositioning.constrainPosition(parameter),

        actual = result.x + result.y;

        expect(actual).to.be.equal(expected);

        constrainPositionStub.restore();

        done();
      
      });
  
  }); 

  describe('#constrainHeightToSafeArea', function () {
    
    it('Invokes hlbSafeArea.getSafeZoneBoundingBox', function (done) {

      var getSafeZoneBoundingBoxSpy = sinon.spy(hlbSafeArea, 'getSafeZoneBoundingBox'),
          $hlbElement = jquery(win.document.getElementById('overflowWidth'));

      hlbPositioning.constrainHeightToSafeArea($hlbElement);

      expect(getSafeZoneBoundingBoxSpy.calledOnce).to.be.true;

      getSafeZoneBoundingBoxSpy.restore();

      done();

    });
    
    it('Invokes jquery.css once if scaled rect parameter ' +
      'is taller than safe zone height and element is not isVisualMedia',
      function (done) {
        
        var isVisualMediaStub = sinon.stub(common, 'isVisualMedia', function () {
              return false;
            }),
            scaleRectFromCenterStub = sinon.stub(hlbPositioning.hlbPositioning, 'scaleRectFromCenter', function () {
              return {
                'height': 100
              };
            }),
            getSafeZoneBoundingBoxStub = sinon.stub(hlbSafeArea, 'getSafeZoneBoundingBox', function () {
              return {
                'height': 5
              };
            }),
            cssSpy = sinon.spy(jquery.fn, 'css'),
            $hlbElement = jquery(win.document.getElementById('overflowWidth'));

        hlbPositioning.constrainHeightToSafeArea($hlbElement);

        expect(cssSpy.calledOnce).to.be.true;

        isVisualMediaStub.restore();
        scaleRectFromCenterStub.restore();
        getSafeZoneBoundingBoxStub.restore();
        cssSpy.restore();

        done();

      });
    
    it('Invokes jquery.css twice if scaled rect parameter ' +
      'is taller than safe zone height and element isVisualMedia',
      function (done) {
      
        var isVisualMediaStub = sinon.stub(common, 'isVisualMedia', function () {
              return true;
            }),
            scaleRectFromCenterStub = sinon.stub(hlbPositioning.hlbPositioning, 'scaleRectFromCenter', function () {
              return {
                'height': 100
              };
            }),
            getSafeZoneBoundingBoxStub = sinon.stub(hlbSafeArea, 'getSafeZoneBoundingBox', function () {
              return {
                'height': 5
              };
            }),
            cssSpy = sinon.spy(jquery.fn, 'css'),
            $hlbElement = jquery(win.document.getElementById('overflowWidth'));

        hlbPositioning.constrainHeightToSafeArea($hlbElement);

        expect(cssSpy.calledTwice).to.be.true;

        isVisualMediaStub.restore();
        scaleRectFromCenterStub.restore();
        getSafeZoneBoundingBoxStub.restore();
        cssSpy.restore();

        done();
      
      });
  
  });

  describe('#constrainWidthToSafeArea()', function () {
    
    it('Invokes hlbSafeArea.getSafeZoneBoundingBox', function (done) {

      var getSafeZoneBoundingBoxSpy = sinon.spy(hlbSafeArea, 'getSafeZoneBoundingBox'),
          $hlbElement = jquery(win.document.getElementById('overflowWidth'));

      hlbPositioning.constrainWidthToSafeArea($hlbElement);

      expect(getSafeZoneBoundingBoxSpy.calledOnce).to.be.true;

      getSafeZoneBoundingBoxSpy.restore();

      done();

    });
    
    it('Invokes jquery.css twice if scaled rect parameter ' +
      'is wider than safe zone width and element is not isVisualMedia',
      function (done) {
        
        var isVisualMediaStub = sinon.stub(common, 'isVisualMedia', function () {
              return false;
            }),
            scaleRectFromCenterStub = sinon.stub(hlbPositioning.hlbPositioning, 'scaleRectFromCenter', function () {
              return {
                'width': 100
              };
            }),
            getSafeZoneBoundingBoxStub = sinon.stub(hlbSafeArea, 'getSafeZoneBoundingBox', function () {
              return {
                'width': 5
              };
            }),
            cssSpy = sinon.spy(jquery.fn, 'css'),
            $hlbElement = jquery(win.document.getElementById('overflowWidth'));

        hlbPositioning.constrainWidthToSafeArea($hlbElement);

        expect(cssSpy.calledTwice).to.be.true;

        isVisualMediaStub.restore();
        scaleRectFromCenterStub.restore();
        getSafeZoneBoundingBoxStub.restore();
        cssSpy.restore();

        done();

      });
    
    it('Invokes jquery.css thrice if scaled rect parameter ' +
      'is wider than safe zone width and element isVisualMedia',
      function (done) {
      
        var isVisualMediaStub = sinon.stub(common, 'isVisualMedia', function () {
              return true;
            }),
            scaleRectFromCenterStub = sinon.stub(hlbPositioning.hlbPositioning, 'scaleRectFromCenter', function () {
              return {
                'width': 100
              };
            }),
            getSafeZoneBoundingBoxStub = sinon.stub(hlbSafeArea, 'getSafeZoneBoundingBox', function () {
              return {
                'width': 5
              };
            }),
            cssSpy = sinon.spy(jquery.fn, 'css'),
            $hlbElement = jquery(win.document.getElementById('overflowWidth'));

        hlbPositioning.constrainWidthToSafeArea($hlbElement);

        expect(cssSpy.calledThrice).to.be.true;

        isVisualMediaStub.restore();
        scaleRectFromCenterStub.restore();
        getSafeZoneBoundingBoxStub.restore();
        cssSpy.restore();

        done();
      
      });
 
  });

  describe('#scaleRectFromCenter()', function () {
    
    it('Returns an object', function (done) {
      
      var $hlbElement = jquery(win.document.getElementById('overflowWidth')),
          expected    = 'object',
          actual;

      actual = typeof hlbPositioning.scaleRectFromCenter($hlbElement);

      expect(actual).to.be.equal(expected);

      done();  
   
    });
    
    it('Returns an object whose width and height properties are scaled by HLBZoom of the ' +
       'inputs height and width values', 
      function (done) {

        var height = 100,
            width  = 100,

            $hlbElement = jquery(win.document.getElementById('overflowWidth')),

            boundingClientRectStub = sinon.stub($hlbElement[0], 'getBoundingClientRect', function () {
              return {
                'left'  : 0,
                'top'   : 0,
                'width' : width,
                'height': height,
                'right' : 100,
                'bottom': 100
              };
            }),

            result   = hlbPositioning.scaleRectFromCenter($hlbElement),

            expected = (width + height) * hlbSafeArea.HLBZoom,
            actual   = result.width + result.height;

        expect(actual).to.be.equal(expected);

        boundingClientRectStub.restore();

        done();

      });
  
  });

  describe('#addVerticalScroll()', function () {

    it('Invokes jquery.css if common.hasVertScroll returns true', function (done) {

      var hasVertScrollStub = sinon.stub(common, 'hasVertScroll', function () {
            return true;
          }),
          cssSpy      = sinon.spy(jquery.fn, 'css'),
          $hlbElement = jquery(win.document.getElementById('nonScaledElement'));

      hlbPositioning.addVerticalScroll($hlbElement);

      expect(cssSpy.called).to.be.true;

      hasVertScrollStub.restore();
      cssSpy.restore();

      done();

    });

  });

  describe('#initializeSize()', function () {

    it('Invokes jquery.css', function (done) {
     
      var $hlbElement = jquery(win.document.body),
          $originalElemenet = jquery(win.document.body),
          cssSpy = sinon.spy(jquery.fn, 'css');

      hlbPositioning.initializeSize($hlbElement, $originalElemenet);

      expect(cssSpy.calledOnce);

      cssSpy.restore();
     
      done();
    
    });

  });

  after(function() {
    delete require.cache[require.resolve(HLB_POSITIONING_MODULE_PATH)];
  });

});

