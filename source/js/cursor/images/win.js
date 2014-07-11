/**
 * This file contains custom Windows-like cursor images for each zoom level.
 * It aims to isolate images storage from the code. We might want to change the
 * format or the way they are represented, so encapsulation sounds like a good idea.
 * @param {object} imagesWin
 * @param {function} callback
 */
sitecues.def('cursor/images/win', function (osImages, callback) {

  'use strict';

  // 128px is max possible cursor dimensions (w/h), anything above will silently fail and you will see no cursor
  // See more info about cursor size support:
  // https://equinox.atlassian.net/wiki/display/RD/Custom+cursor+feature+implementation+investigation

  sitecues.use('platform', function (platform) {

    var pixelRatio = platform.pixel.ratio || 1;

    function prepareCursor (size, type) {

      if (platform.browser.is === 'IE') {
        
        var cursorFile = {
            0: '../images/cursors/win_default_'+size+'.cur'
          , 1: '../images/cursors/win_pointer_'+size+'.cur'
        };

        return sitecues.resolveSitecuesUrl( cursorFile[type] );

      } else {
        
        if (!platform.pixel.cssCursorScaleSupport[platform.browser.is]) {
          pixelRatio = 1;
        }

        size *= pixelRatio;

        var cursorSVG = {
            0: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" '+
          'width="'+(128*pixelRatio)+'px" height="'+(128*pixelRatio)+'px" viewBox="0,0,'+(128*pixelRatio)+','+(128*pixelRatio)+'"><defs><filter id="d" x="0" y="0" width="200%" height="200%"><feOffset result="offOut" in="SourceAlpha" dx=".25" dy=".5" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation=".5" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" /></filter></defs><g transform=" '+
          'scale('+(size)+','+(size)+')" filter="url(#d)"><path fill="#000" d="M0,0 L0,17.75 L4.188,13.875 L8.25,21.062 L11.531,18.719 L7.75,12.062 L12.594,12 L0,0 z" /><path fill="#FFF" d="M0.931,2.277 L1,15.062 L4.281,12 L8.562,19.469 L10.156,18.406 L5.875,11.062 L10.062,11 L0.931,2.277 z" /></g></svg>'
          , 1: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" '+
          'width="'+(128*pixelRatio)+'px" height="'+(128*pixelRatio)+'px" viewBox="0,0,'+(128*pixelRatio)+','+(128*pixelRatio)+'"><defs><filter id="d" x="0" y="0" width="200%" height="200%"><feOffset result="offOut" in="SourceAlpha" dx=".25" dy=".5" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation=".5" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" /></filter></defs><g transform="'+
          'scale('+(size)+','+(size)+')" filter="url(#d)"><path fill="#000" d="M16.631,14.327 C16.638,15.756 16.53,15.942 16.403,16.321 C16.228,16.833 15.683,17.863 15.145,18.7 L14.728,19.338 L14.728,20.475 L14.723,21.97 L9.786,21.97 C5.905,21.97 4.911,22.037 4.911,21.97 C4.911,21.133 4.112,18.881 3.755,17.97 C3.067,16.22 2.473,15.22 0.796,12.887 C-0.237,11.452 -0.173,11.271 -0.233,10.58 C-0.327,9.596 0.117,8.94 1.355,8.946 C2.074,8.946 2.452,9.315 3.36,9.827 L3.812,10.186 L3.845,5.679 C3.879,1.293 3.886,1.173 4.014,0.947 C4.195,0.655 4.806,0.356 5.224,0.242 C5.412,0.189 5.775,0.156 6.091,0.169 C7.026,0.203 7.638,0.608 7.793,1.279 C7.833,1.446 7.867,2.436 7.867,3.546 L7.867,5.52 L8.163,5.487 C8.923,5.4 9.858,5.773 10.241,6.304 C10.416,6.55 10.484,6.597 10.625,6.57 C11.714,6.371 12.535,6.577 13.167,7.202 C13.322,7.361 13.45,7.514 13.45,7.541 C13.45,7.574 13.672,7.58 13.941,7.554 C14.452,7.507 15.084,7.6 15.414,7.767 C15.743,7.933 16.08,8.272 16.261,8.617 C16.436,8.956 16.53,8.97 16.577,10.851 C16.604,11.894 16.624,13.456 16.631,14.327 z" /><path fill="#FFF" d="M15.478,16.428 C15.639,15.909 15.652,14.972 15.558,11.502 C15.511,9.914 15.484,9.528 15.383,9.289 C15.161,8.751 14.617,8.478 13.971,8.584 L13.635,8.644 L13.614,10.14 C13.601,11.449 13.587,11.649 13.487,11.715 C13.352,11.821 13.036,11.828 12.854,11.735 C12.733,11.669 12.727,11.575 12.727,10.153 L12.727,8.638 L12.531,8.332 C12.235,7.873 11.812,7.654 11.24,7.654 C10.998,7.661 10.762,7.681 10.715,7.707 C10.662,7.74 10.641,8.192 10.641,9.203 C10.641,10.233 10.621,10.665 10.561,10.725 C10.514,10.771 10.352,10.804 10.204,10.804 C9.706,10.804 9.7,10.771 9.7,9.083 C9.7,7.395 9.659,7.235 9.148,6.903 C8.899,6.737 8.805,6.717 8.328,6.717 L7.783,6.717 L7.763,8.678 C7.749,10.426 7.736,10.645 7.635,10.718 C7.5,10.824 7.184,10.831 7.002,10.738 C6.881,10.672 6.875,10.552 6.875,6.245 L6.875,1.825 L6.713,1.665 C6.626,1.579 6.437,1.479 6.296,1.439 C5.792,1.3 5.368,1.373 5.079,1.645 L4.924,1.785 L4.924,7.189 C4.924,13.217 4.964,12.772 4.44,12.752 C4.05,12.732 3.989,12.652 3.969,12.114 L3.949,11.385 L3.478,11.033 C2.98,10.667 2.642,10.198 2.211,10.058 C1.942,9.972 1.433,9.854 1.156,10.094 C0.688,10.5 0.864,11.019 0.99,11.261 C1.334,11.917 1.406,12 1.909,12.691 C3.884,15.411 3.844,15.5 5.644,20.489 L5.684,21.107 L9.74,21.107 L13.803,21.107 L13.803,20.249 L13.803,19.392 L14.307,18.654 C14.899,17.79 15.276,17.066 15.478,16.428 z" /></g><defs/></svg>'
        };

        return 'data:image/svg+xml,' + escape( cursorSVG[type] );

      }
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

  if (sitecues.UNIT) {
    exports.win = {
      'urls': osImages.urls
    };
  }

  // Done.
  callback();

});