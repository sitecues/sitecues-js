(function () {
  'use strict';

  var path = 'res/svg_cursors/'
  
    , cursors = [
      // {"url":"osx-lofi-arrow.svg", "min-width":13, "min-height":20,"max-width":83, "max-height":128 }, 
      // {"url":"osx-lofi-pointer.svg", "min-width":18, "min-height":20,"max-width":115, "max-height":128 }, 
      
      //{ "url":"max-osx-retina-arrow2.svg", "type":"retina", "min-width":27, "min-height":42, "max-width":82, "max-height":128 }, 

      { url: 'min-osx-retina-arrow-ds.svg', type: 'retina',
        min_width  :  27,
        min_height :  42,
        max_width  :  82,
        max_height : 128
      },


      { url: 'hand-min-retina.svg', type: 'retina',
        min_width  :  34,
        min_height :  38,
        max_width  : 114,
        max_height : 128
      },

      // {"url":"osx-retina-pointer.svg", "min-width":34, "min-height":38,"max-width":114, "max-height":128 }, 
      // {"url":"win-arrow.svg", "min-width":12, "min-height":19,"max-width":80, "max-height":128 }, 
      // {"url":"win-pointer.svg", "min-width":17, "min-height":22,"max-width":98, "max-height":128 }
    ]

  , zoom = {
      min  : 1
    , max  : 5
    , step : 0.1
    }
  
  // Cache DOM Objects for use later in the script
  , dom = {}

  ;

  function cacheDOM () {
    
    function get (id) {
      return document.getElementById(id);
    }

    dom.canvasBin = get('canvas-bin');
    dom.dataURLS = get('data-urls');
  }

  function processCursors () {
    var i = 0
      , l = cursors.length
      ;

    for(; i < l; i++){
      renderCursor(cursors[i]);
    }
  }

  function renderCursor (cur) {
    (function (cur) {

      var url = cur.url
        , startWidth  = cur.min_width
        , startHeight = cur.min_height
        , steps       = (zoom.max - zoom.min) / zoom.step
        , stepSizeX   = (cur.max_width-startWidth) / steps
        , stepSizeY   = (cur.max_height-startHeight) / steps
        , step        = 0
        , canvas
        , realWidth
        , realHeight
        ;

      function drawToCanvas (url, step, canvas) {
        svg2Canvas(path + url, {
            width       : realWidth
          , height      : realHeight
          , toDataURL   : true
          , density     : 2
          , canvas      : canvas
          , callback    : function (dataURL) {
              var dataurl = document.createElement('dataurl');
              dataurl.setAttribute('title', url + '_' + step);
              dom.dataURLS.appendChild(dataurl);
              dom.canvasBin.appendChild(canvas);
              dataurl.innerHTML = dataURL;
            }
          }
        );
      }

      for(; step < steps; step++){
        canvas  = document.createElement('canvas');
        realWidth = startWidth + (stepSizeX*step);
        realHeight = startHeight + (stepSizeY*step);

        canvas.width = realWidth;
        canvas.height = realHeight;
        canvas.setAttribute('width' , realWidth);
        canvas.setAttribute('height', realHeight);

        drawToCanvas(url, step, canvas);
      }

    })(cur);
  }

  window.addEventListener('load', function(){
    cacheDOM();
    processCursors();
  });

})();