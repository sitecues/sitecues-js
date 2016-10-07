/**
 *  Support color themes in page
 */

define(
  [
    '$',
    'Promise',
    'core/conf/preferences',
    'page/style-service/style-service',
    'core/platform',
    'theme/color-choices',
    'page/util/color',
    'theme/custom-site-theme',
    'core/events',
    'mini-core/native-global',
    'core/inline-style/inline-style'
  ],
  function(
    $,
    Promise,
    pref,
    styleService,
    platform,
    colorChoices,
    colorUtil,
    customTheme,
    events,
    nativeGlobal,
    inlineStyle
  ) {
  'use strict';

  var THEME_STYLESHEET_ID = 'sitecues-js-theme',
    TRANSITION_STYLESHEET_ID = 'sitecues-js-theme-transition',
    REPAINT_MS = 40,
    cachedStyleInfo,
    // TODO remove once no longer necessary -- should be soon
    shouldRepaintToEnsureFullCoverage,
    isPanelExpanded,
    isRepaintNeeded,
    isInitialized,
    originalBodyBackgroundColor,
    isOriginalThemeDark,
    isCurrentlyInverted = false,   // Is dark theme currently applied
    didInvertImages = false, // Are images currently inverted
    finishThemeTimer,
    requestedThemeName,
    requestedThemePower,
    requestedThemeTextHue,
    currentThemeName,  // one of the theme names from color-choices.js
    currentThemePower,  // .01 - 1
    currentThemeTextHue,  // 0 - 1
    basicThemeSupportReady,  // Promise that style info is ready
    imageInversionSupportReady, // Promise that image inversion service is ready
    imageInverter,
    MAX_USER_SPECIFIED_HUE = 1.03,   // If > 1.0 then use white
    TRANSITION_CLASS_FAST = 'sc-animate-theme-fast',
    TRANSITION_CLASS_SLOW = 'sc-animate-theme-slow',
    TRANSITION_MS_FAST = 300,
    TRANSITION_MS_SLOW = 1400,
    DEFAULT_INTENSITY = 0.61,  // Must match default slider position in settings-template.hbs #scp-theme-power
    URL_REGEXP = /url\((?:(?:[\'\" ])*([^\"\'\)]+)[\'\" ]*)/i,
    GRADIENT_REGEXP = /^\s*([\w-]+\s*gradient)\((.*)\).*$/i,
    BUTTON_REGEXP = /(?:^| |,)(?:(?:input\s*\[\s*type\s*=\s*\"(?:button|color|submit|reset)\"\s*\]\s*)|button)(?:$| |,|:)/;

  // ---- PUBLIC ----

  function finalizeTheme() {
    if (shouldRepaintToEnsureFullCoverage) {
      repaintPage();
    }

    // Only our color changes should use our transitions
    $('html').removeClass(TRANSITION_CLASS_FAST + ' ' + TRANSITION_CLASS_SLOW);

    if (!SC_EXTENSION) {
      // Don't do this in extension -- there is no badge
      require(['bp-adaptive/bp-adaptive'], function (bpAdaptive) {
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
    requestedThemeName = pref.get('themeName');
    requestedThemePower = pref.get('themePower') || DEFAULT_INTENSITY;
    requestedThemeTextHue = pref.get('themeTextHue');

    if (!requestedThemeName && !currentThemeName) {
      return; // Still no theme -- power and hue changes do not matter
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
   Object.keys(colorChoices).forEach(function (checkName) {
     $('body').toggleClass('sitecues-' + checkName + '-theme', currentThemeName === checkName);
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
      var themeCss = colorMapFn ? getThemeCssText(colorMapFn, requestedThemePower, requestedThemeTextHue) : '',
        isInversionRequested = isDarkTheme(requestedThemeName),
        isFastTransition = isCurrentlyInverted === isInversionRequested;

      // Apply new CSS
      themeCss = '@media screen {\n' + themeCss + '\n}'; // Do not use in print!
      styleService.updateSheet(THEME_STYLESHEET_ID, {text: themeCss});

      currentThemeName = requestedThemeName;
      currentThemePower = requestedThemePower || DEFAULT_INTENSITY;
      currentThemeTextHue = requestedThemeTextHue;
      isCurrentlyInverted = isInversionRequested;

      // Turn on transitions
      // We want to transition quickly between similar themes, but slowly when performing a drastic change
      // such as going from light to dark or vice-versa
      $('html').addClass(isFastTransition ? TRANSITION_CLASS_FAST : TRANSITION_CLASS_SLOW);

      // Enable site-specific theme changes
      toggleBodyClasses();

      finishThemeTimer = nativeGlobal.setTimeout(finalizeTheme, isFastTransition ? TRANSITION_MS_FAST : TRANSITION_MS_SLOW);
    }
  }

  function needToApplyRequestedTheme() {
    return requestedThemeName !== currentThemeName ||
      requestedThemePower !== currentThemePower ||
      requestedThemeTextHue !== currentThemeTextHue;
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
    var bgStyles,
      fgStyles,
      bgImageStyles;

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
      require(['inverter/inverter'], function (inverter) {
        imageInverter = inverter;
        resolve();
      });
    })
    .then(function() {
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
      prop: 'background-color',
      parsedVal: originalBodyBackgroundColor
    };
    var themedBg = colorMapFn(originalBg, 1);
    return colorUtil.isDarkColor(themedBg);
  }

  function getThemeTransitionCss(transitionMs, className) {
    var selectorBuilder = 'html.' + className +', html.' +
          className + '> body',
      transitionCss = '{transition: background-color ' + transitionMs + 'ms;}\n\n';

    // Set the transition for every selector in the page that targets a background color
    cachedStyleInfo.forEach(function(themeStyle) {
      var type = themeStyle.value.prop,
        selectors;
      if (type === 'background' || type === 'background-color') {
        selectors = themeStyle.rule.selectorText.split(',');
        selectors.forEach(function(bgSelector) {
          selectorBuilder += ',.' + className + ' ' + bgSelector;
        });
      }
    });

    return '\n' + selectorBuilder + transitionCss;
  }

  function prepareTransitionCss() {
    // Create or update transition stylesheet if needed
    var css = getThemeTransitionCss(TRANSITION_MS_FAST, TRANSITION_CLASS_FAST) +
        getThemeTransitionCss(TRANSITION_MS_SLOW, TRANSITION_CLASS_SLOW);
    styleService.updateSheet(TRANSITION_STYLESHEET_ID, { text : css });
  }

  function createRule(prop, newValue, important) {
    // Check for non-values but allow 0 or false through
    if (newValue === null || typeof newValue === 'undefined' || newValue === '') {
      return '';
    }
    return prop + ': ' + newValue + (important ? ' !important; ' : '; ');
  }

  // Split a,b,c(d, e, f), g as
  // ['a', 'b', 'c(d, e, f)', 'g']
  function splitOutsideParens(str, splitter) {
    var length = str.length,  // String to eat as it gets processed left ot right
      splitterLength = splitter.length,
      resultArray = [],
      lastSplitIndex = 0,
      nextSplitIndex,
      nextParenIndex = indexOf('('),
      nextItem;
    function indexOf(lookFor, startIndex) {
      var index = str.indexOf(lookFor, startIndex);
      return index < 0 ? length : index;
    }
    while (lastSplitIndex < length) {
      nextSplitIndex = indexOf(splitter, lastSplitIndex);
      if (nextParenIndex < nextSplitIndex) {
        // Found open paren before splitter
        // get comma after next closed paren
        nextParenIndex = indexOf(')', nextParenIndex);
        nextSplitIndex = indexOf(splitter, nextParenIndex);
        nextParenIndex = indexOf('(', nextParenIndex);
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
    var
      gradientParams = splitOutsideParens(gradientVal, ','), // Split on commas not in parens
      newGradientParams = gradientParams.map(mapParam);

    function mapParam(param) {
      var trimmedParam = param.trim(),
        words = splitOutsideParens(trimmedParam, ' '),  // Split on spaces not in parens
        rgba = colorUtil.getRgbaIfLegalColor(words[0]),
        newRgba;

      if (rgba) {
        newRgba = colorMapFn({ prop: 'background-color', parsedVal: rgba }, intensity);
        if (newRgba) {
          words[0] = colorUtil.getColorString(newRgba);
        }
      }
      return words.join(' ');
    }

    return gradientType + '(' + newGradientParams.join(',') + ')';
  }

  function createTextShadowRule(size, hue) {
    // Create 3 shadows:
    // - To the right
    // - Below
    // - Below AND right
    var right = size.toFixed(2),
      below = (size / 2).toFixed(2), // Stretched vertically only half as much -- just looks better that way
      shadowValue =
        createShadow(right, below) + ',' +
        createShadow(right, 0) + ',' +
        createShadow(0, below);

    function createShadow(x, y) {
      return x + 'px ' + y + 'px ' + hue;
    }
    return createRule('text-shadow', shadowValue);
  }

  /**
   * Retrieve the CSS text required to apply the requested theme
   * @param type
   * @param intensity
   * @returns {string}
   */
  function getThemeCssText(colorMapFn, intensity, textHue) {

    var styleSheetText = '';

    // Backgrounds
    cachedStyleInfo.forEach(function(style) {
      var newRgba,
        newValue,
        selector = style.rule.selectorText,
        prop = style.value.prop;

      if (prop === '-sc-gradient') {
        newRgba = {};
        prop = 'background';
        newValue = getThemedGradientCssText(style.value.gradientType, style.value.gradientVal, colorMapFn, intensity);
      }
      else if (prop === 'color' || prop === 'background-color') {
        newRgba = colorMapFn(style.value, intensity, textHue);
        newValue = newRgba && colorUtil.getColorString(newRgba);
      }
      if (newValue) {
        var important = style.value.important && selector !== ':link' && selector !== ':visited', // Don't let these UA rules override page's <a> rules
          formFixes = '',
          textShadow = '';
        if (isButtonRule(selector)) {
          // Don't alter buttons -- it will change it from a native button and the appearance will break
          // color, background-color
          formFixes = 'border:1px outset ButtonFace;border-radius:4px;';
        }
        if (newRgba.textShadow) {
          // Sometimes we want to darken, so we create a tiny text shadow of the same color as the text
          textShadow = createTextShadowRule(newRgba.textShadow, newValue);
        }
        styleSheetText += selector +
          '{' + createRule(prop, newValue, important) + formFixes + textShadow + '}\n';
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
    }
    else {
      inlineStyle.override(document.documentElement, ['transform', 'translateY(0.01px)']);
      nativeGlobal.setTimeout(function () {
        inlineStyle.restore(document.documentElement, 'transform');
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
    var lastIndexRgb = bgShorthand.lastIndexOf('rgb(');
    if (lastIndexRgb < 0) {
      bgShorthand.lastIndexOf('rgba(');
    }
    if (lastIndexRgb < 0) {
      // Color is not rgb() or rgba() -- may be a color name such as 'white'.
      // In most browsers, color name will be last.
      // In Firefox, the color comes first
      var possibleColors = bgShorthand.split(' ');
      return possibleColors[platform.browser.isFirefox ? 0 : possibleColors.length - 1];
    }
    // Format = rgb(x,x,x) or rgba(x,x,x,x)
    return bgShorthand.substr(lastIndexRgb).split(')')[0] + ')';
  }

  function getSignificantBgImageProperties(cssStyleDecl) {
    var bgImagePropVal = cssStyleDecl['background-image'],
      imageUrl,
      gradient,
      cssText = cssStyleDecl.cssText;

    if (cssText.indexOf('background') < 0) {
      return;  // Need some background property
    }

    imageUrl = getCssUrl(bgImagePropVal);
    gradient = !imageUrl && getBackgroundGradient(bgImagePropVal);
    if (gradient) {
      return {
        prop: '-sc-gradient',
        important: cssStyleDecl.getPropertyPriority('background-image') === 'important',
        gradientType: gradient && gradient[1],
        gradientVal: gradient && gradient[2]
      };
    }

    function getBackgroundGradient(propVal) {
      if (propVal.indexOf('gradient') >= 0) {
        return propVal.match(GRADIENT_REGEXP);
      }
    }

    if (imageUrl) {
      return {
        prop: 'background-image',
        important: cssStyleDecl.getPropertyPriority('background-image') === 'important',
        imageUrl: imageUrl,
        backgroundColor: cssStyleDecl.backgroundColor
      };
    }
  }

  function getCssUrl(propVal) {
    if (propVal.indexOf('url(') >= 0) {
      var match = propVal.match(URL_REGEXP);
      return match && match[1];
    }
  }

  function isButtonRule(selector) {
    if (selector && (selector.lastIndexOf('button') >= 0 || selector.lastIndexOf('input') >= 0)) {
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
    var bgStyle = cssStyleDecl.background,
      colorString = extractColorFromBgShorthand(bgStyle) || cssStyleDecl.backgroundColor,
      rgba = colorString && colorUtil.getRgba(colorString);

    if (rgba) {
      return {
        prop: 'background-color',
        selector: selector,
        parsedVal: rgba,
        important: cssStyleDecl.getPropertyPriority('background-color') === 'important'
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
    if (fgStyle && fgStyle !== 'inherit') {
      return {
        prop: 'color',
        selector: selector,
        parsedVal: colorUtil.getRgba(fgStyle),
        important: cssStyleDecl.getPropertyPriority('color') === 'important',
        contrastEnhancementDirection:
          (function() {
            var fgLuminosity = colorUtil.getLuminanceFromColorName(fgStyle);
            if (fgLuminosity < 0.05) {
              return -1;
            }
            if (fgLuminosity > 0.95) {
              return 1;
            }
            // If we're directly on a dark background, we know the text must get lighter
            var bgRgba = colorUtil.getRgba(cssStyleDecl.backgroundColor);
            if (bgRgba && bgRgba.a > 0.2) {
              return colorUtil.getLuminanceFromColorName(bgRgba) < 0.5 ? 1 : -1;
            }
          }())
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

    pref.defineHandler('themeName', getSanitizedThemeName);
    pref.defineHandler('themePower', getSanitizedThemePower);
    pref.defineHandler('themeTextHue', getSanitizedHue);
    pref.bindListener('themeName', onThemeChange);
    pref.bindListener('themePower', onThemeChange);
    pref.bindListener('themeTextHue', onThemeChange);
    if (typeof pref.get('themePower') === 'undefined') {
      pref.set('themePower', DEFAULT_INTENSITY);
    }
    if (typeof pref.get('themeTextHue') === 'undefined') {
      pref.set('themeTextHue', MAX_USER_SPECIFIED_HUE); // Use white text by default
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

    events.on('bp/did-expand', onPanelExpand);
    events.on('bp/did-shrink', onPanelShrink);
  }

  return {
    init: init
  };
});
