(function(win, $){

  'use strict';

  var 

    // Regular Experssions for SVG Paths
    expression  = {
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

          //c.moveTo(coord[0], coord[1]);
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

          //c.lineTo(coord[0], coord[1]);
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

          //c.bezierCurveTo(coord[0], coord[1], coord[2], coord[3], coord[4], coord[5]);
        },

        // Close Path
        z: function () {
          //c.closePath();
        }

      }

  , svg
  , $pathDisplay = null
  , selPath   = 0
  , pathCount  = 0
  , selCmd    = 0
  , cmdCount  = 0

  , pathElem = null
  , pathStr  = null
  , pathComs = null

  , nudgeAmt = 0.1
  ;


  function storeSVGData () {
    svg = {
      cursor1x: {
        elem: $('#cursor1x'),
        paths: $('#cursor1x').find('path')
      },
      cursor5x: {
        elem: $('#cursor5x'),
        paths: $('#cursor5x').find('path')
      }
    };
    pathCount = svg.cursor1x.paths.length;
  }


  function selectPath (idx) {
    selPath = idx;

    pathElem  = $(svg.cursor1x.paths[selPath]);
    pathStr   = pathElem.attr('d').trim();
    pathComs  = pathStr.split(' ');
    cmdCount  = pathComs.length;
    
    if (cmdCount<selCmd) {
      selCmd=cmdCount-1;
    }
  }


  function drawPathsToDisplay () {
    var p   = 0
      , c
      , pl  = pathCount
      , cl  = cmdCount
      , pathd
      ;

    $pathDisplay.html('');

    for(;p< pl; p++){
      
      pathd = $('<div>',{
        id : 'path:'+p,
        class : 'pathd'+(p===selPath?' sel':''),
      });
    
      var pathElem  = $(svg.cursor1x.paths[p])
        , pathStr   = pathElem.attr('d').trim()
        , pathComs  = pathStr.split(' ')
        ;

      for(c=0 ;c< cl; c++){
        pathd.append( $('<span>',{
          text:pathComs[c],
          class: 'pathcommand'+(c===selCmd&&p===selPath?' sel':''),
        }));
      }

      $pathDisplay.append(pathd);
    }
  }


  var mover = {
    coords: [],
    selPath: null,
    selCmd: null,
    active:false
  };

  function activateMover () {

    // pathElem  = $(svg.cursor1x.paths[selPath]);
    // pathStr   = pathElem.attr('d').trim();
    // pathComs  = pathStr.split(' ');
    // cmdCount  = pathComs.length;

    console.log(pathComs[selCmd]);

    var curCom = pathComs[selCmd]
      , coords
      ;
    if (curCom[0] !== 'z'||curCom[0] !== 'Z') {
      coords = (curCom.slice(1)).split(',');
      mover.coords[0] = parseFloat(coords[0]);
      mover.coords[1] = parseFloat(coords[1]);
      mover.selPath = selPath;
      mover.selCmd  = selCmd;
      mover.cmdType = curCom[0];
      mover.active=true;
    } else {
      mover.active=false;
    }
  }

  function updateMover (x, y) {
    if (mover.active) {
      if (x) {
        mover.coords[0] += parseFloat(x);
      }
      if (y) {
        mover.coords[1] += parseFloat(y);
      }
    }
    updateSVGPath(mover);
  }



  function updateSVGPath (mover) {
    if (mover.active) {
      var curCom  = pathComs[selCmd]
        , newCom  = mover.cmdType+mover.coords[0].toFixed(2)+','+mover.coords[1].toFixed(2)
        , newPath = ''
        ;
      
      $('.sel > .sel').text(newCom);
      $('.sel:first').find('span').each(function(e,i){
        newPath+=$(this).text()+' ';
      });
      
      $(svg.cursor1x.paths[selPath]).attr('d', newPath);
      $(svg.cursor5x.paths[selPath]).attr('d', newPath);

      drawPathsToDisplay();
    }
  }


  win.addEventListener('keydown', function(e){

    switch(e.keyCode){
    case 38: // Up
      updateMover(false, -nudgeAmt);
      break;
    case 40: // Down
      updateMover(false, +nudgeAmt);
      break;
    case 37: // Left
      updateMover(-nudgeAmt, false);
      break;
    case 39: // Right
      updateMover(+nudgeAmt, false);
      break;

    // Select Previous Path
    case 87: // W
      selPath--;
      if (selPath<0) {
        selPath = pathCount-1;
      }
      selectPath(selPath);
      drawPathsToDisplay();
      activateMover();
      break;

    // Select Next Path
    case 83: // S
      selPath++;
      if (selPath>pathCount-1) {
        selPath = 0;
      }
      selectPath(selPath);
      drawPathsToDisplay();
      activateMover();
      break;
    
    // Select Prev Command
    case 65: // A
      selCmd--;
      if (selCmd<0) {
        selCmd=cmdCount-1;
      }
      selectPath(selPath);
      drawPathsToDisplay();
      activateMover();
      break;
    
    // Select Next Command
    case 68: // D
      selCmd++;
      if (selCmd>cmdCount-1) {
        selCmd=0;
      }
      selectPath(selPath);
      drawPathsToDisplay();
      activateMover();
      break;
    }

    // console.log(e.keyCode);
  });



  win.addEventListener('DOMContentLoaded', function(){
    $pathDisplay = $('#path-window');
    storeSVGData();
    selectPath(0);
    drawPathsToDisplay();
    activateMover();
  });

})(window, $);