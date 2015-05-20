/**
 *  Support color themes in page
 */

sitecues.def('theme/color/engine', function(colorEngine, callback) {
  'use strict';
  sitecues.use('jquery', 'style-service', 'platform', 'theme/color/choices',
    function($, styleService, platform, colorChoices) {

      var $themeStyleSheet,
        THEME_STYLESHEET_NAME = 'sitecues-theme',
        DEFAULT_THEME = 'lightened',
        REPAINT_MS = 40,
        THEME_APPLIED_TIMEOUT = 40,
        themeStyles;

      var shouldRepaintToEnsureFullCoverage = platform.browser.isChrome;

      // ---- PUBLIC ----

      // type (optional)
      // intensity (optional) = .01-1
      colorEngine.applyTheme = function(type, intensity) {
        var styleSheetText = type === 'none' ? '' : getThemeCss(type, intensity || 1);

        getStyleSheet().text(styleSheetText);

        if (shouldRepaintToEnsureFullCoverage) {
          repaintPage();
        }

        setTimeout(function() {
          sitecues.emit('theme/did-apply');
        }, THEME_APPLIED_TIMEOUT);
      };

      function getThemeCss(type, intensity) {

        var colorMapFn = colorChoices[type || DEFAULT_THEME],
          styleSheetText = '';

        function getColorString(rgba) {
          var rgb = rgba.r + ',' + rgba.g +',' + rgba.b;
          return rgba.a === 1 ? 'rgb(' + rgb + ')' : 'rgba(' + rgb + ',' +rgba.a + ')';
        }

        function createRule(prop, newValue) {
          return prop + ': ' + newValue + ' !important;';
        }

        // Backgrounds
        themeStyles.forEach(function(style) {
          var newValue;
          if (style.value.prop === 'background-image') {
            newValue = 'none';
          }
          else {
            // color, background-color
            var newRgba = colorMapFn(style.value, intensity);
            newValue = getColorString(newRgba);
          }
          if (newValue) {
            styleSheetText += style.rule.selectorText + ' {' + createRule(style.value.prop, newValue) + ';}\n';
          }
        });

        return styleSheetText;
      };

      // Necessary on youtube.com and https://www.arlington.k12.ma.us/stratton/
      function repaintPage() {
        var oldTransform = document.body.style.transform;
        document.documentElement.style.transform = 'translateY(1px)';
        document.body.style.transform = 'translateY(-1px)';
        setTimeout(function () {
          document.documentElement.style.transform = '';
          document.body.style.transform = oldTransform;
        }, REPAINT_MS);
      }

      function getStyleSheet() {
        if (!$themeStyleSheet) {
          $themeStyleSheet = $('<style>').appendTo('head')
            .attr('id', THEME_STYLESHEET_NAME);
        }
        return $themeStyleSheet;
      }

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

      function convertColorNameToRgbFormat(colorName) {
        // Convert color names such as 'white', 'black', 'transparent'
        var $div = $('<div>').appendTo('html').css('color', colorName),
          isLegalColor = $div[0].style.color,  // Browser won't set the color on the <div> if it's not a legal color name
          rgb = isLegalColor ? $div.css('color') : 'rgba(0, 0, 0, 0)';
        $div.remove();
        return rgb;
      }

      function getRgba(colorString) {
        // In some browsers, sometimes the computed style for a color is 'transparent' instead of rgb/rgba
        var rgb;
        if (colorString.substr(0,3) !== 'rgb') {
          rgb = convertColorNameToRgbFormat(colorString);
        }
        else {
          rgb = colorString;
        }

        var MATCH_COLORS = /rgba?\((\d+), (\d+), (\d+),?( [\d?.]+)?\)/,
          match = MATCH_COLORS.exec(rgb) || {};

        return {
          r: parseInt(match[1] || 0),
          g: parseInt(match[2] || 0),
          b: parseInt(match[3] || 0),
          a: parseFloat(match[4] || 1)
        };
      }

      function hasTypicalBgTextureRepeat(cssStyleDecl) {
        var repeatPropValue = cssStyleDecl.backgroundRepeat || cssStyleDecl.background || '';
        return repeatPropValue.indexOf('repeat-') >= 0;
      }

      // For now, return only background images that we want to erase
      function getSignificantBackgroundImage(cssStyleDecl) {
        var bgStyle = cssStyleDecl.background,
          hasBgImage = bgStyle.indexOf('url(') >= 0 || (cssStyleDecl.backgroundImage && cssStyleDecl.backgroundImage !== 'none'),
          hasBgImageRepeat = hasBgImage && hasTypicalBgTextureRepeat(cssStyleDecl);

        if (hasBgImageRepeat) {
          return {
            prop: 'background-image',
            parsedVal: true  // All we need for now
          };
        }
      }

      function getSignificantBgColor(cssStyleDecl) {
        var bgStyle = cssStyleDecl.background,
          colorString = extractColorFromBgShorthand(bgStyle) || cssStyleDecl.backgroundColor,
          rgba = colorString && getRgba(colorString);

        if (rgba && rgba.a) {
          return {
            prop: 'background-color',
            parsedVal: rgba
          };
        }
      }

      function getFgColor(cssStyleDecl) {
        var fgStyle = cssStyleDecl.color;
        if (fgStyle) {
          return {
            prop: 'color',
            parsedVal: getRgba(fgStyle)
          }
        }
      }

      function initialize() {
        var bgStyles = styleService.getAllMatchingStylesCustom(getSignificantBgColor),
          fgStyles = styleService.getAllMatchingStylesCustom(getFgColor),
          bgImageStyles = styleService.getAllMatchingStylesCustom(getSignificantBackgroundImage);

        themeStyles = bgStyles.concat(fgStyles).concat(bgImageStyles);

        console.log('-------------------------- INIT ------------------------------');
      }

      sitecues.on('style-service/ready', initialize);

      sitecues.applyTheme  = colorEngine.applyTheme;

      if (SC_UNIT) {
        $.extend(exports, colorEngine);
      }

    });

  callback();
});