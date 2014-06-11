// Require the module file we want to test.
var modulePath = '../../../source/js/mouse-highlight/pick',
  pick = require(modulePath),
  fs = require('fs'),
  nodes,
  NUMBER_OF_NODES = 5,
  win;

describe('pick', function() {
  beforeEach(function() {
    win = null;
    nodes = [];

    function addToDom(html, callback) {
      var jsdom = require('jsdom');
      jsdom.env({
        html: html,
        scripts: [],
        done: function(errors, window) {
          win = window;
          callback();
        }
      });
    }

    // jsdom does not correctly set some properties, like localName, childCount, etc. so we fix them here.
    // TODO see if jsdom updates their code so that we no longer need to do this post-correction
    // See https://github.com/tmpvar/jsdom/issues/124 and https://equinox.atlassian.net/browse/SC-1771
    function fixNode(node) {
      if (node.nodeType !== 1 /* Element */) {
        return node;
      }

      // Fix localName
      node = jquery.extend({}, node, { localName: node.tagName.toLowerCase() });
      node.localName = node.tagName.toLowerCase();

      // Fix childCount and childElementCount
      var childNodes = node.childNodes,
        index, numChildren, numElementChildren;
      if (!childNodes) {
        return;
      }

      index = 0;
      numChildren = childNodes.length;
      numElementChildren = 0;

      node.childCount = numChildren;
      for (; index < numChildren; index ++) {
        if (childNodes[index].nodeType === 1 /* Element */) {
          ++ numElementChildren;
        }
      }
      node.childElementCount = numElementChildren;
      return node;
    }

    var oldhtml = fs.readFileSync('./data/html/test-picker.html');
    addToDom(oldhtml, function() {
      var node, count = 0;
      while (count < NUMBER_OF_NODES) {
        node = jquery(win.document).find('#' + count)[0];
        nodes[count] = fixNode(node);
        ++ count;
      }
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
      expect(actualPickedElements[0]).to.not.be.equal(ignoredElement);
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
        actualPickedElements;

      pick.provideCustomSelectors({ignore: '.ignore'});
      actualPickedElements = pick.find(startElement);
      expect(actualPickedElements[0].className).to.not.be.equal('ignore');
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

