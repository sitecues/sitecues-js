require('../test/bootstrap');

// Require the module file we want to test.
var modulePath = '../../../source/js/audio/speech-builder',
  builder = require(modulePath),
  sandbox,
  originalJqueryFind;


describe('speech-builder', function() {
  beforeEach(function() {
    // Override getComputedStyle() for tests
    sandbox = sinon.sandbox.create();
    sandbox.stub(window, 'getComputedStyle', function(element) {
      return {
        display: element.getAttribute('data-display'),
        visibility: element.getAttribute('data-visibility') || 'visible'
      };
    });
  });
  describe('#getText()', function () {
    it('Should return text in document order', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<span data-display="inline">This is an <b data-display="inline">Absolutely Amazing</b> test!</span>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is an Absolutely Amazing test!');
      done();
    });
    it('Should append space period space between block elements when previous block did not end sentence', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<div><div data-display="block">This is an</div><div data-display="block">Absolutely Amazing test!</div></div>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is an . Absolutely Amazing test!');
      done();
    });
    it('Should append spaces between block elements', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<div><div data-display="block">This is an!</div><div data-display="block">Absolutely Amazing test!</div></div>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is an! Absolutely Amazing test!');
      done();
    });
    it('Should ignore comment nodes', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<span data-display="inline">This is a<!--Stupendous--> test!</span>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is a test!');
      done();
    });
    it('Should ignore visibility: hidden content', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<span data-display="inline">This is an <b data-display="inline" data-visibility="hidden">Absolutely ' +
        '<span data-display="inline" data-visibility="visible">Amazing</span></b> test!</span>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is an Amazing test!');
      done();
    });
    it('Should ignore visibility: collapse content', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<span data-display="inline">This is an <b data-display="inline" data-visibility="collapse">Absolutely Amazing</b> test!</span>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is an test!');
      done();
    });
    it('Should ignore display: none content', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<span data-display="inline">This is an <b data-display="none">Absolutely Amazing</b> test!</span>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is an test!');
      done();
    });
    it('Should append @alt text', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<span data-display="inline">This is an<img data-display="inline" alt="Absolutely Amazing">test!</span>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is an Absolutely Amazing test!');
      done();
    });
    it('Should append @title text without space before image', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<span data-display="inline">This is an<img data-display="inline" title="Absolutely Amazing">test!</span>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is an Absolutely Amazing test!');
      done();
    });
    it('Should append @title text with space already before image', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<span data-display="inline">This is an <img data-display="inline" title="Ugly">test!</span>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is an Ugly test!');
      done();
    });
    it('Should append whitespace for image without text equivalent', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<span data-display="inline">Hmm, this is a<img data-display="inline">test!</span>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('Hmm, this is a test!');
      done();
    });
    it('Should append @aria-label text', function (done) {
      var div = document.createElement('div');
      div.innerHTML = '<span data-display="inline">This is an<img data-display="inline" aria-label="Absolutely Amazing">test!</span>';
      var actualText = builder.getText(div);
      expect(actualText).to.be.equal('This is an Absolutely Amazing test!');
      done();
    });
    it('Should append @placeholder text and value from an <input>', function (done) {
      var input = document.createElement('input');
      input.type = "text";
      input.value = "Value";
      input.setAttribute('placeholder', 'Label');
      input.setAttribute('data-display', 'inline');
      var actualText = builder.getText(input);
      expect(actualText).to.be.equal('Label Value');
      done();
    });
// TODO Mock $('#foo') here so this test works -- jQuery is attached to the wrong window so not returning the right thing.
// TODO Also create similar test for @aria-describedby
//    it('Should append @aria-labelledby text', function (done) {
//      // Prepare elements for testing
//      var div = document.createElement('div');
//      div.innerHTML = '<span data-display="inline">This is an<img data-display="inline" aria-labelledby="mylabel">test!</span>';
//      document.body.appendChild(div);
//      var labelDiv = document.createElement('span');
//      labelDiv.id = 'mylabel';
//      labelDiv.innerHTML = '<b>Absolutely Amazing</b>';
//      document.body.appendChild(labelDiv);
//
//      // Prepare $('#mylabel')
//      builder.findElement = function() { return labelDiv; };
//
//      // Perform test
//      var actualText = builder.getText(div);
//      expect(actualText).to.be.equal('This is an Absolutely Amazing test!');
//      done();
//    });
  });
  afterEach(function() {
    sandbox.restore();
  });
  after(function() {
    // Unload module from nodejs's cache
    var name = require.resolve(modulePath);
    delete require.cache[name];
  });
});