"use strict";

/**
 *  The available color theme choices that can be used by the color engine
 */
// Do we want to do:
// - border color
// Reverse colors:
// - sitecues.com positioning
// - Bad photo reversal guesses:
//   http://www.leadingage.org/ and // - http://www.leadingage.org/
sitecues.define("theme/color-choices", [ "$", "page/util/color" ], function($, colorUtil) {
  var hslToRgb = colorUtil.hslToRgb, rgbToHsl = colorUtil.rgbToHsl;
  function getReducedIntensity(rgba, intensity) {
    var hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
    if (hsl.l < .5) {
      hsl.l = 1 - intensity * (1 - hsl.l);
    } else {
      hsl.l *= intensity;
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
    return hue <= .56 || hue >= .8 && hue <= .92;
  }
  function getClosestGoodHueForDarkTheme(hue) {
    if (isHueBrightEnoughForDarkTheme(hue)) {
      return hue;
    }
    if (hue >= .96) {
      return 0;
    } else {
      if (hue >= .92) {
        return .92;
      } else {
        if (hue >= .68) {
          // .56-.8 is a hole
          return .8;
        }
      }
    }
    return .56;
  }
  function getSampleElements(selector) {
    var REMOVE_PSEUDO_CLASSES_AND_ELEMENTS = /::?[^ ,:.]+/g, $result = $();
    try {
      $result = $(selector.replace(REMOVE_PSEUDO_CLASSES_AND_ELEMENTS, ""));
    } catch (ex) {}
    return $result;
  }
  function isInDarkParagraph($sampleElements, luminosity) {
    var isInDarkPara;
    $sampleElements.each(function(index, sampleElement) {
      var sampleElementStyle = getComputedStyle(sampleElement);
      if ("inline" === sampleElementStyle.display) {
        var parentLuminosity, parentElement = sampleElement.parentElement, parentStyle = getComputedStyle(parentElement), parentInnerText = parentElement.innerText, sampleInnerText = sampleElement.innerText;
        if (parentInnerText && parentInnerText.trim().length > (sampleInnerText && sampleInnerText.length) && sampleElementStyle.backgroundColor === parentStyle.backgroundColor) {
          parentLuminosity = colorUtil.getLuminanceFromColorName(parentStyle.color);
          if (parentLuminosity !== luminosity) {
            if (parentLuminosity < .3) {
              isInDarkPara = true;
              return false;
            }
            if (parentLuminosity > .7) {
              isInDarkPara = false;
              return false;
            }
          }
        }
      }
    });
    return isInDarkPara;
  }
  function isWithDarkForeground($sampleElements) {
    return colorUtil.getLuminanceFromColorName($sampleElements.css("color")) < .5;
  }
  /**
   * @param {object} style { parsedVal: rgba, selector, prop: 'color', etc. }
   * @return -1: decrease lightness, 0: do nothing, 1: increase lightness
   */
  function computeContrastEnhancementDirection(style) {
    var $sampleElements, rgba = style.parsedVal, luminosity = colorUtil.getLuminanceFromColorName(rgba);
    if ("color" === style.prop) {
      // Foreground decision
      $sampleElements = getSampleElements(style.selector);
      var isInDarkPara = isInDarkParagraph($sampleElements, luminosity);
      if ("undefined" !== typeof isInDarkPara) {
        return isInDarkPara ? 1 : -1;
      }
      // Middle of the road foreground color -- analyze background
      // If on light background make text darker, and vice-versa
      var isOnDarkBg = colorUtil.isOnDarkBackground($sampleElements[0]);
      if ("undefined" !== typeof isOnDarkBg) {
        return isOnDarkBg ? 1 : -1;
      }
      return luminosity < .5 ? -1 : 1;
    }
    // Background decision
    if (luminosity > .4 && luminosity < .6) {
      // Not sure about bg, check fg darkness
      $sampleElements = getSampleElements(style.selector);
      var isWithDarkFg = isWithDarkForeground($sampleElements);
      if ("undefined" !== typeof isWithDarkFg) {
        return isWithDarkFg ? 1 : -1;
      }
    }
    return luminosity < .5 ? -1 : 1;
  }
  function getContrastEnhancementDirection(style) {
    if ("undefined" !== typeof style.contrastEnhancementDirection) {
      return style.contrastEnhancementDirection;
    }
    var direction = computeContrastEnhancementDirection(style);
    style.contrastEnhancementDirection = direction;
    // Cache
    return direction;
  }
  function getSaturationImpactOnContrast(saturation) {
    return .3 + .8 * saturation;
  }
  function bold(style, intensity) {
    var colorChangeIntensity = intensity / 1.6 + .1, textShadowIntensity = intensity / 3.5, rgba = style.parsedVal, hsl = rgbToHsl(rgba.r, rgba.g, rgba.b), newLightness = hsl.l, saturation = hsl.s, // Reduce contrast change for saturated colors so that we remain colorful
    power = 4 * (1 - colorChangeIntensity) * getSaturationImpactOnContrast(saturation) + ("color" === style.prop ? 0 : .2), factor = "color" === style.prop ? 2 : 6, contrastEnhancementDirection = getContrastEnhancementDirection(style), newAlpha = rgba.a;
    if (contrastEnhancementDirection < 0) {
      // Reduce lightness
      newLightness = hsl.l - Math.pow(hsl.l / factor, power) * colorChangeIntensity;
      // Also increase the alpha if it's < 1
      // This multiplies the alpha, so that if the original is fully transparent it remains transparent
      if (newAlpha < 1) {
        newAlpha = Math.min(1, newAlpha * (colorChangeIntensity + 1));
      }
    } else {
      if (contrastEnhancementDirection > 0) {
        // Reduce darkness
        var darkness = 1 - hsl.l, newDarkness = darkness - Math.pow(darkness / factor, power) * colorChangeIntensity;
        newLightness = 1 - newDarkness;
      }
    }
    var lightnessDiff = Math.abs(newLightness - hsl.l), MIN_SIGNIFICANT_LIGHTNESS_DIFF = .01, isSignificantChange = lightnessDiff > MIN_SIGNIFICANT_LIGHTNESS_DIFF || newAlpha !== rgba.a, returnVal = isSignificantChange ? $.extend({
      a: newAlpha
    }, hslToRgb(hsl.h, hsl.s, newLightness)) : rgba;
    if ("color" === style.prop) {
      // Make the text thicker
      returnVal = $.extend({}, returnVal, {
        textShadow: textShadowIntensity
      });
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
    var FOREGROUND_MIXIN_INTENSITY = .5, grayness = 1 - getSaturation(rgba), mixInRatio = FOREGROUND_MIXIN_INTENSITY * (grayness + .2) / 1.2, // More gray (less saturated)  = more channel reduction, so we can keep colors
    mixInRgba = hslToRgb(textHue, 1, .5);
    return mixRgbaColors(rgba, mixInRgba, mixInRatio);
  }
  function dark(style, intensity, textHue) {
    var hsl, colorizedRgba, newRgba, origLightness, newLightness, bgAddedLightness, bgPreservationFactor, newHue, rgba = style.parsedVal, foregroundIntensity = .4 + Math.min(intensity, .8) / 1.3, textShadowIntensity = .6 * Math.max(0, intensity - .8);
    if ("color" === style.prop) {
      colorizedRgba = textHue && textHue <= 1 ? colorizeGrayText(rgba, textHue) : rgba;
      hsl = rgbToHsl(colorizedRgba.r, colorizedRgba.g, colorizedRgba.b);
      origLightness = Math.max(hsl.l, 1 - hsl.l);
      newLightness = foregroundIntensity * (origLightness + .1);
      newLightness *= 1.2 - hsl.s / 6;
      // Saturated colors should be kept a bit
      newLightness = Math.max(newLightness, foregroundIntensity / 3);
      newLightness = Math.min(newLightness, 1);
      newHue = getClosestGoodHueForDarkTheme(hsl.h);
      newRgba = $.extend({}, rgba, hslToRgb(newHue, hsl.s, newLightness));
      if (textShadowIntensity > 0) {
        newRgba.textShadow = textShadowIntensity;
      }
    } else {
      hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
      bgAddedLightness = (1 - intensity) / 8;
      // Add a little lightness when theme is less intense
      bgPreservationFactor = .6 - intensity / 8;
      origLightness = hsl.l;
      newLightness = origLightness < .4 ? origLightness : 3 * (1 - origLightness);
      newRgba = $.extend({}, rgba, hslToRgb(hsl.h, hsl.s, Math.min(.16, newLightness) * bgPreservationFactor + bgAddedLightness));
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
    if ("color" === style.prop && rgbToHsl(rgba.r, rgba.g, rgba.b).l < .2) {
      return getReducedIntensity(rgba, intensity - .15);
    }
    var mixInRatio = /*rgba.b * 0.001 */ .2 * (1 - intensity), mixInRgba = hslToRgb(.15, 1, .5);
    return mixRgbaColors(rgba, mixInRgba, mixInRatio);
  }
  return {
    dark: dark,
    bold: bold,
    warm: warm
  };
});

/**
 *  Support alterations to themes for specific websites
 */
sitecues.define("theme/custom-site-theme", [ "run/conf/site", "run/conf/urls" ], function(site, urls) {
  // TODO build system could create this variable based on the available themes
  // var SITES_WITH_CUSTOM_THEMES = '__SITES_WITH_CUSTOM_THEMES__';
  var isInitialized, SITES_WITH_CUSTOM_THEMES = {
    "s-0000ee0c": 1,
    "s-05fd6c66": 1,
    "s-0796b61d": 1,
    "s-167ff09a": 1,
    "s-190630d2": 1,
    "s-2158b12a": 1,
    "s-252baed8": 1,
    "s-25cecd79": 1,
    "s-389f76da": 1,
    "s-4bfe60ab": 1,
    "s-570759e3": 1,
    "s-6d6f89a3": 1,
    "s-73dd0fcf": 1,
    "s-7b90f601": 1,
    "s-9afa6ab9": 1,
    "s-acc8f046": 1,
    "s-b427fffb": 1,
    "s-c27fa71d": 1,
    "s-f2a9dde2": 1
  };
  function insertSheet(siteId) {
    var cssLink = document.createElement("link"), cssUrl = urls.resolveResourceUrl("css/site-themes/" + siteId + ".css");
    cssLink.setAttribute("rel", "stylesheet");
    cssLink.setAttribute("href", cssUrl);
    cssLink.id = "sitecues-js-custom-theme";
    document.querySelector("head").appendChild(cssLink);
  }
  function init() {
    if (!isInitialized) {
      isInitialized = true;
      var siteId = site.getSiteId();
      if (SITES_WITH_CUSTOM_THEMES.hasOwnProperty(siteId)) {
        insertSheet(siteId);
      }
    }
  }
  return {
    init: init
  };
});

/**
 *  Support color themes in page
 */
sitecues.define("theme/theme", [ "$", "Promise", "run/conf/preferences", "page/style-service/style-service", "run/platform", "theme/color-choices", "page/util/color", "theme/custom-site-theme", "run/events", "mini-core/native-global", "run/inline-style/inline-style" ], function($, Promise, pref, styleService, platform, colorChoices, colorUtil, customTheme, events, nativeGlobal, inlineStyle) {
  var cachedStyleInfo, // TODO remove once no longer necessary -- should be soon
  shouldRepaintToEnsureFullCoverage, isPanelExpanded, isRepaintNeeded, isInitialized, originalBodyBackgroundColor, isOriginalThemeDark, // Are images currently inverted
  finishThemeTimer, requestedThemeName, requestedThemePower, requestedThemeTextHue, currentThemeName, // one of the theme names from color-choices.js
  currentThemePower, // .01 - 1
  currentThemeTextHue, // 0 - 1
  basicThemeSupportReady, // Promise that style info is ready
  imageInversionSupportReady, // Promise that image inversion service is ready
  imageInverter, THEME_STYLESHEET_ID = "sitecues-js-theme", TRANSITION_STYLESHEET_ID = "sitecues-js-theme-transition", REPAINT_MS = 40, isCurrentlyInverted = false, // Is dark theme currently applied
  didInvertImages = false, MAX_USER_SPECIFIED_HUE = 1.03, // If > 1.0 then use white
  TRANSITION_CLASS_FAST = "sc-animate-theme-fast", TRANSITION_CLASS_SLOW = "sc-animate-theme-slow", TRANSITION_MS_FAST = 300, TRANSITION_MS_SLOW = 1400, DEFAULT_INTENSITY = .61, // Must match default slider position in settings-template.hbs #scp-theme-power
  URL_REGEXP = /url\((?:(?:[\'\" ])*([^\"\'\)]+)[\'\" ]*)/i, GRADIENT_REGEXP = /^\s*([\w-]+\s*gradient)\((.*)\).*$/i, BUTTON_REGEXP = /(?:^| |,)(?:(?:input\s*\[\s*type\s*=\s*\"(?:button|color|submit|reset)\"\s*\]\s*)|button)(?:$| |,|:)/;
  // ---- PUBLIC ----
  function finalizeTheme() {
    if (shouldRepaintToEnsureFullCoverage) {
      repaintPage();
    }
    // Only our color changes should use our transitions
    $("html").removeClass(TRANSITION_CLASS_FAST + " " + TRANSITION_CLASS_SLOW);
    if (true) {
      // Don't do this in extension -- there is no badge
      sitecues.require([ "bp-adaptive/bp-adaptive" ], function(bpAdaptive) {
        bpAdaptive.adaptToSitecuesThemeChange(currentThemeName);
      });
    }
  }
  /**
   * Apply the current theme to the current document
   * Uses currentThemeName, currentThemePower and currentThemeTextHue for theme settings
   */
  function onThemeChange() {
    // Requested theme name
    requestedThemeName = pref.get("themeName");
    requestedThemePower = pref.get("themePower") || DEFAULT_INTENSITY;
    requestedThemeTextHue = pref.get("themeTextHue");
    if (!requestedThemeName && !currentThemeName) {
      return;
    }
    // Relevant theme -- has it changed?
    if (needToApplyRequestedTheme()) {
      // New theme settings are different -- apply them!
      applyRequestedTheme();
    }
  }
  function getColorFn(themeName) {
    return colorChoices[themeName];
  }
  function toggleBodyClasses() {
    // Set class sitecues-[themename]-theme on <body> and clear other theme classes
    Object.keys(colorChoices).forEach(function(checkName) {
      $("body").toggleClass("sitecues-" + checkName + "-theme", currentThemeName === checkName);
    });
  }
  function needToApplyImageInversion() {
    var requestedImageInversion = isDarkTheme(requestedThemeName);
    return requestedImageInversion !== didInvertImages;
  }
  // Apply image inversion if still necessary
  function applyImageInversion() {
    var doInvertImages = isDarkTheme(requestedThemeName);
    if (doInvertImages !== didInvertImages) {
      imageInverter.toggle(doInvertImages);
      didInvertImages = doInvertImages;
    }
  }
  function applyColors() {
    var colorMapFn = getColorFn(requestedThemeName);
    if (needToApplyRequestedTheme()) {
      var themeCss = colorMapFn ? getThemeCssText(colorMapFn, requestedThemePower, requestedThemeTextHue) : "", isInversionRequested = isDarkTheme(requestedThemeName), isFastTransition = isCurrentlyInverted === isInversionRequested;
      // Apply new CSS
      themeCss = "@media screen {\n" + themeCss + "\n}";
      // Do not use in print!
      styleService.updateSheet(THEME_STYLESHEET_ID, {
        text: themeCss
      });
      currentThemeName = requestedThemeName;
      currentThemePower = requestedThemePower || DEFAULT_INTENSITY;
      currentThemeTextHue = requestedThemeTextHue;
      isCurrentlyInverted = isInversionRequested;
      // Turn on transitions
      // We want to transition quickly between similar themes, but slowly when performing a drastic change
      // such as going from light to dark or vice-versa
      $("html").addClass(isFastTransition ? TRANSITION_CLASS_FAST : TRANSITION_CLASS_SLOW);
      // Enable site-specific theme changes
      toggleBodyClasses();
      finishThemeTimer = nativeGlobal.setTimeout(finalizeTheme, isFastTransition ? TRANSITION_MS_FAST : TRANSITION_MS_SLOW);
    }
  }
  function needToApplyRequestedTheme() {
    return requestedThemeName !== currentThemeName || requestedThemePower !== currentThemePower || requestedThemeTextHue !== currentThemeTextHue;
  }
  // Apply colors and image inversion as necessary
  function applyRequestedTheme() {
    // Cancel previous theme application
    clearTimeout(finishThemeTimer);
    // Prepare style info
    basicThemeSupportReady = basicThemeSupportReady || initThemeSupport();
    // Apply image inversions if necessary (depending on most recently requested theme)
    if (needToApplyImageInversion()) {
      imageInversionSupportReady = imageInversionSupportReady || basicThemeSupportReady.then(initImageInversions);
      imageInversionSupportReady.then(applyImageInversion);
    }
    // Apply the most recently requested new colors
    var allRequestedThemeSupportReady = imageInversionSupportReady || basicThemeSupportReady;
    allRequestedThemeSupportReady.then(applyColors);
  }
  function initThemeSupport() {
    var bgStyles, fgStyles, bgImageStyles;
    return new Promise(function(resolve) {
      styleService.init(resolve);
    }).then(function() {
      bgStyles = styleService.getAllMatchingStylesCustom(getSignificantBgColor);
    }).then(function() {
      fgStyles = styleService.getAllMatchingStylesCustom(getFgColor);
    }).then(function() {
      bgImageStyles = styleService.getAllMatchingStylesCustom(getSignificantBgImageProperties);
      cachedStyleInfo = bgStyles.concat(fgStyles).concat(bgImageStyles);
    }).then(prepareTransitionCss);
  }
  function initImageInversions() {
    return new Promise(function(resolve) {
      sitecues.require([ "inverter/inverter" ], function(inverter) {
        imageInverter = inverter;
        resolve();
      });
    }).then(function() {
      return imageInverter.init(cachedStyleInfo);
    });
  }
  // Returns true even if not 'dark', but page themed itself dark already
  function isDarkTheme(themeName) {
    var colorMapFn = getColorFn(themeName);
    if (!colorMapFn) {
      return isOriginalThemeDark;
    }
    var originalBg = {
      prop: "background-color",
      parsedVal: originalBodyBackgroundColor
    };
    var themedBg = colorMapFn(originalBg, 1);
    return colorUtil.isDarkColor(themedBg);
  }
  function getThemeTransitionCss(transitionMs, className) {
    var selectorBuilder = "html." + className + ", html." + className + "> body", transitionCss = "{transition: background-color " + transitionMs + "ms;}\n\n";
    // Set the transition for every selector in the page that targets a background color
    cachedStyleInfo.forEach(function(themeStyle) {
      var selectors, type = themeStyle.value.prop;
      if ("background" === type || "background-color" === type) {
        selectors = themeStyle.rule.selectorText.split(",");
        selectors.forEach(function(bgSelector) {
          selectorBuilder += ",." + className + " " + bgSelector;
        });
      }
    });
    return "\n" + selectorBuilder + transitionCss;
  }
  function prepareTransitionCss() {
    // Create or update transition stylesheet if needed
    var css = getThemeTransitionCss(TRANSITION_MS_FAST, TRANSITION_CLASS_FAST) + getThemeTransitionCss(TRANSITION_MS_SLOW, TRANSITION_CLASS_SLOW);
    styleService.updateSheet(TRANSITION_STYLESHEET_ID, {
      text: css
    });
  }
  function createRule(prop, newValue, important) {
    // Check for non-values but allow 0 or false through
    if (null === newValue || "undefined" === typeof newValue || "" === newValue) {
      return "";
    }
    return prop + ": " + newValue + (important ? " !important; " : "; ");
  }
  // Split a,b,c(d, e, f), g as
  // ['a', 'b', 'c(d, e, f)', 'g']
  function splitOutsideParens(str, splitter) {
    var nextSplitIndex, nextItem, length = str.length, // String to eat as it gets processed left ot right
    splitterLength = splitter.length, resultArray = [], lastSplitIndex = 0, nextParenIndex = indexOf("(");
    function indexOf(lookFor, startIndex) {
      var index = str.indexOf(lookFor, startIndex);
      return index < 0 ? length : index;
    }
    while (lastSplitIndex < length) {
      nextSplitIndex = indexOf(splitter, lastSplitIndex);
      if (nextParenIndex < nextSplitIndex) {
        // Found open paren before splitter
        // get comma after next closed paren
        nextParenIndex = indexOf(")", nextParenIndex);
        nextSplitIndex = indexOf(splitter, nextParenIndex);
        nextParenIndex = indexOf("(", nextParenIndex);
      }
      nextItem = str.substring(lastSplitIndex, nextSplitIndex);
      if (nextItem) {
        resultArray.push(nextItem);
      }
      lastSplitIndex = nextSplitIndex + splitterLength;
    }
    return resultArray;
  }
  function getThemedGradientCssText(gradientType, gradientVal, colorMapFn, intensity) {
    var gradientParams = splitOutsideParens(gradientVal, ","), // Split on commas not in parens
    newGradientParams = gradientParams.map(mapParam);
    function mapParam(param) {
      var newRgba, trimmedParam = param.trim(), words = splitOutsideParens(trimmedParam, " "), // Split on spaces not in parens
      rgba = colorUtil.getRgbaIfLegalColor(words[0]);
      if (rgba) {
        newRgba = colorMapFn({
          prop: "background-color",
          parsedVal: rgba
        }, intensity);
        if (newRgba) {
          words[0] = colorUtil.getColorString(newRgba);
        }
      }
      return words.join(" ");
    }
    return gradientType + "(" + newGradientParams.join(",") + ")";
  }
  function createTextShadowRule(size, hue) {
    // Create 3 shadows:
    // - To the right
    // - Below
    // - Below AND right
    var right = size.toFixed(2), below = (size / 2).toFixed(2), // Stretched vertically only half as much -- just looks better that way
    shadowValue = createShadow(right, below) + "," + createShadow(right, 0) + "," + createShadow(0, below);
    function createShadow(x, y) {
      return x + "px " + y + "px " + hue;
    }
    return createRule("text-shadow", shadowValue);
  }
  /**
   * Retrieve the CSS text required to apply the requested theme
   * @param type
   * @param intensity
   * @returns {string}
   */
  function getThemeCssText(colorMapFn, intensity, textHue) {
    var styleSheetText = "";
    // Backgrounds
    cachedStyleInfo.forEach(function(style) {
      var newRgba, newValue, selector = style.rule.selectorText, prop = style.value.prop;
      if ("-sc-gradient" === prop) {
        newRgba = {};
        prop = "background";
        newValue = getThemedGradientCssText(style.value.gradientType, style.value.gradientVal, colorMapFn, intensity);
      } else {
        if ("color" === prop || "background-color" === prop) {
          newRgba = colorMapFn(style.value, intensity, textHue);
          newValue = newRgba && colorUtil.getColorString(newRgba);
        }
      }
      if (newValue) {
        var important = style.value.important && ":link" !== selector && ":visited" !== selector, // Don't let these UA rules override page's <a> rules
        formFixes = "", textShadow = "";
        if (isButtonRule(selector)) {
          // Don't alter buttons -- it will change it from a native button and the appearance will break
          // color, background-color
          formFixes = "border:1px outset ButtonFace;border-radius:4px;";
        }
        if (newRgba.textShadow) {
          // Sometimes we want to darken, so we create a tiny text shadow of the same color as the text
          textShadow = createTextShadowRule(newRgba.textShadow, newValue);
        }
        styleSheetText += selector + "{" + createRule(prop, newValue, important) + formFixes + textShadow + "}\n";
      }
    });
    return styleSheetText;
  }
  /**
   * Deal with Chrome bugs where scrolled-off content doesn't get new background color
   * Necessary on at least youtube.com and https://www.arlington.k12.ma.us/stratton/
   */
  function repaintPage() {
    if (isPanelExpanded) {
      isRepaintNeeded = true;
    } else {
      inlineStyle.override(document.documentElement, [ "transform", "translateY(0.01px)" ]);
      nativeGlobal.setTimeout(function() {
        inlineStyle.restore(document.documentElement, "transform");
      }, REPAINT_MS);
    }
  }
  /**
   * The CSS background property is shorthand for applying many CSS background- related properties at once.
   * This function extracts the color fro the background property.
   * @param bgShorthand The background property value
   * @returns {string}
   */
  function extractColorFromBgShorthand(bgShorthand) {
    var lastIndexRgb = bgShorthand.lastIndexOf("rgb(");
    if (lastIndexRgb < 0) {
      bgShorthand.lastIndexOf("rgba(");
    }
    if (lastIndexRgb < 0) {
      // Color is not rgb() or rgba() -- may be a color name such as 'white'.
      // In most browsers, color name will be last.
      // In Firefox, the color comes first
      var possibleColors = bgShorthand.split(" ");
      return possibleColors[platform.browser.isFirefox ? 0 : possibleColors.length - 1];
    }
    // Format = rgb(x,x,x) or rgba(x,x,x,x)
    return bgShorthand.substr(lastIndexRgb).split(")")[0] + ")";
  }
  function getSignificantBgImageProperties(cssStyleDecl) {
    var imageUrl, gradient, bgImagePropVal = cssStyleDecl["background-image"], cssText = cssStyleDecl.cssText;
    if (cssText.indexOf("background") < 0) {
      return;
    }
    imageUrl = getCssUrl(bgImagePropVal);
    gradient = !imageUrl && getBackgroundGradient(bgImagePropVal);
    if (gradient) {
      return {
        prop: "-sc-gradient",
        important: "important" === cssStyleDecl.getPropertyPriority("background-image"),
        gradientType: gradient && gradient[1],
        gradientVal: gradient && gradient[2]
      };
    }
    function getBackgroundGradient(propVal) {
      if (propVal.indexOf("gradient") >= 0) {
        return propVal.match(GRADIENT_REGEXP);
      }
    }
    if (imageUrl) {
      return {
        prop: "background-image",
        important: "important" === cssStyleDecl.getPropertyPriority("background-image"),
        imageUrl: imageUrl,
        backgroundColor: cssStyleDecl.backgroundColor
      };
    }
  }
  function getCssUrl(propVal) {
    if (propVal.indexOf("url(") >= 0) {
      var match = propVal.match(URL_REGEXP);
      return match && match[1];
    }
  }
  function isButtonRule(selector) {
    if (selector && (selector.lastIndexOf("button") >= 0 || selector.lastIndexOf("input") >= 0)) {
      return selector.match(BUTTON_REGEXP);
    }
  }
  /**
   * Retrieve information about background colors if we care about them
   * We don't care about transparent colors.
   * @param cssStyleDecl
   * @returns {{prop: string, parsedVal: object }}
   */
  function getSignificantBgColor(cssStyleDecl, selector) {
    var bgStyle = cssStyleDecl.background, colorString = extractColorFromBgShorthand(bgStyle) || cssStyleDecl.backgroundColor, rgba = colorString && colorUtil.getRgba(colorString);
    if (rgba) {
      return {
        prop: "background-color",
        selector: selector,
        parsedVal: rgba,
        important: "important" === cssStyleDecl.getPropertyPriority("background-color")
      };
    }
  }
  /**
   * Retrieve rgba information about foreground colors
   * @param cssStyleDecl
   * @returns {{prop: string, parsedVal: *}}
   */
  function getFgColor(cssStyleDecl, selector) {
    var fgStyle = cssStyleDecl.color;
    if (fgStyle && "inherit" !== fgStyle) {
      return {
        prop: "color",
        selector: selector,
        parsedVal: colorUtil.getRgba(fgStyle),
        important: "important" === cssStyleDecl.getPropertyPriority("color"),
        contrastEnhancementDirection: function() {
          var fgLuminosity = colorUtil.getLuminanceFromColorName(fgStyle);
          if (fgLuminosity < .05) {
            return -1;
          }
          if (fgLuminosity > .95) {
            return 1;
          }
          // If we're directly on a dark background, we know the text must get lighter
          var bgRgba = colorUtil.getRgba(cssStyleDecl.backgroundColor);
          if (bgRgba && bgRgba.a > .2) {
            return colorUtil.getLuminanceFromColorName(bgRgba) < .5 ? 1 : -1;
          }
        }()
      };
    }
  }
  // Theme name must exist in colorChoices
  // Except for null, which means no theme
  function getSanitizedThemeName(name) {
    return name in colorChoices ? name : null;
  }
  // Theme power must be 0 - 1
  function getSanitizedThemePower(power) {
    if (power >= 0) {
      return Math.min(power, 1);
    }
    return 1;
  }
  // If user specifies > 1 use white
  function getSanitizedHue(hue) {
    if (!hue || hue < 0 || hue > MAX_USER_SPECIFIED_HUE) {
      return MAX_USER_SPECIFIED_HUE;
    }
    return hue;
  }
  function init(isPanelOpen) {
    if (isPanelOpen) {
      isPanelExpanded = true;
    }
    if (isInitialized) {
      return;
    }
    isInitialized = true;
    originalBodyBackgroundColor = colorUtil.getDocumentBackgroundColor();
    // TODO remove when no longer necessary
    shouldRepaintToEnsureFullCoverage = platform.browser.isChrome && platform.browser.version < 48;
    pref.defineHandler("themeName", getSanitizedThemeName);
    pref.defineHandler("themePower", getSanitizedThemePower);
    pref.defineHandler("themeTextHue", getSanitizedHue);
    pref.bindListener("themeName", onThemeChange);
    pref.bindListener("themePower", onThemeChange);
    pref.bindListener("themeTextHue", onThemeChange);
    if ("undefined" === typeof pref.get("themePower")) {
      pref.set("themePower", DEFAULT_INTENSITY);
    }
    if ("undefined" === typeof pref.get("themeTextHue")) {
      pref.set("themeTextHue", MAX_USER_SPECIFIED_HUE);
    }
    customTheme.init();
    function onPanelExpand() {
      isPanelExpanded = true;
    }
    function onPanelShrink() {
      isPanelExpanded = false;
      if (isRepaintNeeded) {
        repaintPage();
        isRepaintNeeded = false;
      }
    }
    events.on("bp/did-expand", onPanelExpand);
    events.on("bp/did-shrink", onPanelShrink);
  }
  return {
    init: init
  };
});

sitecues.define("theme", function() {});
//# sourceMappingURL=theme.js.map