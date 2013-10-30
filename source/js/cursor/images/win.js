/**
 * This file contains custom Mac-like cursor images for each zoom level.
 * It aims to isolate images storage from the code. We might want to change the
 * format or the way they are represented, so encapsulation sounds like a good idea.
 * @param {object} imagesMac
 * @param {function} callback
 */
sitecues.def('cursor/images/win', function (osImages, callback) {

  'use strict';

  // 128px is max possible cursor dimensions (w/h), anything above will silently fail and you will see no cursor

  sitecues.use('platform', function (platform) {

    var pixelRatio = platform.pixel.ratio || 1;

    function prepareCursor (size, type) {

      if (!platform.pixel.support[platform.browser.is]) {
        pixelRatio = 1;
      }

      size *= pixelRatio;


      console.log("WINWINWIN!");

      var  cursorSVG = {
          0: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" '+
        'width="'+(128*pixelRatio)+'px" height="'+(128*pixelRatio)+'px" viewBox="0,0,'+(128*pixelRatio)+','+(128*pixelRatio)+'"><defs><filter id="d" x="0" y="0" width="200%" height="200%"><feOffset result="offOut" in="SourceAlpha" dx=".25" dy=".5" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation=".5" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" /></filter></defs><g transform="'+
        'scale('+(size)+','+(size)+')" filter="url(#d)"><path fill="#000000" d="M0,0 L0,17.75 L4.188,13.875 L8.25,21.062 L11.531,18.719 L7.75,12.062 L12.594,12 L0,0 z" /><path fill="#FFFFFF" d="M0.931,2.277 L1,15.062 L4.281,12 L8.562,19.469 L10.156,18.406 L5.875,11.062 L10.062,11 L0.931,2.277 z" /></g></svg>'

        , 1: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" '+
        'width="'+(128*pixelRatio)+'px" height="'+(128*pixelRatio)+'px" viewBox="0,0,'+(128*pixelRatio)+','+(128*pixelRatio)+'"><defs><filter id="d" x="0" y="0" width="200%" height="200%"><feOffset result="offOut" in="SourceAlpha" dx=".25" dy=".5" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation=".5" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" /></filter></defs><g transform="'+
        'scale('+(size)+','+(size)+')" filter="url(#d)"><path fill="#000000" d="M5.102,1.33 C4.84,1.395 4.492,1.627 4.356,1.829 C3.913,2.479 3.873,3.754 4.231,5.721 C4.361,6.442 4.694,7.984 4.765,8.211 C4.785,8.276 4.689,8.216 4.502,8.045 C3.852,7.47 3.358,7.223 2.814,7.223 C2.184,7.218 1.644,7.586 1.342,8.231 C1.196,8.533 1.18,8.614 1.185,9.023 C1.191,9.769 1.407,10.182 2.632,11.735 C3.202,12.46 3.398,12.758 3.928,13.701 C4.059,13.933 4.382,14.296 5.198,15.102 L6.292,16.191 L6.307,16.816 L6.322,17.441 L8.162,17.456 L9.997,17.467 L10.582,16.887 L11.162,16.307 L11.741,16.887 L12.321,17.467 L13.229,17.456 L14.136,17.441 L14.161,16.433 L14.187,15.425 L14.373,15.097 C14.474,14.916 14.756,14.497 15.003,14.164 C15.25,13.832 15.598,13.343 15.78,13.081 C16.495,12.052 16.49,12.083 16.47,9.385 C16.455,7.278 16.455,7.258 16.339,7.041 C16.173,6.724 15.915,6.466 15.613,6.295 C15.381,6.169 15.296,6.149 14.938,6.149 C14.575,6.149 14.494,6.169 14.212,6.315 C14.035,6.406 13.889,6.472 13.889,6.466 C13.884,6.457 13.819,6.32 13.738,6.164 C13.566,5.816 13.289,5.554 12.906,5.373 C12.664,5.262 12.558,5.242 12.145,5.242 C11.605,5.242 11.353,5.327 11.026,5.615 C10.854,5.766 10.839,5.766 10.809,5.675 C10.754,5.494 10.244,5.075 9.937,4.959 C9.518,4.798 9.029,4.808 8.652,4.98 C8.495,5.05 8.283,5.171 8.188,5.247 C8.072,5.332 8.011,5.357 8.011,5.312 C8.011,5.176 7.86,4.229 7.784,3.881 C7.502,2.615 6.983,1.758 6.312,1.451 C6,1.31 5.42,1.249 5.102,1.33 z" /><path fill="#FFFFFF" d="M0,-0 M6.03,2.222 C6.327,2.393 6.61,2.837 6.796,3.422 C6.988,4.017 7.028,4.264 7.179,5.6 C7.25,6.214 7.341,6.905 7.381,7.127 C7.593,8.226 7.845,8.604 8.153,8.276 C8.253,8.171 8.268,8.075 8.313,7.273 C8.339,6.789 8.384,6.336 8.41,6.27 C8.505,6.018 8.858,5.826 9.246,5.826 C9.509,5.821 9.917,6.013 10.093,6.22 C10.224,6.376 10.229,6.412 10.229,6.92 C10.229,7.596 10.305,8.13 10.416,8.251 C10.476,8.322 10.557,8.342 10.698,8.332 C11.021,8.307 11.066,8.196 11.147,7.283 L11.212,6.507 L11.424,6.346 C11.722,6.119 12.11,6.038 12.533,6.109 C13.092,6.205 13.163,6.336 13.254,7.384 C13.335,8.286 13.4,8.443 13.713,8.443 C13.909,8.443 14.05,8.246 14.187,7.808 C14.383,7.167 14.686,6.946 15.18,7.087 C15.416,7.147 15.553,7.318 15.618,7.641 C15.689,7.959 15.689,10.177 15.623,11.044 C15.578,11.654 15.563,11.72 15.366,12.102 C15.18,12.481 14.59,13.312 13.904,14.164 C13.748,14.361 13.597,14.563 13.566,14.623 C13.521,14.714 13.405,16.035 13.405,16.493 L13.405,16.66 L12.962,16.66 L12.513,16.66 L11.893,15.979 C11.55,15.606 11.258,15.299 11.242,15.299 C11.223,15.299 10.905,15.606 10.532,15.979 L9.851,16.66 L8.505,16.66 L7.154,16.66 L7.154,16.211 L7.154,15.763 L6.741,15.395 C6.509,15.188 6.121,14.85 5.879,14.649 C5.289,14.155 4.977,13.786 4.497,13.03 C4.281,12.682 3.706,11.831 3.222,11.14 C2.022,9.416 1.962,9.315 1.962,9.113 C1.962,8.649 2.466,8.09 2.884,8.09 C3.439,8.09 4.523,8.937 5.113,9.839 C5.491,10.409 5.632,10.494 5.944,10.333 C6.06,10.273 6.095,10.212 6.126,10.021 C6.171,9.698 6.04,8.932 5.763,7.934 C5.092,5.524 4.83,4.264 4.83,3.467 C4.825,2.469 5.027,2.091 5.551,2.091 C5.738,2.091 5.874,2.126 6.03,2.222 z"/><path fill="#000000" d="M8.742,10.251 L8.742,10.251 C8.941,10.251 9.102,10.406 9.102,10.597 L9.102,13.994 C9.102,14.185 8.941,14.34 8.742,14.34 L8.742,14.34 C8.543,14.34 8.381,14.185 8.381,13.994 L8.381,10.597 C8.381,10.406 8.543,10.251 8.742,10.251 z" /><path fill="#000000" d="M10.8,10.251 L10.8,10.251 C10.998,10.251 11.16,10.406 11.16,10.597 L11.16,13.994 C11.16,14.185 10.998,14.34 10.8,14.34 L10.8,14.34 C10.601,14.34 10.439,14.185 10.439,13.994 L10.439,10.597 C10.439,10.406 10.601,10.251 10.8,10.251 z" /><path fill="#000000" d="M12.694,10.251 L12.694,10.251 C12.893,10.251 13.055,10.406 13.055,10.597 L13.055,13.994 C13.055,14.185 12.893,14.34 12.694,14.34 L12.694,14.34 C12.495,14.34 12.334,14.185 12.334,13.994 L12.334,10.597 C12.334,10.406 12.495,10.251 12.694,10.251 z" /></g><defs/></svg>'
      };
      
      // console.log(cursorSVG[type], type);

      return 'data:image/svg+xml,' + escape( cursorSVG[type] );
    }

    // Cursor images according to zoom level values, in dataUrl format. Name pattern is: <cursor_type>_<zoom_level>. Example: default_1_0.
    osImages.urls = {
      'default_1_0' : prepareCursor(1.0,0),
      'default_1_1' : prepareCursor(1.1,0),
      'default_1_2' : prepareCursor(1.2,0),
      'default_1_3' : prepareCursor(1.3,0),
      'default_1_4' : prepareCursor(1.4,0),
      'default_1_5' : prepareCursor(1.5,0),
      'default_1_6' : prepareCursor(1.6,0),
      'default_1_7' : prepareCursor(1.7,0),
      'default_1_8' : prepareCursor(1.8,0),
      'default_1_9' : prepareCursor(1.9,0),
      'default_2_0' : prepareCursor(2.0,0),
      'default_2_1' : prepareCursor(2.1,0),
      'default_2_2' : prepareCursor(2.2,0),
      'default_2_3' : prepareCursor(2.3,0),
      'default_2_4' : prepareCursor(2.4,0),
      'default_2_5' : prepareCursor(2.5,0),
      'default_2_6' : prepareCursor(2.6,0),
      'default_2_7' : prepareCursor(2.7,0),
      'default_2_8' : prepareCursor(2.8,0),
      'default_2_9' : prepareCursor(2.9,0),
      'default_3_0' : prepareCursor(3.0,0),
      'default_3_1' : prepareCursor(3.1,0),
      'pointer_1_0' : prepareCursor(1.0,1),
      'pointer_1_1' : prepareCursor(1.1,1),
      'pointer_1_2' : prepareCursor(1.2,1),
      'pointer_1_3' : prepareCursor(1.3,1),
      'pointer_1_4' : prepareCursor(1.4,1),
      'pointer_1_5' : prepareCursor(1.5,1),
      'pointer_1_6' : prepareCursor(1.6,1),
      'pointer_1_7' : prepareCursor(1.7,1),
      'pointer_1_8' : prepareCursor(1.8,1),
      'pointer_1_9' : prepareCursor(1.9,1),
      'pointer_2_0' : prepareCursor(2.0,1),
      'pointer_2_1' : prepareCursor(2.1,1),
      'pointer_2_2' : prepareCursor(2.2,1),
      'pointer_2_3' : prepareCursor(2.3,1),
      'pointer_2_4' : prepareCursor(2.4,1),
      'pointer_2_5' : prepareCursor(2.5,1),
      'pointer_2_6' : prepareCursor(2.6,1),
      'pointer_2_7' : prepareCursor(2.7,1),
      'pointer_2_8' : prepareCursor(2.8,1),
      'pointer_2_9' : prepareCursor(2.9,1),
      'pointer_3_0' : prepareCursor(3.0,1),
      'pointer_3_1' : prepareCursor(3.1,1),
    };

  });

  // Done.
  callback();

});