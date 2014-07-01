// Require the module file we want to test.
var HLB_MODULE_PATH = '../../source/js/highlight-box',
    EVENT_HANDLERS_MODULE_PATH = './data/modules/hlb/event-handlers',
    HLB_POSITIONING_MODULE_PATH = './data/modules/hlb/positioning',
    HLB_DIMMER_MODULE_PATH = './data/modules/hlb/dimmer',
    HLB_STYLING_MODULE_PATH = './data/modules/hlb/styling',
    HLB_PAGE_PATH   = '../pages/hlb.html',

    hlb             = require(HLB_MODULE_PATH),
    eventHandlers   = require(EVENT_HANDLERS_MODULE_PATH),
    hlbPositioning  = require(HLB_POSITIONING_MODULE_PATH),
    hlbStyling      = require(HLB_STYLING_MODULE_PATH),
    dimmer          = require(HLB_DIMMER_MODULE_PATH),
    win;

require('./test/domutils');

describe('hlb', function() {
  
  before(function() {
    domutils.loadHtml(HLB_PAGE_PATH, function(newWindow) {
      win = newWindow;  // We are unable to change original window, so use the new one
    });
  });
    
  // Any references #mapForm() makes about "inputs" are references to any html element
  // a user can set the value of.  For example: textarea, select, radio, text input, etc.
  describe('#mapForm()', function () {
    
    it('Copies the value of the first text input to the second text input.', 
      
      function (done) {
      
        var $elementOne = jquery(win.document.getElementById('textInputOne')),
            $elementTwo = jquery(win.document.getElementById('textInputTwo')),

            expected    = 'butt',
            actual;

        // Set the first elements value to the expected result
        $elementOne.val(expected);
        
        hlb.mapForm($elementOne, $elementTwo);
        
        // Set the actual result to the value of the second elements value.
        actual = $elementTwo.val();

        expect(actual).to.be.equal(expected);

        done();
    
    });

    it('Copies radio button values from one form to another.',
      
      function (done) {

        var $radioButtonOne = jquery(win.document.getElementById('radioButtonTwo')),
            $radioButtonTwo = jquery(win.document.getElementById('radioButtonFour')),
            $formOne        = jquery(win.document.getElementById('formOne')),
            $formTwo        = jquery(win.document.getElementById('formTwo')),
            expected,
            actual;
       
        $radioButtonOne.prop('checked', true);
       
        expected = $radioButtonOne.prop('checked');

        hlb.mapForm($formOne, $formTwo);

        actual = $radioButtonTwo.prop('checked');

        expect(actual).to.be.equal(expected);

        done();

    });

    it('Copies checkbox values from one form to another.',
      
      function (done) {

        var $checkboxOne = jquery(win.document.getElementById('checkboxTwo')),
            $checkboxTwo = jquery(win.document.getElementById('checkboxFour')),
            $formOne     = jquery(win.document.getElementById('formThree')),
            $formTwo     = jquery(win.document.getElementById('formFour')),
            expected,
            actual;
       
        $checkboxOne.prop('checked', true);
       
        expected = $checkboxOne.prop('checked');

        hlb.mapForm($formOne, $formTwo);

        actual = $checkboxTwo.prop('checked');

        expect(actual).to.be.equal(expected);

        done();        

    });

    it('Copies textarea value from one textarea to another',
    
      function (done){

        var $textareaOne = jquery(win.document.getElementById('textareaOne')),
            $textareaTwo = jquery(win.document.getElementById('textareaTwo')),
            expected     = 'This text will be copied.',
            actual;

        $textareaOne.val(expected);

        hlb.mapForm($textareaOne, $textareaTwo);

        actual = $textareaTwo.val();

        expect(actual).to.be.equal(expected);

        done();

    });

    it('Copies select value from one select to another',
    
      function (done) {

        var $selectOne = jquery(win.document.getElementById('selectOne')),
            $selectTwo = jquery(win.document.getElementById('selectTwo')),
            expected   = $selectOne.val(),
            actual;

        hlb.mapForm($selectOne, $selectTwo);

        actual = $selectTwo.val();

        expect(actual).to.be.equal(expected);

        done();

    });
    
    it('Does not copy over any values from the first non-input element to the second non-input element.', 
      
      function (done) {
      
        var $elementOne = jquery(win.document.getElementById('paragraphOne')),
            $elementTwo = jquery(win.document.getElementById('paragraphTwo')),

            expected    = $elementTwo.val(),
            actual;
        
        hlb.mapForm($elementOne, $elementTwo);
        
        // Set the actual result to the value of the second elements value.
        actual = $elementTwo.val();

        expect(actual).to.be.equal(expected);

        done();
    
    });

  });

  describe('#isHLBScaleGreaterThanOne', function () {

    it('Returns false if element does not have any transform set', function (done) {

      var $body = jquery(win.document.body),
          expected = false,
          actual;

      $body.css('transform', 'none');

      hlb.setHLB($body);

      actual = hlb.isHLBScaleGreaterThanOne();

      expect(actual).to.be.equal(expected);

      done();

    });
    
    it('Returns true if elements scale is greater than 1', function (done) {

      var $body = jquery(win.document.body),
          expected = true,
          actual;

      $body.css('transform', 'matrix(2, 0, 0, 2, 0, 0)');

      hlb.setHLB($body);

      actual = hlb.isHLBScaleGreaterThanOne();

      expect(actual).to.be.equal(expected);

      done();

    });

    it('Returns false if elements scale is equal to 1', function (done) {

      var $body = jquery(win.document.body),
          expected = false,
          actual;

      $body.css('transform', 'matrix(1, 0, 0, 1, 0, 0)');

      hlb.setHLB($body);

      actual = hlb.isHLBScaleGreaterThanOne();

      expect(actual).to.be.equal(expected);

      done();

    });

  });
  
  describe('#getOriginalElement()', function () {

    it('Returns DOM element if jQuery element is passed as a parameter', function (done) {

      var $body    = jquery(win.document.body),
          expected = win.document.body,
          actual   = hlb.getOriginalElement($body);

      expect(actual).to.be.equal(expected);

      done();
    
    });

    it('Returns DOM element if DOM elemnet is passed as a parameter', function (done) {
    
      var body     = win.document.body,
          expected = body,
          actual   = hlb.getOriginalElement(body);

      expect(actual).to.be.equal(expected);

      done();
    
    });

    it('Returns DOM element if modified native event is passed as a parameter', function (done) {
    
      var body = win.document.body,
          
          parameter = {
            'dom': {
              'mouse_highlight': {
                'picked': [body]
              }
            }
          },
          
          expected = body,
          actual   = hlb.getOriginalElement(parameter);

      expect(actual).to.be.equal(expected);

      done();
    
    });

    it('Returns undefined if unmodified native event is passed as a parameter', function (done) {

      var parameter = {},
          expected,
          actual = hlb.getOriginalElement(parameter);

      expect(actual).to.be.equal(expected);

      done();

    });

  });
  
  describe('#onHLBHover', function () {

    it('Sets preventDeflationFromMouseout to false', function (done) {

      var expected = false,
          actual;

      hlb.onHLBHover();

      actual = hlb.getPreventDeflationFromMouseout();

      expect(actual).to.be.equal(expected);

      done();

    });

  });

  describe('#onTargetChange', function () { 

    it('Does not invoke closeHLB() if preventDeflationFromMouseout is true', function (done) {

      var parameter = {},

          // NOTE : I couldn't find a way to listen for closeHLB(), because it is private.
          //        For now, listen for the function below to be called because it is called
          //        by closeHLB().
          closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

      hlb.setHLB(jquery(win.document.body));
      hlb.setOriginalElement(jquery(win.document.body));
      hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
      hlb.setPreventDeflationFromMouseout(true);

      hlb.onTargetChange(parameter);

      expect(closeHLBSpy.calledOnce).to.be.false;

      closeHLBSpy.restore();

      done();

    });

    it('Does not invoke closeHLB() if isSticky is true', function (done) {

      var parameter = {},

          // NOTE : I couldn't find a way to listen for closeHLB(), because it is private.
          //        For now, listen for the function below to be called because it is called
          //        by closeHLB().
          closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

      hlb.setHLB(jquery(win.document.body));
      hlb.setOriginalElement(jquery(win.document.body));
      hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
      hlb.setPreventDeflationFromMouseout(false);
      
      sitecues.toggleStickyHLB();

      hlb.onTargetChange(parameter);

      expect(closeHLBSpy.calledOnce).to.be.false;

      closeHLBSpy.restore();
      sitecues.toggleStickyHLB();

      done();

    });

    it('Does not invoke closeHLB() if element passed as a parameter is same as the current hlb element',
      function (done) {

        var parameter = {
          'target': win.document.body
        },

        // NOTE : I couldn't find a way to listen for closeHLB(), because it is private.
        //        For now, listen for the function below to be called because it is called
        //        by closeHLB().
        closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

        hlb.setHLB(jquery(win.document.body));
        hlb.setOriginalElement(jquery(win.document.body));
        hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
        hlb.setPreventDeflationFromMouseout(false);
        
        hlb.onTargetChange(parameter);

        expect(closeHLBSpy.calledOnce).to.be.false;

        closeHLBSpy.restore();
        
        done();

    });

    it('Does not invoke closeHLB() if the mouse button is pressed', function (done) {

      var parameter = {
        'which': 1
      },

      // NOTE : I couldn't find a way to listen for closeHLB(), because it is private.
      //        For now, listen for the function below to be called because it is called
      //        by closeHLB().
      closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

      hlb.setHLB(jquery(win.document.body));
      hlb.setOriginalElement(jquery(win.document.body));
      hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
      hlb.setPreventDeflationFromMouseout(false);
      
      hlb.onTargetChange(parameter);

      expect(closeHLBSpy.calledOnce).to.be.false;

      closeHLBSpy.restore();      

      done();

    });

    it('Does not invoke closeHLB() if the current mouse coordinates are within the bounding client rect of the HLB',
      function (done) {

        var parameter = {
          'clientX': 0,
          'clientY': 0
        },

        // NOTE : I couldn't find a way to listen for closeHLB(), because it is private.
        //        For now, listen for the function below to be called because it is called
        //        by closeHLB().
        closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

        hlb.setHLB(jquery(win.document.body));
        hlb.setOriginalElement(jquery(win.document.body));
        hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
        hlb.setPreventDeflationFromMouseout(false);
        
        hlb.onTargetChange(parameter);

        expect(closeHLBSpy.calledOnce).to.be.false;

        closeHLBSpy.restore();      

        done();
    
    });

    it('Invokes closeHLB() if the current mouse coordinates are outside the bounding client rect of the HLB',
      function (done) {

        var parameter = {
          'clientX': -100,
          'clientY': -100
        },

        // NOTE : I couldn't find a way to listen for closeHLB(), because it is private.
        //        For now, listen for the function below to be called because it is called
        //        by closeHLB().
        closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

        hlb.setHLB(jquery(win.document.body));
        hlb.setOriginalElement(jquery(win.document.body));
        hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
        hlb.setPreventDeflationFromMouseout(false);
        
        hlb.onTargetChange(parameter);

        expect(closeHLBSpy.calledOnce).to.be.true;

        closeHLBSpy.restore();      

        done();
    
    });

  });

  describe('#initializeHLB', function () {

    it('Invokes eventHandlers.disableWheelScroll', function (done) {

      var parameter = win.document.body,
          disableWheelScrollSpy = sinon.spy(eventHandlers, 'disableWheelScroll'),
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};});

      hlb.initializeHLB(parameter);

      expect(disableWheelScrollSpy.calledOnce).to.be.true;

      disableWheelScrollSpy.restore();

      cssStub.restore();

      done();

    });

    it('Sets preventDeflationFromMouseout to true', function (done) {

      var parameter = win.document.body,
          expected  = true,
          actual,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};});

      hlb.setPreventDeflationFromMouseout(false);

      hlb.initializeHLB(parameter);

      actual = hlb.getPreventDeflationFromMouseout();

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();

    });

    it('Sets $hlbElement to an object', function (done) {

      var parameter = win.document.body,
          expected  = 'object',
          actual,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};});

      hlb.setHLB(undefined);

      hlb.initializeHLB(parameter);

      actual = typeof hlb.getHLB();

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();

    });

    it('Sets $hlbWrappingElement to an object', function (done) {
      
      var parameter = win.document.body,
          expected  = 'object',
          actual,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};});

      hlb.setHLBWrappingElement(undefined);

      hlb.initializeHLB(parameter);

      actual = typeof hlb.getHLBWrappingElement();

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();

    });

    it('Emits two sitecues events', function (done) {

      var parameter       = win.document.body,
          sitecuesEmitSpy = sinon.spy(sitecues, 'emit'),
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};});

      hlb.initializeHLB(parameter);

      expect(sitecuesEmitSpy.calledTwice).to.be.true;

      sitecuesEmitSpy.restore();

      cssStub.restore();

      done();

    });

  });

  describe('#sizeHLB', function () {

    it('Invokes hlbPositioning.initializeSize', function (done) {
      
      var initializeSizeSpy = sinon.spy(hlbPositioning, 'initializeSize');

      hlb.sizeHLB();

      expect(initializeSizeSpy.calledOnce).to.be.true;

      initializeSizeSpy.restore();

      done();

    });

    it('Invokes hlbPositioning.constrainHeightToSafeArea', function (done) {
     
      var constrainHeightToSafeAreaSpy = sinon.spy(hlbPositioning, 'constrainHeightToSafeArea');

      hlb.sizeHLB();

      expect(constrainHeightToSafeAreaSpy.calledOnce).to.be.true;

      constrainHeightToSafeAreaSpy.restore();

      done();      
   
    });
    
    it('Invokes hlbPositioning.constrainWidthToSafeArea', function (done) {
      
      var constrainWidthToSafeAreaSpy = sinon.spy(hlbPositioning, 'constrainWidthToSafeArea');

      hlb.sizeHLB();

      expect(constrainWidthToSafeAreaSpy.calledOnce).to.be.true;

      constrainWidthToSafeAreaSpy.restore();

      done();      
    
    });
    
    it('Invokes hlbPositioning.limitWidth', function (done) {
      
      var limitWidthSpy = sinon.spy(hlbPositioning, 'limitWidth');

      hlb.sizeHLB();

      expect(limitWidthSpy.calledOnce).to.be.true;

      limitWidthSpy.restore();

      done();      
    
    });
    
    it('Invokes hlbPositioning.mitigateVerticalScroll', function (done) {
     
      var mitigateVerticalScrollSpy = sinon.spy(hlbPositioning, 'mitigateVerticalScroll');

      hlb.sizeHLB();

      expect(mitigateVerticalScrollSpy.calledOnce).to.be.true;

      mitigateVerticalScrollSpy.restore();

      done();      
   
    });
    
    it('Invokes hlbPositioning.addVerticalScroll', function (done) {
  
      var addVerticalScrollSpy = sinon.spy(hlbPositioning, 'addVerticalScroll');

      hlb.sizeHLB();

      expect(addVerticalScrollSpy.calledOnce).to.be.true;

      addVerticalScrollSpy.restore();

      done();      
   
    });

  });

  describe('#positionHLB', function () {
    
    it('Invokes hlbPositioning.scaleRectFromCenter', function (done) {
      
      var scaleRectFromCenterStub = sinon.stub(hlbPositioning, 'scaleRectFromCenter', function () { 
            return {
              'width': 0,
              'height': 0,
              'left': 0,
              'right': 0,
              'top': 0,
              'bottom': 0
            };
          }),
          midPointDiffStub = sinon.stub(hlbPositioning, 'midPointDiff', function () {
            return {
              'x': 0,
              'y': 0
            };
          }),
          constrainPositionStub = sinon.stub(hlbPositioning, 'constrainPosition', function () {
            return {
              'x': 0,
              'y': 0
            };
          });

      hlb.setHLB(jquery(win.document.body));
      hlb.setOriginalElement(jquery(win.document.body));
      hlb.positionHLB();

      expect(scaleRectFromCenterStub.calledOnce).to.be.true;

      scaleRectFromCenterStub.restore();
      midPointDiffStub.restore();
      constrainPositionStub.restore();

      done();

    });

    it('Invokes hlbPositioning.midPointDiff', function (done) {
      
      var scaleRectFromCenterStub = sinon.stub(hlbPositioning, 'scaleRectFromCenter', function () { 
            return {
              'width': 0,
              'height': 0,
              'left': 0,
              'right': 0,
              'top': 0,
              'bottom': 0
            };
          }),
          midPointDiffStub = sinon.stub(hlbPositioning, 'midPointDiff', function () {
            return {
              'x': 0,
              'y': 0
            };
          }),
          constrainPositionStub = sinon.stub(hlbPositioning, 'constrainPosition', function () {
            return {
              'x': 0,
              'y': 0
            };
          });

      hlb.setHLB(jquery(win.document.body));
      hlb.setOriginalElement(jquery(win.document.body));
      hlb.positionHLB();

      expect(midPointDiffStub.calledOnce).to.be.true;

      scaleRectFromCenterStub.restore();
      midPointDiffStub.restore();
      constrainPositionStub.restore();

      done();

    });

    it('Invokes hlbPositioning.constrainPosition', function (done) {
      
      var scaleRectFromCenterStub = sinon.stub(hlbPositioning, 'scaleRectFromCenter', function () { 
            return {
              'width': 0,
              'height': 0,
              'left': 0,
              'right': 0,
              'top': 0,
              'bottom': 0
            };
          }),
          midPointDiffStub = sinon.stub(hlbPositioning, 'midPointDiff', function () {
            return {
              'x': 0,
              'y': 0
            };
          }),
          constrainPositionStub = sinon.stub(hlbPositioning, 'constrainPosition', function () {
            return {
              'x': 0,
              'y': 0
            };
          });

      hlb.setHLB(jquery(win.document.body));
      hlb.setOriginalElement(jquery(win.document.body));
      hlb.positionHLB();

      expect(constrainPositionStub.calledOnce).to.be.true;

      scaleRectFromCenterStub.restore();
      midPointDiffStub.restore();
      constrainPositionStub.restore();

      done();

    });

  });
  
  describe('#transitionInHLB', function () {

    it('Invokes dimmer.dimBackgroundContent', function (done) {
      
      var dimBackgroundContentSpy = sinon.spy(dimmer, 'dimBackgroundContent');

      hlb.transitionInHLB();

      expect(dimBackgroundContentSpy.calledOnce).to.be.true;

      dimBackgroundContentSpy.restore();

      done();
    
    });

  });

  describe('#transitionOutHLB', function () {

    it('Invokes sitecues.emit', function (done) {

      var emitSpy = sinon.spy(sitecues, 'emit');

      hlb.transitionOutHLB();

      expect(emitSpy.calledOnce).to.be.true;

      emitSpy.restore();

      done();
    
    });

    it('Invokes element.addEventListener if $hlbElement has a transform scale > 1', function (done) {

      var addEventListenerSpy = sinon.spy(win.document.getElementById('scaledElement'), 'addEventListener');

      hlb.setHLB(jquery(win.document.getElementById('scaledElement')));

      hlb.transitionOutHLB();

      expect(addEventListenerSpy.calledOnce).to.be.true;

      addEventListenerSpy.restore();

      done();

    });

    it('Invokes onHLBClosed if $hlbElement has no transform set', function (done) {

      // NOTE : I couldn't find a way to listen for closeHLB(), because it is private.
      //        For now, listen for the function below to be called because it is called
      //        by onHLBClosed().
      var onHLBClosedSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

      hlb.setHLB(jquery(win.document.getElementById('nonScaledElement')));
      
      hlb.transitionOutHLB();

      expect(onHLBClosedSpy.calledOnce).to.be.true;

      onHLBClosedSpy.restore();      

      done();

    });

  });

  describe('#cloneHLB', function () {

    it('Sets $originalElement to an object', function (done) {

      var parameter = win.document.body,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          expected  = 'object',
          actual;

      hlb.setHLBWrappingElement(undefined);

      hlb.cloneHLB(parameter);

      actual = typeof hlb.$getOriginalElement();

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();

    });
    
    it('Sets $hlbElement to an object', function (done) {
      
      var parameter = win.document.body,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          expected  = 'object',
          actual;

      hlb.setHLB(undefined);

      hlb.cloneHLB(parameter);

      actual = typeof hlb.getHLB();

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();      
    
    });
    
    it('Invokes hlbStyling.cloneStyles', function (done) {

      var parameter = win.document.body,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          cloneStylesSpy = sinon.spy(hlbStyling, 'cloneStyles');

      hlb.cloneHLB(parameter);

      expect(cloneStylesSpy.calledOnce).to.be.true;

      cloneStylesSpy.restore();

      cssStub.restore();

      done();
      
    });
    
    it('Invokes hlbStyling.filter', function (done) {
      
      var parameter = win.document.body,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          filterSpy = sinon.spy(hlbStyling, 'filter');

      hlb.cloneHLB(parameter);

      expect(filterSpy.calledOnce).to.be.true;

      filterSpy.restore();

      cssStub.restore();

      done();      
    
    });
    
    it('Invokes hlbStyling.getHLBStyles', function (done) {
    
      var parameter = win.document.body,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          getHLBStylesSpy = sinon.spy(hlbStyling, 'getHLBStyles');

      hlb.cloneHLB(parameter);

      expect(getHLBStylesSpy.calledOnce).to.be.true;

      getHLBStylesSpy.restore();

      cssStub.restore();

      done();      
    
    });
    
    it('Sets $hlbElement id attribute', function (done) {
      
      var parameter = win.document.body,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          expected = hlb.getDefaultHLBId(),
          actual;

      hlb.cloneHLB(parameter);

      actual = hlb.getHLB()[0].id;

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();            

    });

  });

  describe('#closeHLB', function () {

    it('Sets isHLBClosing to false', function (done) {

      var expected = false,
          actual;

      hlb.setIsHLBClosing(true);
      hlb.setHLB(jquery(win.document.getElementById('nonScaledElement')));
      hlb.setOriginalElement(jquery(win.document.getElementById('nonScaledElement')));
      hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));

      hlb.closeHLB();

      actual = hlb.getIsHLBClosing();

      expect(actual).to.be.equal(expected);

      done();
    
    });
    
    it('Invokes dimmer.removeDimmer', function (done) {
      
      var removeDimmerSpy = sinon.spy(dimmer, 'removeDimmer');

      hlb.setIsHLBClosing(true);
      hlb.setHLB(jquery(win.document.getElementById('nonScaledElement')));
      hlb.setOriginalElement(jquery(win.document.getElementById('nonScaledElement')));
      hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));

      hlb.closeHLB();

      expect(removeDimmerSpy.calledOnce).to.be.true;

      removeDimmerSpy.restore();

      done();
    
    });
  
  });

  describe('#onHLBClosed', function () {
   
    it('Invokes eventHandlers.enableWheelScroll', function (done) {
      
      var enableWheelScrollSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

      hlb.onHLBClosed();

      expect(enableWheelScrollSpy.calledOnce).to.be.true;

      enableWheelScrollSpy.restore();

      done();

    });
  
    it('Sets $hlbElement to undefined', function (done) {
      
      hlb.setHLB(jquery(win.document.body));

      hlb.onHLBClosed();

      expect(hlb.getHLB()).to.be.undefined;

      done();

    });
   
    it('Sets $originalElement to undefined', function (done) {
     
      hlb.setOriginalElement(jquery(win.document.body));
     
      hlb.onHLBClosed();
     
      expect(hlb.$getOriginalElement()).to.be.undefined;
     
      done();
    
    });
   
    it('Sets translateCSS to undefined', function (done) {
    
      hlb.setTranslateCSS('2');
    
      hlb.onHLBClosed();
    
      expect(hlb.getTranslateCSS()).to.be.undefined;
    
      done();
    
    });
  
    it('Sets originCSS to undefined', function (done) {
    
      hlb.setOriginCSS('2');
    
      hlb.onHLBClosed();
    
      expect(hlb.getOriginCSS()).to.be.undefined;
    
      done();
   
    });
   
    it('Sets isHLBClosing to false', function (done) {
   
      hlb.setIsHLBClosing(true);
   
      hlb.onHLBClosed();
   
      expect(hlb.getIsHLBClosing()).to.be.false;
   
      done();
  
    });
  
  });

  describe('#onHLBReady', function () {
    
    it('Invokes $.focus if $hlbElement is an input', function (done) {
      
      var $hlbElement = jquery(win.document.getElementById('textInputOne')),
          focusSpy = sinon.spy($hlbElement, 'focus');

      hlb.setHLB($hlbElement);

      hlb.onHLBReady();

      expect(focusSpy.calledOnce).to.be.true;

      focusSpy.restore();

      done();
    
    });
    
    it('Invokes $.focus if $hlbElement is a text area', function (done) {
      
      var $hlbElement = jquery(win.document.getElementById('textareaOne')),
          focusSpy = sinon.spy($hlbElement, 'focus');

      hlb.setHLB($hlbElement);

      hlb.onHLBReady();

      expect(focusSpy.calledOnce).to.be.true;

      focusSpy.restore();

      done();
    
    });
    
    it('Invokes sitecues.emit', function (done) {
      
      var $hlbElement = jquery(win.document.body),
          emitSpy = sinon.spy(sitecues, 'emit');

      hlb.setHLB($hlbElement);

      hlb.onHLBReady();

      expect(emitSpy.calledOnce).to.be.true;

      emitSpy.restore();

      done();
    
    });
  
  });

  describe('#addHLBWrapper()', function () {
    
    it('Sets $hlbWrappingElement to an object', function (done) {
    
      var expected = 'object',
          actual;

      hlb.addHLBWrapper();

      actual = typeof hlb.getHLBWrappingElement();

      expect(actual).to.be.equal(expected);

      done();
    
    });

    it('Sets $hlbWrappingElement id', function (done) {

      var expected = 'sitecues-hlb-wrapper',
          actual;

      hlb.addHLBWrapper();

      actual = hlb.getHLBWrappingElement()[0].id;

      expect(actual).to.be.equal(expected);

      done();

    });

  });

  describe('#removeHLBWraper()', function () {
    
    it('Invokes jquery.remove', function (done) {

      var $hlbWrappingElement,
          removeSpy;
      
      hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));

      $hlbWrappingElement = hlb.getHLBWrappingElement();

      removeSpy = sinon.spy(jquery.fn, 'remove');

      hlb.removeHLBWrapper();

      expect(removeSpy.calledOnce).to.be.true;

      removeSpy.restore();

      done();
    
    });
  
  });

  describe('#toggleHLB()', function () {
    it('Removes dimmer if $hlbElement exists', function (done) {

      var removeDimmerSpy = sinon.spy(dimmer, 'removeDimmer');

      hlb.setOriginalElement(jquery(win.document.getElementById('nonScaledElement')));

      hlb.setHLB(jquery(win.document.getElementById('nonScaledElement')));

      hlb.toggleHLB();

      expect(removeDimmerSpy.calledOnce).to.be.true;

      removeDimmerSpy.restore();

      done();
    
    });
    
    it('Adds dimmer if an element is passed as a parameter', function (done) {
      
      var dimBackgroundContentSpy = sinon.spy(dimmer, 'dimBackgroundContent'),
          cssSpy                  = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}}});

      hlb.setHLB(undefined);

      hlb.toggleHLB(jquery(win.document.body));

      expect(dimBackgroundContentSpy.calledOnce).to.be.true;

      dimBackgroundContentSpy.restore();
      cssSpy.restore();
      
      done();
   
    });
   
    it('Does not remove or add a dimmer if isHLBClosing is true', function (done) {
   
      var removeDimmerSpy = sinon.spy(dimmer, 'removeDimmer'),
          dimBackgroundContentSpy = sinon.spy(dimmer, 'dimBackgroundContent');

      hlb.setIsHLBClosing(true);

      hlb.toggleHLB();

      expect(!removeDimmerSpy.calledOnce && !dimBackgroundContentSpy.calledOnce).to.be.true;

      removeDimmerSpy.restore();
      dimBackgroundContentSpy.restore();

      done();
   
    });
  
  });

  after(function() {
    delete require.cache[require.resolve(HLB_MODULE_PATH)];
  });

});

