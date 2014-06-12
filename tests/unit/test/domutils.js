// jsdom does not correctly set some properties, like localName, childCount, etc. so we fix them here.
// TODO see if jsdom updates their code so that we no longer need to do this post-correction
// See https://github.com/tmpvar/jsdom/issues/124 and https://equinox.atlassian.net/browse/SC-1771

fs = require('fs');

domutils = {
  fixNode: function (node) {
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
      return node;
    }

    index = 0;
    numChildren = childNodes.length;
    numElementChildren = 0;

    node.childCount = numChildren;
    for (; index < numChildren; index++) {
      if (childNodes[index].nodeType === 1 /* Element */) {
        ++numElementChildren;
      }
    }
    node.childElementCount = numElementChildren;
    return node;
  },

  addToDom: function (html, callback) {
    var jsdom = require('jsdom');
    jsdom.env({
      html: html,
      scripts: [],
      done: function (errors, newWindow) {
        callback(newWindow);
      }
    });
  },

  loadHtml: function (fileName, callback) {
    var html = fs.readFileSync(fileName);
    domutils.addToDom(html, callback);
  }
};




