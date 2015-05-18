/**
 *  Support color themes in page
 */

sitecues.def('themes/color/engine', function(colorEngine, callback) {
  'use strict';
  sitecues.use('jquery', 'style-service', 'platform', 'themes/color/choices',
    function($, styleService, platform, colorChoices) {

      var $themeStyleSheet,
        THEME_STYLESHEET_NAME = 'sitecues-theme',
        DEFAULT_THEME = 'lightened',
        REPAINT_MS = 40,
        bgStyles,
        fgStyles;

      var shouldRepaintToEnsureFullCoverage = platform.browser.isChrome;

      // ---- PUBLIC ----

      // type (optional)
      // intensity (optional) = .01-1
      colorEngine.applyTheme = function(type, intensity) {
        var colorMapFn = colorChoices[type || DEFAULT_THEME],
          styleSheetText = '';

        intensity = intensity || 1;

        function getColorString(rgba) {
          var rgb = rgba.r + ',' + rgba.g +',' + rgba.b;
          return rgba.a === 1 ? 'rgb(' + rgb + ')' : 'rgba(' + rgb + ',' +rgba.a + ')';
        }

        function createBgRule(rgba) {
          var colorString = getColorString(rgba);
          return 'background: ' + colorString + ' !important; ' +
            'background-color: ' + colorString + ' !important;\n';
        }

        function createFgRule(rgba) {
          var colorString = getColorString(rgba);
          return 'color: ' + colorString + ' !important;\n';
        }

        // Backgrounds
        bgStyles.forEach(function(bgStyle) {
          var bg = colorMapFn(bgStyle.value, intensity);
          styleSheetText += bgStyle.rule.selectorText + ' {' + createBgRule(bg) + ';}\n';
        });

        // Foregrounds
        fgStyles.forEach(function(fgStyle) {
          var fg = colorMapFn(fgStyle.value, intensity);
          styleSheetText += fgStyle.rule.selectorText + ' {' + createFgRule(fg) + ';}\n';
        });

        getStyleSheet().text(styleSheetText);

        if (shouldRepaintToEnsureFullCoverage) {
          setTimeout(forceRepaint, 0);
        }
      };

      // Necessary on youtube.com and https://www.arlington.k12.ma.us/stratton/
      function forceRepaint() {
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
        if (bgShorthand.substr(0, 3) === 'rgb') {
          // Format = rgb(x,x,x) or rgba(x,x,x,x)
          return bgShorthand.split(')')[0] + ')';
        }
        // Otherwise, provide the color string up to the next space
        return bgShorthand.split(' ')[0];
      }

      function getRgba(colorString) {
        // In some browsers, sometimes the computed style for a color is 'transparent' instead of rgb/rgba
        if (colorString.substr(0,3) !== 'rgb') {
          // Convert color names such as 'white', 'black', 'transparent'
          var $div = $('<div>').appendTo('html')
            .css('color', colorString);
          colorString = $div.css('color');
          $div.remove();
        }
        var MATCH_COLORS = /rgba?\((\d+), (\d+), (\d+),?( [\d?.]+)?\)/,
          match = MATCH_COLORS.exec(colorString) || {};

        return {
          r: parseInt(match[1] || 0),
          g: parseInt(match[2] || 0),
          b: parseInt(match[3] || 0),
          a: parseFloat(match[4] || 1)
        };
      }

      // Return bg color if bg color is used, otherwise falsey value
      function getSignificantBgColor(cssStyleDecl) {
        var bgColor = getBgColor(cssStyleDecl);
        return (bgColor && bgColor.rgba.a) ? bgColor : null;
      }

      function getBgColor(cssStyleDecl) {
        var bgStyle = cssStyleDecl.background;

        if (bgStyle /* && bgStyle.indexOf('url(') < 0 */) {
          return {
            rgba: getRgba(extractColorFromBgShorthand(bgStyle)),
            prop: 'background'
          };
        }

        var bgColorStyle = cssStyleDecl.backgroundColor;
        if (bgColorStyle /* && !cssStyleDecl.backgroundImage */) {
          return {
            rgba: getRgba(bgColorStyle),
            prop: 'background-color'
          };
        }
      }

      function getFgColor(cssStyleDecl) {
        var fgStyle = cssStyleDecl.color;
        if (fgStyle) {
          return {
            prop: 'color',
            rgba: getRgba(fgStyle)
          }
        }
      }

      function initialize() {
        bgStyles = styleService.getAllMatchingStylesCustom(getSignificantBgColor);
        fgStyles = styleService.getAllMatchingStylesCustom(getFgColor);

        console.log('-------------------------- INIT ------------------------------');
        //colorEngine.setTheme(1);
      }

      sitecues.on('style-service/ready', initialize);

      sitecues.applyTheme  = colorEngine.applyTheme;

      if (SC_UNIT) {
        $.extend(exports, colorEngine);
      }

    });

  callback();
});