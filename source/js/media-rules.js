// TODO on zoom change, refreshStyleSheet

/**
 * This is the module for the cursor enhancement.
 * It works as follows:
 * - enables/disables cursor module if zoom level is above/below certain value appropriately;
 * - takes over cursor style(retrives and sets image) when necessary; 
 * - switches custom cursor image when hover over elements that demand certain - not default or auto - cursor;
 * - attaches correspondent window events so that handle custom cursor events.
 */
sitecues.def('cursor', function (cursor, callback) {

  'use strict';
  
  sitecues.use('jquery', 'style-service', 'conf', 'cursor/custom', 'cursor/images/manager', 'platform',
    function ($, styleService, conf, view, imagesManager, platform) {

    var lastZoom,
        lastZoomTimeout,
        // Regexp is used to match URL in the string given(see below).
        URL_REGEXP = '//[a-z0-9\-_]+(\.[a-z0-9\-_]+)+([a-z0-9\-_\.,@\?^=%&;:/~\+#]*[a-z0-9\-@\?^=%&;/~\+#])?',
        CURSOR_TYPES = ['auto', 'default', 'pointer' ];

    function getCssTextForZoom(cssText, zoom) {
      var mediaPrefixEndIndex = cssText.indexOf('{'),
        origMediaRulePrefix = cssText.slice(0, mediaPrefixEndIndex),
        mediaRuleSuffix = cssText.slice(mediaPrefixEndIndex),
        newMediaRulePrefix,
        widthRuleIndex,
        foundNumberResult;

      // Process the origMediaRulePrefix -- everything in the CSS text up to the {
      // For each width, max-width and min-width rule
      // create a new rule with the same text but divide the width by the current level of zoom
      // We eat the string as we process it, copying the results into newMediaRulePrefix
      while (true) {
        widthRuleIndex = origMediaRulePrefix.indexOf('width:');
        if (widthRuleIndex === -1) {
          newMediaRulePrefix += origMediaRulePrefix; // Copy the final parts
          break;
        }
        // Rule lookes like: blahblahblah [foo-]width: 123px (or some other unit) blah blah blah
        // There can be more than one width statement (e.g. min-width and max-width)
        widthRuleIndex += 7; // 'width: '.length;
        newMediaRulePrefix = cssText.slice(0, widthRuleIndex);  // Copy everything up to just after 'width: ' into the new string
        origMediaRulePrefix = origMediaRulePrefix.slice(widthRuleIndex);        // Remove it from the old string

        // Now we're up to the number value
        foundNumberResult = /\d+/.exec(origMediaRulePrefix);
        newMediaRulePrefix += parseInt(foundNumberResult[0]) / zoom;    // Copy number value over, but divide by zoom!
        origMediaRulePrefix = origMediaRulePrefix.slice(foundNumberResult[0].length);   // Remove number value from the string and continue
      }

      return newMediaRulePrefix + mediaRuleSuffix;
    }

    /**
     * Create new media width rules divided by the current level of zoom
     * @param zoom
     */
    sitecues.getMediaWidthRulesForZoom = function(zoom) {
      var rules, rule, cssStyleDeclaration, cssRuleIndex, newCssText = '';

      if (!stylesheetObject) {
        return;
      }

      for (cssRuleIndex = 0, rules = stylesheetObject.cssRules; cssRuleIndex < rules.length; cssRuleIndex++) {
        rule = rules[cssRuleIndex];
        cssStyleDeclaration = rule.style;
        if (rule.type !== CSSRule.MEDIA_RULE) {
          continue;
        }

        newCssText += getCssTextForZoom(rule.cssText, zoom) + '\n';
      }
      return newCssText;
    };
    sitecues.on('zoom', function (zoom) {
      console.log('cursor1');
      if (lastZoom !== zoom) {
        lastZoom = zoom;
        clearTimeout(lastZoomTimeout);
        lastZoomTimeout = setTimeout(refreshStyleSheet, 10);
      }
    });

    callback();
  
  });
});