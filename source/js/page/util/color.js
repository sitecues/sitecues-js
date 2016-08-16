/**
 * Service that converts color strings into an rgba object { r: number, g: number, b: number, a: number }
 */
define(
  [
    'core/inline-style/inline-style'
  ],
  function (
    inlineStyle
  ) {
  'use strict';

  var TRANSPARENT = 'rgba(0, 0, 0, 0)',
    MIN_LUMINOSITY_LIGHT_TONE = 0.62;

  function isDarkColor(colorValue, optionalThreshold) {

    var rgba = getRgba(colorValue);

    return getPerceivedLuminance(rgba) < (optionalThreshold || MIN_LUMINOSITY_LIGHT_TONE);
  }

  function isOnDarkBackground(current, optionalThreshold) {
    var currentBackgroundColor,
      origElement = current,
      currentRect,
      origRect;

    while (current) {
      currentBackgroundColor = getRgba(window.getComputedStyle(current).backgroundColor);

      // Only care about non-transparent backgrounds
      if (currentBackgroundColor.a > 0.5) {
        origRect = origRect || origElement.getBoundingClientRect();
        currentRect = current.getBoundingClientRect();
        if (currentRect.right > origRect.left && currentRect.left < origRect.right &&
          currentRect.bottom > origRect.top && currentRect.top < origRect.bottom) {
          return isDarkColor(currentBackgroundColor, optionalThreshold);
        }
      }

      current = current.parentElement;
    }
    return false;
  }

  // Convert color names such as 'white', 'black', 'transparent' to rgba object or TRANSPARENT
  function convertColorNameToRgbFormat(colorName) {
// APPROACH #1 is fast but bloats library by 1.6k with COLOR_NAMES_MAP
//    var hexVal = colorUtil.COLOR_NAMES_MAP[colorName];
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
// Setting the border on the <body> and then immediately resetting will not cause a visible change
    var docElt = document.documentElement,
      oldBorderColor = inlineStyle.get(docElt, 'outlineColor');
    if (colorName === 'initial' || colorName === 'inherit' || colorName === 'transparent') {
      return TRANSPARENT;
    }
    inlineStyle.set(docElt, {
      outlineColor : colorName
    });
    var isLegalColor = inlineStyle.get(docElt, 'outlineColor'),  // Browser didn't set the border color -> not a legal color
      rgb = isLegalColor && getComputedStyle(docElt).outlineColor;
    inlineStyle.set(docElt, {
      outlineColor : oldBorderColor
    });
    return rgb;
  }

  function getColorString(rgba) {
    function isAlphaRelevant(alpha) {
      return (alpha >= 0 && alpha < 1);  // false if undefined
    }
    var rgb = Math.round(rgba.r) + ',' + Math.round(rgba.g) +',' + Math.round(rgba.b);
    return isAlphaRelevant(rgba.a)? 'rgba(' + rgb + ',' +rgba.a + ')' : 'rgb(' + rgb + ')';
  }

  function getRgbaIfLegalColor(color) {
    if (!color) {
      return;
    }
    if (typeof color === 'object') {
      return color;
    }

    // In some browsers, sometimes the computed style for a color is 'transparent' instead of rgb/rgba
    var rgb;
    if (color.substr(0,3) !== 'rgb') {
      rgb = convertColorNameToRgbFormat(color);
      if (!rgb) {
        return; // Not a color
      }
    }
    else {
      rgb = color;
    }

    var MATCH_COLORS = /rgba?\((\d+), ?(\d+), ?(\d+),?( ?[\d?.]+)?\)/,
      match = MATCH_COLORS.exec(rgb) || {};

    return {
      r: parseInt(match[1] || 0),
      g: parseInt(match[2] || 0),
      b: parseInt(match[3] || 0),
      a: parseFloat(match[4] || 1)
    };
  }

  /**
   * Ensure that an rgba object is returned. Will use TRANSPARENT if necessary.
   * @param color
   */
  function getRgba(color) {
    return getRgbaIfLegalColor(color) || { r: 0, g: 0, b: 0, a: 0};
  }

//  colorUtil.COLOR_NAMES_MAP = {
//    // System color names -- currently based on OS X colors
//    // To get a color code for a certain system color, do the following:
//    // function getHexCode(color) {
//    //   document.body. style.color = color; var rgb = getRgba(getComputedStyle(document.body).color); var num = rgb.r * 256 * 256 + rgb.g * 256 + rgb.b; console.log('0x' + num.toString(16));
//    // }
//
//    buttonface: 0xc0c0c0,
//    buttonhighlight: 0xe9e9e9,
//    buttonshadow: 0x9fa09f,
//    buttontext: 0,
//    captiontext: 0,
//    graytext: 0x7f7f7f,
//    highlighttext: 0,
//    inactiveborder: 0xffffff,
//    inactivecaption: 0xffffff,
//    inactivecaptiontext: 0,
//    infobackground: 0xfbfcc5,
//    infotext: 0,
//    menu: 0xf6f6f6,
//    menutext: 0xffffff,
//    scrollbar: 0xaaaaaa,
//    threeddarkshadow: 0,
//    threedface: 0xc0c0c0,
//    threedhighlight: 0xffffff,
//    threedlightshadow: 0xffffff,
//    threedshadow: 0,
//    window: 0xececec,
//    windowtext: 0,
//    windowframe: 0xaaaaaa,
//
//    // Traditional color names
//    aliceblue: 0xf0f8ff,
//    antiquewhite: 0xfaebd7,
//    aqua: 0x00ffff,
//    aquamarine: 0x7fffd4,
//    azure: 0xf0ffff,
//    beige: 0xf5f5dc,
//    bisque: 0xffe4c4,
//    black: 0x000000,
//    blanchedalmond: 0xffebcd,
//    blue: 0x0000ff,
//    blueviolet: 0x8a2be2,
//    brown: 0xa52a2a,
//    burlywood: 0xdeb887,
//    cadetblue: 0x5f9ea0,
//    chartreuse: 0x7fff00,
//    chocolate: 0xd2691e,
//    coral: 0xff7f50,
//    cornflowerblue: 0x6495ed,
//    cornsilk: 0xfff8dc,
//    crimson: 0xdc143c,
//    cyan: 0x00ffff,
//    darkblue: 0x00008b,
//    darkcyan: 0x008b8b,
//    darkgoldenrod: 0xb8860b,
//    darkgray: 0xa9a9a9,
//    darkgreen: 0x006400,
//    darkkhaki: 0xbdb76b,
//    darkmagenta: 0x8b008b,
//    darkolivegreen: 0x556b2f,
//    darkorange: 0xff8c00,
//    darkorchid: 0x9932cc,
//    darkred: 0x8b0000,
//    darksalmon: 0xe9967a,
//    darkseagreen: 0x8fbc8f,
//    darkslateblue: 0x483d8b,
//    darkslategray: 0x2f4f4f,
//    darkturquoise: 0x00ced1,
//    darkviolet: 0x9400d3,
//    deeppink: 0xff1493,
//    deepskyblue: 0x00bfff,
//    dimgray: 0x696969,
//    dodgerblue: 0x1e90ff,
//    firebrick: 0xb22222,
//    floralwhite: 0xfffaf0,
//    forestgreen: 0x228b22,
//    fuchsia: 0xff00ff,
//    gainsboro: 0xdcdcdc,
//    ghostwhite: 0xf8f8ff,
//    gold: 0xffd700,
//    goldenrod: 0xdaa520,
//    gray: 0x808080,
//    green: 0x008000,
//    greenyellow: 0xadff2f,
//    honeydew: 0xf0fff0,
//    hotpink: 0xff69b4,
//    indianred: 0xcd5c5c,
//    indigo: 0x4b0082,
//    ivory: 0xfffff0,
//    khaki: 0xf0e68c,
//    lavender: 0xe6e6fa,
//    lavenderblush: 0xfff0f5,
//    lawngreen: 0x7cfc00,
//    lemonchiffon: 0xfffacd,
//    lightblue: 0xadd8e6,
//    lightcoral: 0xf08080,
//    lightcyan: 0xe0ffff,
//    lightgoldenrodyellow: 0xfafad2,
//    lightgray: 0xd3d3d3,
//    lightgreen: 0x90ee90,
//    lightpink: 0xffb6c1,
//    lightsalmon: 0xffa07a,
//    lightseagreen: 0x20b2aa,
//    lightskyblue: 0x87cefa,
//    lightslategray: 0x778899,
//    lightsteelblue: 0xb0c4de,
//    lightyellow: 0xffffe0,
//    lime: 0x00ff00,
//    limegreen: 0x32cd32,
//    linen: 0xfaf0e6,
//    magenta: 0xff00ff,
//    maroon: 0x800000,
//    mediumaquamarine: 0x66cdaa,
//    mediumblue: 0x0000cd,
//    mediumorchid: 0xba55d3,
//    mediumpurple: 0x9370db,
//    mediumseagreen: 0x3cb371,
//    mediumslateblue: 0x7b68ee,
//    mediumspringgreen: 0x00fa9a,
//    mediumturquoise: 0x48d1cc,
//    mediumvioletred: 0xc71585,
//    midnightblue: 0x191970,
//    mintcream: 0xf5fffa,
//    mistyrose: 0xffe4e1,
//    moccasin: 0xffe4b5,
//    navajowhite: 0xffdead,
//    navy: 0x000080,
//    oldlace: 0xfdf5e6,
//    olive: 0x808000,
//    olivedrab: 0x6b8e23,
//    orange: 0xffa500,
//    orangered: 0xff4500,
//    orchid: 0xda70d6,
//    palegoldenrod: 0xeee8aa,
//    palegreen: 0x98fb98,
//    paleturquoise: 0xafeeee,
//    palevioletred: 0xdb7093,
//    papayawhip: 0xffefd5,
//    peachpuff: 0xffdab9,
//    peru: 0xcd853f,
//    pink: 0xffc0cb,
//    plum: 0xdda0dd,
//    powderblue: 0xb0e0e6,
//    purple: 0x800080,
//    rebeccapurple: 0x663399,
//    red: 0xff0000,
//    rosybrown: 0xbc8f8f,
//    royalblue: 0x4169e1,
//    saddlebrown: 0x8b4513,
//    salmon: 0xfa8072,
//    sandybrown: 0xf4a460,
//    seagreen: 0x2e8b57,
//    seashell: 0xfff5ee,
//    sienna: 0xa0522d,
//    silver: 0xc0c0c0,
//    skyblue: 0x87ceeb,
//    slateblue: 0x6a5acd,
//    slategray: 0x708090,
//    snow: 0xfffafa,
//    springgreen: 0x00ff7f,
//    steelblue: 0x4682b4,
//    tan: 0xd2b48c,
//    teal: 0x008080,
//    thistle: 0xd8bfd8,
//    tomato: 0xff6347,
//    turquoise: 0x40e0d0,
//    violet: 0xee82ee,
//    wheat: 0xf5deb3,
//    white: 0xffffff,
//    whitesmoke: 0xf5f5f5,
//    yellow: 0xffff00,
//    yellowgreen: 0x9acd32
//  };

  /**
   * Converts an HSL color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes h, s, and l are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param   Number  h       The monochromeHue
   * @param   Number  s       The saturation
   * @param   Number  l       The lightness
   * @return  Object          The RGB representation
   */
  function hslToRgb(h, s, l) {
    var r, g, b;

    if (!s) {
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) {
          t += 1;
        }
        if (t > 1) {
          t -= 1;
        }
        if (t < 1 / 6) {
          return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
          return q;
        }
        if (t < 2 / 3) {
          return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
      };

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // From http://www.w3.org/TR/2006/WD-WCAG20-20060427/complete.html#luminosity-contrastdef
  function getLuminanceFromColorName(colorName) {
    return getPerceivedLuminance(getRgba(colorName));
  }

  // Perceived luminance must apply inverse gamma correction (the ^2.2)
  // See https://en.wikipedia.org/wiki/Luma_(video)
  //     https://en.wikipedia.org/wiki/Luminous_intensity
  //     https://en.wikipedia.org/wiki/Gamma_correction
  //     http://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color
  function getPerceivedLuminance(rgb) {
    var gammaReversed =
        0.299 * getValue('r') +
        0.587 * getValue('g') +
        0.114 * getValue('b');

    function getValue(channel) {
      var rawValue = rgb[channel] / 255;
      return rawValue * rawValue;
    }

    return Math.sqrt(gammaReversed);
  }

  // Trades accuracy for performance
  function getFastLuminance(rgb) {
    var DIVISOR = 2550; // 255 * (2 + 7 + 1)
    return (rgb.r*2 + rgb.g*7 + rgb.b) / DIVISOR;
  }

  function getContrastRatio(color1, color2) {
    var L1 = getLuminanceFromColorName(color1),
      L2 = getLuminanceFromColorName(color2);
    var ratio = (L1 + 0.05) / (L2 + 0.05);
    if (ratio >= 1) {
      return ratio;
    }
    return (L2 + 0.05) / (L1 + 0.05);
  }

  /**
   * Converts an RGB color value to HSL. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h, s, and l in the set [0, 1].
   *
   * @param   Number  r       The red color value
   * @param   Number  g       The green color value
   * @param   Number  b       The blue color value
   * @return  Object          The HSL representation
   */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: h,
      s: s,
      l: l
    };
  }

  // Get the current background color
  function getDocumentBackgroundColor() {
    var
      color = getComputedStyle(document.documentElement).backgroundColor,
      rgba = getRgba(color),
      WHITE = {r: 255, g: 255, b: 255};
    return rgba.a > 0 ? rgba : WHITE;
  }

  if (SC_DEV) {
    sitecues.getRgba = getRgba;
    sitecues.rgbToHsl = rgbToHsl;
    sitecues.hslToRgb = hslToRgb;
    sitecues.getLuminanceFromColorName = getLuminanceFromColorName;
    sitecues.getPerceivedLuminance = getPerceivedLuminance;
    sitecues.getContrastRatio = getContrastRatio;
    sitecues.getColorString = getColorString;
  }

  return {
    isDarkColor: isDarkColor,
    isOnDarkBackground: isOnDarkBackground,
    getColorString: getColorString,
    getRgbaIfLegalColor: getRgbaIfLegalColor,
    getRgba: getRgba,
    getLuminanceFromColorName: getLuminanceFromColorName,
    getFastLuminance: getFastLuminance,
    getPerceivedLuminance: getPerceivedLuminance,
    getContrastRatio: getContrastRatio,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    getDocumentBackgroundColor: getDocumentBackgroundColor
  };


});
