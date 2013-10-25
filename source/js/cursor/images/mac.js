/**
 * This file contains custom Mac-like cursor images for each zoom level.
 * It aims to isolate images storage from the code. We might want to change the
 * format or the way they are represented, so encapsulation sounds like a good idea.
 * @param {object} imagesMac
 * @param {function} callback
 */
sitecues.def('cursor/images/mac', function (osImages, callback) {

  'use strict';

  // function forcePowerofTwo

  // 128px is max possible cursor dimensions (w/h), anything above will silently fail and you will see no cursor

  function prepareCursor (size) {
    // var cursorSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" '+
    //                 'width="'+(128)+'px" height="'+(128)+'px" '+
    //                 'viewBox="0, 0,'+(128)+','+(128)+'"><g '+
    //                 'transform="scale('+(size)+','+(size)+')"><defs><filter id="f1" x="0" y="0" width="200%" height="200%"><feOffset result="offOut" in="SourceGraphic" dx="20" dy="20" /><feBlend in="SourceGraphic" in2="offOut" mode="normal" /></filter></defs><g filter="url(#f1)"><path fill="#FFF" d="M1.016,0.422 L1.031,16.781 L4.312,13.281 L6.446,18.479 L10.344,17.031 L8.062,11.875 L12.496,11.871 L1.016,0.422 z" /></g><path fill="#000" d="M1.938,2.875 L2.031,14.188 L4.531,11.625 L6.969,17.312 L9.031,16.562 L6.688,10.938 L10,10.938"/></g></svg>';

    var cursorSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="128px" height="128px" viewBox="0, 0,128,128"><defs><filter id="f1" x="0" y="0" width="200%" height="200%"><feOffset result="offOut" in="SourceAlpha" dx=".25" dy=".5" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" /></filter></defs><g transform="'+
      'scale('+size+','+size+')" ' +
      'filter="url(#f1)"><path fill="#FFF" d="M1.016,0.422 L1.031,16.781 L4.312,13.281 L6.446,18.479 L10.344,17.031 L8.062,11.875 L12.496,11.871 L1.016,0.422 z" /><path fill="#000" d="M1.938,2.875 L2.031,14.188 L4.531,11.625 L6.969,17.312 L9.031,16.562 L6.688,10.938 L10,10.938"/></g></svg>'
      ;
    
    console.log(cursorSVG);
    
    return 'data:image/svg+xml,' + escape(cursorSVG);
  }


  // Cursor images according to zoom level values, in dataUrl format. Name pattern is: <cursor_type>_<zoom_level>. Example: default_1_0.
  osImages.urls = {
    'default_1_0' : prepareCursor(1.0),
    'default_1_1' : prepareCursor(1.1),
    'default_1_2' : prepareCursor(1.2),
    'default_1_3' : prepareCursor(1.3),
    'default_1_4' : prepareCursor(1.4),
    'default_1_5' : prepareCursor(1.5),
    'default_1_6' : prepareCursor(1.6),
    'default_1_7' : prepareCursor(1.7),
    'default_1_8' : prepareCursor(1.8),
    'default_1_9' : prepareCursor(1.9),
    'default_2_0' : prepareCursor(2.0),
    'default_2_1' : prepareCursor(2.1),
    'default_2_2' : prepareCursor(2.2),
    'default_2_3' : prepareCursor(2.3),
    'default_2_4' : prepareCursor(2.4),
    'default_2_5' : prepareCursor(2.5),
    'default_2_6' : prepareCursor(2.6),
    'default_2_7' : prepareCursor(2.7),
    'default_2_8' : prepareCursor(2.8),
    'default_2_9' : prepareCursor(2.9),
    'default_3_0' : prepareCursor(3.0),
    'default_3_1' : prepareCursor(3.1),
    'pointer_1_0' : prepareCursor(1.0),
    'pointer_1_1' : prepareCursor(1.1),
    'pointer_1_2' : prepareCursor(1.2),
    'pointer_1_3' : prepareCursor(1.3),
    'pointer_1_4' : prepareCursor(1.4),
    'pointer_1_5' : prepareCursor(1.5),
    'pointer_1_6' : prepareCursor(1.6),
    'pointer_1_7' : prepareCursor(1.7),
    'pointer_1_8' : prepareCursor(1.8),
    'pointer_1_9' : prepareCursor(1.9),
    'pointer_2_0' : prepareCursor(2.0),
    'pointer_2_1' : prepareCursor(2.1),
    'pointer_2_2' : prepareCursor(2.2),
    'pointer_2_3' : prepareCursor(2.3),
    'pointer_2_4' : prepareCursor(2.4),
    'pointer_2_5' : prepareCursor(2.5),
    'pointer_2_6' : prepareCursor(2.6),
    'pointer_2_7' : prepareCursor(2.7),
    'pointer_2_8' : prepareCursor(2.8),
    'pointer_2_9' : prepareCursor(2.9),
    'pointer_3_0' : prepareCursor(3.0),
    'pointer_3_1' : prepareCursor(3.1),
  };

  // Done.
  callback();

});