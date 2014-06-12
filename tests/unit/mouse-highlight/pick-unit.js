// Require the module file we want to test.
var modulePath = '../../../source/js/mouse-highlight/pick',
  pick = require(modulePath),
  win;

require('../test/domutils');

describe('pick', function() {
  before(function() {
    domutils.loadHtml('./data/html/test-picker.html', function(newWindow) {
      win = newWindow;  // We are unable to change original window, so use the new one
    });
  });
  describe('#find()', function() {
    it('Returns element with positive judgements', function (done) {
      var startElement = win.document.getElementById('0'),
        actualPickedElements = pick.find(startElement),
        expectedElement = win.document.getElementsByClassName('pickme')[0];
      expect(actualPickedElements[0]).to.be.equal(expectedElement);
      done();
    });
    it('Returns element with @data-sc-pick=prefer', function (done) {
      var startElement = win.document.getElementById('0'),
        actualPickedElements,
        preferredElement = win.document.getElementById('4');

      preferredElement.setAttribute('data-sc-pick', 'prefer');
      actualPickedElements = pick.find(startElement);
      expect(actualPickedElements[0]).to.be.equal(preferredElement);
      done();
    });
    it('Returns null when ancestor has @data-sc-pick=disable', function (done) {
      var startElement = win.document.getElementById('0'),
        actualPickedElements,
        disabledElement = win.document.getElementById('4');

      disabledElement.setAttribute('data-sc-pick', 'disable');
      actualPickedElements = pick.find(startElement);
      expect(actualPickedElements).to.be.equal(null);
      done();
    });
    it('Does not return element with positive judgements when it has @data-sc-pick=ignore', function (done) {
      var startElement = win.document.getElementById('0'),
        actualPickedElements,
        ignoredElement = win.document.getElementsByClassName('pickme')[0];  // Ignore the usual picked element

      ignoredElement.setAttribute('data-sc-pick', 'ignore');
      actualPickedElements = pick.find(startElement);
      expect(jquery(actualPickedElements)[0]).to.not.be.equal(ignoredElement);
      done();
    });
    it('Returns element selected with provideCustomSelectors({prefer: [selector]})', function (done) {
      var startElement = win.document.getElementById('0'),
        actualPickedElements;

      pick.provideCustomSelectors({prefer: '.prefer'});
      actualPickedElements = pick.find(startElement);
      expect(actualPickedElements[0].className).to.be.equal('prefer');
      done();
    });
    it('Returns null when an ancestor of the start node is selected with provideCustomSelectors({disable: [selector]})', function (done) {
      var startElement = win.document.getElementById('0'),
        actualPickedElements;

      pick.provideCustomSelectors({disable: '.disable'});
      actualPickedElements = pick.find(startElement);
      expect(actualPickedElements).to.be.equal(null);
      done();
    });
    it('Does not return element selected with provideCustomSelectors({ignore: [selector]})', function (done) {
      var startElement = win.document.getElementById('0'),
        actualPickedElements,
        ignoredElement = win.document.getElementsByClassName('pickme')[0];

      pick.provideCustomSelectors({ignore: '.pickme'});
      actualPickedElements = pick.find(startElement);
      expect(jquery(actualPickedElements)[0]).to.not.be.equal(ignoredElement);
      done();
    });
    it('Returns null if passed the sitecues badge', function (done) {
      var startElement = win.document.getElementById('sitecues-badge'),
        actualPickedElements = pick.find(startElement);
      expect(actualPickedElements).to.be.equal(null);
      done();
    });
  });
  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
  });
});

