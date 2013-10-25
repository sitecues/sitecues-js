/**
 * This file contains custom Mac-like cursor images for each zoom level.
 * It aims to isolate images storage from the code. We might want to change the
 * format or the way they are represented, so encapsulation sounds like a good idea.
 * @param {object} imagesMac
 * @param {function} callback
 */
sitecues.def('cursor/images/mac', function (osImages, callback) {
  'use strict';

  

  function prepareCursor (size) {
    var cursorSVG = '<svg  x="0px" y="0px" width="128px" height="128px" viewBox="0 0 128 128" enable-background="new 0 0 247 364" xml:space="preserve"><g><g transform="translate(0.000000,364.000000) scale(0.100000,-0.100000)"><path fill="#FFFFFF" d="M110,2150V707.998l97.998,90c53.003,50,191.001,181.006,307.002,290l210,199.004l31.001-56.006C772.998,1200,883.999,987.998,1002.998,760c120-227.998,221.001-420.996,225-427.998c6.001-9.004,76.006,23.994,272.998,132.002c145,78.994,283.008,155,306.006,167.998l40.996,23.994L1739.004,860c-129.004,240-353.008,660-357.002,672.002c-2.002,3.994,175.996,7.998,395,7.998H2175l-365,366.001c-200.996,201.001-665,662.998-1032.002,1026.001l-667.998,660V2150z"/></g><g transform="translate(0.000000,261.000000) scale(0.100000,-0.100000)"><path d="M290,1097.5V67.5l227.998,227.998c125,125,230,227.002,234.004,227.002c2.998,0,122.002-222.998,263.994-495c143.008-272.002,263.008-494.004,267.002-495c6.006,0,315,165,324.004,174.004C1607.998-292.5,1495-80.498,1355.996,177.5l-252.998,470l322.998,2.998c178.008,1.006,324.004,6.006,324.004,10c0,4.004-327.998,336.006-730,737.002l-730,730V1097.5z"/></g></g></svg>';
    
    return 'data:image/svg+xml,' + escape(cursorSVG);
  }


  // Cursor images according to zoom level values, in dataUrl format. Name pattern is: <cursor_type>_<zoom_level>. Example: default_1_0.
  osImages.urls = {
    'default_1_0' : prepareCursor(3.1),
    'default_1_1' : prepareCursor(3.1),
    'default_1_2' : prepareCursor(3.1),
    'default_1_3' : prepareCursor(3.1),
    'default_1_4' : prepareCursor(3.1),
    'default_1_5' : prepareCursor(3.1),
    'default_1_6' : prepareCursor(3.1),
    'default_1_7' : prepareCursor(3.1),
    'default_1_8' : prepareCursor(3.1),
    'default_1_9' : prepareCursor(3.1),
    'default_2_0' : prepareCursor(3.1),
    'default_2_1' : prepareCursor(3.1),
    'default_2_2' : prepareCursor(3.1),
    'default_2_3' : prepareCursor(3.1),
    'default_2_4' : prepareCursor(3.1),
    'default_2_5' : prepareCursor(3.1),
    'default_2_6' : prepareCursor(3.1),
    'default_2_7' : prepareCursor(3.1),
    'default_2_8' : prepareCursor(3.1),
    'default_2_9' : prepareCursor(3.1),
    'default_3_0' : prepareCursor(3.1),
    'default_3_1' : prepareCursor(3.1),
    'default_3_2' : prepareCursor(3.1),
    'default_3_3' : prepareCursor(3.1),
    'default_3_4' : prepareCursor(3.1),
    'default_3_5' : prepareCursor(3.1),
    'default_3_6' : prepareCursor(3.1),
    'default_3_7' : prepareCursor(3.1),
    'default_3_8' : prepareCursor(3.1),
    'default_3_9' : prepareCursor(3.1),
    'default_4_0' : prepareCursor(3.1),
    'default_4_1' : prepareCursor(3.1),
    'default_4_2' : prepareCursor(3.1),
    'default_4_3' : prepareCursor(3.1),
    'default_4_4' : prepareCursor(3.1),
    'default_4_5' : prepareCursor(3.1),
    'default_4_6' : prepareCursor(3.1),
    'default_4_7' : prepareCursor(3.1),
    'default_4_8' : prepareCursor(3.1),
    'default_4_9' : prepareCursor(3.1),
    'default_5_0' : prepareCursor(3.1),
    'pointer_1_0' : prepareCursor(3.1),
    'pointer_1_1' : prepareCursor(3.1),
    'pointer_1_2' : prepareCursor(3.1),
    'pointer_1_3' : prepareCursor(3.1),
    'pointer_1_4' : prepareCursor(3.1),
    'pointer_1_5' : prepareCursor(3.1),
    'pointer_1_6' : prepareCursor(3.1),
    'pointer_1_7' : prepareCursor(3.1),
    'pointer_1_8' : prepareCursor(3.1),
    'pointer_1_9' : prepareCursor(3.1),
    'pointer_2_0' : prepareCursor(3.1),
    'pointer_2_1' : prepareCursor(3.1),
    'pointer_2_2' : prepareCursor(3.1),
    'pointer_2_3' : prepareCursor(3.1),
    'pointer_2_4' : prepareCursor(3.1),
    'pointer_2_5' : prepareCursor(3.1),
    'pointer_2_6' : prepareCursor(3.1),
    'pointer_2_7' : prepareCursor(3.1),
    'pointer_2_8' : prepareCursor(3.1),
    'pointer_2_9' : prepareCursor(3.1),
    'pointer_3_0' : prepareCursor(3.1),
    'pointer_3_1' : prepareCursor(3.1),
  };

  // Done.
  callback();

});