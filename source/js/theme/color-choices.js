/**
 *  The available color theme choices that can be used by the color engine
 */

// Do we want to do:
// - border color
// - images, background-images, iframes?
// - example background-image problem:
//    http://www.teachingvisuallyimpaired.com/increase-contrast.html
// - gradients
// White blocks left on texasat.net -- wtf Chrome?, digg.com
// White on white button text at news.google.com and http://www.lloydsbank.com/, because of:
//    ** news.google.com **
//    background-image: -webkit-linear-gradient(top,#f5f5f5,#f1f1f1);
//    ** lloydsbank **
//    background: -webkit-gradient(linear,0% 0,0% 100%,from(#fff),to(#e6e6e6));
//    background: -webkit-linear-gradient(top,#fff,#e6e6e6);
//    background: -moz-linear-gradient(top,#fff,#e6e6e6);
//    background: -ms-linear-gradient(top,#fff,#e6e6e6);
//    background: -o-linear-gradient(top,#fff,#e6e6e6);

sitecues.def('theme/color/choices', function(colorChoices, callback) {
  'use strict';

  sitecues.use('jquery', function($) {
    var BLACK = { r: 0, g: 0, b: 0, a: 1 },
      MIN_INTENSITY = 0.6,
      YELLOW_HUE = 0.167,
      GREEN_HUE = 0.333,
      monoForegroundHsl = { h: 0.12, s: 1, l: 0.5 },
      monoBackgroundHsl = { h: 0.62, s: 1, l: 0.1 };

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

      if (s == 0) {
        r = g = b = l; // achromatic
      } else {
        var hue2rgb = function hue2rgb(p, q, t) {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        }

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
      }
    }

    // From http://www.w3.org/TR/2006/WD-WCAG20-20060427/complete.html#luminosity-contrastdef
    function getLuminosity(rgb) {
      function getValue(color) {
        return Math.pow(rgb[color] / 255, 2.2);
      }
      return 0.213 * getValue('r') +
             0.715 * getValue('g') +
             0.072 * getValue('b');
    }

    function getContrastRatio(rgb1, rgb2) {
      var L1 = getLuminosity(rgb1),
        L2 = getLuminosity(rgb2);
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
      r /= 255, g /= 255, b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;

      if (max == min) {
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

    function getReducedIntensity(rgba, intensity) {
      var hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      if (hsl.l < .5) {
        hsl.l = 1 - intensity * ( 1 - hsl.l);
      }
      else {
        hsl.l *= intensity;  // Invert lightness
      }
      var lightenedRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      lightenedRgb.a = rgba.a;
      return lightenedRgb;
    }

    function getInvertedLightness(rgba) {
      var hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      hsl.l = 1 - hsl.l;  // Invert lightness
      var invertedRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      invertedRgb.a = rgba.a;
      return invertedRgb;
    }

    // style object is as follows:
    // rgba: color
    // prop: property name ('background', 'background-color' or 'color')

    colorChoices.darkWithYellow = function (style, intensity) {
      return darkWithHue(YELLOW_HUE, style, intensity);
    };

    colorChoices.darkWithGreen = function (style, intensity) {
      return darkWithHue(GREEN_HUE, style, intensity);
    };

    colorChoices.monochrome = function (style, intensity) {
      var mixInHsl = (style.prop === 'color') ? monoForegroundHsl : monoBackgroundHsl,
        rgba = style.parsedVal,
        origHsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
        origLightness = Math.max(origHsl.l, 1 - origHsl.l);
      intensity = Math.max(intensity * origLightness, MIN_INTENSITY);
      var newRgba = $.extend({}, rgba, hslToRgb(mixInHsl.h, mixInHsl.s, mixInHsl.l));
      return getReducedIntensity(newRgba, intensity);
    };

    function darkWithHue(hue, style, intensity) {
      if (style.prop === 'color') {
        var rgba = style.parsedVal,
          hsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
          origLightness = Math.max(Math.max(hsl.l, 1 - hsl.l), 0.5);
        intensity = Math.max(origLightness, intensity);
        var newRgba = $.extend({}, rgba, hslToRgb(hue, 1, 0.5));
        return getReducedIntensity(newRgba, intensity);
      }
      else {
        return getReducedIntensity(BLACK, intensity);
      }
    };

    function isHueBrightEnoughForDarkTheme(hue) {
       return hue <= 0.6 || (hue >= 0.8 && hue <= .92);
    }

    function getClosestGoodHueForDarkTheme(hue) {
      if (isHueBrightEnoughForDarkTheme(hue)) {
        return hue;
      }
      if (hue > 0.96) {
        return 0;
      }
      else if (hue > .9) {
        return .92;
      }
      else if (hue > .7) {
        return .8
      }
      return .6;
    }

    colorChoices.increaseContrast = function(style, intensity) {
      var rgba = style.parsedVal,
        hsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
        luminosity = getLuminosity(rgba);
      if (style.prop === 'color') {
        var MIN_LUMINOSITY = 0.22 * intensity;
        if (luminosity > MIN_LUMINOSITY && luminosity < 0.5) {
          var tooLightFactor = (luminosity / MIN_LUMINOSITY),   // 1 -> just right, 2 -> 2x light as it should be
            newLightness = hsl.l /= tooLightFactor;
          return $.extend({}, rgba, hslToRgb(hsl.h, hsl.s, newLightness));
        }
      }
      return rgba;
    };

    var yowza = 0;
    colorChoices.darkCreative = function (style, intensity) {

      // Hues from .1 - .56 and .84 - .86 are dark enough
      var MIN_CONTRAST_RATIO = 4.4,
        NUM_COLORS = 50,
        newHue,
        contrastRatio,
        oldYowza = yowza;
      while (true) {
        yowza = ((yowza + 1) % NUM_COLORS);
        newHue = yowza / NUM_COLORS;
        contrastRatio = getContrastRatio(hslToRgb(newHue, 1, 0.5), BLACK);
        if (contrastRatio > MIN_CONTRAST_RATIO) {
          SC_DEV && console.log('--> ' + yowza + ' ' + newHue + ' ' + contrastRatio + ':1');
          break;
        }
        if (yowza === oldYowza) {
          break;
        }
      }
      return darkWithHue(newHue, style, intensity);
    };

    colorChoices.darkOriginal = function (style, intensity) {
      var rgba = style.parsedVal,
        hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      if (style.prop === 'color') {
        var origLightness = Math.max(hsl.l, 1 - hsl.l),
          newLightness = Math.max(Math.min(intensity * (origLightness + 0.1), intensity), 0.5),
          newHue = getClosestGoodHueForDarkTheme(hsl.h),
          newRgba = $.extend({}, rgba, hslToRgb(newHue, hsl.s, newLightness));
      }
      else {
        var
          origLightness = hsl.l,
          newLightness = origLightness < 0.4 ? origLightness : (1 - origLightness) * 3,
          newRgba = $.extend({}, rgba, hslToRgb(hsl.h, hsl.s, Math.min(0.16, newLightness) * intensity));
      }
      return newRgba;
    };

    // Invert all colors using HSL inversion
    colorChoices.hslInvert = function (style, intensity) {
      return getReducedIntensity(getInvertedLightness(style.parsedVal), intensity);
    };

    // Invert all colors using RGB inversion
    colorChoices.rgbInvert = function (style, intensity) {
      var rgba = style.parsedVal,
        newRgba = {
          r: 255 - rgba.r,
          g: 255 - rgba.g,
          b: 255 - rgba.b,
          a: rgba.a
        };
      return getReducedIntensity(newRgba, intensity);
    };

    // Reduce overall contrast
    colorChoices.lightened = function (style, intensity) {
      return getReducedIntensity(style.parsedVal, intensity);
    };

    // Creme colored background and lightened text
    // Roughly based on the research on readability for people with dyslexia at
    // http://www.w3.org/WAI/RD/2012/text-customization/r11
    colorChoices.paper = function (style, intensity) {
      if (style.prop === 'color') {
        var rgba = style.parsedVal,
          hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
//        if (hsl.l > .5) {
//          // Ensure dark foreground
//          hsl = 1 - hsl.l;
//          rgba = $.extend({}, rgba, hslToRgb(hsl.h, hsl.l, 1-hsl.l));
//        }
        return getReducedIntensity(rgba, intensity - 0.2);
      }
      else {
        var rgba = style.parsedVal,
          hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);

        if (hsl.l > 0.95) {
          var PAPER_HUE = 0.17,
            PAPER_SATURATION = 0.8,
            PAPER_LIGHTNESS_REDUCTION = 0.015;
          rgba = $.extend({}, rgba, hslToRgb(PAPER_HUE, PAPER_SATURATION, hsl.l - PAPER_LIGHTNESS_REDUCTION));
        }
        return getReducedIntensity(rgba, intensity);
      }
    };

    function mixRgbaColors(origRgba, mixInRgba, mixInRatio) {
      var reductionRatio = 1 - mixInRatio;

      function mixChannel(origChannelValue, mixInChannelValue) {
        return Math.min(Math.round(origChannelValue * reductionRatio + mixInChannelValue * mixInRatio), 255);
      }

      return {
        r: mixChannel(origRgba.r, mixInRgba.r),
        g: mixChannel(origRgba.g, mixInRgba.g),
        b: mixChannel(origRgba.b, mixInRgba.b),
        a: origRgba.a
      };
    }

    colorChoices.blueReduction = function(style, intensity) {
      var rgba = $.extend({}, style.parsedVal);

      if (style.prop === 'color' && rgbToHsl(rgba.r, rgba.g, rgba.b).l < 0.2) {
        return getReducedIntensity(rgba, intensity - 0.15);
      }

      var mixInRatio = /*rgba.b * 0.001 */ .2 * (1 - intensity),
        mixInRgba = hslToRgb(0.15, 1, 0.5);

      return mixRgbaColors(rgba, mixInRgba, mixInRatio);
    };

    colorChoices.isDarkTheme = function(colorMapFn, originalBg) {
      var originalBg = {
        prop: 'background-color',
        parsedVal: originalBg
      };
      var themedBg = colorMapFn(originalBg, 1);
      return colorChoices.isDarkColor(themedBg);
    };

    colorChoices.isDarkColor = function(rgb) {
      var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b  );
      return hsl.l < 0.2;
    };

    if (SC_DEV) {
      // TODO remove
      sitecues.rgbToHsl = rgbToHsl;
      sitecues.hslToRgb = hslToRgb;
      // TODO Put in UI rather than global function
      sitecues.setMonoForegroundHsl = function (newHsl) {
        monoForegroundHsl = newHsl;
      };
      sitecues.setMonoBackgroundHsl = function (newHsl) {
        monoBackgroundHsl = newHsl;
      };
      sitecues.getLuminosity = getLuminosity;
      sitecues.getContrastRatio = getContrastRatio;
    }
  });


  if (SC_UNIT) {
    $.extend(exports, colorChoices);
  }

  callback();
});