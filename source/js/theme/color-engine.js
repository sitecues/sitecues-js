/**
 *  Support color themes in page
 */

sitecues.def('theme/color/engine', function(colorEngine, callback) {
  'use strict';
  sitecues.use('jquery', 'style-service', 'platform', 'theme/color/choices', 'util/color', 'theme/color/img-classifier',
    function($, styleService, platform, colorChoices, colorUtil, imgClassifier) {

      var $themeStyleSheet,
        THEME_STYLESHEET_NAME = 'sitecues-theme',
        REPAINT_MS = 40,
        THEME_APPLIED_TIMEOUT = 40,
        themeStyles,
        shouldRepaintToEnsureFullCoverage = platform.browser.isChrome,
        originalBodyBackgroundColor,
        isOriginalThemeDark,
        transitionTimer,
        TRANSITION_CLASS = 'sc-animate-theme',
        TRANSITION_MS_FAST = 300,
        TRANSITION_MS_SLOW = 2000,
        URL_REGEXP = /url\((?:(?:[\'\" ])*([^\"\'\)]+)[\'\" ]*)/i,
        GRADIENT_REGEXP = /^\s*([\w-]+\s*gradient)\((.*)\).*$/i,
        BUTTON_REGEXP = /(?:^| |,)(?:(?:input\s*\[\s*type\s*=\s*\"(?:button|color|submit|reset)\"\s*\]\s*)|button)(?:$| |,|:)/,
        MOVE_BG_IMAGE_TO_BEFORE = 'display:block;position:absolute;width:inherit;height:inherit;content:"";color:transparent;',
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
      colorEngine.applyTheme = function(type, intensity) {
        var colorMapFn = colorChoices[type];
        if (colorMapFn) {
          initialize();
        }

        var
          isDark = colorUtil.isDarkColor(colorUtil.getDocumentBackgroundColor()),
          willBeDark = isDarkTheme(colorMapFn),
          isReverseTheme = willBeDark !== isOriginalThemeDark,
          themeCss = colorMapFn ? getThemeCssText(colorMapFn, intensity || 1, isReverseTheme) : '',
          transitionCss = initializeTransition(isDark !== willBeDark),
          reverseCss = isReverseTheme ? getReverseFramesCssText() : '';

        getStyleSheet().text(transitionCss + themeCss + reverseCss);

        // Allow web pages to create CSS rules that respond to reverse themes
        $('body').toggleClass('sitecues-reverse-theme', isReverseTheme);
        if (isReverseTheme) {
          imgClassifier.classify();
        }

        if (shouldRepaintToEnsureFullCoverage) {
          repaintPage();
        }

        setTimeout(function() {
          sitecues.emit('theme/did-apply');
        }, THEME_APPLIED_TIMEOUT);
      };

      function isDarkTheme(colorMapFn) {
        return colorMapFn ? colorChoices.isDarkTheme(colorMapFn, originalBodyBackgroundColor) : isOriginalThemeDark;
      }

      function initializeTransition(isCurrentlyReversing) {
        var
          // We want to animate quickly between light themes, but slowly when performing a drastic change
          // such as going from light to dark or vice-versa
          transitionMs = isCurrentlyReversing ? TRANSITION_MS_SLOW : TRANSITION_MS_FAST;

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
          TRANSITION_CSS = '{transition:all ' + transitionMs + 'ms;}\n\n';

        return ANIMATION_SELECTOR + TRANSITION_CSS;
      }

      function getInvertFilter() {
        var INVERT_FILTER = 'filter:invert(100%);';
        return INVERT_FILTER + platform.cssPrefix + INVERT_FILTER;
      }

      // Reverses iframes if we are in a reverse theme
      // Should we reverse non-photo images as well?
      // See http://stackoverflow.com/questions/9354744/how-to-detect-if-an-image-is-a-photo-clip-art-or-a-line-drawing
      // Also see Jeff's image classifier code:
      // - http://roc.cs.rochester.edu/e/ic/features.php?user=none
      // - http://roc.cs.rochester.edu/e/ic/classify.php?user=none
      // We should maybe just do stuff that looks like text -- this is usually 3x as long, and < 200px high
      function getReverseFramesCssText() {
        var REVERSIBLE = ':not(data-sc-reversible="false")',
          FRAME ='frame' + REVERSIBLE + ',iframe' + REVERSIBLE,
          docBg = colorUtil.getColorString(colorUtil.getDocumentBackgroundColor());

        return FRAME + '{' + createRule('background-color', docBg) + getInvertFilter() + '};\n';
      }

      function createRule(prop, newValue, important) {
        return newValue ? prop + ': ' + newValue + (important ? ' !important; ' : '; ') : '';
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
      function getReverseSpriteCssText(styleVal, selector) {
        // Create a pseudo element selector for everything that matches the selector
        function getPseudoSelector(pseudo) {
          return selector.replace(/(,|$)/g, pseudo + '$1');
        }

        if (styleVal.isOnPseudo) {
          // Background already on a pseudo element, just invert it there
          return selector + '{' + getInvertFilter() + '}\n';
        }

        // Move background to a new :before pseudo element so that we can invert it without affecting anything else
        var isPlacedBeforeText = styleVal.isPlacedBeforeText,
          imageProp = isPlacedBeforeText ? 'content' : 'background-image',
          imageUrl = styleVal.imageUrl,
          addBgImageToBeforeCss =
            imageUrl ? MOVE_BG_IMAGE_TO_BEFORE + getInvertFilter() : '',
          addRelevantBgPropsToBeforeCss =
            getPseudoSelector('::before') + '{' +
            addBgImageToBeforeCss +
//                      (isPlacedBeforeText ? createRule('margin-left', '-' + isPlacedBeforeText) : '') +
            (imageUrl ? createRule(imageProp, 'url(' + imageUrl + ')') : '') +
            (isPlacedBeforeText ? 'left:0;top:0;' : '') +
            styleVal.bgPositionStyles +
            '}\n',
          removeBgFromMainElementCss =
            styleVal.imageUrl ?
              selector +' {' +
              createRule('background', 'none', true) +
              createRule('background-image', 'none', true) +
              createRule('background-color', 'transparent', true) +
              (isPlacedBeforeText ? createRule('position', 'relative') : '') + // Help position the ::before
//                        (SC_DEV ? createRule('outline', '2px solid red', true) : '') +
              '}\n' :
              '';
        return addRelevantBgPropsToBeforeCss + removeBgFromMainElementCss;
      }

      /**
       * Retrieve the CSS text required to apply the requested theme
       * @param type
       * @param intensity
       * @returns {string}
       */
      function getThemeCssText(colorMapFn, intensity, isReverse) {

        var styleSheetText = '';

        // Backgrounds
        themeStyles.forEach(function(style) {
          var newValue,
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
            var newRgba = colorMapFn(style.value, intensity);
            newValue = colorUtil.getColorString(newRgba);
          }
          if (newValue) {
            var important = selector !== ':link' && selector !== ':visited', // Don't let these UA rules override page's <a> rules
              formFixes = '';
            if (isButtonRule(selector)) {
              formFixes = 'border:1px outset ButtonFace;border-radius:4px';
            }
            styleSheetText += selector +
              '{' + createRule(style.value.prop, newValue, important) + formFixes + '}\n';
          }
        });

        return styleSheetText;
      }

      /**
       * Deal with Chrome bugs where scrolled-off content doesn't get new background color
       * Necessary on at least youtube.com and https://www.arlington.k12.ma.us/stratton/
       */
      function repaintPage() {
        document.documentElement.style.transform = 'translateY(1px)';
        setTimeout(function () {
          document.documentElement.style.transform = '';
        }, REPAINT_MS);
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

      function shouldInvert(cssStyleDecl, bgImage, selector) {
        if (bgImage) {
          var sampleElement = getSampleElement(selector);
//            rect = { top: 0, left: 0, width: 20, height: 20 }; // Default
          if (colorUtil.isOnDarkBackground(sampleElement)) {
            return false; // Already designed to show on a dark background
          }
          return true;
          // TODO Figure out the clipping and size of the bg image and pass it in to imgClassifier.shouldInvertBgImage(bgImage, rect);
//          if (sampleElement) {
//            // TODO this sucks, but what about % widths in background-size etc.? Those would be hard to figure out
//            rect = sampleElement.getBoundingClientRect();
//          }
//          return imgClassifier.shouldInvertBgImage(bgImage, rect);
        }
      }

      function getSignificantBgImageProperties(cssStyleDecl, selector) {
        var bgPositionStyles = '',
          bgImagePropVal = cssStyleDecl['background-image'],
          imageUrl,
          gradient,
          cssText = cssStyleDecl.cssText;

        if (cssText.indexOf('background') < 0) {
          return;  // Need some background property
        }

        function addPositioningProp(prop) {
          var propVal = cssStyleDecl[prop];
          if (propVal) {
            bgPositionStyles += prop + ':' + propVal + ';\n';
          }
        }

        function getBackgroundGradient(propVal) {
          if (propVal.indexOf('gradient') >= 0) {
            return propVal.match(GRADIENT_REGEXP);
          }
        }

        function isPlacedBeforeText() {
          var paddingLeft = cssStyleDecl.paddingLeft || $(getSampleElement(selector)).css('paddingLeft');
          return parseFloat(paddingLeft) > 0;
        }

        BACKGROUND_IMG_POSITIONING_PROPS.forEach(addPositioningProp);
        imageUrl = getBackgroundImageUrlIfSignificant(bgImagePropVal, cssStyleDecl, selector);
        gradient = !imageUrl && getBackgroundGradient(bgImagePropVal);

        if (imageUrl || gradient || bgPositionStyles) {
          return {
            prop: 'background-image',
            bgPositionStyles: bgPositionStyles,
            imageUrl: imageUrl,
            gradientType: gradient && gradient[1],
            gradientVal: gradient && gradient[2],
            isOnPseudo: selector.indexOf(':before') >= 0 || selector.indexOf(':after') >= 0,
            isPlacedBeforeText: isPlacedBeforeText()
          };
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
      function getBackgroundImageUrlIfSignificant(propVal, cssStyleDecl, selector) {
        var imageUrl = getCssUrl(propVal),
          isSignificantBgImage = imageUrl && shouldInvert(cssStyleDecl, imageUrl, selector);

        return isSignificantBgImage && imageUrl;
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
                var fgLuminosity = colorUtil.getLuminosityFromColorName(fgStyle);
                if (fgLuminosity < 0.05) {
                  return -1;
                }
                if (fgLuminosity > 0.95) {
                  return 1;
                }
                // If we're directly on a dark background, we know the text must get lighter
                var bgRgba = colorUtil.getRgba(cssStyleDecl.backgroundColor);
                if (bgRgba && bgRgba.a > 0.2) {
                  return colorUtil.getLuminosityFromColorName(bgRgba) < 0.5 ? 1 : -1;
                }
              }())
          };
        }
      }

      function initialize() {
        if (themeStyles) {
          return;
        }

        var bgStyles = styleService.getAllMatchingStylesCustom(getSignificantBgColor),
          fgStyles = styleService.getAllMatchingStylesCustom(getFgColor),
          bgImageStyles = styleService.getAllMatchingStylesCustom(getSignificantBgImageProperties);

        originalBodyBackgroundColor = colorUtil.getDocumentBackgroundColor();
        isOriginalThemeDark = colorUtil.isDarkColor(originalBodyBackgroundColor);

        themeStyles = bgStyles.concat(fgStyles).concat(bgImageStyles);
      }

      if (SC_DEV) {
        sitecues.applyTheme  = colorEngine.applyTheme;
      }

      if (SC_UNIT) {
        $.extend(exports, colorEngine);
      }

    });

  callback();
});