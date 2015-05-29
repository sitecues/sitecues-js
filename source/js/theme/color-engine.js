/**
 *  Support color themes in page
 */

sitecues.def('theme/color/engine', function(colorEngine, callback) {
  'use strict';
  sitecues.use('jquery', 'style-service', 'platform', 'theme/color/choices', 'theme/color/util',
    function($, styleService, platform, colorChoices, colorUtil) {

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
        TRANSITION_MS_SLOW = 2000;

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
          reverseCss = isReverseTheme ? getReverseCssText() : '';

        getStyleSheet().text(transitionCss + themeCss + reverseCss);

        // Allow web pages to create CSS rules that respond to reverse themes
        $('html').toggleClass('sitecues-reverse-theme', isReverseTheme);

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

      function getReverseCssText() {
        var FRAME ='frame,iframe',
          BG_OPAQUE = 'background-color:' + colorUtil.getDocumentBackgroundColor() + ';',
          INVERT_FILTER = 'filter:invert(100%);',
          PLATFORM_INVERT_FILTER =  INVERT_FILTER + platform.cssPrefix + INVERT_FILTER;

        return FRAME + '{' + BG_OPAQUE + PLATFORM_INVERT_FILTER + '};\n';
      }

      /**
       * Retrieve the CSS text required to apply the requested theme
       * @param type
       * @param intensity
       * @returns {string}
       */
      function getThemeCssText(colorMapFn, intensity, isReverse) {

        var styleSheetText = '';

        function getColorString(rgba) {
          function isAlphaRelevant(alpha) {
            return (alpha >= 0 && alpha < 1);  // false if undefined
          }
          var rgb = rgba.r + ',' + rgba.g +',' + rgba.b;
          return isAlphaRelevant(rgba.a)? 'rgba(' + rgb + ',' +rgba.a + ')' : 'rgb(' + rgb + ')';
        }

        function createRule(prop, newValue, important) {
          return prop + ': ' + newValue + (important ? ' !important' : '');
        }

        // Backgrounds
        themeStyles.forEach(function(style) {
          var newValue;
          if (style.value.prop === 'background-image') {
            newValue = isReverse && 'none';
          }
          else {
            // Don't alter buttons -- it will change it from a native button and the appearance will break
            // color, background-color
            var newRgba = colorMapFn(style.value, intensity);
            newValue = getColorString(newRgba);
          }
          if (newValue) {
            var selectorText = style.rule.selectorText,
              important = selectorText !== ':link' && selectorText !== ':visited', // Don't let these UA rules override page's <a> rules
              formFixes = '';
            if (isButtonRule(selectorText)) {
              formFixes = ';border:1px outset ButtonFace;border-radius:4px';
            }
            styleSheetText += selectorText +
              ' {' + createRule(style.value.prop, newValue, important) + formFixes + ';}\n';
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

      /**
       * Return true if the background image appears to be used for a gradient
       * @param cssStyleDecl
       * @returns {boolean}
       */
      function isBgImageUsedForGradient(cssStyleDecl) {
        var repeatPropValue = cssStyleDecl.backgroundRepeat || cssStyleDecl.background || '';
        return repeatPropValue.indexOf('repeat-') >= 0;  // Look for repeat-x or repeat-y
      }

      /**
       * Retrieve information about background images the theme needs to care about.
       * For now we only care about gradients.
       * @param cssStyleDecl
       * @returns {{prop: string, parsedVal: boolean}}
       */
      function getSignificantBackgroundImage(cssStyleDecl) {
        var bgStyle = cssStyleDecl.background,
          hasBgImage = bgStyle.indexOf('url(') >= 0 || (cssStyleDecl.backgroundImage && cssStyleDecl.backgroundImage !== 'none'),
          hasBgImageGradient = hasBgImage && isBgImageUsedForGradient(cssStyleDecl);

        if (hasBgImageGradient) {
          return {
            prop: 'background-image',
            parsedVal: true  // All we need for now
          };
        }
      }

      function isButtonRule(selector) {
        if (selector && (selector.lastIndexOf('button') >= 0 || selector.lastIndexOf('input') >= 0)) {
          var BUTTON_SELECTOR = /(?:^| |,)(?:(?:input\s*\[\s*type\s*=\s*\"(?:button|color|submit|reset)\"\s*\]\s*)|button)(?:$| |,|:)/;
          return selector.match(BUTTON_SELECTOR);
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
                var fgLuminosity = colorUtil.getLuminosity(fgStyle);
                if (fgLuminosity < 0.05) {
                  return -1;
                }
                if (fgLuminosity > 0.95) {
                  return 1;
                }
                // If we're directly on a dark background, we know the text must get lighter
                var bgRgba = colorUtil.getRgba(cssStyleDecl.backgroundColor);
                if (bgRgba && bgRgba.a > 0.2) {
                  return colorUtil.getLuminosity(bgRgba) < 0.5 ? 1 : -1;
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
          bgImageStyles = styleService.getAllMatchingStylesCustom(getSignificantBackgroundImage);

        originalBodyBackgroundColor = colorUtil.getDocumentBackgroundColor();
        isOriginalThemeDark = colorUtil.isDarkColor(originalBodyBackgroundColor);

        themeStyles = bgStyles.concat(fgStyles).concat(bgImageStyles);
      }

      // For now this our hacky way to provide access to the theme engine
      // TODO remove this:
      if (SC_DEV) {
        sitecues.applyTheme  = colorEngine.applyTheme;
      }

      if (SC_UNIT) {
        $.extend(exports, colorEngine);
      }

    });

  callback();
});