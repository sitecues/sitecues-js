// Require the module file we want to test.
var HLB_STYLING_MODULE_PATH = '../../../source/js/hlb/styling',
    HLB_PAGE_PATH           = './data/html/test-hlb.html',

    hlbStyling = require(HLB_STYLING_MODULE_PATH),
    win;

require('../test/domutils');

describe('hlbStyling', function() {

  before(function() {
    domutils.loadHtml(HLB_PAGE_PATH, function(newWindow) {
      win = newWindow;  // We are unable to change original window, so use the new one
    });
  });

  describe('#getChildStyles()', function () {

    it('Returns an object whose bottom property value is 0 because child elements of the HLB should not have a non-zero value for bottom style', function (done) {
      var $child = jquery(win.document.getElementById('paragraph')),
          originalElementsComputedStyles = {
            'textDecoration': ''
          },
          initialHLBRect = {

          },
          expected = 0,
          actual = hlbStyling.getChildStyles($child, originalElementsComputedStyles, initialHLBRect).bottom;

      expect(actual).to.be.equal(expected);
      done();
    });

    // it('Returns an object with width and height properties if $child is a non-image element because HLB non-image children should not have computed width inherited.', function (done) {
    //   var $child = jquery(win.document.getElementById('paragraph')),
    //       originalElementsComputedStyles = {
    //         'textDecoration': ''
    //       },
    //       result = hlbStyling.getChildStyles($child, originalElementsComputedStyles);

    //   expect(result.hasOwnProperty('width') && result.hasOwnProperty('height')).to.be.true;
    //   done();
    // });

    // it('Returns an object without width and height properties if $child is an image element because HLB image children should preserve their original ratio.', function (done) {
    //   var $child = jquery('<img>'),
    //       originalElementsComputedStyles = {
    //         'textDecoration': ''
    //       },
    //       result = hlbStyling.getChildStyles($child, originalElementsComputedStyles);

    //   expect(result.hasOwnProperty('width') && result.hasOwnProperty('height')).to.be.false;
    //   done();
    // });

    it('Returns an object with a textDecoration property whose value is "underline" if the original styles for text-decoration includes the string "underline"', function (done) {
      var $child = jquery(win.document.getElementById('paragraph')),
          originalElementsComputedStyles = {
            'textDecoration': 'underline'
          },
          initialHLBRect = {

          },
          expected = 'underline',
          actual = hlbStyling.getChildStyles($child, originalElementsComputedStyles, initialHLBRect).textDecoration;

      expect(actual).to.be.equal(expected);
      done();
    });

    it('Returns an object whose display property value is "inline-block" if the $child original elements computed position is absolute.', function (done) {
      var $child = jquery(win.document.getElementById('paragraph')),
          originalElementsComputedStyles = {
            'textDecoration': '',
            'position': 'absolute'
          },
          initialHLBRect = {

          },
          expected = 'inline-block',
          actual = hlbStyling.getChildStyles($child, originalElementsComputedStyles, initialHLBRect).display;

      expect(actual).to.be.equal(expected);
      done();
    });

  });

  describe('#getNonEmptyBackgroundImage()', function () {
    it('Returns an object with a backgroundImage property if the original element has a parent with a backgroundImage', function (done) {
      var $originalElement = jquery(win.document.getElementById('parentHasBackgroundImage')),
          ancestorCount = 1,
          result = hlbStyling.getNonEmptyBackgroundImage($originalElement, ancestorCount);
      expect(result.hasOwnProperty('backgroundImage')).to.be.true;
      done();
    });
  });

  describe('#getNonTransparentBackground()', function () {
    it('Returns a string if the original element has a parent whose backgroundColor is non-transparent', function (done) {
      var $originalElement = jquery(win.document.getElementById('parentHasBackgroundColor'));
      expect(typeof hlbStyling.getNonTransparentBackground($originalElement) === 'string').to.be.true;
      done();
    });
  });

  describe('#getHLBBackgroundColor()', function () {
    it('Returns HLB_IMAGE_DEFAULT_BACKGROUND_COLOR if the computed style of the background color of the element is transparent and the ' +
       'origianl element is an image',
       function (done) {
         var $originalElement = jquery('<img>'),
             elementComputedStyle = {
              'backgroundColor':'transparent'
             },
             expected = hlbStyling.HLB_IMAGE_DEFAULT_BACKGROUND_COLOR,
             actual = hlbStyling.getHLBBackgroundColor($originalElement, elementComputedStyle);
             expect(actual).to.be.equal(expected);
         done();
       });
    it('Returns HLB_DEFAULT_BACKGROUND_COLOR if every background is tranparent for the original element and its ancestors', function (done) {
      var $originalElement = jquery('paragraph'),
             elementComputedStyle = {
              'backgroundColor':'transparent'
             },
             expected = hlbStyling.HLB_DEFAULT_BACKGROUND_COLOR,
             actual = hlbStyling.getHLBBackgroundColor($originalElement, elementComputedStyle);
             expect(actual).to.be.equal(expected);
         done();
    });
  });

  // The getHLBStyles() purpose is to return the CSS styles for the HLB element.
  describe('#getHLBStyles()', function () {

    it('Returns an object because the object is later passed as a parameter to the jQuery.css function.', function (done) {

      var $originalElement = jquery(win.document.getElementById('overflowWidth')),
          expected         = 'object',
          actual           = typeof hlbStyling.getHLBStyles($originalElement, $originalElement);

      expect(actual).to.be.equal(expected);

      done();

    });

  });

  // The filter() purpose is to filter attributes, styles, and elements from the HLB element.
  describe('#filter()', function () {

    it('Removes ID attribute from HLB element because the HLB element is provided an ID by the speech module.', function (done) {

      var $hlbElement = jquery('<p>', {'id': 'test'}),
          expected    = '',
          actual;

      hlbStyling.filter($hlbElement, $hlbElement, []);

      actual = $hlbElement.attr('id');

      expect(actual).to.be.equal(expected);

      done();

    });

    it('Removes padding styles from parameter because we do not want to copy over padding ' +
       'from the original element to the HLB element', function (done) {

      var $hlbElement = jquery(win.document.getElementById('overflowWidth')),
          expected = '',
          actual;

      $hlbElement[0].style.padding = '100px';

      hlbStyling.filter($hlbElement, $hlbElement, []);

      actual = $hlbElement[0].style.padding;

      expect(actual).to.be.equal(expected);

      done();

    });

  });

  // The initializeStyles() purpose is to clone styles from the original element and all of its children to
  // the HLB element and all of the HLBs children.
  describe('#initializeStyles()', function () {

    it('Sets cssText of $hlbElement to cssText of $originalElement', function (done) {

      var $originalElement = jquery(win.document.getElementById('nonScaledElement')),
          $hlbElement      = jquery(win.document.getElementById('one')),
          expected         = win.getComputedStyle($originalElement[0]).cssText,
          actual;

      hlbStyling.initializeStyles($originalElement, $hlbElement);

      actual = win.getComputedStyle($hlbElement[0]).cssText;

      expect(actual).to.be.equal(expected);

      done();

    });

  });

  after(function() {
    delete require.cache[require.resolve(HLB_STYLING_MODULE_PATH)];
  });

});

