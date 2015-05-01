    // Actual source file for highlight-box module.
var HLB_MODULE_PATH             = '../../source/js/highlight-box',

    // Mocked source files that are highlight-box dependencies.
    HLB_POSITIONING_MODULE_PATH    = './data/modules/hlb/positioning',
    HLB_DIMMER_MODULE_PATH         = './data/modules/hlb/dimmer',
    HLB_STYLING_MODULE_PATH        = './data/modules/hlb/styling',
    HLB_PAGE_PATH                  = './data/html/test-hlb.html',
    HLB_ANIMATION                  = './data/modules/hlb/animation',
    HLB_EVENT_HANDLERS_MODULE_PATH = './data/modules/hlb/event-handlers',

    // Load 'em up.
    hlb              = require(HLB_MODULE_PATH),
    hlbPositioning   = require(HLB_POSITIONING_MODULE_PATH),
    hlbStyling       = require(HLB_STYLING_MODULE_PATH),
    dimmer           = require(HLB_DIMMER_MODULE_PATH),
    hlbAnimation     = require(HLB_ANIMATION),
    hlbEventHandlers = require(HLB_EVENT_HANDLERS_MODULE_PATH),

    // Global window shared by all unit tests in this file.
    win;

// This require exposes a global variable to all tests.  (domutils)
require('./test/domutils');

