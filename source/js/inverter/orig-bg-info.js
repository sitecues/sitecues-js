/*  Create a style sheet that provides info about the original background colors of the page.
 *  We still need to know the original colors for processing images and background-images.
 *
 *  The hints are as follows:
 *  content: "d"   --> originally dark background
 *  content: "l"   --> originally light background
 *
 *  Q. Why in a hacky stylesheet instead of data tied to specific elements?
 *  A. Because this hack allows us to understand newly-added content without doing anything.
 *     The browser automatically ties the metadata from 'content' rules to any new content
 *
 *  Q. Why not track selectors with bg color rules and determine applicability of those style rules ourselves?
 *  A. Because understanding CSS precedence in browsers is tres hard.
 *
 *  Q. Why doesn't this damage the page view?
 *  A. CSS content rules do not affect normal elements, they only actually get used for ::before and ::after
 *     We automatically filter out those selectors when we create the style sheet with our hint rules.
 *
 *  We only create this sheet once.
 */

define([
  'Promise',
  'page/util/color',
  'page/style-service/style-service'
],
function(Promise,
         colorUtil,
         styleService) {

  var DARK_HINTS_ID = 'sitecues-js-orig-info',
    FLAG_BG_DARK = '"D"',
    FLAG_BG_LIGHT = '"L"';

  function getSanitizedSelector(selector) {
    function allowSelector(subSelector) {
      return subSelector.lastIndexOf(':before') <0 && subSelector.lastIndexOf(':after') < 0;
    }
    // Remove :before, ::before, :after, ::after rules
    var subSelectors = selector.split(','),
      allowedSubSelectors = subSelectors.filter(allowSelector);

    return allowedSubSelectors.join(',');
  }

  function createDarkHintRule(selector, themeStyle, rgba) {
    var DARK_BG_THRESHOLD = 0.6,
      isDark = colorUtil.getFastLuminance(rgba) < DARK_BG_THRESHOLD,
      important = themeStyle.value.important,
      contentFlag = isDark ? FLAG_BG_DARK : FLAG_BG_LIGHT;  // D = dark, L = light

    return selector +
      '{ content: ' + contentFlag + (important ? ' !important; ' : '; ') + '}\n';
  }

  function createDarkHintCss(styleInfo) {
    var darkHintSheetCss = '';

    styleInfo.forEach(function (themeStyle) {
      if (themeStyle.value.prop !== 'background-color') {
        return;
      }
      var rgba = themeStyle.value.parsedVal,
        selector = getSanitizedSelector(themeStyle.rule.selectorText);

      if (rgba.a > 0.5 && selector) {
        // Don't bother if mostly transparent
        // Only use selectors without :before and :after
        darkHintSheetCss += createDarkHintRule(selector, themeStyle, rgba);
      }
    });

    return darkHintSheetCss;
  }

  // Return a promise to the bg hints style sheet
  function init(styleInfo) {
    return new Promise(function (resolve) {
      var darkHintSheetCss = createDarkHintCss(styleInfo),
        $sheet = styleService.updateSheet(DARK_HINTS_ID, {text: darkHintSheetCss});
      styleService.getDOMStylesheet($sheet, resolve);
    });
  }

  function wasOnDarkBackground(current) {
    var origElement = current,
      currentRect,
      origRect = origElement.getBoundingClientRect();

    while (current) {
      currentRect = current.getBoundingClientRect();

      // Only care about backgrounds where the original element is inside of the background rect
      if (currentRect.right > origRect.left && currentRect.left < origRect.right &&
        currentRect.bottom > origRect.top && currentRect.top < origRect.bottom) {
        var bgHint = window.getComputedStyle(current).content;
        if (bgHint === FLAG_BG_DARK) {
          return true;
        }
        else if (bgHint === FLAG_BG_LIGHT) {
          return false;
        }
      }

      current = current.parentElement;
    }
    return false;
  }


  return {
    init: init,
    wasOnDarkBackground: wasOnDarkBackground
  };

});
