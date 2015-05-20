/**
 * Service that converts color strings into an rgba object { r: number, g: number, b: number, a: number }
 */
sitecues.def('themes/color/codes', function (colorCodes, callback) {

  'use strict';

  // Convert color names such as 'white', 'black', 'transparent'
  function convertColorNameToRgbFormat(colorName) {
// APPROACH #1 is fast but bloats library by 1.6k with COLOR_NAMES_MAP
//    var hexVal = colorCodes.COLOR_NAMES_MAP[colorName];
//    if (typeof hexVal === 'undefined') {
//      return 'rgba(0, 0, 0, 0)';
//    }
//
//    var red = Math.floor(hexVal / 0x10000) % 256,
//      green = Math.floor(hexVal / 0x100) % 256,
//      blue = hexVal % 256;
//
//    return 'rgb(' + red + ', ' + green + ', ' + blue + ')';

// APPROACH #2 is slower (~34ms on Chrome) but does not require COLOR_NAMES_MAP
    var oldBorderColor = document.body.style.borderColor;
    document.body.style.borderColor = colorName;
    var isLegalColor = document.body.style.borderColor,  // Browser won't set the color on the <div> if it's not a legal color name
      rgb = isLegalColor ? getComputedStyle(document.body).color : 'rgba(0, 0, 0, 0)';
    document.body.style.borderColor = oldBorderColor;
    return rgb;
  }

  colorCodes.getRgba =function(colorString) {
    // In some browsers, sometimes the computed style for a color is 'transparent' instead of rgb/rgba
    var rgb;
    if (colorString.substr(0,3) !== 'rgb') {
      rgb = convertColorNameToRgbFormat(colorString);
    }
    else {
      rgb = colorString;
    }

    var MATCH_COLORS = /rgba?\((\d+), (\d+), (\d+),?( [\d?.]+)?\)/,
      match = MATCH_COLORS.exec(rgb) || {};

    return {
      r: parseInt(match[1] || 0),
      g: parseInt(match[2] || 0),
      b: parseInt(match[3] || 0),
      a: parseFloat(match[4] || 1)
    };
  };

  colorCodes.COLOR_NAMES_MAP = {
    // System color names -- currently based on OS X colors
    // To get a color code for a certain system color, do the following:
    // function getHexCode(color) {
    //   document.body.style.color = color; var rgb = getRgba(getComputedStyle(document.body).color); var num = rgb.r * 256 * 256 + rgb.g * 256 + rgb.b; console.log('0x' + num.toString(16));
    // }

    buttonface: 0xc0c0c0,
    buttonhighlight: 0xe9e9e9,
    buttonshadow: 0x9fa09f,
    buttontext: 0,
    captiontext: 0,
    graytext: 0x7f7f7f,
    highlighttext: 0,
    inactiveborder: 0xffffff,
    inactivecaption: 0xffffff,
    inactivecaptiontext: 0,
    infobackground: 0xfbfcc5,
    infotext: 0,
    menu: 0xf6f6f6,
    menutext: 0xffffff,
    scrollbar: 0xaaaaaa,
    threeddarkshadow: 0,
    threedface: 0xc0c0c0,
    threedhighlight: 0xffffff,
    threedlightshadow: 0xffffff,
    threedshadow: 0,
    window: 0xececec,
    windowtext: 0,
    windowframe: 0xaaaaaa,

    // Traditional color names
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };
//
callback();
});
