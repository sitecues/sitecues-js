/**
 *  Support color themes in page
 */

define(['$', 'core/conf/user/manager', 'page/style-service/style-service', 'core/platform',
    'theme/color-choices', 'page/util/color', 'theme/img-classifier', 'theme/custom-site-theme' ],
  function($, conf, styleService, platform, colorChoices, colorUtil, imgClassifier, customTheme) {
  var $themeStyleSheet,
    THEME_STYLESHEET_NAME = 'sitecues-theme',
    REPAINT_MS = 40,
    themeStyles,
    shouldRepaintToEnsureFullCoverage = platform.browser.isChrome && platform.browser.version < 48,
    isPanelExpanded,
    isRepaintNeeded,
    isInitialized,
    originalBodyBackgroundColor,
    isOriginalThemeDark,
    transitionTimer,
    inverter,
    MAX_USER_SPECIFIED_HUE = 1.03,   // If > 1.0 then use white
    TRANSITION_CLASS = 'sc-animate-theme',
    TRANSITION_MS_FAST = 300,
    TRANSITION_MS_SLOW = 1400,
    DEFAULT_INTENSITY = 0.7,
    URL_REGEXP = /url\((?:(?:[\'\" ])*([^\"\'\)]+)[\'\" ]*)/i,
    GRADIENT_REGEXP = /^\s*([\w-]+\s*gradient)\((.*)\).*$/i,
    BUTTON_REGEXP = /(?:^| |,)(?:(?:input\s*\[\s*type\s*=\s*\"(?:button|color|submit|reset)\"\s*\]\s*)|button)(?:$| |,|:)/;

  // ---- PUBLIC ----

  /**
   * Apply a theme to the current document
   * @param {string} type one of the theme names from color-choices.js
   * @param {number} intensity (optional) = .01-1
   */
  function applyTheme(type, intensity, textHue) {

    function applyThemeImpl() {
      var
        isDark = colorUtil.isDarkColor(colorUtil.getDocumentBackgroundColor()),
        willBeDark = isDarkTheme(colorMapFn),
        isReverseTheme = willBeDark !== isOriginalThemeDark,
        themeCss = colorMapFn ? getThemeCssText(colorMapFn, intensity || DEFAULT_INTENSITY, textHue, isReverseTheme) : '',

        imgCss = '',
        // We want to animate quickly between light themes, but slowly when performing a drastic change
        // such as going from light to dark or vice-versa
        transitionMs = isDark !== willBeDark ? TRANSITION_MS_SLOW : TRANSITION_MS_FAST,
        transitionCss = initializeTransition(transitionMs);

      if (willBeDark) {
        imgCss = handleDarkThemeInversions(isDark, willBeDark);
      }

      getStyleSheet().text(transitionCss + themeCss + imgCss);

      // Allow web pages to create CSS rules that respond to reverse themes
      $('body').toggleClass('sitecues-reverse-theme', isReverseTheme);
      // Set class sitecues-[themename]-theme on <body> and clear other theme classes
      Object.keys(colorChoices).forEach(function(checkType) {
        $('body').toggleClass('sitecues-' + checkType + '-theme', type === checkType);
      });

      setTimeout(function () {
        if (shouldRepaintToEnsureFullCoverage) {
          repaintPage();
        }
        sitecues.require(['bp-adaptive/bp-adaptive'], function(bpAdaptive) {
          bpAdaptive.adaptToSitecuesThemeChange(type);
        });
      }, transitionMs);
    }

    function requireInverter() {
      if (type === 'dark' && !inverter) {
        require(['inverter/inverter'], function (inverterModule) {
          inverter = inverterModule;
          applyThemeImpl();
        });
      }
      else {
        applyThemeImpl();
      }
    }

    var colorMapFn = colorChoices[type];

    if (colorMapFn || !type) {
      initStyles(requireInverter);
    }
  }

  function handleDarkThemeInversions(isDark, willBeDark) {
    if (isDark !== willBeDark) {
      inverter.toggle(willBeDark);
    }

    return getReverseSpriteCssText();
  }

  function isDarkTheme(colorMapFn) {
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

  function initializeTransition(transitionMs) {
    $('html').addClass(TRANSITION_CLASS);
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(function() {
      $('html').removeClass(TRANSITION_CLASS);
    }, transitionMs);

    return getThemeTransitionCss(transitionMs);
  }

  function getThemeTransitionCss(transitionMs) {
    var selectorBuilder = 'html.' + TRANSITION_CLASS +', html.' +
          TRANSITION_CLASS + '> body',
      transitionCss = '{transition: background-color ' + transitionMs + 'ms;}\n\n';

    // Set the transition for every selector in the page that targets a background color
    themeStyles.forEach(function(themeStyle) {
      var type = themeStyle.rule.value,
        selectors;
      if (type === 'background' || type === 'background-color') {
        selectors = themeStyle.rule.selectorText.split(',');
        selectors.forEach(function(bgSelector) {
          selectorBuilder += ',.' + TRANSITION_CLASS + ' ' + bgSelector;
        });
      }
    });

    return selectorBuilder + transitionCss;
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

  function getReverseSpriteCssText() {
    // Reverse background images
    function getCssForOneSprite(bgInfo, selector) {
      if (!bgInfo.imageUrl) {
        return '';
      }

      return selector + '{\n' +
        createRule('background-image', 'url(' + imgClassifier.getInvertUrl(bgInfo.imageUrl) +')', true) +
        '}\n';
    }
    var styleSheetText = '';

    // Backgrounds
    themeStyles.forEach(function(style) {
      // Don't alter buttons -- it will change it from a native button and the appearance will break
      // color, background-color
      if (style.value.prop === 'background-image') {
        styleSheetText += getCssForOneSprite(style.value, style.rule.selectorText);
      }
    });

    return styleSheetText;

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
    themeStyles.forEach(function(style) {
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
        newValue = newRgba && newRgba.a && colorUtil.getColorString(newRgba);
      }
      if (newValue) {
        var important = selector !== ':link' && selector !== ':visited', // Don't let these UA rules override page's <a> rules
          formFixes = '',
          textShadow = '';
        if (isButtonRule(selector)) {
          // Don't alter buttons -- it will change it from a native button and the appearance will break
          // color, background-color
          formFixes = 'border:1px outset ButtonFace;border-radius:4px';
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
      document.documentElement.style.transform = 'translateY(0.01px)';
      setTimeout(function () {
        document.documentElement.style.transform = '';
      }, REPAINT_MS);
    }
  }

  /**
   * Lazily get the style sheet to be used for applying the theme.
   * @returns {jQuery}
   */
  function getStyleSheet() {
    if (!$themeStyleSheet) {
      $themeStyleSheet = $('<style>').appendTo('head')
        .attr('id', THEME_STYLESHEET_NAME);
    }
    return $themeStyleSheet;
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
      // Color name will be last.
      var possibleColors = bgShorthand.split(' ');
      return possibleColors[possibleColors.length - 1];
    }
    // Format = rgb(x,x,x) or rgba(x,x,x,x)
    return bgShorthand.substr(lastIndexRgb).split(')')[0] + ')';
  }

  function getSampleElement(selector) {
    var REMOVE_PSEUDO_CLASSES_AND_ELEMENTS = /::?[^ ,:.]+/g,
      result;
    try { result = document.querySelector(selector.replace(REMOVE_PSEUDO_CLASSES_AND_ELEMENTS, '')); }
    catch(ex) {}
    return result;
  }

  function shouldInvertBackground(cssStyleDecl, bgImage, sampleElement) {
    if (bgImage) {
//        var rect = { top: 0, left: 0, width: 20, height: 20 }; // Default
      if (colorUtil.isOnDarkBackground(sampleElement)) {
        return false; // Already designed to show on a dark background
      }
      if (!sampleElement) {
        return true;
      }
      return imgClassifier.shouldInvertBgImage(bgImage, sampleElement.getBoundingClientRect());
    }
  }

  function getSignificantBgImageProperties(cssStyleDecl, selector) {
    var bgImagePropVal = cssStyleDecl['background-image'],
      imageUrl,
      gradient,
      cssText = cssStyleDecl.cssText,
      sampleElement,
      hasRepeat;

    if (cssText.indexOf('background') < 0) {
      return;  // Need some background property
    }

    imageUrl = getCssUrl(bgImagePropVal);
    gradient = !imageUrl && getBackgroundGradient(bgImagePropVal);
    if (gradient) {
      return {
        prop: '-sc-gradient',
        gradientType: gradient && gradient[1],
        gradientVal: gradient && gradient[2]
      };
    }

    function getBackgroundGradient(propVal) {
      if (propVal.indexOf('gradient') >= 0) {
        return propVal.match(GRADIENT_REGEXP);
      }
    }

    function isPlacedBeforeText(sampleElementCss) {
      // Content with text-indent is using inner text as alternative text but placing it offscreen
      var paddingLeft = cssStyleDecl.paddingLeft || sampleElementCss.paddingLeft;
      return parseFloat(paddingLeft) > 0;
    }

    sampleElement = getSampleElement(selector);
    hasRepeat = cssStyleDecl.backgroundRepeat && cssStyleDecl.backgroundRepeat.indexOf('no-repeat') === -1;


    /**
     * Retrieve information about background images the theme needs to care about.
     * @param propVal
     * @returns {boolean}
     */
    function getBackgroundImageFilter() {
      var sampleElementCss = sampleElement ? getComputedStyle(sampleElement) : {},
        hasHiddenText = cssStyleDecl.textIndent || parseInt(sampleElementCss.textIndent) < 0 ||
          parseInt(cssStyleDecl.fontSize) === 0 || parseInt(sampleElementCss.fontSize) === 0;

      if (hasRepeat) {
        return 'veryDark';
      }
      if (cssStyleDecl.width === '100%') {
        return 'mediumDark';
      }

      if (sampleElement && sampleElement.childElementCount) {
        return 'none';
      }

      if (hasHiddenText || isPlacedBeforeText(sampleElementCss) ||
        (cssStyleDecl.backgroundPosition && cssStyleDecl.backgroundPosition.indexOf('%') < 0)) {  // Clearly a sprite
        return 'reversed';
      }

      if (shouldInvertBackground(cssStyleDecl, imageUrl, sampleElement)) {
        return 'reversed';
      }

      return 'mediumDark';
    }

    if (imageUrl) {
      var bgInfo = {
        prop: 'background-image',
        imageUrl: imageUrl,
        doRequireEmpty: hasRepeat,
        backgroundColor: cssStyleDecl.backgroundColor
      };
      if (getBackgroundImageFilter(bgInfo, imageUrl, cssStyleDecl, sampleElement) === 'reversed') {
        return bgInfo;
      }
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
        parsedVal: rgba
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

  function initStyles(callbackFn) {
    styleService.init(function () {
      collectRelevantStyles(callbackFn);
    });
    }

  function collectRelevantStyles(callbackFn) {
    if (!themeStyles) {
      var bgStyles = styleService.getAllMatchingStylesCustom(getSignificantBgColor),
        fgStyles = styleService.getAllMatchingStylesCustom(getFgColor),
        bgImageStyles = styleService.getAllMatchingStylesCustom(getSignificantBgImageProperties);

      originalBodyBackgroundColor = colorUtil.getDocumentBackgroundColor();
      isOriginalThemeDark = colorUtil.isDarkColor(originalBodyBackgroundColor);

      themeStyles = bgStyles.concat(fgStyles).concat(bgImageStyles);
    }

    callbackFn();
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

  function onThemeChange() {
    applyTheme(conf.get('themeName'), conf.get('themePower'), conf.get('themeTextHue'));
  }

  function init(isPanelOpen) {
    if (isPanelOpen) {
      isPanelExpanded = true;
    }

    if (isInitialized) {
      return;
    }
    isInitialized = true;

    conf.def('themeName', getSanitizedThemeName);
    conf.def('themePower', getSanitizedThemePower);
    conf.def('themeTextHue', getSanitizedHue);
    conf.get('themeName', onThemeChange);
    conf.get('themePower', onThemeChange);
    conf.get('themeTextHue', onThemeChange);
    if (typeof conf.get('themePower') === 'undefined') {
      conf.set('themePower', DEFAULT_INTENSITY);
    }
    if (typeof conf.get('themeTextHue') === 'undefined') {
      conf.set('themeTextHue', MAX_USER_SPECIFIED_HUE); // Use white text by default
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

    sitecues.on('bp/did-expand', onPanelExpand);
    sitecues.on('bp/did-shrink', onPanelShrink);
  }

  return {
    init: init,
    applyTheme: applyTheme
  };

});
