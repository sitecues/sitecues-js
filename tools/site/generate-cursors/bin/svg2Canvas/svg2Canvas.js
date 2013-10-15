(function() {
  'use strict';

  // Global Canvas context
  var c
  
  // Offset Scale (SVG to Canvas ratio)
  , scaleX
  , scaleY
  , scaleSqrt
    
  // Regular Experssions for SVG Paths
  , expression  = {
      pathCommand   : '[mzlhvcqtaMZLHVCQTA][^mzlhvcqtaMZLHVCQTA]+'
    , move          : '[0-9][^,]+'
    , curveTo       : '[0-9][^,|^ ]+'
    }

  // Get the arguments for a Path command
  , processCommand = {

      // Move To (Absolute)
      M: function (command) {
        var regex   = new RegExp(expression.move, 'g')
          , coord   = []
          , nextCoord
          ;

        while((nextCoord = regex.exec(command))){
          coord.push(nextCoord[0]);
        }

        c.moveTo(coord[0], coord[1]);
      },

      // Line To (Absolute)
      L: function (command) {
        var regex   = new RegExp(expression.move, 'g')
          , coord   = []
          , nextCoord
          ;

        while((nextCoord = regex.exec(command))){
          coord.push(nextCoord[0]);
        }

        c.lineTo(coord[0], coord[1]);
      },

      // Curve To (Absolute:Bezier)
      C: function (command) {
        var regex   = new RegExp(expression.curveTo, 'g')
          , coord   = []
          , nextCoord
          ;

        while((nextCoord = regex.exec(command))){
          coord.push(nextCoord[0]);
        }

        c.bezierCurveTo(coord[0], coord[1], coord[2], coord[3], coord[4], coord[5]);
      },

      // Close Path
      z: function () {
        c.closePath();
      }

    }
  ;


  // Load an XML Document. Especially an SVG :)
  function load (url) {
    var xmlDoc = new XMLHttpRequest();
    xmlDoc.open('GET', url, false);
    xmlDoc.send();
    return xmlDoc.responseXML;
  }


  // Apply SVG attributes
  function applyAttrs (node) {
    
    var fill          = node.getAttribute('fill')
      , stroke        = node.getAttribute('stroke')
      , strokeWidth   = node.getAttribute('stroke-width')
      
      // HTML5 Canvas Based Blur (not saved as raster that gets pixelated when scaled)
      , shadow        = node.getAttribute('shadow')
      , shadowBlur    = node.getAttribute('shadow-blur')
      , shadowOffsetX = node.getAttribute('shadow-offset-x')
      , shadowOffsetY = node.getAttribute('shadow-offset-y')
      ;

    if (shadow) {
      c.shadowColor   = shadow;
      c.shadowBlur    = shadowBlur * Math.sqrt(scaleX * scaleY);
      c.shadowOffsetX = shadowOffsetX * scaleX;
      c.shadowOffsetY = shadowOffsetY * scaleY;
    } else {
      c.shadowColor   = '';
      c.shadowBlur    = 0;
      c.shadowOffsetX = 0;
      c.shadowOffsetY = 0;
    }

    if (fill) {
      c.fillStyle = fill;
      c.fill();
    } else {
      c.filleStyle = '';
    }

    if (strokeWidth) {
      c.lineWidth = strokeWidth;
    }

    if (stroke) {
      c.strokeStyle = stroke * scaleSqrt;
      c.stroke();
    } else {
      c.strokeStyle = '';
    }

  }

  // Deal with an SVG Path element
  function path (node) {

    var regex   = new RegExp(expression.pathCommand, 'g')
      , pathd   = node.getAttribute('d')
      , nextCommand
      , commandType
      ;

    c.beginPath();

    while((nextCommand = regex.exec(pathd))){
      commandType = nextCommand[0][0];
      processCommand[commandType](nextCommand);
    }

    applyAttrs(node);

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
        parse(childNode);
        break;
      case 'path':
        path(childNode);
        break;
      }
    }

  }



  // Public Interface for svg2canvas features
  window.svg2Canvas = function (file, props) {

    var response  = load(file)
      , svg       = response.getElementsByTagName('svg')[0]
      , svgWidth  = svg.getAttribute('width')
      , svgHeight = svg.getAttribute('height')
      , width     = props.width || svgWidth
      , height    = props.height || svgHeight
      , density
      , canvas
      , result
      ;

    if (!props.density || props.density === 'auto') {
      density = window.devicePixelRatio;
    } else if (typeof props.density === 'number') {
      density = props.density;
    }

    switch (typeof props.canvas) {
    case 'string':
      canvas = document.getElementById(props.canvas);
      break;
    case 'object':
      canvas = props.canvas;
      break;
    default:
      canvas = document.createElement('canvas');
    }
    
    scaleX = width / svgWidth * density;
    scaleY = height / svgHeight * density;
    scaleSqrt = Math.sqrt(scaleX * scaleY);

    canvas.setAttribute('width', width * density);
    canvas.setAttribute('height', height * density);
    c = canvas.getContext('2d');

    c.save();
    c.scale( scaleX, scaleY);
    parse(svg);
    c.restore();

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    result = props.toDataURL ? canvas.toDataURL() : canvas;

    return props.callback ? props.callback(result) : result;
  
  };

})();