    // Actual source file for highlight-box module.
var HLB_MODULE_PATH             = '../../source/js/highlight-box',

    // Mocked source files that are highlight-box dependencies.
    EVENT_HANDLERS_MODULE_PATH  = './data/modules/hlb/event-handlers',
    HLB_POSITIONING_MODULE_PATH = './data/modules/hlb/positioning',
    HLB_DIMMER_MODULE_PATH      = './data/modules/hlb/dimmer',
    HLB_STYLING_MODULE_PATH     = './data/modules/hlb/styling',
    HLB_PAGE_PATH               = './data/html/test-hlb.html',
    HLB_ANIMATION               = './data/modules/hlb/animation',

    // Load 'em up.
    hlb             = require(HLB_MODULE_PATH),
    eventHandlers   = require(EVENT_HANDLERS_MODULE_PATH),
    hlbPositioning  = require(HLB_POSITIONING_MODULE_PATH),
    hlbStyling      = require(HLB_STYLING_MODULE_PATH),
    dimmer          = require(HLB_DIMMER_MODULE_PATH),
    hlbAnimation    = require(HLB_ANIMATION),

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

  describe('#getValidOriginalElement()', function () {

    it('Sets removeTemporaryOriginalElement to true if the original element is an <li> because the HLB ' +
       'module relies upon this variable to determine if the original ' +
       'element needs to be removed from the DOM', function (done) {

        var $originalElement = jquery(win.document.getElementById('list-item')),

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

        hlb.setRemoveTemporaryOriginalElement(false);

        hlb.getValidOriginalElement($originalElement);

        expect(hlb.getRemoveTemporaryOriginalElement()).to.be.true;

        hlb.setRemoveTemporaryOriginalElement(false);

        appendStub.restore();
        isStub.restore();
        cssStub.restore();
        findStub.restore();

        done();
    });

    it('Sets does not set removeTemporaryOriginalElement to true if the original element is a paragraph because the HLB ' +
       'moduel relies upon this variable to determine if the original ' +
       'element needs to be removed from the DOM', function (done) {

        var $originalElement = jquery(win.document.getElementById('paragraph')),

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

        hlb.setRemoveTemporaryOriginalElement(false);

        hlb.getValidOriginalElement($originalElement);

        expect(hlb.getRemoveTemporaryOriginalElement()).to.be.false;

        hlb.setRemoveTemporaryOriginalElement(false);

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

  // The getOriginalElement() purpose is to return a DOM element from any valid input it receives.
  // The picker module will, at the time of this writing (June 1, 2014), pass a modified
  // native keypress event to the HLB from which we extract the element.  This function also
  // accepts jQuery collections and DOM elements.
  describe('#getPickedElement()', function () {

    it('Returns original DOM element if jQuery collection is passed as a parameter', function (done) {

      var $p       = jquery(win.document.getElementById('paragraph')),
          expected = win.document.getElementById('paragraph'),
          actual   = hlb.getPickedElement($p);

      expect(actual).to.be.equal(expected);

      done();

    });

    it('Returns original DOM element if original DOM element is passed as a parameter', function (done) {

      var p        = win.document.getElementById('paragraph'),
          expected = p,
          actual   = hlb.getPickedElement(p);

      expect(actual).to.be.equal(expected);

      done();

    });

    it('Returns original DOM element if mocked modified native keypress event is passed as a parameter', function (done) {

      var p = win.document.getElementById('paragraph'),

          nativeKeypressEventThatIsModifiedByPickerModule = {
            'dom': {
              'mouse_highlight': {
                'picked': [p]
              }
            }
          },

          expected = p,
          actual   = hlb.getPickedElement(nativeKeypressEventThatIsModifiedByPickerModule);

      expect(actual).to.be.equal(expected);

      done();

    });

    it('Returns undefined if empty object is passed as a parameter', function (done) {

      var emptyObject = {},
          actual      = hlb.getPickedElement(emptyObject);

      expect(actual).to.be.equal(undefined);

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

    it('Does not invoke closeHLB() if preventDeflationFromMouseout is true because we do not want to ' +
       'close the HLB if the mouse was never within the bounding rect of the HLB', function (done) {

      var emptyObject = {},

          // TODO : I couldn't find a way to listen for closeHLB(), because it is private.
          //        For now, listen for the function below to be called because it is called
          //        by closeHLB().
          closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

      hlb.setHLB(jquery(win.document.getElementById('paragraph')));
      hlb.setOriginalElement(jquery(win.document.getElementById('paragraph')));
      hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
      hlb.setPreventDeflationFromMouseout(true);

      hlb.onTargetChange(emptyObject);

      expect(closeHLBSpy.calledOnce).to.be.false;

      closeHLBSpy.restore();

      done();

    });

    it('Does not invoke closeHLB() if isSticky is true because isSticky is togglable by a public method '  +
       'on the sitecues object, and we want to be able to set this to true to force the HLB to stay open ' +
       'for debugging and development purposes.', function (done) {

      var emptyObject = {},

          // NOTE : I couldn't find a way to listen for closeHLB(), because it is private.
          //        For now, listen for the function below to be called because it is called
          //        by closeHLB().
          closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

      hlb.setHLB(jquery(win.document.getElementById('paragraph')));
      hlb.setOriginalElement(jquery(win.document.getElementById('paragraph')));
      hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
      hlb.setPreventDeflationFromMouseout(false);

      sitecues.toggleStickyHLB();

      hlb.onTargetChange(emptyObject);

      expect(closeHLBSpy.calledOnce).to.be.false;

      closeHLBSpy.restore();
      sitecues.toggleStickyHLB();

      done();

    });

    it('Does not invoke closeHLB() if the HLB element is passed as a parameter because we do not want to close ' +
       'the HLB if the user mouses over the HLB', function (done) {

        var mockedNativeMousemoveEventObject = {
              'target': win.document.getElementById('paragraph')
            },
            closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

        hlb.setHLB(jquery(win.document.getElementById('paragraph')));
        hlb.setOriginalElement(jquery(win.document.getElementById('paragraph')));
        hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
        hlb.setPreventDeflationFromMouseout(false);

        hlb.onTargetChange(mockedNativeMousemoveEventObject);

        expect(closeHLBSpy.calledOnce).to.be.false;

        closeHLBSpy.restore();

        done();

    });

    it('Does not invoke closeHLB() if the mouse button is pressed because we want the user ' +
       'to be able to click and drag text for copy and pasting', function (done) {

      var mockedNativeMousemoveEventObject = {
            'which': 1
          },
          closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

      hlb.setHLB(jquery(win.document.getElementById('paragraph')));
      hlb.setOriginalElement(jquery(win.document.getElementById('paragraph')));
      hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
      hlb.setPreventDeflationFromMouseout(false);

      hlb.onTargetChange(mockedNativeMousemoveEventObject);

      expect(closeHLBSpy.calledOnce).to.be.false;

      closeHLBSpy.restore();

      done();

    });

    it('Does not invoke closeHLB() if the current mouse coordinates are within the bounding ' +
       'client rect of the HLB because we do not want mouse movement inside the HLB to close the HLB',
      function (done) {

        var mockedNativeMousemoveEventObject = {
              'clientX': 0,
              'clientY': 0
            },
            closeHLBSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

        hlb.setHLB(jquery(win.document.getElementById('paragraph')));
        hlb.setOriginalElement(jquery(win.document.getElementById('paragraph')));
        hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
        hlb.setPreventDeflationFromMouseout(false);

        hlb.onTargetChange(mockedNativeMousemoveEventObject);

        expect(closeHLBSpy.calledOnce).to.be.false;

        closeHLBSpy.restore();

        done();

    });

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
        hlb.setOriginalElement(jquery(win.document.getElementById('paragraph')));
        hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));
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

    it('Invokes eventHandlers.disableWheelScroll because the user should not be able to scroll the document ' +
       'while the HLB is open', function (done) {

      var paragraph             = win.document.getElementById('paragraph'),
          disableWheelScrollSpy = sinon.spy(eventHandlers, 'disableWheelScroll'),
          cssStub               = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};});

      hlb.initializeHLB(paragraph);

      expect(disableWheelScrollSpy.calledOnce).to.be.true;

      disableWheelScrollSpy.restore();

      cssStub.restore();

      done();

    });

    it('Sets preventDeflationFromMouseout to true because the HLB should never close by ' +
       'mouse movements until the mouse is inside the HLB', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          cssStub   = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          expected  = true,
          actual;

      hlb.setPreventDeflationFromMouseout(false);

      hlb.initializeHLB(paragraph);

      actual = hlb.getPreventDeflationFromMouseout();

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();

    });

    it('Sets $hlbElement to an object because $hlbElement is a private variable in the scope of ' +
       'the HLB module, which is used by other private functions, and should be assigned a jQuery collection.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          expected  = 'object',
          actual,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};});

      hlb.setHLB(undefined);

      hlb.initializeHLB(paragraph);

      actual = typeof hlb.getHLB();

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();

    });

    it('Sets $hlbWrappingElement to an object because $hlbWrappingElement is a private variable in the scope of ' +
       'the HLB module, which is used by other private functions, and should be assigned a jQuery function.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          expected  = 'object',
          actual,
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};});

      hlb.setHLBWrappingElement(undefined);

      hlb.initializeHLB(paragraph);

      actual = typeof hlb.getHLBWrappingElement();

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();

    });

  });

  // The sizeHLB() purpose is to set the height and width of the $hlbElement
  // NOTE: All of the functions sizeHLB() calls are public methods of the modules dependency,
  //       which are all mocked for the unit tests to work.
  describe('#sizeHLB', function () {

    it('Invokes the initialization step called hlbPositioning.initializeSize() because it sets the ' +
       'height and width of the HLB to the height and width of the bounding rect of the element passed ' +
       'to the HLB by the picker', function (done) {

      var initializeSizeSpy = sinon.spy(hlbPositioning, 'initializeSize');

      hlb.setHLB(jquery(win.document.getElementById('paragraph')));
      hlb.sizeHLB();

      expect(initializeSizeSpy.calledOnce).to.be.true;

      initializeSizeSpy.restore();

      done();

    });

    it('Invokes hlbPositioning.constrainHeightToSafeArea because it is responsible for limiting the ' +
       'height of the HLB to the height of the safe area', function (done) {

      var constrainHeightToSafeAreaSpy = sinon.spy(hlbPositioning, 'constrainHeightToSafeArea');

      hlb.sizeHLB();

      expect(constrainHeightToSafeAreaSpy.calledOnce).to.be.true;

      constrainHeightToSafeAreaSpy.restore();

      done();

    });

    it('Invokes hlbPositioning.constrainWidthToSafeArea because it is responsible for limiting the ' +
       'width of the HLB to the width of the safe area', function (done) {

      var constrainWidthToSafeAreaSpy = sinon.spy(hlbPositioning, 'constrainWidthToSafeArea');

      hlb.sizeHLB();

      expect(constrainWidthToSafeAreaSpy.calledOnce).to.be.true;

      constrainWidthToSafeAreaSpy.restore();

      done();

    });

    it('Invokes hlbPositioning.limitWidth because it is responsible for limiting the width of certain html tags',
      function (done) {

        var limitWidthSpy = sinon.spy(hlbPositioning, 'limitWidth');

        hlb.sizeHLB();

        expect(limitWidthSpy.calledOnce).to.be.true;

        limitWidthSpy.restore();

        done();

    });

    it('Invokes hlbPositioning.mitigateVerticalScroll because it is responsible for increasing the height ' +
       'of the HLB until there is no vertical scroll or the height is equal to the safe zone height, whichever ' +
       'comes first', function (done) {

      var mitigateVerticalScrollSpy = sinon.spy(hlbPositioning, 'mitigateVerticalScroll');

      hlb.sizeHLB();

      expect(mitigateVerticalScrollSpy.calledOnce).to.be.true;

      mitigateVerticalScrollSpy.restore();

      done();

    });

    it('Invokes hlbPositioning.addVerticalScroll because it is responsible for setting the css styles ' +
       'for a vertical scrollbar if it is necessary', function (done) {

      var addVerticalScrollSpy = sinon.spy(hlbPositioning, 'addVerticalScroll');

      hlb.sizeHLB();

      expect(addVerticalScrollSpy.calledOnce).to.be.true;

      addVerticalScrollSpy.restore();

      done();

    });

  });

  // The positionHLB() purpose is to position the HLB element so that the midpoint overlaps with the midpoint
  // of the original element passed by the picker.  If overlapping the midpoints results in the HLB being outside
  // of the safe area bounding rect, then it is moved the minimum distance to be within its bounds.  This function
  // caches the results of the translation and transform-origin needed to position the HLB.
  // NOTE: All the work done in this function is delegated to a module dependency, which we mock, so we can't test
  //       if they function at this level.
  describe('#positionHLB', function () {

    it('Invokes hlbPositioning.scaleRectFromCenter because we want to position the scaled HLB, which we must simulate ' +
       'at this point, which is what hlbPositioning.scaleRectFromCenter does' , function (done) {

      var scaleRectFromCenterStub = sinon.stub(hlbPositioning, 'scaleRectFromCenter', function () {
            return {
              'width' : 0,
              'height': 0,
              'left'  : 0,
              'right' : 0,
              'top'   : 0,
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

      hlb.setHLB(jquery(win.document.getElementById('paragraph')));
      hlb.setOriginalElement(jquery(win.document.getElementById('paragraph')));
      hlb.positionHLB();

      expect(scaleRectFromCenterStub.calledOnce).to.be.true;

      scaleRectFromCenterStub.restore();
      midPointDiffStub.restore();
      constrainPositionStub.restore();

      done();

    });

    it('Invokes hlbPositioning.midPointDiff because we want to position the HLB so that the midpoint overlaps ' +
       'with the midpoint of the original element passed by the picker.  This function returns the difference ' +
       'between midpoints so we can appropriately translate the HLB to its correct position.', function (done) {

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

      hlb.setHLB(jquery(win.document.getElementById('paragraph')));
      hlb.setOriginalElement(jquery(win.document.getElementById('paragraph')));
      hlb.positionHLB();

      expect(midPointDiffStub.calledOnce).to.be.true;

      scaleRectFromCenterStub.restore();
      midPointDiffStub.restore();
      constrainPositionStub.restore();

      done();

    });

    it('Invokes hlbPositioning.constrainPosition because we want to position the HLB inside the ' +
       'safe area bounding rect.  This function returns the minimum distance a rectangle must travel ' +
       'to occupy another rectangle', function (done) {

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

      hlb.setHLB(jquery(win.document.getElementById('paragraph')));
      hlb.setOriginalElement(jquery(win.document.getElementById('paragraph')));
      hlb.positionHLB();

      expect(constrainPositionStub.calledOnce).to.be.true;

      scaleRectFromCenterStub.restore();
      midPointDiffStub.restore();
      constrainPositionStub.restore();

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

      hlb.setHLBWrappingElement(undefined);

      hlb.cloneHLB(paragraph);

      actual = typeof hlb.$getOriginalElement();

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();

    });

    it('Sets $hlbElement to an object because $hlbElement is a private variable that references ' +
       'the element we create that is a result of cloning the original element', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          cssStub   = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          expected  = 'object',
          actual;

      hlb.setHLB(undefined);

      hlb.cloneHLB(paragraph);

      actual = typeof hlb.getHLB();

      expect(actual).to.be.equal(expected);

      cssStub.restore();

      done();

    });

    it('Invokes hlbStyling.initializeStyles because the HLB module relies upon another module to initializeStyles styles.', function (done) {

      var paragraph      = win.document.getElementById('paragraph'),
          cssStub        = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          initializeStylesSpy = sinon.spy(hlbStyling, 'initializeStyles');

      hlb.cloneHLB(paragraph);

      expect(initializeStylesSpy.calledOnce).to.be.true;

      initializeStylesSpy.restore();

      cssStub.restore();

      done();

    });

    it('Invokes hlbStyling.filter because the HLB module relies upon another module to filter styles.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          cssStub   = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          filterSpy = sinon.spy(hlbStyling, 'filter');

      hlb.cloneHLB(paragraph);

      expect(filterSpy.calledOnce).to.be.true;

      filterSpy.restore();

      cssStub.restore();

      done();

    });

    it('Invokes hlbStyling.getHLBStyles because the HLB module relies upon another module to get styles.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          cssStub = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          getHLBStylesSpy = sinon.spy(hlbStyling, 'getHLBStyles');

      hlb.cloneHLB(paragraph);

      expect(getHLBStylesSpy.calledOnce).to.be.true;

      getHLBStylesSpy.restore();

      cssStub.restore();

      done();

    });

    it('Sets $hlbElement id attribute because only one HLB can exist at any one moment.', function (done) {

      var paragraph = win.document.getElementById('paragraph'),
          cssStub   = sinon.stub(jquery, 'css', function () {return {'appendTo':function(){}};}),
          expected  = hlb.getDefaultHLBId(),
          actual;

      hlb.cloneHLB(paragraph);

      actual = hlb.getHLB()[0].id;

      expect(actual).to.be.equal(expected);

      cssStub.restore();

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
    //   hlb.setOriginalElement(jquery(win.document.getElementById('nonScaledElement')));
    //   hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));

    //   hlb.closeHLB();

    //   actual = hlb.getIsHLBClosing();

    //   expect(actual).to.be.equal(expected);

    //   done();

    // });

    it('Invokes dimmer.removeDimmer because another module is responsible for doing the work of removing the dimmer.', function (done) {

      var removeDimmerSpy = sinon.spy(hlbAnimation, 'transitionOutHLB');

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

  // The onHLBClosed purpose is to clean up the DOM and HLB module state of anything related to the HLB.
  describe('#onHLBClosed', function () {

    it('Invokes eventHandlers.enableWheelScroll because we want to allow users to scroll the document ' +
       'after the HLB closes.', function (done) {

      var enableWheelScrollSpy = sinon.spy(eventHandlers, 'enableWheelScroll');

      hlb.onHLBClosed();

      expect(enableWheelScrollSpy.calledOnce).to.be.true;

      enableWheelScrollSpy.restore();

      done();

    });

    it('Sets $hlbElement to undefined because $hlbElement is a private variable that is an HLB element.', function (done) {

      hlb.setHLB(jquery(win.document.getElementById('paragraph')));

      hlb.onHLBClosed();

      expect(hlb.getHLB()).to.be.undefined;

      done();

    });

    it('Sets $originalElement to undefined because $originalElement is a private variable that is an element ' +
       'passed by the picker to the HLB', function (done) {

      hlb.setOriginalElement(jquery(win.document.getElementById('paragraph')));

      hlb.onHLBClosed();

      expect(hlb.$getOriginalElement()).to.be.undefined;

      done();

    });

    it('Sets translateCSS to undefined because translateCSS is a private variable that represents the position of the HLB.', function (done) {

      hlb.setTranslateCSS('2');

      hlb.onHLBClosed();

      expect(hlb.getTranslateCSS()).to.be.undefined;

      done();

    });

    it('Sets originCSS to undefined because originCSS is a private variable that represents the transform-origin of the HLB.', function (done) {

      hlb.setOriginCSS('2');

      hlb.onHLBClosed();

      expect(hlb.getOriginCSS()).to.be.undefined;

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

  // The onHLBReady() purpose is to set and emit the proper states when the HLB is finished transitioning in to be used
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

      hlb.setHLBWrappingElement(jquery(win.document.getElementById('hlbWrappingElement')));

      $hlbWrappingElement = hlb.getHLBWrappingElement();

      removeSpy = sinon.spy(jquery.fn, 'remove');

      hlb.removeHLBWrapper();

      expect(removeSpy.calledOnce).to.be.true;

      removeSpy.restore();

      done();

    });

  });

  // The toggleHLB() function is the entry point into opening and closing the HLB.
  describe('#toggleHLB()', function () {

    it('Sets private variable isHLBClosing to true if $hlbElement already exists and undefined is passed to toggleHLB.', function (done) {

      hlb.setHLB(jquery(win.document.getElementById('paragraph2')));
      hlb.setOriginalElement(jquery(win.document.getElementById('paragraph2')));

      hlb.toggleHLB(undefined);

      expect(hlb.getIsHLBClosing()).to.be.true;

      done();

    });

    it('Does not remove or add a dimmer if isHLBClosing is true', function (done) {

      var removeDimmerSpy = sinon.spy(dimmer, 'removeDimmer'),
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