describe('highlight-box', function() {

  before(function() {
    domutils.loadHtml(HLB_PAGE_PATH, function(newWindow) {
      win = newWindow;
    });
  });

  describe('#getValidFoundation()', function () {

    it('Sets removeTemporaryFoundation to true if the picked element is an <li> because the HLB ' +
       'module relies upon this variable to determine if the foundation ' +
       'element needs to be removed from the DOM', function (done) {

        var $picked = jquery(win.document.getElementById('list-item')),

            appendStub = sinon.stub(jquery.fn, 'append', function () {

              var result = [];

              result[0] = {'style': {}};

              result['style'] = {};

              result['css'] = function () {
                                return {
                                  'insertAfter': function () {}
                                };
                              };
              return result;

            }),

            isStub = sinon.stub(jquery.fn, 'is', function () {
              return true;
            }),

            cssStub = sinon.stub(jquery.fn, 'css', function () {
              return {
                'insertAfter':function () {}
              }
            }),

            findStub = sinon.stub(jquery.fn, 'find', function () {
              return {
                'addBack': function () {
                  return [];
                }
              };
            });

        hlb.setRemoveTemporaryFoundation(false);

        hlb.getValidFoundation($picked);

        expect(hlb.getRemoveTemporaryFoundation()).to.be.true;

        hlb.setRemoveTemporaryFoundation(false);

        appendStub.restore();
        isStub.restore();
        cssStub.restore();
        findStub.restore();

        done();
    });

    it('Sets does not set removeTemporaryOriginalElement to true if the original element is a paragraph because the HLB ' +
       'moduel relies upon this variable to determine if the original ' +
       'element needs to be removed from the DOM', function (done) {

        var $picked = jquery(win.document.getElementById('paragraph')),

            appendStub = sinon.stub(jquery.fn, 'append', function () {

              var result = [];

              result[0] = {'style': {}};

              result['style'] = {};

              result['css'] = function () {
                                return {
                                  'insertAfter': function () {}
                                };
                              };
              return result;

            }),

            isStub = sinon.stub(jquery.fn, 'is', function () {
              return false;
            }),

            cssStub = sinon.stub(jquery.fn, 'css', function () {
              return {
                'insertAfter':function () {}
              }
            }),

            findStub = sinon.stub(jquery.fn, 'find', function () {
              return {
                'addBack': function () {
                  return [];
                }
              };
            });

        hlb.setRemoveTemporaryFoundation(false);

        hlb.getValidFoundation($picked);

        expect(hlb.getRemoveTemporaryFoundation()).to.be.false;

        hlb.setRemoveTemporaryFoundation(false);

        appendStub.restore();
        isStub.restore();
        cssStub.restore();
        findStub.restore();

        done();
    });

  });

  // The mapForm() purpose is to clone a form chosen by the picker to render
  // as a highlight-box, preserving all values set in the original form.
  describe('#mapForm()', function () {

    describe('Updates the values of one set of form elements with values from another set of form elements', function () {

      it('Text input values are copied from one form to another',

        function (done) {

          var $elementOne = jquery(win.document.getElementById('textInputOne')),
              $elementTwo = jquery(win.document.getElementById('textInputTwo')),

              expected    = 'p',
              actual;

          // Set the first elements value to the expected result
          $elementOne.val(expected);

          hlb.mapForm($elementOne, $elementTwo);

          // Set the actual result to the value of the second elements value.
          actual = $elementTwo.val();

          expect(actual).to.be.equal(expected);

          done();

      });

      it('Radio button values are copied from one form to another.',

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

      it('Checkbox values are copied from one form to another.',

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

      it('Textarea values are copied from one form to another',

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

      it('Select values are copied from one form to another',

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

    });

    it('Paragraph values are never copied from one element to another',

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

  // The onHLBHover() purpose is to allow the closing of the HLB by moving the mouse
  // outside the bounding rect of the HLB when the HLB is hovered over.
  describe('#onHLBHover', function () {

    it('Sets preventDeflationFromMouseout to false because preventDeflationFromMouseout, if true, ' +
       'prevents the HLB from deflating by moving the mouse outside of the bounding rect of the HLB', function (done) {

      var expected = false,
          actual;

      hlb.setHLB({'off':function(){}});

      hlb.onHLBHover();

      actual = hlb.getPreventDeflationFromMouseout();

      expect(actual).to.be.equal(expected);

      hlb.setHLB();

      done();

    });

  });

  // The onTargetChange() is a mouse move callback whose purpose is to close the HLB if the state of the HLB allows it.
  describe('#onTargetChange', function () {
    it('Invokes closeHLB() if the current mouse coordinates are outside the bounding client rect of the HLB because ' +
       'the HLB should close if the user moves outside the bounding rect of the HLB if the user has already had their ' +
       'mouse within the coordinates of the HLB bounding rect', function (done) {

        var mockedNativeMousemoveEventObject = {
          'clientX': -100,
          'clientY': -100
        },

        // NOTE : I couldn't find a way to listen for closeHLB(), because it is private.
        //        For now, listen for the function below to be called because it is called
        //        by closeHLB().
        closeHLBSpy = sinon.spy(hlbAnimation, 'transitionOutHLB');

        hlb.setHLB(jquery(win.document.getElementById('paragraph')));
        hlb.setFoundation(jquery(win.document.getElementById('paragraph')));
        hlb.setHLBWrapper(jquery(win.document.getElementById('hlbWrappingElement')));
        hlb.setPreventDeflationFromMouseout(false);

        hlb.onTargetChange(mockedNativeMousemoveEventObject);

        expect(closeHLBSpy.calledOnce).to.be.true;

        closeHLBSpy.restore();

        done();

    });

  });

  // The initializeHLB() purpose is the first step in the creation process for the HLB.
  // This function is responsible for cloning the original element, mapping form data,
  // cloning child styles, filtering attributes, styles, and elements, and setting the
  // HLB with default styles and computed styles.
  describe('#initializeHLB', function () {

    it('Invokes eventHandlers.captureWheelEvents because the user should not be able to scroll the document ' +
       'while the HLB is open', function (done) {

      var paragraph             = win.document.getElementById('paragraph'),
          disableWheelScrollSpy = sinon.spy(hlbEventHandlers, 'captureWheelEvents'),
          cssStub               = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          insertAfterStub       = sinon.stub(hlb.getHLBWrapper(), 'insertAfter', function () {});

      hlb.setHighlight({});
      hlb.initializeHLB(paragraph);

      expect(disableWheelScrollSpy.calledOnce).to.be.true;

      disableWheelScrollSpy.restore();

      cssStub.restore();
      insertAfterStub.restore();
      hlb.setHighlight();

      done();

    });

    it('Sets preventDeflationFromMouseout to true because the HLB should never close by ' +
       'mouse movements until the mouse is inside the HLB', function (done) {

      var paragraph       = win.document.getElementById('paragraph'),
          cssStub         = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          insertAfterStub = sinon.stub(hlb.getHLBWrapper(), 'insertAfter', function () {}),
          expected        = true,
          actual;

      hlb.setPreventDeflationFromMouseout(false);
      hlb.setHighlight({});
      hlb.initializeHLB(paragraph);

      actual = hlb.getPreventDeflationFromMouseout();

      expect(actual).to.be.equal(expected);

      cssStub.restore();
      insertAfterStub.restore();
      hlb.setHighlight();
      done();

    });

    it('Sets $hlbElement to an object because $hlbElement is a private variable in the scope of ' +
       'the HLB module, which is used by other private functions, and should be assigned a jQuery collection.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          expected  = 'object',
          actual,
          insertAfterStub = sinon.stub(hlb.getHLBWrapper(), 'insertAfter', function () {}),
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};});

      hlb.setHLB(undefined);
      hlb.setHighlight({});
      hlb.initializeHLB(paragraph);

      actual = typeof hlb.getHLB();

      expect(actual).to.be.equal(expected);

      cssStub.restore();
      insertAfterStub.restore();
      hlb.setHighlight();
      done();

    });

    it('Sets $hlbWrapper to an object because $hlbWrappingElement is a private variable in the scope of ' +
       'the HLB module, which is used by other private functions, and should be assigned a jQuery function.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          expected  = 'object',
          actual,
          insertAfterStub = sinon.stub(hlb.getHLBWrapper(), 'insertAfter', function () {}),
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};});
      hlb.setHighlight({});
      hlb.setHLBWrapper(undefined);

      hlb.initializeHLB(paragraph);

      actual = typeof hlb.getHLBWrapper();

      expect(actual).to.be.equal(expected);

      cssStub.restore();
      insertAfterStub.restore();
      hlb.setHighlight();
      done();

    });

  });

  // The cloneHLB() purpose is to clone the element and styles passed by the picker to create a new HLB.
  describe('#cloneHLB', function () {

    it('Sets $originalElement to an object because $originalElement is a private variable that references ' +
       'the original element passed to the HLB module by the picker.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          cssStub   = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          expected  = 'object',
          actual;

      hlb.setHighlight({});
      hlb.setHLBWrapper(undefined);

      hlb.cloneHLB(paragraph);

      actual = typeof hlb.$getFoundation();

      expect(actual).to.be.equal(expected);

      cssStub.restore();
      hlb.setHighlight();
      done();

    });

    it('Sets $hlb to an object because $hlbElement is a private variable that references ' +
       'the element we create that is a result of cloning the original element', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          cssStub   = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          expected  = 'object',
          actual;
      hlb.setHighlight({});
      hlb.setHLB(undefined);

      hlb.cloneHLB(paragraph);

      actual = typeof hlb.getHLB();

      expect(actual).to.be.equal(expected);

      cssStub.restore();
      hlb.setHighlight();
      done();

    });

    it('Invokes hlbStyling.initializeStyles because the HLB module relies upon another module to initializeStyles styles.', function (done) {

      var paragraph      = win.document.getElementById('paragraph'),
          cssStub        = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          initializeStylesSpy = sinon.spy(hlbStyling, 'initializeStyles');
      hlb.setHighlight({});
      hlb.cloneHLB(paragraph);

      expect(initializeStylesSpy.calledOnce).to.be.true;

      initializeStylesSpy.restore();

      cssStub.restore();
      hlb.setHighlight();
      done();

    });

    it('Invokes hlbStyling.filter because the HLB module relies upon another module to filter styles.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          cssStub   = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          filterSpy = sinon.spy(hlbStyling, 'filter');
      hlb.setHighlight({});
      hlb.cloneHLB(paragraph);

      expect(filterSpy.calledOnce).to.be.true;

      filterSpy.restore();

      cssStub.restore();
      hlb.setHighlight();
      done();

    });

    it('Invokes hlbStyling.getHLBStyles because the HLB module relies upon another module to get styles.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          getHLBStylesSpy = sinon.spy(hlbStyling, 'getHLBStyles');
      hlb.setHighlight({});
      hlb.cloneHLB(paragraph);

      expect(getHLBStylesSpy.calledOnce).to.be.true;

      getHLBStylesSpy.restore();

      cssStub.restore();
      hlb.setHighlight();
      done();

    });

    it('Sets $hlb id attribute because only one HLB can exist at any one moment.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          cssStub   = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          expected  = hlb.getDefaultHLBId(),
          actual;
      hlb.setHighlight({});
      hlb.cloneHLB(paragraph);

      actual = hlb.getHLB()[0].id;

      expect(actual).to.be.equal(expected);

      cssStub.restore();
      hlb.setHighlight();
      done();

    });

  });

  // The closeHLB() purpose is to close the HLB
  describe('#closeHLB', function () {

    // it('Sets isHLBClosing to false because closeHLB() is responsible for closing the HLB, and once finished, sets ' +
    //    'this private variable to false so that the HLB can open again.' , function (done) {

    //   var expected = false,
    //       actual;

    //   hlb.setIsHLBClosing(true);
    //   hlb.setHLB(jquery(win.document.getElementById('nonScaledElement')));
    //   hlb.setFoundation(jquery(win.document.getElementById('nonScaledElement')));
    //   hlb.setHLBWrapper(jquery(win.document.getElementById('hlbWrappingElement')));

    //   hlb.closeHLB();

    //   actual = hlb.getIsHLBClosing();

    //   expect(actual).to.be.equal(expected);

    //   done();

    // });

    it('Invokes dimmer.undimBackgroundContent because another module is responsible for doing the work of removing the dimmer.', function (done) {

      var removeDimmerSpy = sinon.spy(hlbAnimation, 'transitionOutHLB');

      hlb.setIsHLBClosing(true);
      hlb.setHLB(jquery(win.document.getElementById('nonScaledElement')));
      hlb.setFoundation(jquery(win.document.getElementById('nonScaledElement')));
      hlb.setHLBWrapper(jquery(win.document.getElementById('hlbWrappingElement')));

      hlb.closeHLB();

      expect(removeDimmerSpy.calledOnce).to.be.true;

      removeDimmerSpy.restore();

      done();

    });

  });

  // The onHLBClosed purpose is to clean up the DOM and HLB module state of anything related to the HLB.
  describe('#onHLBClosed', function () {

    it('Sets $hlbElement to undefined because $hlbElement is a private variable that is an HLB element.', function (done) {

      hlb.setHLB(jquery(win.document.getElementById('paragraph')));

      hlb.onHLBClosed();

      expect(hlb.getHLB()).to.be.undefined;

      done();

    });

    it('Sets $originalElement to undefined because $originalElement is a private variable that is an element ' +
       'passed by the picker to the HLB', function (done) {

      hlb.setFoundation(jquery(win.document.getElementById('paragraph')));

      hlb.onHLBClosed();

      expect(hlb.$getFoundation()).to.be.undefined;

      done();

    });

    it('Sets isHLBClosing to false because isHLBClosing represents the transitioning state of the HLB, which should not be ' +
       'transitioning when the HLB is closed.', function (done) {

      hlb.setIsHLBClosing(true);

      hlb.onHLBClosed();

      expect(hlb.getIsHLBClosing()).to.be.false;

      done();

    });

  });

  // The onHLBReady() purpose is to set and emit the proper modes when the HLB is finished transitioning in to be used
  // and read by a user.
  describe('#onHLBReady', function () {

    it('Invokes $.focus if $hlbElement is an input because we want to enable auto-focus for the HLB when it is an input.', function (done) {

      var $hlbElement = jquery(win.document.getElementById('textInputOne')),
          focusSpy    = sinon.spy($hlbElement, 'focus');

      hlb.setHLB($hlbElement);

      hlb.onHLBReady();

      expect(focusSpy.calledOnce).to.be.true;

      focusSpy.restore();

      done();

    });

    it('Invokes $.focus if $hlbElement is a text area because we want to enable auto-focus for the HLB when it is an input.', function (done) {

      var $hlbElement = jquery(win.document.getElementById('textareaOne')),
          focusSpy    = sinon.spy($hlbElement, 'focus');

      hlb.setHLB($hlbElement);

      hlb.onHLBReady();

      expect(focusSpy.calledOnce).to.be.true;

      focusSpy.restore();

      done();

    });

  });


  // The removeHLBWrapper() purpose is to remove, from the DOM, the parent of the HLB and Dimmer element.
  describe('#removeHLBWrapper()', function () {

    it('Invokes jquery.remove because we rely upon the jQuery library to remove elements from the DOM', function (done) {

      var $hlbWrappingElement,
          removeSpy;

      hlb.setHLBWrapper(jquery(win.document.getElementById('hlbWrappingElement')));

      $hlbWrappingElement = hlb.getHLBWrapper();

      removeSpy = sinon.spy(jquery.fn, 'remove');

      hlb.removeHLBWrapper();

      expect(removeSpy.calledOnce).to.be.true;

      removeSpy.restore();

      done();

    });

  });

  // The toggleHLB() function is the entry point into opening and closing the HLB.
  describe('#toggleHLB()', function () {

    it('Sets private variable isHLBClosing to true if $hlb already exists and undefined is passed to toggleHLB.', function (done) {

      hlb.setHLB(jquery(win.document.getElementById('paragraph2')));
      hlb.setFoundation(jquery(win.document.getElementById('paragraph2')));

      hlb.toggleHLB(undefined);

      expect(hlb.getIsHLBClosing()).to.be.true;

      done();

    });

    it('Does not remove or add a dimmer if isHLBClosing is true', function (done) {

      var removeDimmerSpy = sinon.spy(dimmer, 'undimBackgroundContent'),
          dimBackgroundContentSpy = sinon.spy(dimmer, 'dimBackgroundContent');

      hlb.setIsHLBClosing(true);

      hlb.toggleHLB();

      expect(dimBackgroundContentSpy.calledOnce).to.be.false;
      expect(removeDimmerSpy.calledOnce).to.be.false;

      removeDimmerSpy.restore();
      dimBackgroundContentSpy.restore();

      done();

    });

  });

  after(function() {
    delete require.cache[require.resolve(HLB_MODULE_PATH)];
  });

});