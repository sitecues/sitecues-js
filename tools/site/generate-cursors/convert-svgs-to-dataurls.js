

  var path = 'res/svg_cursors/';
  
  // var cursors = [
  //     'cursor_mac_arrow.svg'
  //   , 'cursor_mac_glove.svg'
  //   , 'cursor_pc_arrow.svg'
  //   , 'cursor_pc_hand.svg'
  // ];

  var cursors = [
    // {"url":"osx-lofi-arrow.svg", "min-width":13, "min-height":20,"max-width":83, "max-height":128 }, 
    // {"url":"osx-lofi-pointer.svg", "min-width":18, "min-height":20,"max-width":115, "max-height":128 }, 
    
    //{ "url":"max-osx-retina-arrow2.svg", "type":"retina", "min-width":27, "min-height":42, "max-width":82, "max-height":128 }, 

    { "url":"min-osx-retina-arrow-ds.svg", "type":"retina",
      "min-width"  :  27,
      "min-height" :  42,
      "max-width"  :  82,
      "max-height" : 128
    }, 


    { "url":"hand-min-retina.svg", "type":"retina",
      "min-width"  :  34,
      "min-height" :  38,
      "max-width"  : 114,
      "max-height" : 128
    }, 

    // {"url":"osx-retina-pointer.svg", "min-width":34, "min-height":38,"max-width":114, "max-height":128 }, 
    // {"url":"win-arrow.svg", "min-width":12, "min-height":19,"max-width":80, "max-height":128 }, 
    // {"url":"win-pointer.svg", "min-width":17, "min-height":22,"max-width":98, "max-height":128 }
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


  function renderCursor (cur) {
    var url = cur.url

    // var canvas = document.createElement('canvas');

    // canvg(canvas, path+url);

    var startWidth  = cur["min-width"]
      , startHeight = cur["min-height"]
      , size        = zoom.min
      , steps       = (zoom.max - zoom.min) / zoom.step
      , stepSizeX   = (cur["max-width"]-startWidth) / steps
      , stepSizeY   = (cur["max-height"]-startHeight) / steps
      , step        = 0
      , i           = 0
      ;

    // console.log(steps, stepSize);
    


    for(; step < steps; step++){
      // size = size.toFixed(1);
      
      // if(i<1){
        var canvas      = document.createElement('canvas')
          , realWidth   = startWidth + (stepSizeX*step)
          , realHeight  = startHeight + (stepSizeY*step)
          ;

        canvas.width = realWidth;
        canvas.height = realHeight;
        canvas.setAttribute('width' , realWidth);
        canvas.setAttribute('height', realHeight);

        if(cur.type="retina"){ 
          // realWidth *= .5;
          // realHeight *= .5;
          // canvas.width = realWidth;
          // canvas.height = realHeight;
          // canvas.setAttribute('width' , realWidth);
          // canvas.setAttribute('height', realHeight);
        }

        (function(url, step, canvas){
          svg2Canvas(path+url, {
              width       : realWidth
            , height      : realHeight
            , toDataURL   : true
            , density     : 2
            , canvas      : canvas
            , callback    : function(dataURL){
                var dataurl = document.createElement('dataurl');
                dataurl.setAttribute('title',url+'_'+step);
                console.log(url+'_'+step);

                dom.dataURLS.appendChild(dataurl);
                dom.canvasBin.appendChild(canvas);
                dataurl.innerHTML = dataURL;
          }});
        })(url, step, canvas);

      // }

      i++;
    }

  };


  window.addEventListener("load", function(){
    var canvas = document.getElementById('canvas');
    cacheDOM();
    processCursors();
  });