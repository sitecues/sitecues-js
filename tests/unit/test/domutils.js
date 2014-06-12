var fs = require('fs');

domutils = {
  addToDom: function (html, callback) {
    // jsdom does not correctly set some properties, like localName, childCount, etc. so we fix them here.
    // TODO see if jsdom updates their code so that we no longer need to do this post-correction
    // See https://github.com/tmpvar/jsdom/issues/124 and https://equinox.atlassian.net/browse/SC-1771
    // Adds the following properties to an element:
    // localName, childCount, childElementCount, firstElementChild
    // Note: we can add/modify properties only be using Object.defineProperty() -- setting directly won't work
    function fixNode() {
      var node = this;
      if (node.nodeType !== 1 /* Element */) {
        return;
      }

      Object.defineProperty(node, 'localName', {
        value: node.tagName.toLowerCase()
      });

      // Fix localName

      // Fix childCount and childElementCount
      var childNodes = node.childNodes,
        index, numChildren, numElementChildren,
        firstElementChild = null;
      if (!childNodes) {
        return;
      }

      index = 0;
      numChildren = childNodes.length;
      numElementChildren = 0;

      Object.defineProperty(node, 'childCount', {
        value: numChildren
      });

      node.childCount = numChildren;
      for (; index < numChildren; index++) {
        if (childNodes[index].nodeType === 1 /* Element */) {
          if (!firstElementChild) {
            firstElementChild = childNodes[index];
          }
          ++numElementChildren;
        }
      }
      Object.defineProperty(node, 'childElementCount', {
        value: numElementChildren
      });

      Object.defineProperty(node, 'firstElementChild', {
        value: firstElementChild
      });

    }

    var jsdom = require('jsdom');
    jsdom.env({
      html: html,
      scripts: [],
      done: function (errors, newWindow) {
        jquery(newWindow.document).find('*').each(fixNode);
        callback(newWindow);
      }
    });
  },

  loadHtml: function (fileName, callback) {
    var html = fs.readFileSync(fileName);
    domutils.addToDom(html, callback);
  }
};




