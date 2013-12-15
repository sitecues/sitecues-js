(function () {
  'use strict';

  var path = '../../cursor_input/'
  
    // Only need to generate Win-IE cursors. The other broswers and osses use SVGs.

    , cursors = [

      { url: 'win_default.svg',
        width     : 14,
        height    : 23,
        hotspotX  : 0,
        hotspotY  : 0
      },

      { url: 'win_pointer.svg',
        width     : 17,
        height    : 22,
        hotspotX  : 5,
        hotspotY  : 1
      }
    ]

  , zoom = {
      min  : 1
    , max  : 3.1
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
        , startWidth  = cur.width
        , startHeight = cur.height
        , step        = zoom.min+zoom.step
        , canvas
        , realWidth
        , realHeight
        , hotspotX
        , hotspotY
        ;

      function drawToCanvas (url, step, canvas, hotspotX, hotspotY) {
        svg2Canvas(path + url, {
            width       : parseInt(realWidth)
          , height      : parseInt(realHeight)
          , toDataURL   : true
          , density     : 1
          , canvas      : canvas
          , callback    : function (dataURL) {
              var dataurl = document.createElement('dataurl');
              dataurl.setAttribute('title', (url.split('.svg')[0]) + '_' + (parseFloat(step).toFixed(1)));
              dataurl.setAttribute('data-hotspotx', hotspotX);
              dataurl.setAttribute('data-hotspoty', hotspotY);
              dom.dataURLS.appendChild(dataurl);
              dom.canvasBin.appendChild(canvas);
              dataurl.innerHTML = dataURL;
            }
          }
        );
      }

      for(; step < zoom.max+zoom.step; step+=zoom.step){
        canvas  = document.createElement('canvas');
        realWidth = startWidth * step;
        realHeight = startHeight * step;

        hotspotX = parseInt(cur.hotspotX * step);
        hotspotY = parseInt(cur.hotspotY * step);

        canvas.width  = 96;
        canvas.height = 96;
        canvas.setAttribute('width' , 96);
        canvas.setAttribute('height', 96);

        drawToCanvas(url, step, canvas, hotspotX, hotspotY);
      }

    })(cur);
  }

  window.addEventListener('load', function(){
    cacheDOM();
    processCursors();
  });

})();