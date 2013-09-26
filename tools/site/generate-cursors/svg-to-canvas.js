(function() {
  'use strict';

  // Canvas context
  var c
    
  , expression = {
      pathCommand   : '[mzlhvcqtaMZLHVCQTA][^mzlhvcqtaMZLHVCQTA]+'
    , move          : '[0-9][^,]+'
    , curveTo       : '[0-9][^,|^ ]+'
    }

  , attributeList = {
      path    : ['d']
    , common  : ['fill']
    }
  ;


  // Load an XML Document. Especially an SVG :)
  function load (url) {
    var xmlDoc = new XMLHttpRequest();
    xmlDoc.open('GET', url, false);
    xmlDoc.send();
    return xmlDoc.responseXML;
  }


  // Deal with an SVG Path element
  function path (node) {

    var regex   = new RegExp(expression.pathCommand, 'g')
      , pathd   = node.getAttribute('d')
      , command
      ;

    while((command = regex.exec(pathd))){
      console.log(command);
    }

  }


  // Parse SVG XML Nodes
  function parse (node) {

    var children = node.childNodes
      , l = children.length
      , i = 0
      , childNode
      , tagName
      ;

    for (; i< l; i++) {
      childNode = children[i];
      tagName   = childNode.tagName;

      switch(tagName){
      case 'defs':
        break;
      case 'g':
        break;
      case 'path':
        path(childNode);
        break;
      }
    }
  }

  // Public Interface for svg2canvas features
  window.svg2canvas = function (file, canvasId) {

    var response = load(file)
      , canvas   = document.getElementById(canvasId)
      , svg      = response.getElementsByTagName('svg')[0]
      ;

    c = canvas.getContext('2d');

    parse(svg);

  };

})();