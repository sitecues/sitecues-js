// Require the module file we want to test.
var HLB_MODULE_PATH = '../../source/js/highlight-box',
    HLB_PAGE_PATH   = '../pages/hlb.html',

    SITECUES_HLB_ID = 'sitecues-hlb',    
    hlb             = require(HLB_MODULE_PATH),
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
          closeHLBSpy = sinon.spy(hlb, 'closeHLB');

      hlb.setHLB(jquery(win.document.body));
      hlb.setOriginalElement(jquery(win.document.body));

      hlb.setPreventDeflationFromMouseout(true);

      hlb.onTargetChange(parameter);

      expect(closeHLBSpy.calledOnce).to.be.false;

      closeHLBSpy.restore();

      done();

    });

  });

  after(function() {
    delete require.cache[require.resolve(HLB_MODULE_PATH)];
  });

});

