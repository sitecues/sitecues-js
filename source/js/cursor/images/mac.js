/**
 * This file contains custom Mac-like cursor images for each zoom level.
 * It aims to isolate images storage from the code. We might want to change the
 * format or the way they are represented, so encapsulation sounds like a good idea.
 * @param {object} imagesMac
 * @param {function} callback
 */
sitecues.def('cursor/images/mac', function (osImages, callback) {

  'use strict';

  // 128px is max possible cursor dimensions (w/h), anything above will silently fail and you will see no cursor

  sitecues.use('platform', function (platform) {

    var pixelRatio = platform.pixel.ratio || 1;

    function prepareCursor (size, type) {

      if (!platform.pixel.support[platform.browser.is]) {
        pixelRatio = 1
      }

      size *= pixelRatio;

      var  cursorSVG = { A: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" '+
        'width="'+(128*pixelRatio)+'px" height="'+(128*pixelRatio)+'px" viewBox="0,0,'+(128*pixelRatio)+','+(128*pixelRatio)+'"><defs><filter id="f1" x="0" y="0" width="200%" height="200%"><feOffset result="offOut" in="SourceAlpha" dx=".25" dy=".5" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" /></filter></defs><g transform="'+
        'scale('+(size)+','+(size)+')" ' +
        'filter="url(#f1)"><path fill="#FFF" d="M1.016,0.422 L1.031,16.781 L4.312,13.281 L6.446,18.479 L10.344,17.031 L8.062,11.875 L12.496,11.871 L1.016,0.422 z" /><path fill="#000" d="M1.938,2.875 L2.031,14.188 L4.531,11.625 L6.969,17.312 L9.031,16.562 L6.688,10.938 L10,10.938"/></g></svg>'
                       , B:  '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" '+
        'width="'+(128*pixelRatio)+'px" height="'+(128*pixelRatio)+'px" viewBox="0,0,'+(128*pixelRatio)+','+(128*pixelRatio)+'"><defs><filter id="f1" x="0" y="0" width="200%" height="200%"><feOffset result="offOut" in="SourceAlpha" dx=".25" dy=".5" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" /></filter></defs><g transform="'+
        'scale('+(size)+','+(size)+')" ' +
        'filter="url(#f1)"><path fill="#F00" d="M1.016,0.422 L1.031,16.781 L4.312,13.281 L6.446,18.479 L10.344,17.031 L8.062,11.875 L12.496,11.871 L1.016,0.422 z" /><path fill="#000" d="M1.938,2.875 L2.031,14.188 L4.531,11.625 L6.969,17.312 L9.031,16.562 L6.688,10.938 L10,10.938"/></g></svg>'
      };
      
      // console.log(cursorSVG[type], type);

      return 'data:image/svg+xml,' + escape( cursorSVG[type] );
    }

    // Cursor images according to zoom level values, in dataUrl format. Name pattern is: <cursor_type>_<zoom_level>. Example: default_1_0.
    osImages.urls = {
      'default_1_0' : prepareCursor(1.0,'A'),
      'default_1_1' : prepareCursor(1.1,'A'),
      'default_1_2' : prepareCursor(1.2,'A'),
      'default_1_3' : prepareCursor(1.3,'A'),
      'default_1_4' : prepareCursor(1.4,'A'),
      'default_1_5' : prepareCursor(1.5,'A'),
      'default_1_6' : prepareCursor(1.6,'A'),
      'default_1_7' : prepareCursor(1.7,'A'),
      'default_1_8' : prepareCursor(1.8,'A'),
      'default_1_9' : prepareCursor(1.9,'A'),
      'default_2_0' : prepareCursor(2.0,'A'),
      'default_2_1' : prepareCursor(2.1,'A'),
      'default_2_2' : prepareCursor(2.2,'A'),
      'default_2_3' : prepareCursor(2.3,'A'),
      'default_2_4' : prepareCursor(2.4,'A'),
      'default_2_5' : prepareCursor(2.5,'A'),
      'default_2_6' : prepareCursor(2.6,'A'),
      'default_2_7' : prepareCursor(2.7,'A'),
      'default_2_8' : prepareCursor(2.8,'A'),
      'default_2_9' : prepareCursor(2.9,'A'),
      'default_3_0' : prepareCursor(3.0,'A'),
      'default_3_1' : prepareCursor(3.1,'A'),
      'pointer_1_0' : prepareCursor(1.0,'B'),
      'pointer_1_1' : prepareCursor(1.1,'B'),
      'pointer_1_2' : prepareCursor(1.2,'B'),
      'pointer_1_3' : prepareCursor(1.3,'B'),
      'pointer_1_4' : prepareCursor(1.4,'B'),
      'pointer_1_5' : prepareCursor(1.5,'B'),
      'pointer_1_6' : prepareCursor(1.6,'B'),
      'pointer_1_7' : prepareCursor(1.7,'B'),
      'pointer_1_8' : prepareCursor(1.8,'B'),
      'pointer_1_9' : prepareCursor(1.9,'B'),
      'pointer_2_0' : prepareCursor(2.0,'B'),
      'pointer_2_1' : prepareCursor(2.1,'B'),
      'pointer_2_2' : prepareCursor(2.2,'B'),
      'pointer_2_3' : prepareCursor(2.3,'B'),
      'pointer_2_4' : prepareCursor(2.4,'B'),
      'pointer_2_5' : prepareCursor(2.5,'B'),
      'pointer_2_6' : prepareCursor(2.6,'B'),
      'pointer_2_7' : prepareCursor(2.7,'B'),
      'pointer_2_8' : prepareCursor(2.8,'B'),
      'pointer_2_9' : prepareCursor(2.9,'B'),
      'pointer_3_0' : prepareCursor(3.0,'B'),
      'pointer_3_1' : prepareCursor(3.1,'B'),
    };

  });

  // Done.
  callback();

});