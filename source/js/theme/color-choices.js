/**
 *  The available color theme choices that can be used by the color engine
 */

// Do we want to do:
// - border color
// Reverse colors:
// - sitecues.com positioning
// - Bad photo reversal guesses:
//   http://www.leadingage.org/ and // - http://www.leadingage.org/

define(
  [
    '$',
    'page/util/color'
  ],
  function (
    $,
    colorUtil
  ) {
  'use strict';

  var hslToRgb = colorUtil.hslToRgb,
    rgbToHsl = colorUtil.rgbToHsl;

  function getReducedIntensity(rgba, intensity) {
    var hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
    if (hsl.l < 0.5) {
      hsl.l = 1 - intensity * (1 - hsl.l);
    }
    else {
      hsl.l *= intensity;  // Invert lightness
    }
    var lightenedRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    lightenedRgb.a = rgba.a;
    return lightenedRgb;
  }

//    function getInvertedLightness(rgba) {
//      var hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
//      hsl.l = 1 - hsl.l;  // Invert lightness
//      var invertedRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
//      invertedRgb.a = rgba.a;
//      return invertedRgb;
//    }

  // style object is as follows:
  // rgba: color
  // prop: property name ('background', 'background-color' or 'color')

//    function monochrome (style, intensity) {
//      var mixInHsl = (style.prop === 'color') ? monoForegroundHsl : monoBackgroundHsl,
//        rgba = style.parsedVal,
//        origHsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
//        origLightness = Math.max(origHsl.l, 1 - origHsl.l);
//      intensity = Math.max(intensity * origLightness, MIN_INTENSITY);
//      var newRgba = $.extend({}, rgba, hslToRgb(mixInHsl.h, mixInHsl.s, mixInHsl.l));
//      return getReducedIntensity(newRgba, intensity);
//    };

//    function darkWithHue(hue, style, intensity) {
//      if (style.prop === 'color') {
//        var rgba = style.parsedVal,
//          hsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
//          origLightness = Math.max(Math.max(hsl.l, 1 - hsl.l), 0.5);
//        intensity = Math.max(origLightness, intensity);
//        var newRgba = $.extend({}, rgba, hslToRgb(hue, 1, 0.5));
//        return getReducedIntensity(newRgba, intensity);
//      }
//      else {
//        return getReducedIntensity(BLACK, intensity);
//      }
//    }
//
  function isHueBrightEnoughForDarkTheme(hue) {
    return hue <= 0.56 || (hue >= 0.8 && hue <= 0.92);
  }

  function getClosestGoodHueForDarkTheme(hue) {
    if (isHueBrightEnoughForDarkTheme(hue)) {
      return hue;
    }
    if (hue >= 0.96) {
      return 0;
    }
    else if (hue >= 0.92) {
      return 0.92;
    }
    else if (hue >= 0.68) {   // .56-.8 is a hole
      return 0.8;
    }
    return 0.56;
  }

  function getSampleElements(selector) {
    var REMOVE_PSEUDO_CLASSES_AND_ELEMENTS = /::?[^ ,:.]+/g,
      $result = $();
    try {
      $result = $(selector.replace(REMOVE_PSEUDO_CLASSES_AND_ELEMENTS, ''));
    }
    catch (ex) {
    }
    return $result;
  }

  function isInDarkParagraph($sampleElements, luminosity) {
    var isInDarkPara;

    $sampleElements.each(function (index, sampleElement) {
      var sampleElementStyle = getComputedStyle(sampleElement);
      if (sampleElementStyle.display === 'inline') {
        var parentElement = sampleElement.parentElement,
          parentStyle = getComputedStyle(parentElement),
          parentLuminosity,
          parentInnerText = parentElement.innerText,
          sampleInnerText = sampleElement.innerText;
        if (parentInnerText && parentInnerText.trim().length > (sampleInnerText && sampleInnerText.length) &&
          sampleElementStyle.backgroundColor === parentStyle.backgroundColor) {
          parentLuminosity = colorUtil.getLuminanceFromColorName(parentStyle.color);
          if (parentLuminosity !== luminosity) {
            if (parentLuminosity < 0.3) {
              isInDarkPara = true;
              return false; // Stop iterating
            }
            if (parentLuminosity > 0.7) {
              isInDarkPara = false;
              return false; // Stop iterating
            }
          }
        }
      }
    });

    return isInDarkPara;
  }

  function isWithDarkForeground($sampleElements) {
    return colorUtil.getLuminanceFromColorName($sampleElements.css('color')) < 0.5;
  }

  /**
   * @param {object} style { parsedVal: rgba, selector, prop: 'color', etc. }
   * @return -1: decrease lightness, 0: do nothing, 1: increase lightness
   */
  function computeContrastEnhancementDirection(style) {
    var rgba = style.parsedVal,
      luminosity = colorUtil.getLuminanceFromColorName(rgba),
      $sampleElements;

    if (style.prop === 'color') {
      // Foreground decision
      $sampleElements = getSampleElements(style.selector);

      var isInDarkPara = isInDarkParagraph($sampleElements, luminosity);
      if (typeof isInDarkPara !== 'undefined') {
        return isInDarkPara ? 1 : -1;
      }

      // Middle of the road foreground color -- analyze background
      // If on light background make text darker, and vice-versa
      var isOnDarkBg = colorUtil.isOnDarkBackground($sampleElements[0]);
      if (typeof isOnDarkBg !== 'undefined') {
        return isOnDarkBg ? 1 : -1;
      }

      return luminosity < 0.5 ? -1 : 1;
    }

    // Background decision
    if (luminosity > 0.4 && luminosity < 0.6) {
      // Not sure about bg, check fg darkness
      $sampleElements = getSampleElements(style.selector);
      var isWithDarkFg = isWithDarkForeground($sampleElements);
      if (typeof isWithDarkFg !== 'undefined') {
        return isWithDarkFg ? 1 : -1;
      }
    }
    return luminosity < 0.5 ? -1 : 1;
  }

  function getContrastEnhancementDirection(style) {
    if (typeof style.contrastEnhancementDirection !== 'undefined') {
      return style.contrastEnhancementDirection;
    }
    var direction = computeContrastEnhancementDirection(style);
    style.contrastEnhancementDirection = direction; // Cache
    return direction;
  }

  function getSaturationImpactOnContrast(saturation) {
    return 0.3 + saturation * 0.8;
  }

  function bold(style, intensity) {
    var colorChangeIntensity = intensity / 1.6 + 0.1,
      textShadowIntensity = intensity / 3.5,
      rgba = style.parsedVal,
      hsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
      newLightness = hsl.l,
      saturation = hsl.s, // Reduce contrast change for saturated colors so that we remain colorful
      power = (1 - colorChangeIntensity) * 4 * getSaturationImpactOnContrast(saturation) + (style.prop === 'color' ? 0 : 0.2),
      factor = style.prop === 'color' ? 2 : 6,
      contrastEnhancementDirection = getContrastEnhancementDirection(style),
      newAlpha = rgba.a;

    if (contrastEnhancementDirection < 0) {
      // Reduce lightness
      newLightness = hsl.l - Math.pow(hsl.l / factor, power) * colorChangeIntensity;
      // Also increase the alpha if it's < 1
      // This multiplies the alpha, so that if the original is fully transparent it remains transparent
      if (newAlpha < 1) {
        newAlpha = Math.min(1, newAlpha * (colorChangeIntensity + 1));
      }
    }
    else if (contrastEnhancementDirection > 0) {
      // Reduce darkness
      var darkness = 1 - hsl.l,
        newDarkness = darkness - Math.pow(darkness / factor, power) * colorChangeIntensity;
      newLightness = 1 - newDarkness;
    }

    var lightnessDiff = Math.abs(newLightness - hsl.l),
      MIN_SIGNIFICANT_LIGHTNESS_DIFF = 0.01,
      isSignificantChange = lightnessDiff > MIN_SIGNIFICANT_LIGHTNESS_DIFF || newAlpha !== rgba.a,
      returnVal = isSignificantChange ? $.extend({a: newAlpha}, hslToRgb(hsl.h, hsl.s, newLightness)) : rgba;

    if (style.prop === 'color') {
      // Make the text thicker
      returnVal = $.extend({}, returnVal, {textShadow: textShadowIntensity});
    }
    return returnVal;
  }

//    var yowza = 0;
//    function darkCreative (style, intensity) {
//
//      // Hues from .1 - .56 and .84 - .86 are dark enough
//      var MIN_CONTRAST_RATIO = 4.4,
//        NUM_COLORS = 50,
//        newHue,
//        contrastRatio,
//        oldYowza = yowza;
//      while (true) {
//        yowza = ((yowza + 1) % NUM_COLORS);
//        newHue = yowza / NUM_COLORS;
//        contrastRatio = colorUtil.getContrastRatio(hslToRgb(newHue, 1, 0.5), BLACK);
//        if (contrastRatio > MIN_CONTRAST_RATIO) {
//          if (SC_DEV) { console.log('--> ' + yowza + ' ' + newHue + ' ' + contrastRatio + ':1'); }
//          break;
//        }
//        if (yowza === oldYowza) {
//          break;
//        }
//      }
//      return darkWithHue(newHue, style, intensity);
//    };

  function getSaturation(rgba) {
    return rgbToHsl(rgba.r, rgba.g, rgba.b).s;
  }

  function colorizeGrayText(rgba, textHue) {
    var FOREGROUND_MIXIN_INTENSITY = 0.5,
      grayness = 1 - getSaturation(rgba),
      mixInRatio = FOREGROUND_MIXIN_INTENSITY * (grayness + 0.2) / 1.2, // More gray (less saturated)  = more channel reduction, so we can keep colors
      mixInRgba = hslToRgb(textHue, 1, 0.5);
    return mixRgbaColors(rgba, mixInRgba, mixInRatio);  // Mix in the opposite color
  }

  function dark(style, intensity, textHue) {
    var rgba = style.parsedVal,
      hsl,
      colorizedRgba,
      newRgba,
      origLightness,
      newLightness,
      bgAddedLightness,
      bgPreservationFactor,
      newHue,
      foregroundIntensity = 0.4 + (Math.min(intensity, 0.8) / 1.3),
      textShadowIntensity = Math.max(0, intensity - 0.8) * 0.6;

    if (style.prop === 'color') {
      colorizedRgba = (textHue && textHue <= 1) ? colorizeGrayText(rgba, textHue) : rgba;
      hsl = rgbToHsl(colorizedRgba.r, colorizedRgba.g, colorizedRgba.b);
      origLightness = Math.max(hsl.l, 1 - hsl.l);
      newLightness = foregroundIntensity * (origLightness + 0.1);
      newLightness = newLightness * (1.2 - hsl.s / 6); // Saturated colors should be kept a bit
      newLightness = Math.max(newLightness, foregroundIntensity / 3);
      newLightness = Math.min(newLightness, 1);
      newHue = getClosestGoodHueForDarkTheme(hsl.h);
      newRgba = $.extend({}, rgba, hslToRgb(newHue, hsl.s, newLightness));
      if (textShadowIntensity > 0) {
        newRgba.textShadow = textShadowIntensity;
      }
    }
    else {
      hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      bgAddedLightness = (1 - intensity) / 8; // Add a little lightness when theme is less intense
      bgPreservationFactor = 0.6 - intensity / 8;
      origLightness = hsl.l;
      newLightness = (origLightness < 0.4 ? origLightness : (1 - origLightness) * 3);
      newRgba = $.extend({}, rgba, hslToRgb(hsl.h, hsl.s, Math.min(0.16, newLightness) * bgPreservationFactor + bgAddedLightness));
    }
    return newRgba;
  }

//    // Invert all colors using HSL inversion
//    hslInvert (style, intensity) {
//      return getReducedIntensity(getInvertedLightness(style.parsedVal), intensity);
//    };
//
//    // Invert all colors using RGB inversion
//    rgbInvert (style, intensity) {
//      var rgba = style.parsedVal,
//        newRgba = {
//          r: 255 - rgba.r,
//          g: 255 - rgba.g,
//          b: 255 - rgba.b,
//          a: rgba.a
//        };
//      return getReducedIntensity(newRgba, intensity);
//    };

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

  function warm(style, intensity) {
    var rgba = $.extend({}, style.parsedVal);

    intensity = 1 - intensity / 3;

    if (style.prop === 'color' && rgbToHsl(rgba.r, rgba.g, rgba.b).l < 0.2) {
      return getReducedIntensity(rgba, intensity - 0.15);
    }

    var mixInRatio = /*rgba.b * 0.001 */ 0.2 * (1 - intensity),
      mixInRgba = hslToRgb(0.15, 1, 0.5);

    return mixRgbaColors(rgba, mixInRgba, mixInRatio);
  }

  return {
    dark: dark,
    bold: bold,
    warm: warm
  };
});
