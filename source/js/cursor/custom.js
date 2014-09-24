sitecues.def('cursor/custom', function (customCursor, callback) {
  'use strict';

  var PREFIX = '<svg xmlns="http://www.w3.org/2000/svg" width="SIDE" height="SIDE" viewBox="0,0,SIDE0,SIDE0"><defs><filter id="d" width="200%" height="200%"><feOffset result="offOut" in="SourceAlpha" dx="2.5" dy="5" /><feGaussianBlur result="blurOut" in="offOut" stdDeviation="5" /><feBlend in="SourceGraphic" in2="blurOut" mode="normal" /></filter></defs><g transform="scale(SIZE)" filter="url(#d)">',
    POSTFIX = '</g><defs/></svg>',
    CURSOR_SVG = {
      // Optimized to 2 decimal places via the SVG optimizer at https://petercollingridge.appspot.com/svg-editor
      // Turned into relative paths via the SVG editor at http://svg-edit.googlecode.com/svn-history/r1771/trunk/editor/svg-editor.html
      // (first paste in markup, accept the markup, then go back to markup view via <SVG> button)
      win: {
        _default:
          '<path d="M0 0L0 178 42 139 83 211 115 187 78 121 126 120 0 0z"/>' +
          '<path fill="#FFF" d="M9 23L10 151 43 120 86 195 102 184 59 111 101 110 9 23z"/>',
        _pointer:
          '<path d="m166,143c0,15 -1,16 -2,20c-2,5 -7,16 -12,24l-5,6l0,12l0,15l-49,0c-39,0 -49,0 -49,0c0,-9 -8,-31 -11,-40c-7,-18 -13,-28 -30,-51c-10,-14 -10,-16 -10,-23c-1,-10 3,-17 16,-16c7,0 11,3 20,8l4,4l1,-45c0,-44 0,-45 1,-47c2,-3 8,-6 12,-8c2,0 6,0 9,0c9,0 15,4 17,11c0,2 1,11 1,23l0,19l3,0c7,-1 17,3 20,8c2,3 3,3 4,3c11,-2 19,0 26,6c1,2 3,3 3,3c0,1 2,1 4,1c6,-1 12,0 15,2c3,1 7,5 9,8c1,4 2,4 3,23c0,10 0,26 0,34z"/>' +
          '<path fill="#FFF" d="m155,164c1,-5 2,-14 1,-49c-1,-16 -1,-20 -2,-22c-2,-5 -8,-8 -14,-7l-4,0l0,15c0,14 0,16 -1,16c-1,1 -5,1 -6,0c-2,0 -2,-1 -2,-15l0,-16l-2,-3c-3,-4 -7,-6 -13,-6c-2,0 -4,0 -5,0c0,0 -1,5 -1,15c0,10 0,15 0,15c-1,1 -2,1 -4,1c-5,0 -5,0 -5,-17c0,-17 0,-19 -5,-22c-3,-2 -4,-2 -9,-2l-5,0l0,20c0,17 -1,20 -2,20c-1,1 -4,1 -6,0c-1,0 -1,-1 -1,-44l0,-45l-2,-1c-1,-1 -3,-2 -4,-3c-5,-1 -9,0 -12,3l-2,1l0,54c0,60 1,56 -5,56c-3,-1 -4,-1 -4,-7l0,-7l-5,-4c-5,-3 -9,-8 -13,-9c-3,-1 -8,-2 -10,0c-5,4 -3,9 -2,12c3,6 4,7 9,14c20,27 19,28 37,78l1,6l40,0l41,0l0,-8l0,-9l5,-7c6,-9 10,-16 12,-23z"/>'
        },
      mac: {
        _default:
          '<path fill="#FFF" d="M10 4L10 168 43 133 65 185 103 170 81 119 125 119 10 4z"/>' +
          '<path d="M19 29L20 142 45 116 70 173 90 166 67 109 100 109"/>',
        _pointer:
          '<path d="m51,13c-3,1 -6,3 -7,5c-5,7 -5,20 -2,39c2,7 5,23 6,25c0,1 -1,0 -3,-1c-6,-6 -11,-9 -17,-9c-6,0 -12,4 -15,10c-1,3 -1,4 -1,8c0,8 2,12 14,27c6,8 8,11 13,20c2,2 5,6 13,14l11,11l0,6l0,6l19,1l18,0l6,-6l6,-6l5,6l6,6l9,0l9,-1l1,-10l0,-10l2,-3c1,-2 4,-6 6,-9c3,-4 6,-9 8,-11c7,-10 7,-10 7,-37c0,-21 0,-21 -2,-24c-1,-3 -4,-5 -7,-7c-2,-1 -3,-1 -7,-1c-3,0 -4,0 -7,1c-2,1 -3,2 -3,2c0,0 -1,-2 -2,-3c-1,-4 -4,-6 -8,-8c-2,-1 -3,-2 -7,-2c-6,0 -8,1 -12,4c-1,2 -2,2 -2,1c0,-2 -6,-6 -9,-7c-4,-2 -9,-2 -12,0c-2,1 -4,2 -5,3c-1,0 -2,1 -2,0c0,-1 -1,-11 -2,-14c-3,-13 -8,-21 -15,-24c-3,-2 -9,-2 -12,-2z"/>' +
          '<path fill="#FFF" d="m0,0l60,22c3,2 6,6 8,12c2,6 2,9 4,22c1,6 1,13 2,15c2,11 5,15 8,12c1,-1 1,-2 1,-10c0,-5 1,-10 1,-10c1,-3 5,-5 9,-5c2,0 6,2 8,4c1,2 1,2 1,7c0,7 1,12 2,14c1,0 2,0 3,0c3,0 4,-1 5,-10l0,-8l2,-1c3,-3 7,-4 11,-3c6,1 7,2 8,13c0,9 1,10 4,10c2,0 4,-1 5,-6c2,-6 5,-8 10,-7c2,1 4,2 4,5c1,4 1,26 0,34c0,7 0,7 -2,11c-2,4 -8,12 -15,21c-1,2 -3,4 -3,4c-1,1 -2,14 -2,19l0,2l-4,0l-5,0l-6,-7c-3,-4 -6,-7 -7,-7c0,0 -3,3 -7,7l-6,7l-14,0l-13,0l0,-5l0,-4l-5,-4c-2,-2 -6,-5 -8,-7c-6,-5 -9,-9 -14,-17c-2,-3 -8,-12 -13,-19c-12,-17 -12,-18 -12,-20c0,-4 5,-10 9,-10c5,0 16,8 22,17c4,6 5,7 8,5c2,0 2,-1 2,-3c1,-3 -1,-11 -3,-21c-7,-24 -10,-36 -10,-44c0,-10 2,-14 8,-14c1,0 3,0 4,1l-60,-22z"/>' +
          '<path d="m87,103l0,0c2,0 4,1 4,3l0,34c0,2 -2,3 -4,3l0,0c-2,0 -3,-1 -3,-3l0,-34c0,-2 1,-3 3,-3z"/>' +
          '<path d="m108,103l0,0c2,0 4,1 4,3l0,34c0,2 -2,3 -4,3l0,0c-2,0 -4,-1 -4,-3l0,-34c0,-2 2,-3 4,-3z"/>' +
          '<path d="m127,103l0,0c2,0 4,1 4,3l0,34c0,2 -2,3 -4,3l0,0c-2,0 -4,-1 -4,-3l0,-34c0,-2 2,-3 4,-3z"/>'
        }
      };

  sitecues.use('platform', function (platform) {

    /**
     * Get a URL for the cursor given the current platform
     * @param type 'default' or 'pointer'  (for auto cursor, use 'default')
     * @param sizeRatio a number > 1 (e.g. 2 = 2x)
     * @param pixelRatio = 1 for normal, 2 for retina cursor
     */
    customCursor.getUrl = function(type, sizeRatio, pixelRatio) {

      if (platform.browser.is === 'IE') {
        return sitecues.resolveSitecuesUrl( '../images/cursors/win_' + type + '_' + Math.min(sizeRatio,3) + '.cur' );
      }

      var prefix = PREFIX
          .replace(/SIZE/g, '' + sizeRatio * pixelRatio)
          .replace(/SIDE/g, '' + 128 * pixelRatio),
        cursorSvg = prefix + CURSOR_SVG[platform.os.is]['_' + type] + POSTFIX;

      return 'data:image/svg+xml,' + escape( cursorSvg );
    };

    // Done.
    callback();

  });

});