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

  // The getHLBStyles() purpose is to return the CSS styles for the HLB element.
  describe('#getHLBStyles()', function () {

    it('Returns an object because the object is later passed as a parameter to the jQuery.css function.', function (done) {

      var $originalElement = jquery(win.document.getElementById('overflowWidth')),
          expected         = 'object',
          actual           = typeof hlbStyling.getHLBStyles($originalElement);

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

      hlbStyling.filter($hlbElement);

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

      hlbStyling.filter($hlbElement);

      actual = $hlbElement[0].style.padding;

      expect(actual).to.be.equal(expected);

      done();

    });

  });

  // The cloneStyles() purpose is to clone styles from the original element and all of its children to
  // the HLB element and all of the HLBs children.
  describe('#cloneStyles()', function () {

    it('Sets cssText of $hlbElement to cssText of $originalElement', function (done) {

      var $originalElement = jquery(win.document.getElementById('nonScaledElement')),
          $hlbElement      = jquery(win.document.getElementById('one')),
          expected         = win.getComputedStyle($originalElement[0]).cssText,
          actual;

      hlbStyling.cloneStyles($originalElement, $hlbElement);

      actual = win.getComputedStyle($hlbElement[0]).cssText;

      expect(actual).to.be.equal(expected);

      done();

    });

  });

  after(function() {
    delete require.cache[require.resolve(HLB_STYLING_MODULE_PATH)];
  });

});

