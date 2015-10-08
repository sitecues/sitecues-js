/**
 *  Support color themes in page
 */

define(['$', 'core/conf/user/manager', 'style-service/style-service', 'core/platform',
    'theme/color-choices', 'util/color', 'theme/img-classifier'],
  function($, conf, styleService, platform, colorChoices, colorUtil, imgClassifier) {
  var $themeStyleSheet,
    THEME_STYLESHEET_NAME = 'sitecues-theme',
    REPAINT_MS = 40,
    themeStyles,
    shouldRepaintToEnsureFullCoverage = platform.browser.isChrome,
    isPanelExpanded,
    isRepaintNeeded,
    isInitialized,
    originalBodyBackgroundColor,
    isOriginalThemeDark,
    transitionTimer,
    MAX_USER_SPECIFIED_HUE = 1.1,   // If > 1.0 then use white
    TRANSITION_CLASS = 'sc-animate-theme',
    TRANSITION_MS_FAST = 300,
    TRANSITION_MS_SLOW = 1400,
    DEFAULT_INTENSITY = 0.5,
    URL_REGEXP = /url\((?:(?:[\'\" ])*([^\"\'\)]+)[\'\" ]*)/i,
    GRADIENT_REGEXP = /^\s*([\w-]+\s*gradient)\((.*)\).*$/i,
    BUTTON_REGEXP = /(?:^| |,)(?:(?:input\s*\[\s*type\s*=\s*\"(?:button|color|submit|reset)\"\s*\]\s*)|button)(?:$| |,|:)/,
    MOVE_BG_IMAGE_TO_PSEUDO = 'display:block;position:absolute;content:"";',
    PSEUDO_FOR_BG_IMAGES = '::before',
    FILTER_PROP = platform.cssPrefix + 'filter',
    FILTER_VAL = {
      reversed: 'invert(100%)',
      mediumDark: 'brightness(.6)',
      veryDark: 'brightness(.2)'
    },
    INVERT_FILTER = createRule(FILTER_PROP, FILTER_VAL.reversed),
    BACKGROUND_IMG_POSITIONING_PROPS = [
      'background-repeat',
      'background-attachment',
      'background-position-x',
      'background-position-y',
      'background-origin',
      'background-size',
      'background-clip'
//          'vertical-align',
//          'padding',
//          'padding-top',
//          'padding-left',
//          'padding-bottom',
//          'padding-right',
//          'box-sizing'
    ];

  // ---- PUBLIC ----

  /**
   * Apply a theme to the current document
   * @param {string} type one of the theme names from color-choices.js
   * @param {number} intensity (optional) = .01-1
   */
  function applyTheme(type, intensity, textHue) {

    init();

    function applyThemeImpl() {
      var
        isDark = colorUtil.isDarkColor(colorUtil.getDocumentBackgroundColor()),
        willBeDark = isDarkTheme(colorMapFn),
        isReverseTheme = willBeDark !== isOriginalThemeDark,
        themeCss = colorMapFn ? getThemeCssText(colorMapFn, intensity || DEFAULT_INTENSITY, textHue, isReverseTheme) : '',
      // We want to animate quickly between light themes, but slowly when performing a drastic change
      // such as going from light to dark or vice-versa
        transitionMs = isDark !== willBeDark ? TRANSITION_MS_SLOW : TRANSITION_MS_FAST,
        transitionCss = initializeTransition(transitionMs),
        reverseCss = isReverseTheme ? getReverseFramesCssText() : '';

      getStyleSheet().text(transitionCss + themeCss + reverseCss);

      // Allow web pages to create CSS rules that respond to reverse themes
      $('body').toggleClass('sitecues-reverse-theme', isReverseTheme);
      if (isReverseTheme) {
        imgClassifier.classify();
      }

      setTimeout(function () {
        if (shouldRepaintToEnsureFullCoverage) {
          repaintPage();
        }
        sitecues.emit('theme/did-apply');
      }, transitionMs);
    }

    var colorMapFn = colorChoices[type];
    if (colorMapFn || !type) {
      initStyles(applyThemeImpl);
    }
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
    var ANIMATION_SELECTOR = 'html.' + TRANSITION_CLASS +', html.' +
          TRANSITION_CLASS + '> body, html.' + TRANSITION_CLASS + '> body *',
      TRANSITION_CSS = '{transition: background-color ' + transitionMs + 'ms;}\n\n';

    return ANIMATION_SELECTOR + TRANSITION_CSS;
  }

  // Reverses iframes if we are in a reverse theme
  // Should we reverse non-photo images as well?
  // See http://stackoverflow.com/questions/9354744/how-to-detect-if-an-image-is-a-photo-clip-art-or-a-line-drawing
  // Also see Jeff's image classifier code:
  // - http://roc.cs.rochester.edu/e/ic/features.php?user=none
  // - http://roc.cs.rochester.edu/e/ic/classify.php?user=none
  // We should maybe just do stuff that looks like text -- this is usually 3x as long, and < 200px high
  function getReverseFramesCssText() {
    var REVERSIBLE = ':not([data-sc-reversible="false"])',
      FRAME ='frame' + REVERSIBLE + ',iframe:not([src*="youtube"]:not([src*=".vine."])' + REVERSIBLE,
      docBg = colorUtil.getColorString(colorUtil.getDocumentBackgroundColor());

    return FRAME + '{' + createRule('background-color', docBg) + INVERT_FILTER + '};\n';
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

  // Map background image related rules to something that can be reversed
  // TODO clean this up
  function getReverseSpriteCssText(bgInfo, selector) {
    // Create a pseudo element selector for everything that matches the selector
    function getSelector(pseudo) {
      return (pseudo ? selector.replace(/(,|$)/g, pseudo + '$1')  : selector) + ' {\n';
    }

    function hasPseudoElement(selector) {
      return !hasNoPseudoElement(selector);
    }

    function hasNoPseudoElement(selector) {
      return selector.indexOf(':before') < 0 && selector.indexOf(':after') < 0;
    }

    // propName is width or height
    function getSizeRule(propName, doProvideFallback) {
      var value = bgInfo[propName],
        important;
      if (value) {
        important = true;
      }
      else if (doProvideFallback) {
        // If positioned '100%' will fill the space of the positioned element and no more
        // If not positioned 'auto' will fill the available space and no less
        // TODO Now I need to try 'inherit' instead of '100%' because of http://www.sfgate.com/crime/article/Man-beaten-up-at-Little-Caesars-after-calling-6313685.php
        // TODO go and see what using 'inherit' breaks
        if (bgInfo.doSetPositionRelative || bgInfo.isPositioned) {
          value = '100%';
        }
        else {
          value = bgInfo.isInline ? 'inherit' : 'auto';
        }
      }
      return createRule(propName, value, important);
    }

    if (!bgInfo.doMoveToPseudo) {  // Definitely a sprite, only content will be background-image
      return bgInfo.hasImageUrl ? getSelector(':not([data-sc-reversible])') + INVERT_FILTER + '}\n' : '';
    }

    // Background already on a pseudo element are just inverted there
    // See http://www.bbc.co.uk/newsbeat/article/32973341/british-tank-crushes-learner-drivers-car-in-germany
    var invertExistingPseudoElemsCss = '',
      items = selector.split(','),
      pseudoElemsSelector = items.filter(hasPseudoElement).join(',').trim(),
      nonPseudoElemsSelector =  items.filter(hasNoPseudoElement).join(',');
    if (pseudoElemsSelector) {
      invertExistingPseudoElemsCss = getSelector(pseudoElemsSelector) + INVERT_FILTER + '}\n';
    }

    if (!nonPseudoElemsSelector) {
      // Nothing left to do, everything was already in a ::before or ::after
      return invertExistingPseudoElemsCss;
    }

    selector = nonPseudoElemsSelector;

    // Move background to a new :before pseudo element so that we can invert it without affecting anything else
    if (!bgInfo.hasImageUrl) {
      return getSelector(PSEUDO_FOR_BG_IMAGES) + bgInfo.bgPositionStyles + getSizeRule('width') + getSizeRule('height') + '}\n';
    }

    var
      removeBgFromMainElementCss =
        getSelector() + createRule('background-image', 'none', true) +
        '}\n',
      positionRelativeCss =
        bgInfo.doSetPositionRelative ?
          getSelector(':not(:empty)') + createRule('position', 'relative') + '}\n' : // Help position the pseudo element, only add if we need it (not empty)
          '',
      sizePosCss =
        getSelector(':not(:empty)' + PSEUDO_FOR_BG_IMAGES) +
        'left:0;top:0;overflow:hidden;' +   // Size and position the pseudo element
         '}\n',
      filterCss =
        getSelector(':not([data-sc-reversible])' + PSEUDO_FOR_BG_IMAGES) + // Only items that don't already have a filter rule (e.g. not images)
        MOVE_BG_IMAGE_TO_PSEUDO +
        bgInfo.bgPositionStyles +
        createRule('background-color', bgInfo.backgroundColor) +
        getSizeRule('width', true) +
        getSizeRule('height', true) +
        createRule('background-image', bgInfo.imageUrlProp) +
        createRule(FILTER_PROP, FILTER_VAL[bgInfo.filter]) +
        '}\n',
      stackBelowCss =
        getSelector(':not(:empty)' + PSEUDO_FOR_BG_IMAGES) + createRule('z-index', -99999) + '}\n',
      ensureStackingContextCss =
          bgInfo.isPlacedBeforeText && !bgInfo.hasStackingContext ?
            getSelector(':not(:empty)') + createRule('opacity', 0.999) + '}\n' :
            '';

    return invertExistingPseudoElemsCss + removeBgFromMainElementCss + positionRelativeCss + filterCss +
      sizePosCss + stackBelowCss + ensureStackingContextCss;
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
  function getThemeCssText(colorMapFn, intensity, textHue, isReverse) {

    var styleSheetText = '';

    // Backgrounds
    themeStyles.forEach(function(style) {
      var newValue,
        newRgba = {},
        selector = style.rule.selectorText;

      if (style.value.prop === 'background-image') {
        if (style.value.gradientVal) {
          newValue = getThemedGradientCssText(style.value.gradientType, style.value.gradientVal, colorMapFn, intensity);
        }
        else if (isReverse) {
          styleSheetText += getReverseSpriteCssText(style.value, selector);
          return;
        }
        else {
          return;
        }
      }
      else {
        // Don't alter buttons -- it will change it from a native button and the appearance will break
        // color, background-color
        newRgba = colorMapFn(style.value, intensity, textHue);
        newValue = newRgba && newRgba.a && colorUtil.getColorString(newRgba);
      }
      if (newValue) {
        var important = selector !== ':link' && selector !== ':visited', // Don't let these UA rules override page's <a> rules
          formFixes = '',
          textShadow = '';
        if (isButtonRule(selector)) {
          formFixes = 'border:1px outset ButtonFace;border-radius:4px';
        }
        if (newRgba.textShadow) {
          // Sometimes we want to darken, so we create a tiny text shadow of the same color as the text
          textShadow = createTextShadowRule(newRgba.textShadow, newValue);
        }
        styleSheetText += selector +
          '{' + createRule(style.value.prop, newValue, important) + formFixes + textShadow + '}\n';
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
   * This function extracts the color fro the background propery.
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
    var bgPositionStyles = '',
      bgImagePropVal = cssStyleDecl['background-image'],
      imageUrl,
      gradient,
      cssText = cssStyleDecl.cssText,
      sampleElement,
      sampleElementCss,
      position,
      hasImage,
      hasHiddenText;

    if (cssText.indexOf('background') < 0) {
      return;  // Need some background property
    }

    function addPositioningProp(prop) {
      var propVal = cssStyleDecl[prop];
      if (propVal === 'auto' && (prop === 'width' || prop === 'height')) {
        propVal = '100%'; // 'auto' won't properly apply to positioned:absolute
      }
      if (propVal && propVal !== 'initial') {
        bgPositionStyles += prop + ':' + propVal + ';';
      }
    }

    function getBackgroundGradient(propVal) {
      if (propVal.indexOf('gradient') >= 0) {
        return propVal.match(GRADIENT_REGEXP);
      }
    }

    function isPlacedBeforeText() {
      // Content with text-indent is using inner text as alternative text but placing it offscreen
      var paddingLeft = cssStyleDecl.paddingLeft || sampleElementCss.paddingLeft;
      return parseFloat(paddingLeft) > 0;
    }

    sampleElement = getSampleElement(selector);
    sampleElementCss = sampleElement ? getComputedStyle(sampleElement) : {};
    position = cssStyleDecl.position || sampleElementCss.position;
    BACKGROUND_IMG_POSITIONING_PROPS.forEach(addPositioningProp);
    imageUrl = getCssUrl(bgImagePropVal);
    gradient = !imageUrl && getBackgroundGradient(bgImagePropVal);
    hasImage = imageUrl || (bgPositionStyles && sampleElementCss.backgroundImage !== 'none');
    hasHiddenText = cssStyleDecl.textIndent || parseInt(sampleElementCss.textIndent) < 0 ||
      parseInt(cssStyleDecl.fontSize) === 0 || parseInt(sampleElementCss.fontSize) === 0;

    if (imageUrl || gradient || bgPositionStyles) {
      var bgInfo = {
        prop: 'background-image',
        bgPositionStyles: bgPositionStyles,
        backgroundPosition: cssStyleDecl.backgroundPosition,
        hasRepeat: cssStyleDecl.backgroundRepeat &&
          cssStyleDecl.backgroundRepeat.indexOf('no-repeat') === -1,
        hasHiddenText: hasHiddenText,
        hasImageUrl: !!imageUrl,
        imageUrlProp: cssStyleDecl.backgroundImage,
        gradientType: gradient && gradient[1],
        gradientVal: gradient && gradient[2],
        isPositioned: position && position !== 'static',
        hasStackingContext: cssStyleDecl.zIndex || parseInt(sampleElementCss.zIndex) > 0 ||
          cssStyleDecl.opacity || parseFloat(sampleElementCss.opacity) < 1,
        doMoveToPseudo: hasImage && !hasHiddenText,
        isPlacedBeforeText: isPlacedBeforeText(),
        isFullWidth: cssStyleDecl.width === '100%',
        width: cssStyleDecl.width !== 'auto' && cssStyleDecl.width,
        height: cssStyleDecl.height !== 'auto' && cssStyleDecl.height,
        isInline: (cssStyleDecl.display || sampleElementCss.display) === 'inline',
        backgroundColor: cssStyleDecl.backgroundColor
      };
      bgInfo.filter = imageUrl && getBackgroundImageFilter(bgInfo, imageUrl, cssStyleDecl, sampleElement);
      bgInfo.doSetPositionRelative = !bgInfo.isPositioned && !bgInfo.hasHiddenText && !bgInfo.isFullWidth && !bgInfo.hasRepeat;
      return bgInfo;
    }
  }

  function getCssUrl(propVal) {
    if (propVal.indexOf('url(') >= 0) {
      var match = propVal.match(URL_REGEXP);
      return match && match[1];
    }
  }

  /**
   * Retrieve information about background images the theme needs to care about.
   * @param propVal
   * @returns {boolean}
   */
  function getBackgroundImageFilter(bgInfo, imageUrl, cssStyleDecl, sampleElement) {
    if (bgInfo.hasRepeat) {
      return 'veryDark';
    }
    if (cssStyleDecl.width === '100%') {
      return 'mediumDark';
    }

    if (bgInfo.hasHiddenText || bgInfo.doMoveToPseudo || bgInfo.isPlacedBeforeText ||
      bgInfo.backgroundPosition) {  // Clearly a sprite
      return 'reversed';
    }

    if (shouldInvertBackground(cssStyleDecl, imageUrl, sampleElement)) {
      return 'reversed';
    }

    return 'mediumDark';
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

  function init() {
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

  if (SC_DEV) {
    sitecues.applyTheme  = applyTheme;
  }

  return {
    init: init,
    applyTheme: applyTheme
  };

});
