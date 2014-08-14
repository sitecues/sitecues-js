// Require the module file we want to test.
var HLB_POSITIONING_MODULE_PATH = '../../../source/js/hlb/positioning',
    HLB_SAFE_AREA_MODULE_PATH   = '../data/modules/hlb/safe-area',
    COMMON_MODULE_PATH          = '../data/modules/util/common',
    HLB_PAGE_PATH               = './data/html/test-hlb.html',

    common          = require(COMMON_MODULE_PATH),
    hlbPositioning  = require(HLB_POSITIONING_MODULE_PATH),
    hlbSafeArea     = require(HLB_SAFE_AREA_MODULE_PATH),
    win;

require('../test/domutils');

describe('hlbPositioning', function() {

  before(function() {
    domutils.loadHtml(HLB_PAGE_PATH, function(newWindow) {
      win = newWindow;
    });
  });

  // The isEligibleForConstrainedWidth() purpose is to determine if the $hlbElement is going to have
  // its width restricted by 50 x-characters
  describe('#isEligibleForConstrainedWidth()', function () {

    it('Returns true if element passed is a paragraph because paragraphs are valid elements ' +
       'for limiting the width to 50-X characters.', function (done) {

        var $hlbElement = jquery('<p>');

        expect(hlbPositioning.isEligibleForConstrainedWidth($hlbElement)).to.be.true;

        done();

    });

    it('Returns false if element passed is a div because divs are invalid elements ' +
       'for limiting the width to 50-X characters.', function (done) {

        var $hlbElement = jquery('<div>');

        expect(hlbPositioning.isEligibleForConstrainedWidth($hlbElement)).to.be.false;

        done();

    });

  });

  // The fixOverflowWidth() purpose is to set the width of the $hlbElement to something that includes
  // all of its visual content horizontally.
  describe('#fixOverflowWidth()', function () {

    it('Invokes hlbSafeArea.getSafeZoneBoundingBox if $hlbElement clientWidth is less than the scrollWidth ' +
       'because if the clientWidth is less than the scrollWidth it means that content flows, visually, outside ' +
       'the HLB element.' ,

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

  // The getExtraLeftPadding() purpose is to return how much left-padding is on the $hlbElement that isn't
  // default padding.  $hlbElement receives extra left padding if it is a list.
  describe('#getExtraLeftPadding()', function () {

    it('Returns type number', function (done) {

      var $hlbElement = jquery(win.document.getElementById('paragraph')),
          expected    = 'number',
          actual;

      actual = typeof hlbPositioning.getExtraLeftPadding($hlbElement);

      expect(actual).to.be.equal(expected);

      done();

    });

  });

  // The midPointDiff() purpose is to calculate and return the difference between two rectangle midpoints.
  describe('#midPointDiff()', function () {

    it('Returns an object because the object represents the x-axis and y-axis difference between ' +
       'two rectangles.', function (done) {

      var $rectOne = jquery(win.document.getElementById('paragraph')),
          $rectTwo = jquery(win.document.getElementById('paragraph')),
          expected = 'object',
          result   = hlbPositioning.midPointDiff($rectOne, $rectTwo),
          actual   = typeof result;

      expect(actual).to.be.equal(expected);

      done();

    });

    it('Returns an object whose properties have values of 0 if both elements midpoints overlap', function (done) {

      var $rectOne = jquery(win.document.getElementById('paragraph')),
          $rectTwo = jquery(win.document.getElementById('paragraph')),
          expected = 0,
          result   = hlbPositioning.midPointDiff($rectOne, $rectTwo),
          actual   = result.x + result.y;

      expect(actual).to.be.equal(expected);

      done();

    });

  });

  // The limitWidth() purpsose  is to limit the width of the $hlbElement to 50 x-characters.
  describe('#limitWidth()', function () {

    it('Invokes jquery.css if $hlbElement is a paragraph because we rely upon jQuery to limit the width of the ' +
       '$hlbElement.', function (done) {

      var $hlbElement = jquery('<p>'),
          cssSpy = sinon.spy(jquery.fn, 'css');

      hlbPositioning.limitWidth($hlbElement, $hlbElement, 1);

      expect(cssSpy.calledOnce).to.be.true;

      cssSpy.restore();

      done();

    });

  });

  // The mitigateVerticalScroll() purpose is to increase the height of the $hlbElement until the $hlbElement has
  // no vertical scrollbar or it is as tall as the safe-area height (whichever comes first).
  describe('#mitigateVerticalScroll()', function () {

    it('Invokes jquery.css if common.hasVertScroll returns true and' +
       'height of $hlbElement is less than the height of the safe area because ' +
       'we rely upon jQuery to set the height of the HLB element',
      function (done) {

        var $hlbElement             = jquery('<p>'),
            hasVertScrollStub       = sinon.stub(common, 'hasVertScroll', function () {return true;}),
            cssSpy                  = sinon.spy(jquery.fn, 'css'),

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

        expect(cssSpy.called).to.be.true;

        hasVertScrollStub.restore();
        cssSpy.restore();
        scaleRectFromCenterStub.restore();
        getSafeZoneBoundingBoxStub.restore();
        constrainHeightToSafeAreaStub.restore();

        done();
    });

  });

  // The constrainPosition() purpose is to calculate and return the distance the HLB element must travel
  // to occupy the safe-area.
  describe('#constrainPosition()', function () {

    it('Returns an object with x and y properties', function (done) {

      var parameter = {
        'left'  : 0,
        'right' : 0,
        'top'   : 0,
        'bottom': 0,
        'width' : 0,
        'height': 0
      },
      result = hlbPositioning.constrainPosition(parameter);

      expect(result.hasOwnProperty('x')).to.be.true;
      expect(result.hasOwnProperty('y')).to.be.true;

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

  // The constrainHeightToSafeArea() purpose is to force the HLB element to never have a height greater than
  // the height of the safe-area.
  describe('#constrainHeightToSafeArea', function () {

    it('Invokes hlbSafeArea.getSafeZoneBoundingBox because we rely upon another module to ' +
       'calculate and return the safe zone bounding box', function (done) {

      var getSafeZoneBoundingBoxSpy = sinon.spy(hlbSafeArea, 'getSafeZoneBoundingBox'),
          $hlbElement = jquery(win.document.getElementById('overflowWidth'));

      hlbPositioning.constrainHeightToSafeArea($hlbElement);

      expect(getSafeZoneBoundingBoxSpy.calledOnce).to.be.true;

      getSafeZoneBoundingBoxSpy.restore();

      done();

    });

    it('Invokes jquery.css if scaled rect parameter ' +
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

        expect(cssSpy.called).to.be.true;

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

        expect(cssSpy.called).to.be.true;

        isVisualMediaStub.restore();
        scaleRectFromCenterStub.restore();
        getSafeZoneBoundingBoxStub.restore();
        cssSpy.restore();

        done();

      });

  });

  // The constrainHeightToSafeArea() purpose is to force the HLB element to never have a width greater than
  // the width of the safe-area.
  describe('#constrainWidthToSafeArea()', function () {

    it('Invokes hlbSafeArea.getSafeZoneBoundingBox because we rely upon another module to ' +
       'calculate and return the safe zone bounding box', function (done) {

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

  // The scaleRectFromCenter() purpose is to calculate and return a scaled bounding client rect.
  describe('#scaleRectFromCenter()', function () {

    it('Returns an object because the functions purpose is to simulate a bounding client rect.', function (done) {

      var $hlbElement = jquery(win.document.getElementById('overflowWidth')),
          expected    = 'object',
          actual;

      actual = typeof hlbPositioning.scaleRectFromCenter($hlbElement);

      expect(actual).to.be.equal(expected);

      done();

    });

    it('Returns an object whose width and height properties are scaled by getHLBTransformScale() of the ' +
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

            expected = (width + height) * hlbSafeArea.getHLBTransformScale(),
            actual   = result.width + result.height;

        expect(actual).to.be.equal(expected);

        boundingClientRectStub.restore();

        done();

      });

  });

  // The addVerticalScroll() purpose is to determine if the HLB element requires a vertical
  // scrollbar, and applies it if necessary.
  describe('#addVerticalScroll()', function () {

    it('Invokes jquery.css if common.hasVertScroll returns true because we rely upon ' +
       'jQuery to set the scrollbar', function (done) {

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

  // The initializeSize() purpose is to set the HLB elements ideal height and width.
  describe('#initializeSize()', function () {

    it('Invokes jquery.css because we rely upon jQuery for setting the HLB elements ' +
       'height and width.', function (done) {

      var $hlbElement       = jquery(win.document.getElementById('paragraph')),
          $originalElemenet = jquery(win.document.getElementById('paragraph')),
          cssSpy            = sinon.spy(jquery.fn, 'css');

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

