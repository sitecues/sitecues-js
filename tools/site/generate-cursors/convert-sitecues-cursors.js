

  var path = 'res/cursor/';
  
  var cursors = [
      'cursor_mac_arrow.svg'
    , 'cursor_mac_glove.svg'
    , 'cursor_pc_arrow.svg'
    , 'cursor_pc_hand.svg'
  ];

  var zoom = {
      min  :  1
    , max  :  5
    , step : .1
  };

  
  // Cache DOM Objects for use later in the script
  var dom = {};

  function cacheDOM () {
    
    function get (id) {
      return document.getElementById(id);
    }

    dom.canvasBin = get("canvas-bin");
    dom.dataURLS = get("data-urls");
  }

  function processCursors () {
    var i = 0
      , l = cursors.length
      ;

    for(; i < l; i++){
      (function(cur){
        renderCursor(cur);
      })(cursors[i]);
      // renderCursor(cursors[i]);
    }
  };


  function renderCursor (url) {
    

    var canvas = document.createElement('canvas');
    // canvas.setAttribute('id', url+':'+size);
    canvg(canvas, path+url);

    var startWidth  = canvas.width
      , startHeight = canvas.height
      , size        = zoom.max
      , i = 0
      ;


    for(; size > zoom.min-zoom.step; size-=zoom.step){
      size = size.toFixed(1);
      
      if(i<2){
        var canvas      = document.createElement('canvas')
          , realWidth   = startWidth / size
          , realHeight  = startHeight / size
          ;

        canvas.width = realWidth;
        canvas.height = realHeight;
        canvas.setAttribute('width' , realWidth);
        canvas.setAttribute('height', realHeight);

        canvg(canvas, path+url, {
             scaleWidth      : realWidth
           , scaleHeight     : realHeight
           , ignoreDimensions: true
           , ignoreMouse     : true
           , ignoreAnimation : true
        });

        var dataurl = document.createElement('dataurl');
        dataurl.setAttribute('title',url+'_'+size);
        console.log(url+'_'+size);

        dataurl.innerHTML = canvas.toDataURL();
        dom.dataURLS.appendChild(dataurl);

        dom.canvasBin.appendChild(canvas);
      }

      i++;
    }

  };


  window.addEventListener("load", function(){
    var canvas = document.getElementById('canvas');
    cacheDOM();
    processCursors();
  });