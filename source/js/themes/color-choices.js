/**
 *  Support color themes in page
 *  The available color theme choices
 */

// TODO media queries -- wikipedia and digg
// Do we want to do:
// - border color
// - images, background-images?
// - Force adaptive badge?
// Sidebar colors not taking effect at
//   - http://www.foxnews.com/world/2015/05/17/russia-putin-scores-8-goals-in-game-with-nhl-veterans/
//   - Parts of http://www.cnn.com/
//   - http://timesofindia.indiatimes.com/world/europe/French-mayor-expelled-for-claiming-Islam-will-be-banned-from-France-by-2027/articleshow/47316711.cms
//   - is it because we apply styles in the wrong order (style-service doesn't try to preserve order)
// Not working on
// - http://www.jsonline.com/sports/bucks/
// - http://news.yahoo.com/us-raid-syria-killed-32-members-including-4-102310292.html
// - http://english.alarabiya.net/en/News/middle-east/2015/05/17/Egypt-restricts-women-travelling-to-Turkey-.html

sitecues.def('themes/color/choices', function(colorChoices, callback) {
  'use strict';

  sitecues.use('jquery', function($) {
    var BLACK = { r: 0, g: 0, b: 0, a: 1 },
      MIN_INTENSITY = 0.6,
      YELLOW_HUE = 0.167;


    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   Number  h       The hue
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

    function getInvertedColor(rgba) {
      var hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      hsl.l = 1 - hsl.l;  // Invert lightness
      var invertedRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      invertedRgb.a = rgba.a;
      return invertedRgb;
    }

    // style object is as follows:
    // rgba: color
    // prop: property name ('background', 'background-color' or 'color')

    colorChoices.blackWithYellow = function (style, intensity) {
      return blackWithHue(YELLOW_HUE, style, intensity);
    };

    var hue;
    sitecues.setHue = function (newHue) {
      hue = newHue;
    }

    colorChoices.blackWithHue = function (style, intensity) {
      return blackWithHue(hue, style, intensity);
    };

    var yowza = 0;
    colorChoices.blackWithYowza = function (style, intensity) {
      yowza = ((yowza + 1) % 21)
      return blackWithHue(yowza / 20, style, intensity);
    };

    function blackWithHue(hue, style, intensity) {
      if (style.prop === 'color') {
        var rgba = style.rgba,
          hsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
          origLightness = Math.max(hsl.l, 1 - hsl.l);
        intensity = Math.max(intensity * origLightness, MIN_INTENSITY);
        var newRgba = $.extend(rgba, hslToRgb(hue, 1, 0.5));
        return getReducedIntensity(newRgba, intensity);
      }
      else {
        return getReducedIntensity(BLACK, intensity);
      }
    };

    colorChoices.blackKeepForeground = function (style, intensity) {
      if (style.prop === 'color') {
        var rgba = style.rgba,
          hsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
          origLightness = 1 - hsl.l,
          newLightness = Math.max(Math.min(intensity * (origLightness + 0.2), intensity), MIN_INTENSITY);
        var newRgba = $.extend({}, rgba, hslToRgb(hsl.h, hsl.s, newLightness));
        return newRgba;
      }
      else {
        var rgba = style.rgba,
          hsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
          origLightness = hsl.l,
          newLightness = Math.max(intensity * (0.18 - origLightness / 5), 0);
        var newRgba = $.extend({}, rgba, hslToRgb(hsl.h, hsl.s, newLightness));
        return newRgba;
      }
    };

    colorChoices.hslInvert = function (style, intensity) {
      return getReducedIntensity(getInvertedColor(style.rgba), intensity);
    };

    colorChoices.invert = function (style, intensity) {
      var rgba = style.rgba,
        newRgba = {
          r: 255 - rgba.r,
          g: 255 - rgba.g,
          b: 255 - rgba.b,
          a: rgba.a
        };
      return getReducedIntensity(newRgba, intensity);
    };

    colorChoices.lightened = function (style, intensity) {
      return getReducedIntensity(style.rgba, intensity);
    };

    sitecues.hslToRgb = hslToRgb;
    sitecues.rgbToHsl = rgbToHsl;
  });

  if (SC_UNIT) {
    $.extend(exports, colorChoices);
  }

  callback();
});