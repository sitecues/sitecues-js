/*
 * LIVE SVG-Path Update
 *
 * This script allows us to update SVG paths in realtime within a browser window using the keyboard.
 * It is used to get pixel-perfect shapes for the cursors, so that they look the same as the OS cursors.
 
 * Without this script, the process would be:
 *  - Generate/updating an SVG, 
 *  - Export it to a file
 *  - Look at it on another OS/browser to check it looks right.
 *
 * Just because a shape looks correct small, does not mean it looks correct large. Getting scalable
 * graphics to look good regardless of the resolution takes time and experimentation. This is a
 * very, very slow process. You can imagine what it would be like to do this for all cursors every time
 * the graphics change.
 * 
 * This script allows us to manipulate the subpixels of a path element without using the mouse, making
 * the edit more accurate and less fiddly (trying to click and drag in the right places). Importantly,
 * the live changes made to SVG path is visible on multiple scales at one time. This means we can get 
 * quality graphics on multiple scales, fast.
 *
 * Much of the SVG code I have re-used from MIT Lisenced open-source code I have on Github, some of
 * it going back as far as 2008. (See: The Burst Engine and svg2Canvas.js)
 * 
 * (Currently working with absolution positioning SVG path commands, using M, L and C only.)
 *
 *  - Alistair MacDonald
 * 
 */

