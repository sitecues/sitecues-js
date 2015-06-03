/**
 *  The available color theme choices that can be used by the color engine
 */

// Do we want to do:
// - border color
// - background-image textures and gradients
// - example background-image texture problem:
//    http://www.teachingvisuallyimpaired.com/increase-contrast.html
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

  sitecues.use('jquery', 'util/color', function($, colorUtil) {
    var BLACK = { r: 0, g: 0, b: 0, a: 1 },
      MIN_INTENSITY = 0.6,
      YELLOW_HUE = 0.167,
      GREEN_HUE = 0.333,
      monoForegroundHsl = { h: 0.12, s: 1, l: 0.5 },
      monoBackgroundHsl = { h: 0.62, s: 1, l: 0.1 },
      hslToRgb = colorUtil.hslToRgb,
      rgbToHsl = colorUtil.rgbToHsl,
      getRgba = colorUtil.getRgba;

    function getReducedIntensity(rgba, intensity) {
      var hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      if (hsl.l < 0.5) {
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
    }

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

    // Sample pages with low contrast issues:
    // http://reederapp.com/ios/#/2/features
    // http://www.breckgear.com/
    // http://www.goldbrecht-systems.com/
    // https://dribbble.com/owltastic
    // https://news.ycombinator.com/item?id=2222522
    // http://mediatemple.net/
    // http://www.pomona.edu/museum/exhibitions/

    function isOnDarkBackground(origElement) {
      var origRect,
        testBackgroundElement,
        testBackgroundRect,
        testBackgroundRgba;

      testBackgroundElement = origElement;

      while (testBackgroundElement) {
        var computedStyle = getComputedStyle(testBackgroundElement);
        if (computedStyle.backgroundColor) {
          testBackgroundRgba = getRgba(computedStyle.backgroundColor);
          if (testBackgroundRgba.a > 0.2) {
            // Make sure the element is geometrically within the background test rect
            origRect = origRect || origElement.getBoundingClientRect();
            testBackgroundRect = testBackgroundElement.getBoundingClientRect();
            if (testBackgroundRect.right > origRect.left && testBackgroundRect.left < origRect.right &&
              testBackgroundRect.bottom > origRect.top && testBackgroundRect.top < origRect.bottom) {
              return colorUtil.getLuminosityFromColorName(testBackgroundRgba) < 0.5;
            }
          }
        }
        testBackgroundElement = testBackgroundElement.parentElement;
      }
    }

    function getSampleElements(selector) {
      var REMOVE_PSEUDO_CLASSES_AND_ELEMENTS = /::?[^ ,:.]+/g,
        $result = $();
      try { $result = $(selector.replace(REMOVE_PSEUDO_CLASSES_AND_ELEMENTS, '')); }
      catch(ex) {}
      return $result;
    }

    function isInDarkParagraph($sampleElements, luminosity) {
      var isInDarkPara;

      $sampleElements.each(function(index, sampleElement) {
        var sampleElementStyle = getComputedStyle(sampleElement);
        if (sampleElementStyle.display === 'inline') {
          var parentElement = sampleElement.parentElement,
            parentStyle = getComputedStyle(parentElement),
            parentLuminosity;
          if (parentElement.innerText.trim().length > sampleElement.innerText.length &&
            sampleElementStyle.backgroundColor === parentStyle.backgroundColor) {
            parentLuminosity = colorUtil.getLuminosityFromColorName(parentStyle.color);
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
      return colorUtil.getLuminosityFromColorName($sampleElements.css('color')) < 0.5;
    }

    /**
     * @param {object} style { parsedVal: rgba, selector, prop: 'color', etc. }
     * @return -1: decrease lightness, 0: do nothing, 1: increase lightness
     */
    function computeContrastEnhancementDirection(style) {
      var rgba = style.parsedVal,
        luminosity = colorUtil.getLuminosityFromColorName(rgba),
        $sampleElements;

      if (style.prop === 'color') {
        // Foreground decision
        $sampleElements = getSampleElements(style.selector);

        var isInDarkPara = isInDarkParagraph($sampleElements, luminosity);
        if (typeof isInDarkPara !== 'undefined') {
          return isInDarkPara ? -1 : 1;
        }

        // Middle of the road foreground color -- analyze background
        // If on light background make text darker, and vice-versa
        var isOnDarkBg = isOnDarkBackground($sampleElements[0]);
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
          return isWithDarkFg ? 1: -1;
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

    colorChoices.increaseContrast = function(style, intensity) {
      intensity /= 1.8;

      var rgba = style.parsedVal,
        hsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
        newLightness = hsl.l,
        saturation = hsl.s, // Reduce contrast change for saturated colors so that we remain colorful
        power = (1 - intensity) * 4 * getSaturationImpactOnContrast(saturation) + (style.prop === 'color' ? 0 : 0.2),
        factor = style.prop === 'color' ? 2 : 6,
        contrastEnhancementDirection = getContrastEnhancementDirection(style),
        newAlpha = rgba.a;

      if (contrastEnhancementDirection < 0) {
        // Reduce lightness
        newLightness = hsl.l - Math.pow(hsl.l / factor, power) * intensity;
        // Also increase the alpha if it's < 1
        // This multiplies the alpha, so that if the original is fully transparent it remains transparent
        if (newAlpha < 1) {
          newAlpha = Math.min(1, newAlpha * (intensity + 1));
        }
      }
      else if (contrastEnhancementDirection > 0) {
        // Reduce darkness
        var darkness = 1 - hsl.l,
          newDarkness = darkness - Math.pow(darkness / factor, power) * intensity;
        newLightness = 1 - newDarkness;
      }

      var lightnessDiff = Math.abs(newLightness - hsl.l),
        MIN_SIGNIFICANT_LIGHTNESS_DIFF = .01,
        isSignificantChange = lightnessDiff > MIN_SIGNIFICANT_LIGHTNESS_DIFF || newAlpha !== rgba.a;
      return isSignificantChange ? $.extend({ a: newAlpha }, hslToRgb(hsl.h, hsl.s, newLightness)): rgba;
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
        contrastRatio = colorUtil.getContrastRatio(hslToRgb(newHue, 1, 0.5), BLACK);
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
        hsl = rgbToHsl(rgba.r, rgba.g, rgba.b),
        newRgba,
        origLightness,
        newLightness,
        newHue;

      if (style.prop === 'color') {
        origLightness = Math.max(hsl.l, 1 - hsl.l);
        newLightness = Math.max(Math.min(intensity * (origLightness + 0.1), intensity), 0.5);
        newHue = getClosestGoodHueForDarkTheme(hsl.h);
        newRgba = $.extend({}, rgba, hslToRgb(newHue, hsl.s, newLightness));
      }
      else {
        origLightness = hsl.l;
        newLightness = origLightness < 0.4 ? origLightness : (1 - origLightness) * 3;
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
      var rgba = style.parsedVal,
        hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      if (style.prop === 'color') {
        return getReducedIntensity(rgba, intensity - 0.2);
      }
      else {
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

    colorChoices.isDarkTheme = function(colorMapFn, originalBgRgba) {
      var originalBg = {
        prop: 'background-color',
        parsedVal: originalBgRgba
      };
      var themedBg = colorMapFn(originalBg, 1);
      return colorUtil.isDarkColor(themedBg);
    };

    if (SC_DEV) {
      // TODO Put in UI rather than global function
      sitecues.setMonoForegroundHsl = function (newHsl) {
        monoForegroundHsl = newHsl;
      };
      sitecues.setMonoBackgroundHsl = function (newHsl) {
        monoBackgroundHsl = newHsl;
      };
    }
  });


  if (SC_UNIT) {
    $.extend(exports, colorChoices);
  }

  callback();
});