(function(){

  'use strict';

  //// HELPER FUNCTIONS ////

  // Regular expressions used to break up the SVG path segments.
  var expression  = {
    pathCommand   : '[MLCz][^MLCz]+|z',
    // move          : '[-0-9][^,]+',
    move          : '[0-9-.]+',
    curveTo       : '[-0-9|.]+'
  };

  // Processes the arguments of a path segment command into a coordinate array.
  var processCommand = {

    // Move To (Absolute)
    M: function (command) {
      var regex   = new RegExp(expression.move, 'g'),
          coord   = [],
          nextCoord;
        
      while((nextCoord = regex.exec(command))){
        coord.push(parseFloat(nextCoord[0]));
      }

      return coord;
    },

    // Line To (Absolute)
    L: function (command) {
      var regex   = new RegExp(expression.move, 'g'),
          coord   = [],
          nextCoord;

      while((nextCoord = regex.exec(command))){
        coord.push(parseFloat(nextCoord[0]));
      }

      return coord;
    },

    // Curve To (Absolute:Bezier)
    C: function (command) {
      var regex   = new RegExp(expression.curveTo, 'g'),
          coord   = [],
          nextCoord;

      while((nextCoord = regex.exec(command))){
       coord.push(parseFloat(nextCoord[0]));
      }

      return coord;
    },

    // Close Path
    z: function () {
      return [];
    },

  };

  // Create a commandList Array from an SVG path String
  function pathToCommandList (pathStr) {
    var regex       = new RegExp(expression.pathCommand, 'g'),
        pathd       = pathStr,
        commandList = [],
        nextCommand,
        commandType;

    while((nextCommand = regex.exec(pathd))){
      commandType = nextCommand[0][0];
      commandList.push({
          type    : commandType,
          coords  : processCommand[commandType](nextCommand)
        });
    }

    return commandList;
  }



  //// GLOBAL VARS ////

  var svgRefs,
      $pathDataElem   = null,
      curSelPathIdx   = 0,      // The currently selected/focused path index (within the svg)
      curSelPathElem  = null,   // The currently selected/focused path element
      curSelSegCmd    = 0,      // The currently selected/focused path-segment (command)
      numPaths        = 0,      // Number of paths in the SVG
      numSegsInPath   = 0,      // Number of commands/segments in the selected path
      pathCommandList = [],     // An Array of segment commands in the current selected path
      nudgeAmt      = 0.1;    // The amount/speed which points and controls-points are moved per key event


  // Stores references to the SVG DOM elements
  function storeSVGRefs () {
    svgRefs = {
      cursor1x: {
        elem: $('#cursor1x'),
        paths: $('#cursor1x').find('path')
      },
      cursor5x: {
        elem: $('#cursor5x'),
        paths: $('#cursor5x').find('path'),
        controlPoints: {
          cp0Box  :$('#cursor5x').find('rect[data-ui="control-point-0-box"]'),
          cp1Box  :$('#cursor5x').find('rect[data-ui="control-point-1-box"]'),
          cp2Box  :$('#cursor5x').find('rect[data-ui="control-point-2-box"]'),
          cp1Line :$('#cursor5x').find('path[data-ui="control-point-1-line"]'),
          cp2Line :$('#cursor5x').find('path[data-ui="control-point-2-line"]')
        }
      },

    };
    numPaths = svgRefs.cursor1x.paths.length;
  }

  // 
  function displayPathDataAsHTML () {
    var pl  = numPaths,
        p   = 0,
        d,
        c,
        cl,
        pathd;

    $pathDataElem.html('');

    for(;p< pl; p++){
      
      pathd = $('<div>',{
        id : 'path:'+p,
        class : 'pathd'+(p===curSelPathIdx?' sel':''),
      });

      var pathComs = pathToCommandList($(svgRefs.cursor1x.paths[p]).attr('d'));
      cl=pathComs.length;

      for(c=0 ;c< cl; c++){

        var c_com     = pathComs[c],
            type      = c_com.type,
            coords    = c_com.coords,
            dl        = coords.length,
            coordStr  = '';
          
        for(d=0; d< dl; d+=2){
          coordStr += coords[d] +','+ coords[d+1] +' ';
        }

        pathd.append( $('<span>',{
          text: (type + coordStr).trim(),
          class: 'pathcommand'+(c===curSelSegCmd&&p===curSelPathIdx?' sel':''),
        }));
      }

      $pathDataElem.append(pathd);
    }
  }


  // Operates on a segment to update the position of points/control-points in the SVG path
  var segMover = {
    
    segRef: null,  // Referece to segment being moved
    active:false,  // Becomes active when this particular kind of segment can be moved

    // Focuses the segMover on a particular segment of the currently selected path
    focusOnSeg: function focusOnSeg () {
      
      // TODO: Don't use globals here, it's going to become unreliable.
      this.segRef = pathCommandList[curSelSegCmd];

      // Update control points to match the position of the currently sele2ted segment
      this.updateControlPoints();

    },

    updateControlPoints: function updateControlPoints () {
      
      // If there are any coordinates at all (it's not a close-path 'z' command)...
      if (typeof this.segRef.coords[0] === 'number') {

        // Move the base control point coordinate box and make it visible
        svgRefs.cursor5x.controlPoints.cp0Box.attr('transform',   'translate('+this.segRef.coords[0]+','+this.segRef.coords[1]+')');
        svgRefs.cursor5x.controlPoints.cp0Box.attr('opacity', '1');

        // If we are dealing with multipole control points for this segment...
        if (this.segRef.coords.length >4) {
          svgRefs.cursor5x.controlPoints.cp1Box.attr('transform', 'translate('+this.segRef.coords[2]+','+this.segRef.coords[3]+')');
          svgRefs.cursor5x.controlPoints.cp2Box.attr('transform', 'translate('+this.segRef.coords[4]+','+this.segRef.coords[5]+')');
          svgRefs.cursor5x.controlPoints.cp1Line.attr('d',                 'M'+this.segRef.coords[2]+','+this.segRef.coords[3] +' L'+ this.segRef.coords[0]+','+this.segRef.coords[1]);
          svgRefs.cursor5x.controlPoints.cp2Line.attr('d',                 'M'+this.segRef.coords[2]+','+this.segRef.coords[3] +' L'+ this.segRef.coords[4]+','+this.segRef.coords[5]);
          svgRefs.cursor5x.controlPoints.cp1Box.attr('opacity', '1');
          svgRefs.cursor5x.controlPoints.cp2Box.attr('opacity', '1');
          svgRefs.cursor5x.controlPoints.cp1Line.attr('opacity', '1');
          svgRefs.cursor5x.controlPoints.cp2Line.attr('opacity', '1');
        
        // If we only have 2 control points... make points 1 & 2 invisible, (point 0 remains visible)
        } else {
          svgRefs.cursor5x.controlPoints.cp1Box.attr('opacity', '0');
          svgRefs.cursor5x.controlPoints.cp2Box.attr('opacity', '0');
          svgRefs.cursor5x.controlPoints.cp1Box.attr('opacity', '0');
          svgRefs.cursor5x.controlPoints.cp2Box.attr('opacity', '0');
          svgRefs.cursor5x.controlPoints.cp1Line.attr('opacity', '0');
          svgRefs.cursor5x.controlPoints.cp2Line.attr('opacity', '0');
        }
      
      // If we only have 0 control points (z close-path)... make points 1 & 2 invisible, (point 0 remains visible)
      }else{
        svgRefs.cursor5x.controlPoints.cp1Box.attr('opacity', '0');
        svgRefs.cursor5x.controlPoints.cp2Box.attr('opacity', '0');
        svgRefs.cursor5x.controlPoints.cp1Box.attr('opacity', '0');
        svgRefs.cursor5x.controlPoints.cp2Box.attr('opacity', '0');
        svgRefs.cursor5x.controlPoints.cp1Line.attr('opacity', '0');
        svgRefs.cursor5x.controlPoints.cp2Line.attr('opacity', '0');
      }
    },

    // Updates the coordinates of the currently selected segment
    updateSegCoords: function updateSegCoords (x, y) {

      // 1ST CP: Modify the first control-point (if it exists)
      if (keyStack[ keyDownIs.shift ]) {

        // console.log(typeof this.segRef.coords[2]);
        if (typeof this.segRef.coords[2] === 'number') {
          this.segRef.coords[2] += x*nudgeAmt;
          this.segRef.coords[3] += y*nudgeAmt;
        }
      
      // 2ND CP: Modify the second control point (if it exists)
      } else if (keyStack[ keyDownIs.command ] ||  keyStack[ keyDownIs.alt ]) {
        
        // console.log(typeof this.segRef.coords[2]);
        if (typeof this.segRef.coords[4] === 'number') {
          this.segRef.coords[4] += x*nudgeAmt;
          this.segRef.coords[5] += y*nudgeAmt;
        }
      
      // BASE COORD: Modify the base coordinate (always exists except for close-path 'z')
      } else {

        if (typeof this.segRef.coords === 'object') {
          this.segRef.coords[0] += x*nudgeAmt;
          this.segRef.coords[1] += y*nudgeAmt;
        }
      }
      
      updateSelectedSVGPath();
      updateHTMLDataSegment(this.segRef);
      this.updateControlPoints();

      
      // console.log(this.segRef.coords);
    }
  };


  function updateHTMLDataSegment (segRef) {
    var type      = segRef.type,
        coords    = segRef.coords,
        d,
        dl        = coords.length,
        pathdSeg  = '',
        coordStr  = '';


    if (dl>0) {
      for(d=0; d< dl; d+=2){
        coordStr += (coords[d]).toFixed(2) +','+ (coords[d+1]).toFixed(2) +' ';
      }
      pathdSeg += type + coordStr;
    } else {
      pathdSeg = 'z';
    }
    // console.log(dl);

    $('.sel > .sel').text(pathdSeg);
    //console.log(pathdSeg);
  }

  // Updates all instances of the currently selected SVG paths, across multiple sized visible copies of the SVG
  function updateSelectedSVGPath () {  
    var i     = 0,
        l     = pathCommandList.length,
        pathd = '',
        d;

    for(;i< l; i++){
      var i_com     = pathCommandList[i],
          type      = i_com.type,
          coords    = i_com.coords,
          dl        = coords.length,
          coordStr  = '';
      
      if (dl>0) {
        for(d=0; d< dl; d+=2){
          coordStr += (coords[d]).toFixed(2) +','+ (coords[d+1]).toFixed(2) +' ';
        }
        pathd += type + coordStr;

      } else {
        pathd += 'z';
      }
    }
    
    //console.log(pathd);
    $(svgRefs.cursor1x.paths[curSelPathIdx]).attr('d', pathd);
    $(svgRefs.cursor5x.paths[curSelPathIdx]).attr('d', pathd);
  }



  // A stack containing boolean keydown states
  var keyStack = {},

    keyDownIs = {
      shift   : 16,
      alt     : 18,
      command : 91
    };


  // Handle keys being released
  window.addEventListener('keyup', function(e){
    var keyCode = e.keyCode;
    keyStack[keyCode] = false;
  });

  // Handle keys being pressed
  window.addEventListener('keydown', function(e){
    var keyCode = e.keyCode,
        preventDefault = true;

    //console.log(keyCode);
    
    // Track the state of the keys for modifiers
    keyStack[keyCode] = true;

    switch(keyCode){
    
    // Modifier keys
    case 16:
      break;
    case 18:
      break;
    case 91:
      break;

    case 38: // Up
      segMover.updateSegCoords(0, -1);
      break;
    case 40: // Down
      segMover.updateSegCoords(0, +1);
      break;
    case 37: // Left
      segMover.updateSegCoords(-1, 0);
      break;
    case 39: // Right
      segMover.updateSegCoords(+1, 0);
      break;

    // Select Previous Path
    case 87: // W
      curSelPathIdx--;
      if (curSelPathIdx<0) {
        curSelPathIdx = numPaths-1;
      }
      selectPath(curSelPathIdx);
      displayPathDataAsHTML();
      segMover.focusOnSeg();
      break;

    // Select Next Path
    case 83: // S
      curSelPathIdx++;
      if (curSelPathIdx>numPaths-1) {
        curSelPathIdx = 0;
      }
      selectPath(curSelPathIdx);
      displayPathDataAsHTML();
      segMover.focusOnSeg();
      break;
    
    // Select Prev Command
    case 65: // A
      curSelSegCmd--;
      if (curSelSegCmd<0) {
        curSelSegCmd=numSegsInPath-1;
      }
      displayPathDataAsHTML();
      segMover.focusOnSeg();
      break;
    
    // Select Next Command
    case 68: // D
      curSelSegCmd++;
      if (curSelSegCmd>numSegsInPath-1) {
        curSelSegCmd=0;
      }
      displayPathDataAsHTML();
      segMover.focusOnSeg();
      break;

    // If none of the keys were captured... it's OK to resume default key behavior
    default:
      preventDefault = false;
      break;
    }

    if (preventDefault === true) {
      e.preventDefault();
    }
  });


  // Selects a path by it's index in the SVG
  function selectPath (idx) {
    curSelPathIdx   = idx;
    curSelPathElem  = $(svgRefs.cursor1x.paths[idx]);
    pathCommandList = pathToCommandList( curSelPathElem.attr('d') );
    numSegsInPath   = pathCommandList.length;
    if (numSegsInPath < curSelSegCmd) {
      curSelSegCmd = numSegsInPath - 1;
    }
  }


  function init () {
    $pathDataElem = $('#path-data');
    storeSVGRefs();
    selectPath(0);
    segMover.focusOnSeg(0);
    displayPathDataAsHTML();
    
    $('#export-button').click(function(){
      $('#export-data').html('');

      $('.pathd').each(function(e,i){
        var data='';

        $(this).find('.pathcommand').each(function(i,e){
          data+=e.textContent+' ';
        });
        
        $('#export-data').append($('<div>',{
          class: 'output-data',
          text: data
        }));
      });

    });
  }

  window.addEventListener('DOMContentLoaded', init);

})();







